import { BezierEdge, EdgeProps, getSmoothStepPath, getSimpleBezierPath } from '@xyflow/react'

// For now, use the default React Flow edges
// We can create custom edge components later if needed
export const edgeTypes = {
  default: BezierEdge,
  conditional: BezierEdge,
  error: BezierEdge,
}
