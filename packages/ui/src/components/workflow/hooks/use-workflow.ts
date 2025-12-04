import { useState, useCallback, useRef, useMemo } from 'react'
import { useReactFlow } from '@xyflow/react'
import {
  type WorkflowNode,
  type Connection,
  type Workflow,
  type NodeTemplate,
  type NodeId,
} from '../types'
import { v4 as uuidv4 } from 'uuid'

export interface WorkflowValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface WorkflowOperations {
  // Node operations
  addNode: (template: NodeTemplate, position?: { x: number; y: number }) => string
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void
  deleteNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => string

  // Connection operations
  addConnection: (connection: Omit<Connection, 'id'>) => string
  deleteConnection: (connectionId: string) => void

  // Workflow operations
  clearWorkflow: () => void
  loadWorkflow: (workflow: Workflow) => void
  saveWorkflow: () => Workflow

  // Validation
  validateWorkflow: () => WorkflowValidation
  canConnect: (source: NodeId, sourcePort: string, target: NodeId, targetPort: string) => boolean

  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  // Selection
  selectNodes: (nodeIds: string[]) => void
  clearSelection: () => void

  // Clipboard
  copyNodes: (nodeIds?: string[]) => void
  pasteNodes: (position?: { x: number; y: number }) => string[]
  canPaste: boolean
}

export interface UseWorkflowOptions {
  initialWorkflow?: Workflow
  onWorkflowChange?: (workflow: Workflow) => void
  validateOnChange?: boolean
  maxHistorySize?: number
}

interface WorkflowState {
  nodes: WorkflowNode[]
  connections: Connection[]
  selectedNodeIds: string[]
}

export function useWorkflow(options: UseWorkflowOptions = {}) {
  const {
    initialWorkflow,
    onWorkflowChange,
    validateOnChange = true,
    maxHistorySize = 50,
  } = options

  const reactFlowInstance = useReactFlow()

  // State
  const [state, setState] = useState<WorkflowState>({
    nodes: initialWorkflow?.nodes || [],
    connections: initialWorkflow?.connections || [],
    selectedNodeIds: [],
  })

  // History for undo/redo
  const historyRef = useRef<WorkflowState[]>([])
  const historyIndexRef = useRef(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Clipboard
  const clipboardRef = useRef<{ nodes: WorkflowNode[]; connections: Connection[] } | null>(null)
  const [canPaste, setCanPaste] = useState(false)

  // Save state to history
  const saveToHistory = useCallback(
    (newState: WorkflowState) => {
      const history = historyRef.current
      const currentIndex = historyIndexRef.current

      // Remove any history after current index
      history.splice(currentIndex + 1)

      // Add new state
      history.push(JSON.parse(JSON.stringify(newState)))

      // Limit history size
      if (history.length > maxHistorySize) {
        history.shift()
      }

      historyIndexRef.current = history.length - 1
      setCanUndo(history.length > 1)
      setCanRedo(false)
    },
    [maxHistorySize],
  )

  // Update state helper
  const updateState = useCallback(
    (updates: Partial<WorkflowState>, saveHistory = true) => {
      setState(prev => {
        const newState = { ...prev, ...updates }

        if (saveHistory) {
          saveToHistory(newState)
        }

        if (onWorkflowChange) {
          onWorkflowChange({
            id: initialWorkflow?.id || 'temp',
            name: initialWorkflow?.name || 'Untitled Workflow',
            nodes: newState.nodes,
            connections: newState.connections,
          })
        }

        return newState
      })
    },
    [saveToHistory, onWorkflowChange, initialWorkflow],
  )

  // Validation
  const validateWorkflow = useCallback((): WorkflowValidation => {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for at least one trigger
    const triggers = state.nodes.filter(n => n.type === 'trigger')
    if (triggers.length === 0) {
      errors.push('Workflow must have at least one trigger')
    }

    // Check for at least one action
    const actions = state.nodes.filter(n => n.type === 'action')
    if (actions.length === 0) {
      errors.push('Workflow must have at least one action')
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>()
    state.connections.forEach(conn => {
      connectedNodeIds.add(conn.source)
      connectedNodeIds.add(conn.target)
    })

    state.nodes.forEach(node => {
      if (!connectedNodeIds.has(node.id) && state.nodes.length > 1) {
        warnings.push(`Node "${node.title}" is not connected`)
      }

      // Check required inputs
      if (node.inputs) {
        node.inputs.forEach(input => {
          if (input.required && !input.connected) {
            errors.push(
              `Required input "${input.label || 'Input'}" on "${node.title}" is not connected`,
            )
          }
        })
      }
    })

    // Check for cycles
    if (hasCycle(state.nodes, state.connections)) {
      errors.push('Workflow contains a cycle')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }, [state])

  // Check if connection is valid
  const canConnect = useCallback(
    (source: NodeId, sourcePort: string, target: NodeId, targetPort: string): boolean => {
      // Can't connect to self
      if (source === target) return false

      // Check if connection already exists
      const exists = state.connections.some(
        conn =>
          conn.source === source &&
          conn.sourcePort === sourcePort &&
          conn.target === target &&
          conn.targetPort === targetPort,
      )
      if (exists) return false

      // Would create a cycle?
      const testConnections = [
        ...state.connections,
        {
          id: 'test',
          source,
          sourcePort,
          target,
          targetPort,
        },
      ]
      if (hasCycle(state.nodes, testConnections)) return false

      // Additional validation based on node types
      const sourceNode = state.nodes.find(n => n.id === source)
      const targetNode = state.nodes.find(n => n.id === target)

      if (!sourceNode || !targetNode) return false

      // Triggers can only be sources
      if (targetNode.type === 'trigger') return false

      return true
    },
    [state],
  )

  // Node operations
  const addNode = useCallback(
    (template: NodeTemplate, position?: { x: number; y: number }) => {
      const nodeId = uuidv4()
      const newNode: WorkflowNode = {
        id: nodeId,
        type: template.type,
        title: template.title,
        description: template.description,
        icon: template.icon,
        position: position || { x: 250, y: 250 },
        inputs: template.inputs?.map((input, index) => ({
          ...input,
          id: `${nodeId}-input-${index}`,
        })),
        outputs: template.outputs?.map((output, index) => ({
          ...output,
          id: `${nodeId}-output-${index}`,
        })),
        config: template.defaultConfig,
      }

      updateState({
        nodes: [...state.nodes, newNode],
      })

      return nodeId
    },
    [state.nodes, updateState],
  )

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<WorkflowNode>) => {
      updateState({
        nodes: state.nodes.map(node => (node.id === nodeId ? { ...node, ...updates } : node)),
      })
    },
    [state.nodes, updateState],
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      updateState({
        nodes: state.nodes.filter(n => n.id !== nodeId),
        connections: state.connections.filter(c => c.source !== nodeId && c.target !== nodeId),
      })
    },
    [state, updateState],
  )

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const node = state.nodes.find(n => n.id === nodeId)
      if (!node) return ''

      const newNodeId = uuidv4()
      const newNode: WorkflowNode = {
        ...JSON.parse(JSON.stringify(node)),
        id: newNodeId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        inputs: node.inputs?.map((input, index) => ({
          ...input,
          id: `${newNodeId}-input-${index}`,
          connected: false,
        })),
        outputs: node.outputs?.map((output, index) => ({
          ...output,
          id: `${newNodeId}-output-${index}`,
          connected: false,
        })),
      }

      updateState({
        nodes: [...state.nodes, newNode],
      })

      return newNodeId
    },
    [state.nodes, updateState],
  )

  // Connection operations
  const addConnection = useCallback(
    (connection: Omit<Connection, 'id'>) => {
      const connectionId = uuidv4()
      const newConnection: Connection = {
        ...connection,
        id: connectionId,
      }

      // Update connected status on ports
      const updatedNodes = state.nodes.map(node => {
        if (node.id === connection.source) {
          return {
            ...node,
            outputs: node.outputs?.map(output =>
              output.id === connection.sourcePort ? { ...output, connected: true } : output,
            ),
          }
        }
        if (node.id === connection.target) {
          return {
            ...node,
            inputs: node.inputs?.map(input =>
              input.id === connection.targetPort ? { ...input, connected: true } : input,
            ),
          }
        }
        return node
      })

      updateState({
        nodes: updatedNodes,
        connections: [...state.connections, newConnection],
      })

      return connectionId
    },
    [state, updateState],
  )

  const deleteConnection = useCallback(
    (connectionId: string) => {
      const connection = state.connections.find(c => c.id === connectionId)
      if (!connection) return

      // Update connected status on ports
      const updatedNodes = state.nodes.map(node => {
        if (node.id === connection.source) {
          return {
            ...node,
            outputs: node.outputs?.map(output =>
              output.id === connection.sourcePort ? { ...output, connected: false } : output,
            ),
          }
        }
        if (node.id === connection.target) {
          return {
            ...node,
            inputs: node.inputs?.map(input =>
              input.id === connection.targetPort ? { ...input, connected: false } : input,
            ),
          }
        }
        return node
      })

      updateState({
        nodes: updatedNodes,
        connections: state.connections.filter(c => c.id !== connectionId),
      })
    },
    [state, updateState],
  )

  // Workflow operations
  const clearWorkflow = useCallback(() => {
    updateState({
      nodes: [],
      connections: [],
      selectedNodeIds: [],
    })
  }, [updateState])

  const loadWorkflow = useCallback(
    (workflow: Workflow) => {
      updateState({
        nodes: workflow.nodes,
        connections: workflow.connections,
        selectedNodeIds: [],
      })
    },
    [updateState],
  )

  const saveWorkflow = useCallback((): Workflow => {
    return {
      id: initialWorkflow?.id || uuidv4(),
      name: initialWorkflow?.name || 'Untitled Workflow',
      nodes: state.nodes,
      connections: state.connections,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }, [state, initialWorkflow])

  // Undo/Redo
  const undo = useCallback(() => {
    if (!canUndo) return

    const history = historyRef.current
    const newIndex = historyIndexRef.current - 1

    if (newIndex >= 0) {
      historyIndexRef.current = newIndex
      const previousState = history[newIndex]
      setState(previousState)

      setCanUndo(newIndex > 0)
      setCanRedo(true)
    }
  }, [canUndo])

  const redo = useCallback(() => {
    if (!canRedo) return

    const history = historyRef.current
    const newIndex = historyIndexRef.current + 1

    if (newIndex < history.length) {
      historyIndexRef.current = newIndex
      const nextState = history[newIndex]
      setState(nextState)

      setCanUndo(true)
      setCanRedo(newIndex < history.length - 1)
    }
  }, [canRedo])

  // Selection
  const selectNodes = useCallback(
    (nodeIds: string[]) => {
      updateState({ selectedNodeIds: nodeIds }, false)
    },
    [updateState],
  )

  const clearSelection = useCallback(() => {
    updateState({ selectedNodeIds: [] }, false)
  }, [updateState])

  // Clipboard
  const copyNodes = useCallback(
    (nodeIds?: string[]) => {
      const idsToCopy = nodeIds || state.selectedNodeIds
      if (idsToCopy.length === 0) return

      const nodesToCopy = state.nodes.filter(n => idsToCopy.includes(n.id))
      const connectionsToCopy = state.connections.filter(
        c => idsToCopy.includes(c.source) && idsToCopy.includes(c.target),
      )

      clipboardRef.current = {
        nodes: JSON.parse(JSON.stringify(nodesToCopy)),
        connections: JSON.parse(JSON.stringify(connectionsToCopy)),
      }
      setCanPaste(true)
    },
    [state],
  )

  const pasteNodes = useCallback(
    (position?: { x: number; y: number }) => {
      if (!clipboardRef.current) return []

      const { nodes: copiedNodes, connections: copiedConnections } = clipboardRef.current
      const idMap = new Map<string, string>()
      const pastedNodeIds: string[] = []

      // Calculate offset
      const bounds = copiedNodes.reduce(
        (acc, node) => ({
          minX: Math.min(acc.minX, node.position.x),
          minY: Math.min(acc.minY, node.position.y),
        }),
        { minX: Infinity, minY: Infinity },
      )

      const offset = position
        ? { x: position.x - bounds.minX, y: position.y - bounds.minY }
        : { x: 50, y: 50 }

      // Create new nodes
      const newNodes = copiedNodes.map(node => {
        const newId = uuidv4()
        idMap.set(node.id, newId)
        pastedNodeIds.push(newId)

        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + offset.x,
            y: node.position.y + offset.y,
          },
          inputs: node.inputs?.map((input, index) => ({
            ...input,
            id: `${newId}-input-${index}`,
            connected: false,
          })),
          outputs: node.outputs?.map((output, index) => ({
            ...output,
            id: `${newId}-output-${index}`,
            connected: false,
          })),
        }
      })

      // Create new connections
      const newConnections = copiedConnections
        .map(conn => ({
          ...conn,
          id: uuidv4(),
          source: idMap.get(conn.source) || conn.source,
          target: idMap.get(conn.target) || conn.target,
        }))
        .filter(conn => idMap.has(conn.source) && idMap.has(conn.target))

      updateState({
        nodes: [...state.nodes, ...newNodes],
        connections: [...state.connections, ...newConnections],
        selectedNodeIds: pastedNodeIds,
      })

      return pastedNodeIds
    },
    [state, updateState],
  )

  // Auto-validation
  const validation = useMemo(() => {
    if (validateOnChange) {
      return validateWorkflow()
    }
    return { isValid: true, errors: [], warnings: [] }
  }, [validateOnChange, validateWorkflow])

  // Initialize history
  useMemo(() => {
    if (historyRef.current.length === 0) {
      saveToHistory(state)
    }
  }, []) // eslint-disable-line

  return {
    // State
    nodes: state.nodes,
    connections: state.connections,
    selectedNodeIds: state.selectedNodeIds,
    validation,

    // Operations
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    addConnection,
    deleteConnection,
    clearWorkflow,
    loadWorkflow,
    saveWorkflow,
    validateWorkflow,
    canConnect,
    undo,
    redo,
    canUndo,
    canRedo,
    selectNodes,
    clearSelection,
    copyNodes,
    pasteNodes,
    canPaste,
  }
}

// Helper function to detect cycles
function hasCycle(nodes: WorkflowNode[], connections: Connection[]): boolean {
  const adjacencyList = new Map<string, string[]>()

  // Build adjacency list
  nodes.forEach(node => adjacencyList.set(node.id, []))
  connections.forEach(conn => {
    const neighbors = adjacencyList.get(conn.source) || []
    neighbors.push(conn.target)
    adjacencyList.set(conn.source, neighbors)
  })

  // DFS to detect cycle
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = adjacencyList.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }

  return false
}
