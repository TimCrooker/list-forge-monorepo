import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { RichText } from './rich-text'

const meta = {
  title: 'Blocks/Content/RichText',
  component: RichText,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RichText>

export default meta
type Story = StoryObj<typeof meta>

// Sample rich text content
const sampleContent = `
<h1>Welcome to Rich Text Editor</h1>
<p>This is a <strong>powerful</strong> and <em>flexible</em> rich text editor that supports various formatting options.</p>

<h2>Features</h2>
<ul>
  <li>Text formatting (bold, italic, underline)</li>
  <li>Headings and paragraphs</li>
  <li>Lists (ordered and unordered)</li>
  <li>Text alignment</li>
  <li>Links and images</li>
  <li>Code blocks</li>
  <li>Blockquotes</li>
</ul>

<h3>Example Code Block</h3>
<pre><code>function hello() {
  console.log("Hello, world!");
}</code></pre>

<blockquote>
  <p>This is a blockquote example. It can contain multiple paragraphs and other elements.</p>
</blockquote>

<p>You can also add <a href="https://example.com">links</a> and <img src="https://picsum.photos/200/100" alt="Sample image">images</a> to your content.</p>

<h2>Text Alignment</h2>
<p style="text-align: center;">This text is centered.</p>
<p style="text-align: right;">This text is right-aligned.</p>
<p style="text-align: justify;">This text is justified. It will spread across the full width of the container, creating a clean and professional look.</p>
`

export const Default: Story = {
  args: {
    value: sampleContent,
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
    value: sampleContent,
    onChange: value => {
      // Content changed: value
    },
    toolbar: false,
  },
}

export const ReadOnly: Story = {
  args: {
    value: sampleContent,
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
    placeholder: 'Start writing your content here...',
  },
}

export const CustomHeight: Story = {
  args: {
    value: sampleContent,
    onChange: value => {
      // Content changed: value
    },
    minHeight: '300px',
    maxHeight: '600px',
  },
}

export const CustomClassName: Story = {
  args: {
    value: sampleContent,
    onChange: value => {
      // Content changed: value
    },
    className: 'p-4 bg-gray-100 rounded-lg',
  },
}

// Examples with different content types
export const WithHeadings: Story = {
  args: {
    value: `
<h1>Heading 1</h1>
<p>Paragraph text under heading 1.</p>

<h2>Heading 2</h2>
<p>Paragraph text under heading 2.</p>

<h3>Heading 3</h3>
<p>Paragraph text under heading 3.</p>
    `,
    onChange: value => {
      // Content changed: value
    },
  },
}

export const WithLists: Story = {
  args: {
    value: `
<h2>Unordered List</h2>
<ul>
  <li>First item</li>
  <li>Second item
    <ul>
      <li>Nested item 1</li>
      <li>Nested item 2</li>
    </ul>
  </li>
  <li>Third item</li>
</ul>

<h2>Ordered List</h2>
<ol>
  <li>First item</li>
  <li>Second item
    <ol>
      <li>Nested item 1</li>
      <li>Nested item 2</li>
    </ol>
  </li>
  <li>Third item</li>
</ol>
    `,
    onChange: value => {
      // Content changed: value
    },
  },
}

export const WithFormatting: Story = {
  args: {
    value: `
<p>This is <strong>bold</strong> text.</p>
<p>This is <em>italic</em> text.</p>
<p>This is <u>underlined</u> text.</p>
<p>This is <s>strikethrough</s> text.</p>
<p>This is <code>inline code</code> text.</p>
    `,
    onChange: value => {
      // Content changed: value
    },
  },
}

export const WithLinksAndImages: Story = {
  args: {
    value: `
<h2>Links</h2>
<p>Here's a <a href="https://example.com">regular link</a>.</p>
<p>Here's a <a href="https://example.com" target="_blank">link that opens in a new tab</a>.</p>

<h2>Images</h2>
<p>Here's an image:</p>
<img src="https://picsum.photos/400/200" alt="Sample image">

<p>Here's an image with a link:</p>
<a href="https://example.com">
  <img src="https://picsum.photos/400/200" alt="Clickable image">
</a>
    `,
    onChange: value => {
      // Content changed: value
    },
  },
}

export const WithCodeBlocks: Story = {
  args: {
    value: `
<h2>JavaScript Code</h2>
<pre><code>function calculateTotal(items) {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}</code></pre>

<h2>HTML Code</h2>
<pre><code>&lt;div class="container"&gt;
  &lt;h1&gt;Hello, World!&lt;/h1&gt;
  &lt;p&gt;This is a sample HTML code.&lt;/p&gt;
&lt;/div&gt;</code></pre>
    `,
    onChange: value => {
      // Content changed: value
    },
  },
}

export const WithBlockquotes: Story = {
  args: {
    value: `
<blockquote>
  <p>This is a simple blockquote.</p>
</blockquote>

<blockquote>
  <p>This is a blockquote with multiple paragraphs.</p>
  <p>It can contain various elements and formatting.</p>
  <ul>
    <li>Even lists</li>
    <li>And other elements</li>
  </ul>
</blockquote>

<blockquote>
  <p>This is a <strong>formatted</strong> blockquote with <em>different</em> styles.</p>
  <p>It can include <a href="https://example.com">links</a> and other elements.</p>
</blockquote>
    `,
    onChange: value => {
      // Content changed: value
    },
  },
}

export const WithAlignment: Story = {
  args: {
    value: `
<h2>Text Alignment Examples</h2>

<p style="text-align: left;">This text is left-aligned (default).</p>

<p style="text-align: center;">This text is centered.</p>

<p style="text-align: right;">This text is right-aligned.</p>

<p style="text-align: justify;">This text is justified. It will spread across the full width of the container, creating a clean and professional look. This is particularly useful for longer paragraphs where you want to maintain a consistent edge on both sides of the text.</p>
    `,
    onChange: value => {
      // Content changed: value
    },
  },
}
