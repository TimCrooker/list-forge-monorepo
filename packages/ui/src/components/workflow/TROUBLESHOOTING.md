# Workflow Builder Troubleshooting Guide

## Common Issues and Solutions

### 1. React Flow Edge Creation Errors

**Error:** "Couldn't create edge for target handle id: [handle-id]"

**Cause:** React Flow can't find the handle with the specified ID.

**Solutions:**
- Ensure handle IDs in your node data match exactly what's used in connections
- Make sure handles are rendered with the correct `id` prop
- For custom nodes, ensure they properly render Handle components from React Flow

**Example:**
```typescript
// Node definition
const node: WorkflowNode = {
  id: '1',
  outputs: [{
    id: 'node-1-output', // This ID must match in connections
    type: 'output',
    position: 'right'
  }]
}

// Connection definition
const connection: Connection = {
  source: '1',
  sourcePort: 'node-1-output', // Must match the output ID exactly
  target: '2',
  targetPort: 'node-2-input'
}
```

### 2. Maximum Update Depth Exceeded

**Error:** `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect...`

**Causes & Solutions:**

1. **Unmemoized data transformations**
   ```tsx
   // ❌ Bad - Creates new arrays on every render
   <WorkflowCanvas
     nodes={nodes.map(n => n.data as WorkflowNode)}
     connections={edges.map(e => ({ ... }))}
   />

   // ✅ Good - Memoize transformations
   const workflowNodes = useMemo(() =>
     nodes.map(n => n.data as WorkflowNode),
     [nodes]
   )
   ```

2. **Inline object/array creation**
   ```tsx
   // ❌ Bad - Creates new object on every render
   <WorkflowCanvas settings={{ snapToGrid: true }} />

   // ✅ Good - Memoize or define outside
   const settings = useMemo(() => ({ snapToGrid: true }), [])
   ```

3. **Unmemoized callbacks**
   ```tsx
   // ❌ Bad - Creates new function on every render
   onNodeClick={(node) => setSelectedNode(node)}

   // ✅ Good - Use useCallback
   const handleNodeClick = useCallback((node) => {
     setSelectedNode(node)
   }, [])
   ```

4. **Component-specific issues**:
   - Removed `fitView` prop from ReactFlow (can cause re-renders)
   - Removed complex dropdowns from BaseNode (temporary fix)
   - Replaced ScrollArea with native overflow-auto in NodePalette
   - Removed unnecessary useEffect for canvas state updates

### 3. Node Not Initialized Error

**Error**: `It seems that you are trying to drag a node that is not initialized. Please use onNodesChange as explained in the docs.`

**Cause**: This error occurs when React Flow doesn't have the required callbacks to update node positions.

**Solution**:
Ensure you're passing all required callbacks to WorkflowCanvas:

```tsx
// ✅ Correct - All required callbacks provided
<WorkflowCanvas
  nodes={nodes}
  connections={connections}
  onNodesChange={onNodesChange}  // Required!
  onEdgesChange={onEdgesChange}  // Required!
  onConnect={onConnect}          // Required!
/>
```

When managing state, properly convert between WorkflowNode and React Flow formats:

```tsx
const onNodesChange = useCallback((changes: NodeChange[]) => {
  setNodes((currentNodes) => {
    const flowNodes = currentNodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node,
    }))

    const updatedFlowNodes = applyNodeChanges(changes, flowNodes as any)

    return updatedFlowNodes.map(flowNode => ({
      ...(flowNode.data as unknown as WorkflowNode),
      position: flowNode.position,
    }))
  })
}, [])
```

### 4. Nodes Not Rendering

**Cause:** Node data structure doesn't match what React Flow expects.

**Solutions:**
- Ensure nodes have required properties: id, type, position, data
- Register custom node types in nodeTypes object
- Check that node type matches a registered component

### 5. Handles Not Connecting

**Cause:** Handle positioning or z-index issues.

**Solutions:**
- Render handles as direct children of the node root element
- Ensure handles aren't obscured by other elements
- Use proper Position enum values from React Flow

### 6. Drag and Drop Not Working

**Cause:** Missing drag event handlers or incorrect data transfer.

**Solutions:**
- Implement onDrop and onDragOver handlers on the canvas container
- Use proper data transfer format in drag events
- Ensure draggable elements set correct drag data

## Best Practices

1. **Single ReactFlowProvider**: Only wrap your app once with ReactFlowProvider
2. **Memoize Static Data**: Use useMemo for nodeTypes, edgeTypes, and other static configurations
3. **Unique IDs**: Always use unique IDs for nodes, handles, and connections
4. **Type Safety**: Use TypeScript interfaces for node and connection data
5. **Error Boundaries**: Wrap workflow components in error boundaries for production

## Debug Tips

1. Enable React Flow dev mode:
```typescript
<ReactFlow
  // ... other props
  proOptions={{ hideAttribution: false }}
/>
```

2. Log node and edge updates:
```typescript
onNodesChange={(changes) => {
  console.log('Node changes:', changes)
  // Apply changes
}}
```

3. Check React DevTools for multiple ReactFlow contexts

4. Verify handle IDs match between nodes and connections:
```typescript
console.log('Node handles:', node.inputs, node.outputs)
console.log('Connection ports:', connection.sourcePort, connection.targetPort)
```