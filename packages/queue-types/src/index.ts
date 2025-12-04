export const QUEUE_AI_WORKFLOW = 'queue:ai-workflows';

export interface StartWorkflowJob {
  workflowType: 'photo-intake-v1' | 'price-refresh-v1';
  itemId: string;
  orgId: string;
  userId: string;
}

