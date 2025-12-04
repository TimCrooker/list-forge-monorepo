import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from './toaster'
import { ToastAction } from './toast'

const meta = {
  title: 'UI/Toast',
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
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const ToastDemo = () => {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          description: 'Your message has been sent.',
        })
      }}
    >
      Show Toast
    </Button>
  )
}

export const Default: Story = {
  render: () => <ToastDemo />,
}

const ToastWithTitle = () => {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: 'Scheduled: Catch up',
          description: 'Friday, February 10, 2023 at 5:57 PM',
        })
      }}
    >
      Show Toast with Title
    </Button>
  )
}

export const WithTitle: Story = {
  render: () => <ToastWithTitle />,
}

const ToastWithAction = () => {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem with your request.',
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        })
      }}
    >
      Show Toast with Action
    </Button>
  )
}

export const WithAction: Story = {
  render: () => <ToastWithAction />,
}

const ToastDestructive = () => {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem with your request.',
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        })
      }}
    >
      Show Destructive Toast
    </Button>
  )
}

export const Destructive: Story = {
  render: () => <ToastDestructive />,
}

const ToastExamples = () => {
  const { toast } = useToast()

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        onClick={() => {
          toast({
            title: 'Success!',
            description: 'Your changes have been saved.',
          })
        }}
      >
        Success Toast
      </Button>
      <Button
        onClick={() => {
          toast({
            title: 'Info',
            description: 'New updates are available.',
            action: <ToastAction altText="Update">Update</ToastAction>,
          })
        }}
      >
        Info Toast
      </Button>
      <Button
        onClick={() => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete the item.',
          })
        }}
      >
        Error Toast
      </Button>
      <Button
        onClick={() => {
          toast({
            title: 'Warning',
            description: 'Your session will expire in 5 minutes.',
            action: <ToastAction altText="Extend">Extend</ToastAction>,
          })
        }}
      >
        Warning Toast
      </Button>
    </div>
  )
}

export const Examples: Story = {
  render: () => <ToastExamples />,
}
