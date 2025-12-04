import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Label } from './label'
import { Input } from './input'
import { Button } from './button'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
}

export const WithDisabled: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics" disabled>
          Analytics
        </TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Overview</h3>
          <p className="text-muted-foreground">
            Welcome to your dashboard. Here's what's happening with your business today.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="reports" className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Reports</h3>
          <p className="text-muted-foreground">
            View detailed reports and analytics for your business.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex space-x-8">
      <Tabs defaultValue="general" orientation="vertical" className="w-[600px]">
        <TabsList className="h-auto">
          <TabsTrigger value="general" className="justify-start">
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="justify-start">
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="justify-start">
            Integrations
          </TabsTrigger>
          <TabsTrigger value="advanced" className="justify-start">
            Advanced
          </TabsTrigger>
        </TabsList>
        <div className="ml-8">
          <TabsContent value="general" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">General Settings</h3>
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input id="project-name" placeholder="My Awesome Project" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="A brief description..." />
              </div>
              <Button>Save Changes</Button>
            </div>
          </TabsContent>
          <TabsContent value="security" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Security Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage your security preferences and two-factor authentication.
              </p>
              <Button variant="outline">Enable 2FA</Button>
            </div>
          </TabsContent>
          <TabsContent value="integrations" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Integrations</h3>
              <p className="text-sm text-muted-foreground">
                Connect your account with third-party services.
              </p>
              <Button variant="outline">Browse Integrations</Button>
            </div>
          </TabsContent>
          <TabsContent value="advanced" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Advanced Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure advanced options and developer settings.
              </p>
              <Button variant="destructive">Reset All Settings</Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  ),
}
