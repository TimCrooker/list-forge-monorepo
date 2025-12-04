import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  QuickActions,
  ActionButton,
  FloatingActionButton,
  ActionGroup,
  CommandPalette,
} from './quick-actions'
import {
  Plus,
  Upload,
  Download,
  Send,
  FileText,
  Users,
  Settings,
  Calendar,
  Mail,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Share2,
  Copy,
  Trash2,
  Edit,
  Save,
} from 'lucide-react'

const meta = {
  title: 'Blocks/Application/QuickActions',
  component: QuickActions,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof QuickActions>

export default meta
type Story = StoryObj<typeof meta>

// Sample actions
const sampleActions = [
  {
    id: 'create',
    label: 'Create New',
    icon: <Plus className="h-4 w-4" />,
    description: 'Create a new item',
    onClick: () => {
      // Create
    },
  },
  {
    id: 'upload',
    label: 'Upload',
    icon: <Upload className="h-4 w-4" />,
    description: 'Upload files',
    onClick: () => {
      // Upload
    },
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    description: 'Export data',
    onClick: () => {
      // Export
    },
  },
  {
    id: 'send',
    label: 'Send',
    icon: <Send className="h-4 w-4" />,
    description: 'Send message',
    onClick: () => {
      // Send
    },
  },
  {
    id: 'document',
    label: 'Document',
    icon: <FileText className="h-4 w-4" />,
    description: 'View documents',
    onClick: () => {
      // Document
    },
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Users className="h-4 w-4" />,
    description: 'Manage team',
    onClick: () => {
      // Team
    },
  },
]

const documentActions = [
  {
    id: 'new-doc',
    label: 'New Document',
    icon: <FileText className="h-4 w-4" />,
    description: 'Create a new document',
    onClick: () => {
      // New Document
    },
  },
  {
    id: 'import',
    label: 'Import',
    icon: <Upload className="h-4 w-4" />,
    description: 'Import documents',
    onClick: () => {
      // Import
    },
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    description: 'Export documents',
    onClick: () => {
      // Export
    },
  },
]

const teamActions = [
  {
    id: 'add-member',
    label: 'Add Member',
    icon: <Users className="h-4 w-4" />,
    description: 'Add a new team member',
    onClick: () => {
      // Add Member
    },
  },
  {
    id: 'invite',
    label: 'Invite',
    icon: <Mail className="h-4 w-4" />,
    description: 'Send team invitations',
    onClick: () => {
      // Invite
    },
  },
  {
    id: 'roles',
    label: 'Manage Roles',
    icon: <Settings className="h-4 w-4" />,
    description: 'Configure team roles',
    onClick: () => {
      // Roles
    },
  },
]

export const Default: Story = {
  args: {
    actions: sampleActions,
    title: 'Quick Actions',
    description: 'Common actions for this section',
    layout: 'grid',
    columns: 2,
  },
}

export const GridLayout: Story = {
  args: {
    actions: sampleActions,
    title: 'Grid Layout',
    description: 'Actions displayed in a grid',
    layout: 'grid',
    columns: 3,
  },
}

export const ListLayout: Story = {
  args: {
    actions: sampleActions,
    title: 'List Layout',
    description: 'Actions displayed in a list',
    layout: 'list',
  },
}

export const CompactLayout: Story = {
  args: {
    actions: sampleActions,
    title: 'Compact Layout',
    description: 'Actions displayed in a compact format',
    layout: 'compact',
  },
}

export const SingleColumn: Story = {
  args: {
    actions: sampleActions,
    title: 'Single Column',
    description: 'Actions in a single column',
    layout: 'grid',
    columns: 1,
  },
}

export const FourColumns: Story = {
  args: {
    actions: sampleActions,
    title: 'Four Columns',
    description: 'Actions in four columns',
    layout: 'grid',
    columns: 4,
  },
}

export const WithVariants: Story = {
  args: {
    actions: [
      {
        id: 'create',
        label: 'Create',
        icon: <Plus className="h-4 w-4" />,
        description: 'Default variant',
        onClick: () => {
          // Create
        },
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: <Edit className="h-4 w-4" />,
        description: 'Secondary variant',
        onClick: () => {
          // Edit
        },
        variant: 'secondary',
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        description: 'Destructive variant',
        onClick: () => {
          // Delete
        },
        variant: 'destructive',
      },
      {
        id: 'save',
        label: 'Save',
        icon: <Save className="h-4 w-4" />,
        description: 'Ghost variant',
        onClick: () => {
          // Save
        },
        variant: 'ghost',
      },
    ],
    title: 'Button Variants',
    description: 'Different button variants',
    layout: 'grid',
    columns: 2,
  },
}

export const WithDisabledActions: Story = {
  args: {
    actions: [
      {
        id: 'create',
        label: 'Create',
        icon: <Plus className="h-4 w-4" />,
        description: 'Enabled action',
        onClick: () => {
          // Create
        },
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: <Edit className="h-4 w-4" />,
        description: 'Disabled action',
        onClick: () => {
          // Edit
        },
        disabled: true,
      },
    ],
    title: 'Disabled Actions',
    description: 'Actions with disabled state',
    layout: 'grid',
    columns: 2,
  },
}

export const ActionButtonExample: Story = {
  args: {
    actions: [],
  },
  render: () => (
    <div className="space-y-4">
      <ActionButton
        action={{
          id: 'create',
          label: 'Create New',
          icon: <Plus className="h-4 w-4" />,
          description: 'Create a new item',
          onClick: () => {
            // Create
          },
        }}
        showDescription
      />
      <ActionButton
        action={{
          id: 'edit',
          label: 'Edit',
          icon: <Edit className="h-4 w-4" />,
          description: 'Edit item',
          onClick: () => {
            // Edit
          },
        }}
        size="sm"
      />
    </div>
  ),
}

export const FloatingActionButtonExample: Story = {
  args: {
    actions: [],
  },
  render: () => (
    <div className="relative h-[400px] w-full border">
      <FloatingActionButton
        onClick={() => {
          // FAB clicked
        }}
        icon={<Plus className="h-5 w-5" />}
        label="Create New"
        position="bottom-right"
      />
    </div>
  ),
}

export const ActionGroupExample: Story = {
  args: {
    actions: [],
  },
  render: () => (
    <div className="space-y-4">
      <ActionGroup title="Document Actions" actions={documentActions} defaultExpanded />
      <ActionGroup title="Team Actions" actions={teamActions} defaultExpanded />
    </div>
  ),
}

export const CommandPaletteExample: Story = {
  args: {
    actions: [],
  },
  render: () => (
    <div className="space-y-4">
      <CommandPalette
        actions={[...sampleActions, ...documentActions, ...teamActions]}
        placeholder="Search actions..."
      />
    </div>
  ),
}

export const WithLongLabels: Story = {
  args: {
    actions: [
      {
        id: 'create',
        label: 'Create a New Document with Advanced Settings',
        icon: <Plus className="h-4 w-4" />,
        description: 'Create a new document with advanced configuration options',
        onClick: () => {
          // Create
        },
      },
      {
        id: 'upload',
        label: 'Upload Multiple Files with Progress Tracking',
        icon: <Upload className="h-4 w-4" />,
        description: 'Upload multiple files with progress tracking and validation',
        onClick: () => {
          // Upload
        },
      },
    ],
    title: 'Long Labels',
    description: 'Actions with long labels and descriptions',
    layout: 'grid',
    columns: 2,
  },
}

export const WithManyActions: Story = {
  args: {
    actions: [
      ...sampleActions,
      ...documentActions,
      ...teamActions,
      {
        id: 'calendar',
        label: 'Calendar',
        icon: <Calendar className="h-4 w-4" />,
        description: 'View calendar',
        onClick: () => {
          // Calendar
        },
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: <MessageSquare className="h-4 w-4" />,
        description: 'View messages',
        onClick: () => {
          // Messages
        },
      },
      {
        id: 'search',
        label: 'Search',
        icon: <Search className="h-4 w-4" />,
        description: 'Search items',
        onClick: () => {
          // Search
        },
      },
    ],
    title: 'Many Actions',
    description: 'Grid with many actions',
    layout: 'grid',
    columns: 3,
  },
}
