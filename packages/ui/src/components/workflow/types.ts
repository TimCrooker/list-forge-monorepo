import { type LucideIcon } from 'lucide-react'

// Base types
export type NodeId = string
export type ConnectionId = string
export type PortId = string

// Position and dimensions
export interface Position {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
}

// Port configuration
export interface Port {
  id: PortId
  type: 'input' | 'output'
  position?: 'top' | 'right' | 'bottom' | 'left'
  label?: string
  dataType?: 'any' | 'string' | 'number' | 'boolean' | 'object' | 'array'
  required?: boolean
  multiple?: boolean
  connected?: boolean
}

// Node types
export type NodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'loop'
  | 'parallel'
  | 'delay'
  | 'group'
  | 'comment'
  | 'custom'

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'warning' | 'disabled'

// Base node interface
export interface WorkflowNode {
  id: NodeId
  type: NodeType
  title: string
  description?: string
  icon?: LucideIcon
  position: Position
  dimensions?: Dimensions
  status?: NodeStatus
  inputs?: Port[]
  outputs?: Port[]
  config?: Record<string, any>
  data?: Record<string, any>
  isSelected?: boolean
  isLocked?: boolean
  parent?: NodeId // For nested nodes
  children?: NodeId[] // For group nodes
}

// Connection interface
export interface Connection {
  id: ConnectionId
  source: NodeId
  sourcePort: PortId
  target: NodeId
  targetPort: PortId
  type?: 'default' | 'conditional' | 'error'
  label?: string
  animated?: boolean
  data?: Record<string, any>
}

// Workflow interface
export interface Workflow {
  id: string
  name: string
  description?: string
  nodes: WorkflowNode[]
  connections: Connection[]
  variables?: Record<string, any>
  settings?: WorkflowSettings
  version?: number
  createdAt?: Date
  updatedAt?: Date
}

// Workflow settings
export interface WorkflowSettings {
  readonly?: boolean
  snapToGrid?: boolean
  gridSize?: number
  showGrid?: boolean
  allowPan?: boolean
  allowZoom?: boolean
  minZoom?: number
  maxZoom?: number
}

// Canvas state
export interface CanvasState {
  zoom: number
  position: Position
  selection: NodeId[]
  draggedNode?: NodeId
  hoveredNode?: NodeId
  hoveredPort?: { nodeId: NodeId; portId: PortId }
  connecting?: {
    source: NodeId
    sourcePort: PortId
    position: Position
  }
}

// Drag and drop types
export interface DragData {
  type: 'node' | 'connection' | 'new-node'
  nodeType?: NodeType
  nodeId?: NodeId
  connectionId?: ConnectionId
  offset?: Position
}

// Node template for palette
export interface NodeTemplate {
  type: NodeType
  category: string
  title: string
  description: string
  icon?: LucideIcon
  defaultConfig?: Record<string, any>
  inputs?: Omit<Port, 'id'>[]
  outputs?: Omit<Port, 'id'>[]
}

// Events
export interface WorkflowEvents {
  onNodeAdd?: (node: WorkflowNode) => void
  onNodeRemove?: (nodeId: NodeId) => void
  onNodeUpdate?: (nodeId: NodeId, updates: Partial<WorkflowNode>) => void
  onNodeMove?: (nodeId: NodeId, position: Position) => void
  onNodeSelect?: (nodeIds: NodeId[]) => void
  onConnectionAdd?: (connection: Connection) => void
  onConnectionRemove?: (connectionId: ConnectionId) => void
  onCanvasChange?: (state: Partial<CanvasState>) => void
  onWorkflowSave?: (workflow: Workflow) => void
}

// Re-export React Flow types for convenience
export type {
  NodeChange,
  EdgeChange,
  OnConnect,
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  Connection as ReactFlowConnection,
  OnNodesChange,
  OnEdgesChange,
  NodeProps,
  EdgeProps,
} from '@xyflow/react'
