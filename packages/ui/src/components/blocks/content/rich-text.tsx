import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Image,
  Code,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export interface RichTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  readOnly?: boolean
  toolbar?: boolean
  minHeight?: string
  maxHeight?: string
}

export const RichText = ({
  value,
  onChange,
  className,
  placeholder = 'Start writing...',
  readOnly = false,
  toolbar = true,
  minHeight = '200px',
  maxHeight = '500px',
}: RichTextProps) => {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState('')

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    handleInput()
  }

  const insertLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl)
      setLinkUrl('')
      setIsLinkPopoverOpen(false)
    }
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      execCommand('insertImage', url)
    }
  }

  type ToolbarItem = {
    icon: React.ReactNode
    tooltip: string
  } & (
    | { command: string; value?: string; onClick?: never }
    | { onClick: () => void; command?: never; value?: never }
  )

  type ToolbarGroup = {
    group: string
    items: ToolbarItem[]
  }

  const toolbarItems: ToolbarGroup[] = [
    {
      group: 'Format',
      items: [
        {
          icon: <Bold className="h-4 w-4" />,
          tooltip: 'Bold',
          command: 'bold',
        },
        {
          icon: <Italic className="h-4 w-4" />,
          tooltip: 'Italic',
          command: 'italic',
        },
        {
          icon: <Underline className="h-4 w-4" />,
          tooltip: 'Underline',
          command: 'underline',
        },
        {
          icon: <Strikethrough className="h-4 w-4" />,
          tooltip: 'Strikethrough',
          command: 'strikeThrough',
        },
      ],
    },
    {
      group: 'Headings',
      items: [
        {
          icon: <Heading1 className="h-4 w-4" />,
          tooltip: 'Heading 1',
          command: 'formatBlock',
          value: 'h1',
        },
        {
          icon: <Heading2 className="h-4 w-4" />,
          tooltip: 'Heading 2',
          command: 'formatBlock',
          value: 'h2',
        },
        {
          icon: <Heading3 className="h-4 w-4" />,
          tooltip: 'Heading 3',
          command: 'formatBlock',
          value: 'h3',
        },
      ],
    },
    {
      group: 'Lists',
      items: [
        {
          icon: <List className="h-4 w-4" />,
          tooltip: 'Bullet List',
          command: 'insertUnorderedList',
        },
        {
          icon: <ListOrdered className="h-4 w-4" />,
          tooltip: 'Numbered List',
          command: 'insertOrderedList',
        },
      ],
    },
    {
      group: 'Alignment',
      items: [
        {
          icon: <AlignLeft className="h-4 w-4" />,
          tooltip: 'Align Left',
          command: 'justifyLeft',
        },
        {
          icon: <AlignCenter className="h-4 w-4" />,
          tooltip: 'Align Center',
          command: 'justifyCenter',
        },
        {
          icon: <AlignRight className="h-4 w-4" />,
          tooltip: 'Align Right',
          command: 'justifyRight',
        },
        {
          icon: <AlignJustify className="h-4 w-4" />,
          tooltip: 'Justify',
          command: 'justifyFull',
        },
      ],
    },
    {
      group: 'Insert',
      items: [
        {
          icon: <Link className="h-4 w-4" />,
          tooltip: 'Insert Link',
          onClick: () => setIsLinkPopoverOpen(true),
        },
        {
          icon: <Image className="h-4 w-4" />,
          tooltip: 'Insert Image',
          onClick: insertImage,
        },
        {
          icon: <Code className="h-4 w-4" />,
          tooltip: 'Code Block',
          command: 'formatBlock',
          value: 'pre',
        },
        {
          icon: <Quote className="h-4 w-4" />,
          tooltip: 'Blockquote',
          command: 'formatBlock',
          value: 'blockquote',
        },
      ],
    },
    {
      group: 'History',
      items: [
        {
          icon: <Undo className="h-4 w-4" />,
          tooltip: 'Undo',
          command: 'undo',
        },
        {
          icon: <Redo className="h-4 w-4" />,
          tooltip: 'Redo',
          command: 'redo',
        },
      ],
    },
  ]

  return (
    <div className={cn('space-y-2', className)}>
      {toolbar && (
        <div className="flex flex-wrap gap-1 rounded-lg border p-1">
          <TooltipProvider>
            {toolbarItems.map((group, groupIndex) => (
              <React.Fragment key={group.group}>
                {groupIndex > 0 && <Separator className="mx-1" orientation="vertical" />}
                <div className="flex items-center gap-1">
                  {group.items.map(item => (
                    <Tooltip key={item.tooltip}>
                      <TooltipTrigger asChild>
                        <Button
                          className="h-8 w-8"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (item.onClick) {
                              item.onClick()
                            } else if (item.command) {
                              execCommand(item.command, item.value)
                            }
                          }}
                        >
                          {item.icon}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{item.tooltip}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </TooltipProvider>
        </div>
      )}

      <div
        dangerouslySetInnerHTML={{ __html: value }}
        ref={editorRef}
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none rounded-lg border p-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          readOnly && 'cursor-default select-none',
        )}
        contentEditable={!readOnly}
        data-placeholder={placeholder}
        style={{ minHeight, maxHeight }}
        onInput={handleInput}
      />

      <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsLinkPopoverOpen(false)}>
                Cancel
              </Button>
              <Button onClick={insertLink}>Insert</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
