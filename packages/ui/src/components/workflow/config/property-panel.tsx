import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type WorkflowNode } from '../types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

export interface PropertyPanelProps {
  node: WorkflowNode | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (nodeId: string, updates: Partial<WorkflowNode>) => void
  className?: string
}

// Basic schema for node properties
const nodeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
})

export const PropertyPanel = ({
  node,
  open,
  onOpenChange,
  onSave,
  className,
}: PropertyPanelProps) => {
  const form = useForm({
    resolver: zodResolver(nodeSchema),
    defaultValues: {
      title: '',
      description: '',
      config: {},
    },
  })

  // Reset form when node changes
  React.useEffect(() => {
    if (node) {
      form.reset({
        title: node.title,
        description: node.description || '',
        config: node.config || {},
      })
    }
  }, [node, form])

  const handleSubmit = (values: z.infer<typeof nodeSchema>) => {
    if (node) {
      onSave(node.id, values)
      onOpenChange(false)
    }
  }

  if (!node) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn('w-96', className)}>
        <SheetHeader>
          <SheetTitle>Configure {node.type}</SheetTitle>
          <SheetDescription>Update the properties and settings for this node</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form className="space-y-6 mt-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <Tabs className="w-full" defaultValue="general">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-4 mt-4" value="general">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormDescription>Optional description for this node</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Node type specific fields */}
                {node.type === 'trigger' && <TriggerConfig form={form} />}

                {node.type === 'condition' && <ConditionConfig form={form} />}

                {node.type === 'action' && <ActionConfig form={form} />}
              </TabsContent>

              <TabsContent className="space-y-4 mt-4" value="advanced">
                <FormField
                  control={form.control}
                  name="config.retryOnError"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Retry on Error</FormLabel>
                        <FormDescription>Automatically retry if this node fails</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout (seconds)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Maximum execution time before timeout</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1" type="submit">
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

// Node type specific configuration components
const TriggerConfig = ({ form }: { form: any }) => {
  return (
    <FormField
      control={form.control}
      name="config.triggerType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Trigger Type</FormLabel>
          <Select defaultValue={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select trigger type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="manual">Manual Trigger</SelectItem>
              <SelectItem value="schedule">Scheduled</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="event">Event Based</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

const ConditionConfig = ({ form }: { form: any }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="config.field"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field to Check</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., status, value, user.role" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="config.operator"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Operator</FormLabel>
            <Select defaultValue={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="notEquals">Not Equals</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="greaterThan">Greater Than</SelectItem>
                <SelectItem value="lessThan">Less Than</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="config.value"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Value</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Value to compare against" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

const ActionConfig = ({ form }: { form: any }) => {
  return (
    <FormField
      control={form.control}
      name="config.actionType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Action Type</FormLabel>
          <Select defaultValue={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="http">HTTP Request</SelectItem>
              <SelectItem value="email">Send Email</SelectItem>
              <SelectItem value="database">Database Query</SelectItem>
              <SelectItem value="transform">Transform Data</SelectItem>
              <SelectItem value="custom">Custom Script</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
