import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from './switch'
import { Label } from './label'

const meta = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Switch />,
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="disabled" disabled />
      <Label htmlFor="disabled" className="opacity-50">
        Disabled Switch
      </Label>
    </div>
  ),
}

export const CheckedDisabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="checked-disabled" checked disabled />
      <Label htmlFor="checked-disabled" className="opacity-50">
        Checked & Disabled
      </Label>
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">Manage how you receive notifications.</p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="marketing">Marketing emails</Label>
            <p className="text-sm text-muted-foreground">
              Receive emails about new products, features, and more.
            </p>
          </div>
          <Switch id="marketing" />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="security">Security emails</Label>
            <p className="text-sm text-muted-foreground">
              Receive emails about your account security.
            </p>
          </div>
          <Switch id="security" defaultChecked />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="updates">Product updates</Label>
            <p className="text-sm text-muted-foreground">
              Receive updates about product changes and improvements.
            </p>
          </div>
          <Switch id="updates" />
        </div>
      </div>
    </div>
  ),
}
