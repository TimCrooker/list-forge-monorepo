import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from './separator'

const meta = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
        <p className="text-sm text-muted-foreground">An open-source UI component library.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <h4 className="mb-4 text-sm font-medium leading-none">Account Settings</h4>
      <div className="space-y-4">
        <div>
          <p className="text-sm">Profile</p>
          <p className="text-xs text-muted-foreground">Manage your public profile</p>
        </div>
        <Separator />
        <div>
          <p className="text-sm">Billing</p>
          <p className="text-xs text-muted-foreground">Manage billing and payment details</p>
        </div>
        <Separator />
        <div>
          <p className="text-sm">Notifications</p>
          <p className="text-xs text-muted-foreground">Customize your notification preferences</p>
        </div>
      </div>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center">
      <div className="text-center">
        <p className="text-2xl font-bold">50</p>
        <p className="text-xs text-muted-foreground">Tasks</p>
      </div>
      <Separator orientation="vertical" className="mx-4 h-full" />
      <div className="text-center">
        <p className="text-2xl font-bold">12</p>
        <p className="text-xs text-muted-foreground">Completed</p>
      </div>
      <Separator orientation="vertical" className="mx-4 h-full" />
      <div className="text-center">
        <p className="text-2xl font-bold">38</p>
        <p className="text-xs text-muted-foreground">Remaining</p>
      </div>
    </div>
  ),
}
