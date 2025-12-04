import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  FileEdit,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  readOnly?: boolean
  toolbar?: boolean
  minHeight?: string
  maxHeight?: string
}

export const MarkdownEditor = ({
  value,
  onChange,
  className,
  placeholder = 'Start writing in markdown...',
  readOnly = false,
  toolbar = true,
  minHeight = '200px',
  maxHeight = '500px',
}: MarkdownEditorProps) => {
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState('')
  const [linkText, setLinkText] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<'edit' | 'preview'>('edit')

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('textarea')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText =
      value.substring(0, start) + prefix + selectedText + suffix + value.substring(end)

    onChange(newText)

    // Set cursor position after the inserted markdown
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  const insertLink = () => {
    if (linkUrl) {
      const markdown = `[${linkText || linkUrl}](${linkUrl})`
      insertMarkdown(markdown)
      setLinkUrl('')
      setLinkText('')
      setIsLinkPopoverOpen(false)
    }
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      const alt = prompt('Enter image alt text:')
      const markdown = `![${alt || ''}](${url})`
      insertMarkdown(markdown)
    }
  }

  const toolbarItems = [
    {
      group: 'Format',
      items: [
        {
          icon: <Bold className="h-4 w-4" />,
          tooltip: 'Bold',
          onClick: () => insertMarkdown('**', '**'),
        },
        {
          icon: <Italic className="h-4 w-4" />,
          tooltip: 'Italic',
          onClick: () => insertMarkdown('*', '*'),
        },
      ],
    },
    {
      group: 'Headings',
      items: [
        {
          icon: <Heading1 className="h-4 w-4" />,
          tooltip: 'Heading 1',
          onClick: () => insertMarkdown('# '),
        },
        {
          icon: <Heading2 className="h-4 w-4" />,
          tooltip: 'Heading 2',
          onClick: () => insertMarkdown('## '),
        },
        {
          icon: <Heading3 className="h-4 w-4" />,
          tooltip: 'Heading 3',
          onClick: () => insertMarkdown('### '),
        },
      ],
    },
    {
      group: 'Lists',
      items: [
        {
          icon: <List className="h-4 w-4" />,
          tooltip: 'Bullet List',
          onClick: () => insertMarkdown('- '),
        },
        {
          icon: <ListOrdered className="h-4 w-4" />,
          tooltip: 'Numbered List',
          onClick: () => insertMarkdown('1. '),
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
          onClick: () => insertMarkdown('```\n', '\n```'),
        },
        {
          icon: <Quote className="h-4 w-4" />,
          tooltip: 'Blockquote',
          onClick: () => insertMarkdown('> '),
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
                          onClick={item.onClick}
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

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'edit' | 'preview')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger className="flex items-center gap-2" value="edit">
            <FileEdit className="h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="preview">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit">
          <Textarea
            className={cn('font-mono', readOnly && 'cursor-default select-none')}
            placeholder={placeholder}
            readOnly={readOnly}
            style={{ minHeight, maxHeight }}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </TabsContent>
        <TabsContent value="preview">
          <div
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none rounded-lg border p-4',
              readOnly && 'cursor-default select-none',
            )}
            style={{ minHeight, maxHeight }}
          >
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const inline = !match
                  return !inline ? (
                    <SyntaxHighlighter PreTag="div" language={match[1]} style={vscDarkPlus as any}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
              }}
              remarkPlugins={[remarkGfm]}
            >
              {value}
            </ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>

      <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text (Optional)</Label>
              <Input
                id="link-text"
                placeholder="Link text"
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
              />
            </div>
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
