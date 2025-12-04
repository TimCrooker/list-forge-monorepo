import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FileUpload } from './file-upload'

const meta = {
  title: 'Blocks/Content/FileUpload',
  component: FileUpload,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FileUpload>

export default meta
type Story = StoryObj<typeof meta>

// Sample files for preview
const sampleFiles = [
  new File([''], 'document.pdf', { type: 'application/pdf' }),
  new File([''], 'image.jpg', { type: 'image/jpeg' }),
  new File([''], 'spreadsheet.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }),
  new File([''], 'text.txt', { type: 'text/plain' }),
]

export const Default: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
  },
}

export const WithFiles: Story = {
  args: {
    value: sampleFiles,
    onChange: files => {
      // Files changed: files
    },
  },
}

export const MultipleFiles: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    multiple: true,
  },
}

export const SingleFile: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    multiple: false,
  },
}

export const WithFileTypes: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    accept: '.pdf,.doc,.docx,.txt',
  },
}

export const WithMaxSize: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  },
}

export const WithMaxFiles: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    maxFiles: 3,
    multiple: true,
  },
}

export const WithoutPreview: Story = {
  args: {
    value: sampleFiles,
    onChange: files => {
      // Files changed: files
    },
    showPreview: false,
  },
}

export const WithoutProgress: Story = {
  args: {
    value: sampleFiles,
    onChange: files => {
      // Files changed: files
    },
    showProgress: false,
  },
}

export const CustomClassName: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    className: 'p-4 bg-gray-100 rounded-lg',
  },
}

// Examples with different file types
export const ImagesOnly: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    accept: 'image/*',
    multiple: true,
  },
}

export const DocumentsOnly: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    accept: '.pdf,.doc,.docx,.txt',
    multiple: true,
  },
}

export const SpreadsheetsOnly: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    accept: '.xlsx,.xls,.csv',
    multiple: true,
  },
}

// Examples with different size limits
export const SmallFiles: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    maxSize: 1 * 1024 * 1024, // 1MB
    multiple: true,
  },
}

export const LargeFiles: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  },
}

// Examples with different file limits
export const SingleFileLimit: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    maxFiles: 1,
    multiple: true,
  },
}

export const ManyFilesLimit: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    maxFiles: 10,
    multiple: true,
  },
}

// Examples with different combinations
export const ImageUploader: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    multiple: true,
  },
}

export const DocumentUploader: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    accept: '.pdf,.doc,.docx,.txt',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 3,
    multiple: true,
  },
}

export const MediaUploader: Story = {
  args: {
    value: [],
    onChange: files => {
      // Files changed: files
    },
    accept: 'image/*,video/*',
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 5,
    multiple: true,
  },
}
