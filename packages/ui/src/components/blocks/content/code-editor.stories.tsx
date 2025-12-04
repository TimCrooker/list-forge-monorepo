import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CodeEditor } from './code-editor'
import { TooltipProvider } from '../../ui/tooltip'
import { Tabs } from '../../ui/tabs'

const meta: Meta<typeof CodeEditor> = {
  title: 'Blocks/Content/CodeEditor',
  component: CodeEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <Tabs defaultValue="edit">
        <TooltipProvider>
          <div className="w-[800px]">
            <Story />
          </div>
        </TooltipProvider>
      </Tabs>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Sample code snippets
const javascriptCode = `function calculateTotal(items) {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

const items = [
  { name: 'Apple', price: 0.5, quantity: 4 },
  { name: 'Banana', price: 0.3, quantity: 6 },
  { name: 'Orange', price: 0.4, quantity: 3 }
];

const total = calculateTotal(items);
console.log('Total:', total);`

const typescriptCode = `interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  getUsersByRole(role: User['role']): User[] {
    return this.users.filter(user => user.role === role);
  }
}`

const pythonCode = `def fibonacci(n: int) -> list[int]:
    """
    Generate Fibonacci sequence up to n terms.

    Args:
        n: Number of terms to generate

    Returns:
        List of Fibonacci numbers
    """
    if n <= 0:
        return []
    elif n == 1:
        return [0]

    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])

    return sequence

# Example usage
result = fibonacci(10)
print(f"First 10 Fibonacci numbers: {result}")`

const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Page</title>
    <style>
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to our website</h1>
        <div class="card">
            <h2>Featured Content</h2>
            <p>This is a sample page with some basic HTML structure.</p>
        </div>
    </div>
</body>
</html>`

const cssCode = `.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
}

.button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background: #0056b3;
}`

const jsonCode = JSON.stringify(
  {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com',
    roles: ['admin', 'user'],
    settings: {
      theme: 'dark',
      notifications: true,
    },
  },
  null,
  2,
)

const markdownCode = `# Markdown Example

## Features
- **Bold** and *italic* text
- [Links](https://example.com)
- \`inline code\`

\`\`\`javascript
// Code block
function hello() {
  console.log("Hello, world!");
}
\`\`\`

> Blockquote example

1. Ordered list
2. Second item
3. Third item`

const sqlCode = `SELECT
    u.id,
    u.name,
    u.email,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id, u.name, u.email
HAVING order_count > 0
ORDER BY total_spent DESC
LIMIT 10;`

const yamlCode = `version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./src:/usr/share/nginx/html
    environment:
      - NODE_ENV=production
    depends_on:
      - api

  api:
    image: node:16
    working_dir: /app
    volumes:
      - ./api:/app
    command: npm start
    environment:
      - DB_HOST=db
      - DB_USER=user
      - DB_PASS=secret`

export const Default: Story = {
  args: {
    value: javascriptCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'javascript',
  },
}

export const TypeScript: Story = {
  args: {
    value: typescriptCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'typescript',
  },
}

export const Python: Story = {
  args: {
    value: pythonCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'python',
  },
}

export const HTML: Story = {
  args: {
    value: htmlCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'html',
  },
}

export const CSS: Story = {
  args: {
    value: cssCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'css',
  },
}

export const WithoutLanguageSelector: Story = {
  args: {
    value: javascriptCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'javascript',
    showLanguageSelector: false,
  },
}

export const WithoutCopyButton: Story = {
  args: {
    value: javascriptCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'javascript',
    showCopyButton: false,
  },
}

export const WithoutLineNumbers: Story = {
  args: {
    value: javascriptCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'javascript',
    showLineNumbers: false,
  },
}

export const ReadOnly: Story = {
  args: {
    value: javascriptCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'javascript',
    readOnly: true,
  },
}

export const CustomHeight: Story = {
  args: {
    value: javascriptCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'javascript',
    minHeight: '300px',
    maxHeight: '600px',
  },
}

export const LightTheme: Story = {
  args: {
    value: javascriptCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'javascript',
    theme: 'light',
  },
}

export const CustomPlaceholder: Story = {
  args: {
    value: '',
    onChange: value => {
      // Code changed: value
    },
    language: 'javascript',
    placeholder: 'Write your JavaScript code here...',
  },
}

export const CustomClassName: Story = {
  args: {
    value: javascriptCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'javascript',
    className: 'p-4 bg-gray-100 rounded-lg',
  },
}

// Examples with different languages
export const JSONExample: Story = {
  args: {
    value: jsonCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'json',
  },
}

export const Markdown: Story = {
  args: {
    value: markdownCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'markdown',
  },
}

export const SQL: Story = {
  args: {
    value: sqlCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'sql',
  },
}

export const YAML: Story = {
  args: {
    value: yamlCode,
    onChange: value => {
      // Code changed: value
    },
    language: 'yaml',
  },
}
