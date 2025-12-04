import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value="@peduarte" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Browse through different sections of the application.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <nav className="flex flex-col space-y-2">
            <Button variant="ghost" className="justify-start">
              Home
            </Button>
            <Button variant="ghost" className="justify-start">
              Profile
            </Button>
            <Button variant="ghost" className="justify-start">
              Settings
            </Button>
            <Button variant="ghost" className="justify-start">
              Help
            </Button>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  ),
}

export const TopSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Top</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>You have 3 unread messages.</SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">New message from Alice</p>
            <p className="text-sm text-muted-foreground">
              Hey, are you available for a quick call?
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Meeting reminder</p>
            <p className="text-sm text-muted-foreground">Team standup in 30 minutes</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Task completed</p>
            <p className="text-sm text-muted-foreground">
              John marked "Update documentation" as done
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
}

export const BottomSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Bottom</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Cookie Settings</SheetTitle>
          <SheetDescription>Manage your cookie preferences here.</SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Essential Cookies</p>
              <p className="text-sm text-muted-foreground">Required for the website to function</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Always On
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Analytics Cookies</p>
              <p className="text-sm text-muted-foreground">Help us improve our website</p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing Cookies</p>
              <p className="text-sm text-muted-foreground">Used for targeted advertising</p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Save Preferences</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}
