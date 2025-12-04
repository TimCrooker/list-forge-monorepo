import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './skeleton'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
}

export const Card: Story = {
  render: () => (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
}

export const List: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  ),
}

export const Table: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <div className="space-y-3">
        <div className="flex space-x-4">
          <Skeleton className="h-6 w-[100px]" />
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-6 w-[100px]" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-8 w-[150px]" />
            <Skeleton className="h-8 w-[100px]" />
          </div>
        ))}
      </div>
    </div>
  ),
}

export const Form: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-10 w-[120px]" />
    </div>
  ),
}
