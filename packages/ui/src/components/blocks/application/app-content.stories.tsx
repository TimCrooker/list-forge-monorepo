import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AppContent, PageHeader } from './app-content'
import { Button } from '@/components/ui/button'
import { PlusIcon, DownloadIcon, FilterIcon } from 'lucide-react'

const meta = {
  title: 'Blocks/Application/AppContent',
  component: AppContent,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AppContent>

export default meta
type Story = StoryObj<typeof meta>

// Sample breadcrumb items
const sampleBreadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Current Project' },
]

// Sample actions
const sampleActions = (
  <>
    <Button variant="outline" size="sm">
      <FilterIcon className="mr-2 h-4 w-4" />
      Filter
    </Button>
    <Button variant="outline" size="sm">
      <DownloadIcon className="mr-2 h-4 w-4" />
      Export
    </Button>
    <Button size="sm">
      <PlusIcon className="mr-2 h-4 w-4" />
      New Item
    </Button>
  </>
)

// Sample content
const SampleContent = () => (
  <div className="space-y-4">
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-medium">Content Section 1</h3>
      <p className="text-muted-foreground">
        This is a sample content section to demonstrate the layout.
      </p>
    </div>
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-medium">Content Section 2</h3>
      <p className="text-muted-foreground">
        Another content section to show spacing and structure.
      </p>
    </div>
  </div>
)

export const Default: Story = {
  args: {
    title: 'Project Overview',
    description: 'View and manage your project details',
    breadcrumbs: sampleBreadcrumbs,
    actions: sampleActions,
    children: <SampleContent />,
  },
}

export const WithoutBreadcrumbs: Story = {
  args: {
    title: 'Dashboard',
    description: 'Your personal dashboard',
    actions: sampleActions,
    children: <SampleContent />,
  },
}

export const WithoutActions: Story = {
  args: {
    title: 'Documentation',
    description: 'Learn how to use our platform',
    breadcrumbs: sampleBreadcrumbs,
    children: <SampleContent />,
  },
}

export const WithoutHeader: Story = {
  args: {
    children: <SampleContent />,
  },
}

export const WithMaxWidth: Story = {
  args: {
    title: 'Settings',
    description: 'Configure your application settings',
    maxWidth: 'lg',
    children: <SampleContent />,
  },
}

export const WithCustomPadding: Story = {
  args: {
    title: 'User Profile',
    description: 'View and edit your profile information',
    padding: 'lg',
    children: <SampleContent />,
  },
}

export const WithFullWidth: Story = {
  args: {
    title: 'Analytics Dashboard',
    description: 'View detailed analytics and metrics',
    maxWidth: 'full',
    children: <SampleContent />,
  },
}

export const WithMinimalPadding: Story = {
  args: {
    title: 'Compact View',
    description: 'A view with minimal padding',
    padding: 'sm',
    children: <SampleContent />,
  },
}

export const WithNoPadding: Story = {
  args: {
    title: 'Full Bleed Content',
    description: 'Content that extends to the edges',
    padding: 'none',
    children: <SampleContent />,
  },
}

export const WithCustomClassName: Story = {
  args: {
    title: 'Custom Styled Content',
    description: 'Content with custom styling',
    className: 'bg-muted/50',
    contentClassName: 'bg-background/50',
    children: <SampleContent />,
  },
}

export const PageHeaderExample: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => (
    <div className="space-y-8">
      <PageHeader
        title="Page Header Example"
        description="This is a standalone page header component"
        breadcrumbs={sampleBreadcrumbs}
        actions={sampleActions}
      />
      <div className="rounded-lg border p-4">
        <p>Content below the page header</p>
      </div>
    </div>
  ),
}

export const WithInteractiveBreadcrumbs: Story = {
  args: {
    title: 'Interactive Navigation',
    description: 'Try clicking the breadcrumb items',
    breadcrumbs: [
      {
        label: 'Home',
        onClick: () => {
          // Home clicked
        },
      },
      {
        label: 'Projects',
        onClick: () => {
          // Projects clicked
        },
      },
      { label: 'Current Project' },
    ],
    children: <SampleContent />,
  },
}

export const WithLongContent: Story = {
  args: {
    title: 'Long Content Example',
    description: 'Demonstrating how the component handles long content',
    breadcrumbs: sampleBreadcrumbs,
    actions: sampleActions,
    children: (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <h3 className="text-lg font-medium">Content Section {i + 1}</h3>
            <p className="text-muted-foreground">
              This is a sample content section to demonstrate how the component handles multiple
              sections and long content. The content should scroll properly within the container
              while maintaining the header position.
            </p>
          </div>
        ))}
      </div>
    ),
  },
}
