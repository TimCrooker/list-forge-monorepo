import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Progress } from './progress'

const meta = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      defaultValue: 0,
    },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 33,
    className: 'w-[60%]',
  },
}

export const Empty: Story = {
  args: {
    value: 0,
    className: 'w-[60%]',
  },
}

export const Half: Story = {
  args: {
    value: 50,
    className: 'w-[60%]',
  },
}

export const Complete: Story = {
  args: {
    value: 100,
    className: 'w-[60%]',
  },
}

export const Animated: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(13)

    React.useEffect(() => {
      const timer = setTimeout(() => setProgress(66), 500)
      return () => clearTimeout(timer)
    }, [])

    return <Progress value={progress} className="w-[60%]" />
  },
}
