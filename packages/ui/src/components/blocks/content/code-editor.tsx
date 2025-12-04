import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, FileCode, Eye } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'plaintext', label: 'Plain Text' },
]

export interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  className?: string
  placeholder?: string
  readOnly?: boolean
  showLineNumbers?: boolean
  showLanguageSelector?: boolean
  showCopyButton?: boolean
  minHeight?: string
  maxHeight?: string
  theme?: 'dark' | 'light'
}

export const CodeEditor = ({
  value,
  onChange,
  language = 'plaintext',
  className,
  placeholder = 'Enter your code here...',
  readOnly = false,
  showLineNumbers = true,
  showLanguageSelector = true,
  showCopyButton = true,
  minHeight = '200px',
  maxHeight = '500px',
  theme = 'dark',
}: CodeEditorProps) => {
  const [copied, setCopied] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'edit' | 'preview'>('edit')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newValue = `${value.substring(0, start)}  ${value.substring(end)}`
      onChange(newValue)
      // Set cursor position after the inserted tab
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        {showLanguageSelector && (
          <Select value={language} onValueChange={onChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2">
          {showCopyButton && (
            <Button className="h-8 w-8" size="icon" variant="ghost" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'edit' | 'preview')}>
            <TabsList>
              <TabsTrigger className="flex items-center gap-2" value="edit">
                <FileCode className="h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger className="flex items-center gap-2" value="preview">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <TabsContent className="mt-0" value="edit">
        <ScrollArea
          className={cn('rounded-lg border', theme === 'dark' ? 'bg-[#1E1E1E]' : 'bg-background')}
          style={{ minHeight, maxHeight }}
        >
          <textarea
            ref={textareaRef}
            className={cn(
              'w-full resize-none border-0 bg-transparent p-4 font-mono text-sm focus:outline-none focus:ring-0',
              theme === 'dark' ? 'text-white' : 'text-foreground',
              readOnly && 'cursor-default select-none',
            )}
            placeholder={placeholder}
            readOnly={readOnly}
            style={{ minHeight, maxHeight }}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </ScrollArea>
      </TabsContent>

      <TabsContent className="mt-0" value="preview">
        <ScrollArea className="rounded-lg border" style={{ minHeight, maxHeight }}>
          <SyntaxHighlighter
            wrapLines
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              background: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
            }}
            language={language}
            showLineNumbers={showLineNumbers}
            style={vscDarkPlus}
          >
            {value || placeholder}
          </SyntaxHighlighter>
        </ScrollArea>
      </TabsContent>
    </div>
  )
}
