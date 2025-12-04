# Workflow Builder Components

A comprehensive visual workflow builder system for creating automation workflows, process builders, and node-based interfaces similar to Jira Automation, Zapier, or GitHub Actions. Built on React Flow with production-ready state management, validation, and execution capabilities.

## Key Features

- **Visual Canvas** - Drag-and-drop interface for building workflows
- **Comprehensive State Management** - Built-in hooks for workflow operations
- **Validation System** - Ensures workflows are valid before execution
- **Execution Engine** - Runtime for testing and executing workflows
- **Undo/Redo** - Full history management with configurable history size
- **Copy/Paste** - Duplicate nodes and sub-workflows
- **Type Safety** - Full TypeScript support throughout
- **Extensible** - Easy to add custom node types and executors
- **Templates** - Pre-built node templates for common use cases

## Core Components

### WorkflowCanvas

**Purpose**: Main canvas component for visual workflow editing
**Use Cases**: Automation builders, process designers, visual programming interfaces
**Key Props**: `nodes`, `connections`, `onNodesChange`, `onEdgesChange`, `onConnect`, `settings`

```tsx
import { WorkflowCanvas, ReactFlowProvider } from '@epmx/unify-ui'

<ReactFlowProvider>
  <WorkflowCanvas
    nodes={nodes}
    connections={connections}
    onNodesChange={handleNodesChange}
    onEdgesChange={handleEdgesChange}
    onConnect={handleConnect}
    onNodeClick={handleNodeClick}
    settings={{
      snapToGrid: true,
      gridSize: 20,
      showGrid: true,
      minimap: true,
      controls: true
    }}
  />
</ReactFlowProvider>
```

### NodePalette

**Purpose**: Searchable palette of draggable node templates
**Use Cases**: Component library, template browser, workflow building
**Key Props**: `templates`, `onNodeDragStart`, `searchable`, `categories`

```tsx
import { NodePalette, jiraAutomationTemplates } from '@epmx/unify-ui'

<NodePalette
  templates={jiraAutomationTemplates}
  onNodeDragStart={handleDragStart}
  onNodeDragEnd={handleDragEnd}
  searchable={true}
  categories={[
    { id: 'triggers', label: 'Triggers' },
    { id: 'conditions', label: 'Conditions' },
    { id: 'actions', label: 'Actions' }
  ]}
/>
```

### PropertyPanel

**Purpose**: Configuration panel for node properties and settings
**Use Cases**: Node editing, property configuration, form-based node setup
**Key Props**: `node`, `open`, `onOpenChange`, `onSave`

```tsx
import { PropertyPanel } from '@epmx/unify-ui'

<PropertyPanel
  node={selectedNode}
  open={isPanelOpen}
  onOpenChange={setIsPanelOpen}
  onSave={handleNodeUpdate}
  onDelete={handleNodeDelete}
  validation={{
    required: ['name', 'type'],
    validate: (values) => validateNodeConfig(values)
  }}
/>
```

## State Management Hooks

### useWorkflow

**Purpose**: Main hook for comprehensive workflow state management
**Use Cases**: Workflow editing, state persistence, undo/redo functionality
**Key Features**: History management, validation, persistence, bulk operations

```tsx
import { useWorkflow } from '@epmx/unify-ui'

const workflow = useWorkflow({
  initialWorkflow: savedWorkflow,
  onWorkflowChange: (wf) => saveToServer(wf),
  validateOnChange: true,
  maxHistorySize: 50,
  autosave: true,
  autosaveDelay: 2000
})

// Node operations
workflow.addNode(template, position)
workflow.updateNode(nodeId, updates)
workflow.deleteNode(nodeId)
workflow.duplicateNode(nodeId)
workflow.copyNodes(nodeIds)
workflow.pasteNodes(position)

// Connection operations
workflow.addConnection(connection)
workflow.deleteConnection(connectionId)

// History operations
workflow.undo()
workflow.redo()
workflow.canUndo // boolean
workflow.canRedo // boolean

// Validation and persistence
workflow.validateWorkflow()
workflow.saveWorkflow()
workflow.loadWorkflow(workflowData)
workflow.isValid // boolean
workflow.validationErrors // array
```

### useWorkflowExecution

**Purpose**: Hook for workflow runtime execution and monitoring
**Use Cases**: Workflow testing, automation execution, runtime monitoring
**Key Features**: Execution control, progress tracking, error handling

```tsx
import { useWorkflowExecution } from '@epmx/unify-ui'

const execution = useWorkflowExecution(nodes, connections, {
  onNodeStart: (nodeId, context) => {
    console.log('Started:', nodeId)
  },
  onNodeComplete: (nodeId, output, context) => {
    console.log('Completed:', nodeId, output)
  },
  onNodeError: (nodeId, error, context) => {
    console.error('Error:', nodeId, error)
  },
  executors: {
    // Custom node executors
    'http-request': async (node, inputs, context) => {
      const response = await fetch(node.config.url)
      return await response.json()
    },
    'send-email': async (node, inputs, context) => {
      return await sendEmail(node.config)
    }
  }
})

// Execution control
execution.startExecution(inputs)
execution.pauseExecution()
execution.resumeExecution()
execution.stopExecution()

// Monitoring
execution.getProgress() // 0-100
execution.isRunning // boolean
execution.currentNode // current executing node
execution.executionLog // array of execution events
```

## Node Types

### Trigger Nodes

Entry points for workflow execution:

- **Manual Trigger** - User-initiated workflow start
- **Schedule Trigger** - Cron-based time triggers
- **Webhook Trigger** - HTTP endpoint triggers
- **Issue Created** - Jira issue creation events
- **Issue Updated** - Jira issue modification events
- **Issue Transitioned** - Status change events
- **File Upload** - File system events

### Condition Nodes

Logic branching and flow control:

- **If/Else Condition** - Boolean logic branching
- **Issue Type Check** - Jira issue type validation
- **Status Check** - Issue status verification
- **Priority Level** - Priority threshold checks
- **User Role** - Permission validation
- **JQL Query** - Advanced Jira queries
- **Time Since** - Time-based conditions
- **Value Comparison** - Generic value comparisons

### Action Nodes

Operations and integrations:

- **Transition Issue** - Change Jira issue status
- **Update Field** - Modify issue fields
- **Add Comment** - Post comments to issues
- **Assign Issue** - Set assignee
- **Send Email** - Email notifications
- **Send Slack** - Slack message integration
- **HTTP Request** - External API calls
- **Run Script** - Custom JavaScript execution
- **Database Query** - SQL operations
- **Transform Data** - Data manipulation
- **Upload File** - File operations

### Utility Nodes

Helper and control nodes:

- **Delay/Wait** - Time delays
- **Log/Debug** - Logging and debugging
- **Generate UUID** - ID generation
- **Random Choice** - Random selection
- **For Each Loop** - Array iteration
- **Filter Array** - Data filtering
- **Parallel Execution** - Concurrent processing
- **Try/Catch** - Error handling

### Drag & Drop Components

#### SortableList

For creating reorderable lists of items.

```tsx
import { SortableList } from '@epmx/unify-ui'

<SortableList
  items={items}
  onReorder={handleReorder}
  renderItem={(item, index) => <ItemComponent item={item} />}
  keyExtractor={(item) => item.id}
/>
```

#### DraggableItem & DropZone

Low-level components for custom drag-and-drop functionality.

```tsx
import { DraggableItem, DropZone } from '@epmx/unify-ui'

<DraggableItem id="item-1" data={itemData}>
  <div>Drag me!</div>
</DraggableItem>

<DropZone id="zone-1" acceptsData={(data) => data.type === 'valid'}>
  <div>Drop items here</div>
</DropZone>
```

## Default Node Templates

The library includes 20+ pre-configured node templates:

### Triggers

- Manual Trigger
- Schedule Trigger (cron)
- Webhook Trigger
- File Upload Trigger

### Actions

- HTTP Request
- Send Email
- Database Query
- Transform Data
- Send Slack Message

### Logic

- If/Else Condition
- For Each Loop
- Filter Array
- Parallel Execution

### Utilities

- Delay/Wait
- Log/Debug
- Generate UUID
- Random Choice

### Integration

- Download File
- Upload File
- Call Function

### Error Handling

- Try/Catch
- Throw Error
- Success Response

## Workflow Validation

The validation system ensures workflow integrity:

### Validation Rules

1. **At least one trigger** - Every workflow must start with a trigger
2. **At least one action** - Workflows must perform operations
3. **No disconnected nodes** - All nodes must be connected (warning)
4. **No cycles** - Prevents infinite loops
5. **Required inputs connected** - Validates required connections
6. **Valid connection types** - Type-safe connections
7. **Node configuration complete** - Required fields populated

### Custom Validation

```tsx
const customValidation = {
  validateNode: (node) => {
    if (node.type === 'http-request' && !node.config.url) {
      return ['URL is required for HTTP requests']
    }
    return []
  },
  validateConnection: (connection, nodes) => {
    // Custom connection validation logic
    return []
  }
}

const workflow = useWorkflow({
  validation: customValidation
})
```

## Template System

### Pre-built Templates

The library includes comprehensive template collections:

```tsx
import {
  jiraAutomationTemplates,
  slackIntegrationTemplates,
  emailWorkflowTemplates,
  dataProcessingTemplates
} from '@epmx/unify-ui'

// Combine multiple template sets
const allTemplates = [
  ...jiraAutomationTemplates,
  ...slackIntegrationTemplates,
  ...customTemplates
]
```

### Custom Templates

```tsx
const customTemplate = {
  id: 'custom-action',
  name: 'Custom Action',
  description: 'Performs custom business logic',
  category: 'actions',
  icon: CustomIcon,
  defaultConfig: {
    timeout: 30000,
    retries: 3
  },
  configSchema: {
    type: 'object',
    properties: {
      endpoint: { type: 'string', required: true },
      method: { type: 'string', enum: ['GET', 'POST'] }
    }
  },
  executor: async (config, inputs, context) => {
    // Custom execution logic
    return { success: true, data: result }
  }
}
```

## Complete Example

```tsx
import { useState } from 'react'
import {
  WorkflowCanvas,
  NodePalette,
  PropertyPanel,
  ReactFlowProvider,
  useWorkflow,
  useWorkflowExecution,
  jiraAutomationTemplates
} from '@epmx/unify-ui'

function AutomationBuilder() {
  const [selectedNode, setSelectedNode] = useState(null)

  const workflow = useWorkflow({
    validateOnChange: true,
    maxHistorySize: 100,
    autosave: true
  })

  const execution = useWorkflowExecution(
    workflow.nodes,
    workflow.connections,
    {
      onNodeComplete: (nodeId, output) => {
        console.log(`Node ${nodeId} completed:`, output)
      },
      onWorkflowComplete: (outputs) => {
        console.log('Workflow completed:', outputs)
      }
    }
  )

  return (
    <ReactFlowProvider>
      <div className="flex h-screen bg-background">
        {/* Node Palette */}
        <div className="w-80 border-r">
          <NodePalette
            templates={jiraAutomationTemplates}
            searchable={true}
          />
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Button
              onClick={() => execution.startExecution()}
              disabled={!workflow.isValid || execution.isRunning}
            >
              {execution.isRunning ? 'Running...' : 'Run Workflow'}
            </Button>
            <Button
              variant="outline"
              onClick={workflow.undo}
              disabled={!workflow.canUndo}
            >
              Undo
            </Button>
            <Button
              variant="outline"
              onClick={workflow.redo}
              disabled={!workflow.canRedo}
            >
              Redo
            </Button>
          </div>

          <WorkflowCanvas
            nodes={workflow.nodes}
            connections={workflow.connections}
            onNodesChange={workflow.onNodesChange}
            onEdgesChange={workflow.onEdgesChange}
            onConnect={workflow.onConnect}
            onNodeClick={setSelectedNode}
            settings={{
              snapToGrid: true,
              showGrid: true,
              minimap: true
            }}
          />
        </div>

        {/* Property Panel */}
        <PropertyPanel
          node={selectedNode}
          open={!!selectedNode}
          onOpenChange={(open) => !open && setSelectedNode(null)}
          onSave={(nodeId, updates) => {
            workflow.updateNode(nodeId, updates)
            setSelectedNode(null)
          }}
          onDelete={(nodeId) => {
            workflow.deleteNode(nodeId)
            setSelectedNode(null)
          }}
        />
      </div>
    </ReactFlowProvider>
  )
}

## TypeScript Support

Comprehensive TypeScript definitions:

```typescript
// Core types
export type NodeId = string
export type ConnectionId = string
export type NodeType = 'trigger' | 'action' | 'condition' | 'loop' | 'utility'

// Node interfaces
export interface WorkflowNode {
  id: NodeId
  type: NodeType
  name: string
  config: Record<string, any>
  position: { x: number; y: number }
  inputs: NodePort[]
  outputs: NodePort[]
}

export interface Connection {
  id: ConnectionId
  source: NodeId
  target: NodeId
  sourcePort: string
  targetPort: string
}

// Workflow state
export interface WorkflowState {
  nodes: WorkflowNode[]
  connections: Connection[]
  metadata: WorkflowMetadata
}

// Execution context
export interface ExecutionContext {
  workflowId: string
  executionId: string
  variables: Record<string, any>
  step: number
  startTime: Date
}
```
