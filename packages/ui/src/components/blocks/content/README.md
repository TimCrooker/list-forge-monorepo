# Content Blocks

This directory contains rich content creation and editing components including editors, file management, and media handling. These blocks provide comprehensive content management capabilities.

## Components

### Rich Text Editor

**Purpose**: WYSIWYG rich text editor with formatting controls
**Use Cases**: Blog editing, content creation, documentation, comments
**Key Props**: `value`, `onChange`, `toolbar`, `features`, `placeholder`

```tsx
<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar={[
    'bold', 'italic', 'underline', 'strike',
    'heading', 'blockquote', 'bulletList', 'orderedList',
    'link', 'image', 'table'
  ]}
  features={{
    imageUpload: true,
    linkPreview: true,
    wordCount: true
  }}
  placeholder="Start writing..."
/>
```

### Markdown Editor

**Purpose**: Markdown editor with live preview and syntax highlighting
**Use Cases**: Documentation, README files, technical writing
**Key Props**: `value`, `onChange`, `preview`, `highlightLanguages`, `plugins`

```tsx
<MarkdownEditor
  value={markdown}
  onChange={setMarkdown}
  preview="side"
  highlightLanguages={['javascript', 'typescript', 'css', 'html']}
  plugins={['tables', 'taskLists', 'codeHighlight']}
  onImageUpload={handleImageUpload}
/>
```

### Code Editor

**Purpose**: Code editor with syntax highlighting and IntelliSense
**Use Cases**: Code editing, configuration files, scripting
**Key Props**: `language`, `value`, `onChange`, `theme`, `extensions`

```tsx
<CodeEditor
  language="typescript"
  value={code}
  onChange={setCode}
  theme="vs-dark"
  extensions={[
    'autocomplete',
    'lintGutter',
    'searchPanel',
    'foldCode'
  ]}
  height="400px"
/>
```

### File Upload

**Purpose**: Drag-and-drop file upload with progress and validation
**Use Cases**: Document upload, image upload, attachment handling
**Key Props**: `accept`, `multiple`, `maxSize`, `onUpload`, `preview`

```tsx
<FileUpload
  accept={['image/*', '.pdf', '.doc', '.docx']}
  multiple={true}
  maxSize={10 * 1024 * 1024} // 10MB
  onUpload={handleFileUpload}
  preview={true}
  dropzoneText="Drop files here or click to browse"
  progress={uploadProgress}
/>
```

### Media Gallery

**Purpose**: Image and video gallery with lightbox and management
**Use Cases**: Photo galleries, media libraries, portfolio display
**Key Props**: `media`, `layout`, `lightbox`, `editable`, `onSelect`

```tsx
<MediaGallery
  media={[
    {
      id: '1',
      type: 'image',
      src: '/images/photo1.jpg',
      alt: 'Beautiful landscape',
      caption: 'Mountain sunrise'
    },
    {
      id: '2',
      type: 'video',
      src: '/videos/demo.mp4',
      poster: '/images/video-poster.jpg',
      caption: 'Product demo'
    }
  ]}
  layout="masonry"
  lightbox={true}
  editable={true}
  onSelect={handleMediaSelect}
/>
```

## Features

### Rich Text Capabilities

- WYSIWYG editing experience
- Comprehensive formatting toolbar
- Table creation and editing
- Image and media embedding
- Link management with previews
- Custom block types
- Collaborative editing support

### Markdown Features

- Live preview modes (side-by-side, tab)
- Syntax highlighting
- Table editing
- Task list support
- Math equation support
- Mermaid diagram support
- Export to HTML/PDF

### Code Editor Features

- Multi-language support
- Syntax highlighting
- Auto-completion
- Error highlighting
- Code folding
- Search and replace
- Multiple cursors
- Vim/Emacs key bindings

### File Management

- Drag-and-drop upload
- Progress indicators
- File type validation
- Size restrictions
- Preview generation
- Bulk operations
- Cloud storage integration

### Media Handling

- Multiple format support
- Automatic thumbnails
- Lazy loading
- Progressive loading
- Responsive images
- Video transcoding
- Metadata extraction

## Usage Examples

### Blog Editor

```tsx
function BlogEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState(null);

  return (
    <div className="space-y-6">
      <Input
        placeholder="Blog post title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-2xl font-bold border-none p-0"
      />

      <FileUpload
        accept={['image/*']}
        maxSize={5 * 1024 * 1024}
        onUpload={setFeaturedImage}
        preview={true}
        single={true}
      />

      <RichTextEditor
        value={content}
        onChange={setContent}
        toolbar={[
          'bold', 'italic', 'heading', 'blockquote',
          'bulletList', 'orderedList', 'link', 'image'
        ]}
        features={{
          imageUpload: true,
          autoSave: true,
          wordCount: true
        }}
        onImageUpload={handleImageUpload}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline">Save Draft</Button>
        <Button>Publish</Button>
      </div>
    </div>
  );
}
```

### Documentation Editor

```tsx
function DocumentationEditor() {
  const [markdown, setMarkdown] = useState('');

  return (
    <div className="h-screen">
      <MarkdownEditor
        value={markdown}
        onChange={setMarkdown}
        preview="side"
        highlightLanguages={[
          'javascript', 'typescript', 'python',
          'bash', 'json', 'yaml'
        ]}
        plugins={[
          'tables',
          'taskLists',
          'codeHighlight',
          'mermaid',
          'math'
        ]}
        toolbar={{
          guide: true,
          fullscreen: true,
          preview: true
        }}
      />
    </div>
  );
}
```

### Asset Manager

```tsx
function AssetManager() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Media Library</h2>
        <div className="flex gap-2">
          <ToggleGroup type="single" value={view} onValueChange={setView}>
            <ToggleGroupItem value="grid">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <FileUpload
        multiple={true}
        accept={['image/*', 'video/*', '.pdf']}
        onUpload={handleBulkUpload}
        dropzoneText="Drop media files here"
      />

      <MediaGallery
        media={mediaFiles}
        layout={view === 'grid' ? 'masonry' : 'list'}
        selectable={true}
        onSelect={setSelectedFiles}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </div>
  );
}
```
