import * as React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type WorkflowNode, type Port } from '../types'
import {
  MoreVertical,
  Settings,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface BaseNodeData extends WorkflowNode {
  onConfig?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onLock?: () => void
}

export interface BaseNodeProps {
  data: BaseNodeData
  selected?: boolean
}

const statusIcons = {
  idle: null,
  running: <Loader2 className="h-3 w-3 animate-spin" />,
  success: <CheckCircle className="h-3 w-3" />,
  error: <XCircle className="h-3 w-3" />,
  warning: <AlertCircle className="h-3 w-3" />,
  disabled: null,
}

const statusColors = {
  idle: 'default',
  running: 'secondary',
  success: 'default',
  error: 'destructive',
  warning: 'outline',
  disabled: 'secondary',
} as const

export const BaseNode = ({ data, selected }: BaseNodeProps) => {
  const {
    title,
    description,
    icon: Icon,
    status = 'idle',
    inputs = [],
    outputs = [],
    isLocked,
  } = data

  return (
    <div className="relative">
      <Card
        className={cn(
          'min-w-[200px] shadow-sm transition-all',
          selected && 'ring-2 ring-primary ring-offset-2',
          isLocked && 'opacity-60',
          status === 'running' && 'animate-pulse',
        )}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm leading-none truncate">{title}</h3>
                {description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
                )}
              </div>
            </div>

            {status !== 'idle' && (
              <Badge className="h-5 gap-1" variant={statusColors[status]}>
                {statusIcons[status]}
                <span className="text-xs">{status}</span>
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0">
          {/* Additional content slot */}
          {data.data && (
            <div className="text-xs text-muted-foreground">
              {/* Custom content based on node type */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input handles */}
      {inputs.map((input, index) => (
        <NodeHandle
          key={input.id}
          isInput
          index={index}
          nodeId={data.id}
          port={input}
          total={inputs.length}
        />
      ))}

      {/* Output handles */}
      {outputs.map((output, index) => (
        <NodeHandle
          key={output.id}
          index={index}
          isInput={false}
          nodeId={data.id}
          port={output}
          total={outputs.length}
        />
      ))}
    </div>
  )
}

interface NodeHandleProps {
  port: Port
  nodeId: string
  isInput: boolean
  index: number
  total: number
}

const NodeHandle = ({ port, nodeId, isInput, index, total }: NodeHandleProps) => {
  const defaultPosition = isInput ? Position.Left : Position.Right
  const position = getPositionValue(port.position) || defaultPosition

  // Calculate offset for multiple handles
  const offset = total > 1 ? `${((index + 1) / (total + 1)) * 100}%` : '50%'

  const positionStyles = {
    [Position.Top]: { top: offset, left: '50%', transform: 'translate(-50%, -50%)' },
    [Position.Right]: { top: offset, right: 0, transform: 'translate(50%, -50%)' },
    [Position.Bottom]: { bottom: 0, left: offset, transform: 'translate(-50%, 50%)' },
    [Position.Left]: { top: offset, left: 0, transform: 'translate(-50%, -50%)' },
  }

  return (
    <>
      <Handle
        className={cn(
          'w-3 h-3 border-2',
          port.connected ? 'bg-primary border-primary' : 'bg-background border-muted-foreground',
          port.required && !port.connected && 'border-destructive',
        )}
        id={port.id}
        position={position}
        style={positionStyles[position]}
        type={isInput ? 'target' : 'source'}
      />
      {port.label && (
        <div
          className={cn(
            'absolute text-xs text-muted-foreground whitespace-nowrap',
            position === Position.Left && 'left-4',
            position === Position.Right && 'right-4',
            position === Position.Top && 'top-4',
            position === Position.Bottom && 'bottom-4',
          )}
          style={{
            [position === Position.Left || position === Position.Right ? 'top' : 'left']: offset,
          }}
        >
          {port.label}
          {port.required && <span className="text-destructive ml-0.5">*</span>}
        </div>
      )}
    </>
  )
}

// Helper function to convert string position to Position enum
function getPositionValue(position?: string): Position | undefined {
  switch (position) {
    case 'top':
      return Position.Top
    case 'right':
      return Position.Right
    case 'bottom':
      return Position.Bottom
    case 'left':
      return Position.Left
    default:
      return undefined
  }
}
