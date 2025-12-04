import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MarkdownEditor } from './markdown-editor'

const meta = {
  title: 'Blocks/Content/MarkdownEditor',
  component: MarkdownEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MarkdownEditor>

export default meta
type Story = StoryObj<typeof meta>

// Sample markdown content
const sampleMarkdown = `# Welcome to Markdown

This is a **bold** and *italic* text example.

## Features
- Rich text formatting
- Code blocks
- Lists
- Links and images

### Code Example
\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

> This is a blockquote

[Visit our website](https://example.com)

![Sample image](https://via.placeholder.com/150)
`

export const Default: Story = {
  args: {
    value: sampleMarkdown,
    onChange: value => {
      // Content changed: value
    },
  },
}

export const Empty: Story = {
  args: {
    value: '',
    onChange: value => {
      // Content changed: value
    },
  },
}

export const WithoutToolbar: Story = {
  args: {
    value: sampleMarkdown,
    onChange: value => {
      // Content changed: value
    },
    toolbar: false,
  },
}

export const ReadOnly: Story = {
  args: {
    value: sampleMarkdown,
    onChange: value => {
      // Content changed: value
    },
    readOnly: true,
  },
}

export const CustomPlaceholder: Story = {
  args: {
    value: '',
    onChange: value => {
      // Content changed: value
    },
    placeholder: 'Write your content here...',
  },
}

export const CustomHeight: Story = {
  args: {
    value: sampleMarkdown,
    onChange: value => {
      // Content changed: value
    },
    minHeight: '300px',
    maxHeight: '600px',
  },
}

export const WithCustomClassName: Story = {
  args: {
    value: sampleMarkdown,
    onChange: value => {
      // Content changed: value
    },
    className: 'border-2 border-blue-500 rounded-lg p-4',
  },
}

// Complex markdown examples
const complexMarkdown = `# Advanced Markdown Examples

## Text Formatting
This is **bold**, *italic*, ***bold and italic***, ~~strikethrough~~, and \`inline code\`.

## Lists
### Unordered List
- Item 1
  - Nested item 1.1
  - Nested item 1.2
- Item 2
- Item 3

### Ordered List
1. First item
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2
3. Third item

## Code Blocks
\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = {
  id: "1",
  name: "John Doe",
  email: "john@example.com"
};
\`\`\`

## Tables
| Name | Age | Occupation |
|------|-----|------------|
| John | 30  | Developer  |
| Jane | 25  | Designer   |

## Blockquotes
> This is a blockquote
>
> > This is a nested blockquote

## Links and Images
[Visit our website](https://example.com)

![Sample image](https://via.placeholder.com/150)

## Task Lists
- [x] Completed task
- [ ] Pending task
- [ ] Another task

## Horizontal Rule
---

## Footnotes
Here's a sentence with a footnote. [^1]

[^1]: This is the footnote.

## Math Equations
Inline math: $E = mc^2$

Block math:
$$
\\frac{n!}{k!(n-k)!} = \\binom{n}{k}
$$
`

export const ComplexMarkdown: Story = {
  args: {
    value: complexMarkdown,
    onChange: value => {
      // Content changed: value
    },
  },
}

// Examples with different content types
export const WithCodeBlocks: Story = {
  args: {
    value: `\`\`\`javascript
// JavaScript example
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

\`\`\`python
# Python example
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
\`\`\`

\`\`\`html
<!-- HTML example -->
<div class="greeting">
  <h1>Hello, World!</h1>
</div>
\`\`\``,
    onChange: value => {
      // Content changed: value
    },
  },
}

export const WithTables: Story = {
  args: {
    value: `| Feature | Basic | Pro | Enterprise |
|---------|-------|-----|------------|
| Users   | 1-5   | 6-50| Unlimited  |
| Storage | 5GB   | 50GB| 500GB      |
| Support | Email | Chat| 24/7 Phone  |

| Left Align | Center Align | Right Align |
|:-----------|:------------:|------------:|
| Left       | Center       | Right       |
| Text       | Text         | Text        |`,
    onChange: value => {
      // Content changed: value
    },
  },
}

export const WithImages: Story = {
  args: {
    value: `# Image Examples

## Basic Image
![Basic image](https://via.placeholder.com/150)

## Image with Alt Text
![A beautiful landscape](https://via.placeholder.com/300x200)

## Image with Title
![Image title](https://via.placeholder.com/400x300 "This is the image title")

## Linked Image
[![Click me](https://via.placeholder.com/100)](https://example.com)`,
    onChange: value => {
      // Content changed: value
    },
  },
}

export const WithLinks: Story = {
  args: {
    value: `# Link Examples

## Basic Links
[Visit our website](https://example.com)
[Email us](mailto:contact@example.com)

## Links with Titles
[Visit our website](https://example.com "This is a tooltip")

## Reference Links
[Reference link][1]

[1]: https://example.com "This is a reference link"

## Auto Links
<https://example.com>
<contact@example.com>`,
    onChange: value => {
      // Content changed: value
    },
  },
}
