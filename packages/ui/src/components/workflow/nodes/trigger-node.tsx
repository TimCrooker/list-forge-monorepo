import * as React from 'react'
import { BaseNode, type BaseNodeProps } from './base-node'
import { type WorkflowNode } from '../types'
import { Play, Calendar, Clock, Webhook, FileInput, MousePointer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface TriggerNodeData extends WorkflowNode {
  triggerType?: 'manual' | 'schedule' | 'webhook' | 'file' | 'event'
  schedule?: string
  webhookUrl?: string
  eventName?: string
}

const triggerIcons = {
  manual: MousePointer,
  schedule: Calendar,
  webhook: Webhook,
  file: FileInput,
  event: Play,
}

export const TriggerNode = (props: BaseNodeProps) => {
  const triggerType = (props.data as TriggerNodeData).triggerType || 'manual'
  const Icon = triggerIcons[triggerType] || Play

  // Override the icon with the trigger-specific icon
  const nodeData = {
    ...props.data,
    icon: Icon,
  }

  return (
    <>
      <BaseNode {...props} data={nodeData} />
      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
        <Badge className="text-xs" variant="secondary">
          Trigger
        </Badge>
      </div>
    </>
  )
}
