import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MediaGallery } from './media-gallery'
import { TooltipProvider } from '../../ui/tooltip'

const meta: Meta<typeof MediaGallery> = {
  title: 'Blocks/Content/MediaGallery',
  component: MediaGallery,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <TooltipProvider>
        <div className="w-[800px]">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Sample media items
const sampleItems = [
  {
    id: '1',
    url: 'https://picsum.photos/800/600',
    type: 'image' as const,
    title: 'Beautiful Landscape',
    description: 'A stunning view of mountains and lakes',
  },
  {
    id: '2',
    url: 'https://picsum.photos/800/600',
    type: 'image' as const,
    title: 'City Skyline',
    description: 'Modern architecture at sunset',
  },
  {
    id: '3',
    url: 'https://picsum.photos/800/600',
    type: 'image' as const,
    title: 'Nature Scene',
    description: 'Lush green forest with sunlight',
  },
  {
    id: '4',
    url: 'https://picsum.photos/800/600',
    type: 'image' as const,
    title: 'Ocean View',
    description: 'Crystal clear waters and sandy beach',
  },
  {
    id: '5',
    url: 'https://picsum.photos/800/600',
    type: 'image' as const,
    title: 'Mountain Range',
    description: 'Snow-capped peaks under blue sky',
  },
  {
    id: '6',
    url: 'https://picsum.photos/800/600',
    type: 'image' as const,
    title: 'Urban Life',
    description: 'Busy city streets and people',
  },
]

const videoItems = [
  {
    id: 'v1',
    url: 'https://example.com/sample-video.mp4',
    type: 'video' as const,
    title: 'Sample Video 1',
    description: 'A beautiful nature video',
    thumbnail: 'https://picsum.photos/800/600',
  },
  {
    id: 'v2',
    url: 'https://example.com/sample-video-2.mp4',
    type: 'video' as const,
    title: 'Sample Video 2',
    description: 'City life timelapse',
    thumbnail: 'https://picsum.photos/800/600',
  },
]

const mixedItems = [...sampleItems, ...videoItems]

export const Default: Story = {
  args: {
    items: sampleItems,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const GridView: Story = {
  args: {
    items: sampleItems,
    view: 'grid',
    columns: 3,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const CarouselView: Story = {
  args: {
    items: sampleItems,
    view: 'carousel',
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const CustomColumns: Story = {
  args: {
    items: sampleItems,
    view: 'grid',
    columns: 4,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const CustomAspectRatio: Story = {
  args: {
    items: sampleItems,
    view: 'grid',
    aspectRatio: 4 / 3,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const WithoutControls: Story = {
  args: {
    items: sampleItems,
    showControls: false,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const WithVideos: Story = {
  args: {
    items: videoItems,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const MixedContent: Story = {
  args: {
    items: mixedItems,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const CustomClassName: Story = {
  args: {
    items: sampleItems,
    className: 'p-4 bg-gray-100 rounded-lg',
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

// Examples with different layouts
export const TwoColumns: Story = {
  args: {
    items: sampleItems,
    view: 'grid',
    columns: 2,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const SingleColumn: Story = {
  args: {
    items: sampleItems,
    view: 'grid',
    columns: 1,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

// Examples with different aspect ratios
export const SquareAspectRatio: Story = {
  args: {
    items: sampleItems,
    view: 'grid',
    aspectRatio: 1,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const PortraitAspectRatio: Story = {
  args: {
    items: sampleItems,
    view: 'grid',
    aspectRatio: 3 / 4,
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

// Examples with minimal items
export const SingleItem: Story = {
  args: {
    items: [sampleItems[0]],
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}

export const TwoItems: Story = {
  args: {
    items: sampleItems.slice(0, 2),
    onDelete: id => {
      // Delete item: id
    },
    onDownload: id => {
      // Download item: id
    },
  },
}
