import { BaseNode } from './base-node'
import { TriggerNode } from './trigger-node'
import { ConditionNode } from './condition-node'

// Register all node types here
export const nodeTypes = {
  trigger: TriggerNode,
  action: BaseNode,
  condition: ConditionNode,
  loop: BaseNode,
  parallel: BaseNode,
  delay: BaseNode,
  group: BaseNode,
  comment: BaseNode,
  custom: BaseNode,
}

// Export all node components for individual use
export { BaseNode, TriggerNode, ConditionNode }
