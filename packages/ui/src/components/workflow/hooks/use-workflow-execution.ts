import { useState, useCallback, useRef, useEffect } from 'react'
import { type WorkflowNode, type Connection, type NodeId } from '../types'

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed'
export type NodeExecutionStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped'

export interface NodeExecutionState {
  nodeId: NodeId
  status: NodeExecutionStatus
  startTime?: Date
  endTime?: Date
  error?: string
  output?: any
  logs?: string[]
}

export interface ExecutionContext {
  variables: Record<string, any>
  inputs: Record<string, any>
  outputs: Record<NodeId, any>
}

export interface WorkflowExecutionState {
  id: string
  status: ExecutionStatus
  startTime?: Date
  endTime?: Date
  currentNodeId?: NodeId
  nodeStates: Record<NodeId, NodeExecutionState>
  context: ExecutionContext
  error?: string
}

export interface UseWorkflowExecutionOptions {
  onNodeStart?: (nodeId: NodeId, context: ExecutionContext) => void
  onNodeComplete?: (nodeId: NodeId, output: any, context: ExecutionContext) => void
  onNodeError?: (nodeId: NodeId, error: Error, context: ExecutionContext) => void
  onExecutionComplete?: (state: WorkflowExecutionState) => void
  onExecutionError?: (error: Error, state: WorkflowExecutionState) => void
  executors?: Record<string, NodeExecutor>
}

export type NodeExecutor = (
  node: WorkflowNode,
  inputs: any,
  context: ExecutionContext,
) => Promise<any> | any

export function useWorkflowExecution(
  nodes: WorkflowNode[],
  connections: Connection[],
  options: UseWorkflowExecutionOptions = {},
) {
  const [executionState, setExecutionState] = useState<WorkflowExecutionState>({
    id: '',
    status: 'idle',
    nodeStates: {},
    context: {
      variables: {},
      inputs: {},
      outputs: {},
    },
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const executionQueueRef = useRef<NodeId[]>([])

  // Initialize node states
  useEffect(() => {
    const nodeStates: Record<NodeId, NodeExecutionState> = {}
    nodes.forEach(node => {
      nodeStates[node.id] = {
        nodeId: node.id,
        status: 'pending',
      }
    })
    setExecutionState(prev => ({ ...prev, nodeStates }))
  }, [nodes])

  // Get next nodes to execute
  const getNextNodes = useCallback(
    (completedNodeId?: NodeId): NodeId[] => {
      if (!completedNodeId) {
        // Find trigger nodes
        return nodes.filter(n => n.type === 'trigger').map(n => n.id)
      }

      // Find nodes connected to the completed node
      const nextNodes: NodeId[] = []
      connections.forEach(conn => {
        if (conn.source === completedNodeId) {
          const targetNode = nodes.find(n => n.id === conn.target)
          if (targetNode) {
            // Check if all required inputs are satisfied
            const requiredInputs = targetNode.inputs?.filter(i => i.required) || []
            const satisfiedInputs = connections.filter(
              c =>
                c.target === targetNode.id &&
                executionState.nodeStates[c.source]?.status === 'success',
            )

            if (requiredInputs.length <= satisfiedInputs.length) {
              nextNodes.push(targetNode.id)
            }
          }
        }
      })

      return nextNodes
    },
    [nodes, connections, executionState.nodeStates],
  )

  // Execute a single node
  const executeNode = useCallback(
    async (nodeId: NodeId) => {
      const node = nodes.find(n => n.id === nodeId)
      if (!node) return

      // Update node state to running
      setExecutionState(prev => ({
        ...prev,
        currentNodeId: nodeId,
        nodeStates: {
          ...prev.nodeStates,
          [nodeId]: {
            ...prev.nodeStates[nodeId],
            status: 'running',
            startTime: new Date(),
          },
        },
      }))

      options.onNodeStart?.(nodeId, executionState.context)

      try {
        // Gather inputs from connected nodes
        const inputs: Record<string, any> = {}
        connections
          .filter(conn => conn.target === nodeId)
          .forEach(conn => {
            const sourceOutput = executionState.context.outputs[conn.source]
            if (sourceOutput !== undefined) {
              inputs[conn.targetPort] = sourceOutput
            }
          })

        // Execute node
        let output: any
        const executor = options.executors?.[node.type]

        if (executor) {
          output = await executor(node, inputs, executionState.context)
        } else {
          // Default mock execution
          output = await mockExecuteNode(node, inputs, executionState.context)
        }

        // Update execution state with success
        setExecutionState(prev => ({
          ...prev,
          nodeStates: {
            ...prev.nodeStates,
            [nodeId]: {
              ...prev.nodeStates[nodeId],
              status: 'success',
              endTime: new Date(),
              output,
            },
          },
          context: {
            ...prev.context,
            outputs: {
              ...prev.context.outputs,
              [nodeId]: output,
            },
          },
        }))

        options.onNodeComplete?.(nodeId, output, executionState.context)

        // Queue next nodes
        const nextNodes = getNextNodes(nodeId)
        executionQueueRef.current.push(...nextNodes)
      } catch (error) {
        // Update execution state with error
        setExecutionState(prev => ({
          ...prev,
          nodeStates: {
            ...prev.nodeStates,
            [nodeId]: {
              ...prev.nodeStates[nodeId],
              status: 'error',
              endTime: new Date(),
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        }))

        options.onNodeError?.(nodeId, error as Error, executionState.context)
        throw error
      }
    },
    [nodes, connections, executionState.context, options, getNextNodes],
  )

  // Start execution
  const startExecution = useCallback(
    async (inputs?: Record<string, any>) => {
      // Reset execution state
      const nodeStates: Record<NodeId, NodeExecutionState> = {}
      nodes.forEach(node => {
        nodeStates[node.id] = {
          nodeId: node.id,
          status: 'pending',
        }
      })

      setExecutionState({
        id: Date.now().toString(),
        status: 'running',
        startTime: new Date(),
        nodeStates,
        context: {
          variables: {},
          inputs: inputs || {},
          outputs: {},
        },
      })

      // Create abort controller
      abortControllerRef.current = new AbortController()

      // Initialize execution queue with trigger nodes
      const triggerNodes = getNextNodes()
      executionQueueRef.current = [...triggerNodes]

      try {
        // Execute nodes in queue
        while (executionQueueRef.current.length > 0 && executionState.status === 'running') {
          if (abortControllerRef.current.signal.aborted) {
            throw new Error('Execution aborted')
          }

          const nodeId = executionQueueRef.current.shift()!
          await executeNode(nodeId)
        }

        // Mark execution as completed
        setExecutionState(prev => ({
          ...prev,
          status: 'completed',
          endTime: new Date(),
        }))

        options.onExecutionComplete?.(executionState)
      } catch (error) {
        // Mark execution as failed
        setExecutionState(prev => ({
          ...prev,
          status: 'failed',
          endTime: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        }))

        options.onExecutionError?.(error as Error, executionState)
      }
    },
    [nodes, getNextNodes, executeNode, executionState, options],
  )

  // Pause execution
  const pauseExecution = useCallback(() => {
    setExecutionState(prev => ({ ...prev, status: 'paused' }))
  }, [])

  // Resume execution
  const resumeExecution = useCallback(() => {
    setExecutionState(prev => ({ ...prev, status: 'running' }))
  }, [])

  // Stop execution
  const stopExecution = useCallback(() => {
    abortControllerRef.current?.abort()
    setExecutionState(prev => ({
      ...prev,
      status: 'idle',
      endTime: new Date(),
    }))
  }, [])

  // Get node execution state
  const getNodeState = useCallback(
    (nodeId: NodeId): NodeExecutionState | undefined => {
      return executionState.nodeStates[nodeId]
    },
    [executionState.nodeStates],
  )

  // Get execution progress
  const getProgress = useCallback((): number => {
    const totalNodes = Object.keys(executionState.nodeStates).length
    if (totalNodes === 0) return 0

    const completedNodes = Object.values(executionState.nodeStates).filter(
      state => state.status === 'success' || state.status === 'error' || state.status === 'skipped',
    ).length

    return (completedNodes / totalNodes) * 100
  }, [executionState.nodeStates])

  return {
    executionState,
    startExecution,
    pauseExecution,
    resumeExecution,
    stopExecution,
    getNodeState,
    getProgress,
    isRunning: executionState.status === 'running',
    isPaused: executionState.status === 'paused',
    isCompleted: executionState.status === 'completed',
    isFailed: executionState.status === 'failed',
  }
}

// Mock node execution for demo purposes
async function mockExecuteNode(
  node: WorkflowNode,
  inputs: any,
  context: ExecutionContext,
): Promise<any> {
  // Simulate async execution
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

  // Return mock output based on node type
  switch (node.type) {
    case 'trigger':
      return { triggered: true, timestamp: new Date().toISOString() }

    case 'condition':
      // Simulate condition evaluation
      const result = Math.random() > 0.5
      return { result, branch: result ? 'true' : 'false' }

    case 'action':
      return {
        executed: true,
        inputs,
        output: `Action ${node.title} completed`,
      }

    default:
      return { completed: true }
  }
}
