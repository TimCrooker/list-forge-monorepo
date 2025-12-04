import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, X, File, Image, FileText, CheckCircle2 } from 'lucide-react'

export interface FileUploadProps {
  value: File[]
  onChange: (files: File[]) => void
  className?: string
  multiple?: boolean
  accept?: string
  maxSize?: number // in bytes
  maxFiles?: number
  showPreview?: boolean
  showProgress?: boolean
}

export const FileUpload = ({
  value,
  onChange,
  className,
  multiple = false,
  accept,
  maxSize,
  maxFiles,
  showPreview = true,
  showProgress = true,
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({})
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const validateFile = (file: File): boolean => {
    if (maxSize && file.size > maxSize) {
      alert(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`)
      return false
    }
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const fileType = file.type
      const fileExtension = `.${file.name.split('.').pop()}`
      if (!acceptedTypes.some(type => fileType.match(type) || fileExtension.match(type))) {
        alert(`File ${file.name} is not an accepted file type`)
        return false
      }
    }
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(validateFile)
    if (maxFiles && value.length + validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }
    onChange([...value, ...validFiles])
    validFiles.forEach(file => {
      // Simulate upload progress
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        if (progress >= 100) clearInterval(interval)
      }, 200)
    })
  }

  const removeFile = (index: number) => {
    const newFiles = [...value]
    newFiles.splice(index, 1)
    onChange(newFiles)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-6 w-6" />
    if (file.type.includes('text')) return <FileText className="h-6 w-6" />
    return <File className="h-6 w-6" />
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          'hover:border-primary/50 hover:bg-primary/5',
        )}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          accept={accept}
          className="hidden"
          multiple={multiple}
          type="file"
          onChange={handleFileInput}
        />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag and drop files here, or{' '}
          <Button
            className="p-0 h-auto"
            variant="link"
            onClick={() => fileInputRef.current?.click()}
          >
            browse
          </Button>
        </p>
        {accept && (
          <p className="mt-1 text-xs text-muted-foreground">Accepted file types: {accept}</p>
        )}
        {maxSize && (
          <p className="mt-1 text-xs text-muted-foreground">
            Maximum file size: {maxSize / 1024 / 1024}MB
          </p>
        )}
      </div>

      {value.length > 0 && (
        <ScrollArea className="h-[200px] rounded-md border p-4">
          <div className="space-y-4">
            {value.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)}KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {showProgress && uploadProgress[file.name] < 100 ? (
                    <Progress className="w-[100px]" value={uploadProgress[file.name]} />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <Button
                    className="h-8 w-8"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
