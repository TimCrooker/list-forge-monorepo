import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SonnerToaster as Toaster } from './sonner'
import { Button } from './button'
import { toast } from 'sonner'

const meta = {
  title: 'UI/Sonner',
  component: Toaster,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <>
        <Toaster />
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Button variant="outline" onClick={() => toast('Event has been created')}>
      Show Toast
    </Button>
  ),
}

export const Success: Story = {
  render: () => (
    <Button variant="outline" onClick={() => toast.success('Event has been created')}>
      Show Success
    </Button>
  ),
}

export const Error: Story = {
  render: () => (
    <Button variant="outline" onClick={() => toast.error('Event has not been created')}>
      Show Error
    </Button>
  ),
}

export const Info: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.info('Be at the area 10 minutes before the event time')}
    >
      Show Info
    </Button>
  ),
}

export const Warning: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.warning('Event start time cannot be earlier than 8am')}
    >
      Show Warning
    </Button>
  ),
}

export const WithDescription: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast('Event has been created', {
          description: 'Monday, January 3rd at 6:00pm',
        })
      }
    >
      Show with Description
    </Button>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast('Event has been created', {
          action: {
            label: 'Undo',
            onClick: () => console.debug('Undo'),
          },
        })
      }
    >
      Show with Action
    </Button>
  ),
}

export const Promise: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => {
        const promise = () => new Promise(resolve => setTimeout(resolve, 2000))

        toast.promise(promise, {
          loading: 'Loading...',
          success: 'Success!',
          error: 'Error',
        })
      }}
    >
      Show Promise
    </Button>
  ),
}

export const Custom: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.custom(t => (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <p className="font-semibold">Custom toast</p>
            <p className="text-sm text-gray-500">This is a custom toast component</p>
            <button
              onClick={() => toast.dismiss(t)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-500"
            >
              Dismiss
            </button>
          </div>
        ))
      }
    >
      Show Custom
    </Button>
  ),
}

export const AllTypes: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Button onClick={() => toast('Default toast')}>Default</Button>
      <Button onClick={() => toast.success('Success toast')}>Success</Button>
      <Button onClick={() => toast.error('Error toast')}>Error</Button>
      <Button onClick={() => toast.info('Info toast')}>Info</Button>
      <Button onClick={() => toast.warning('Warning toast')}>Warning</Button>
      <Button onClick={() => toast.loading('Loading toast')}>Loading</Button>
    </div>
  ),
}
