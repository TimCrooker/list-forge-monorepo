import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Slider } from './slider'

const meta = {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: { type: 'array' },
    },
    max: {
      control: { type: 'number' },
    },
    step: {
      control: { type: 'number' },
    },
  },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
    className: 'w-[60%]',
  },
}

export const Range: Story = {
  args: {
    defaultValue: [25, 75],
    max: 100,
    step: 1,
    className: 'w-[60%]',
  },
}

export const WithSteps: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 10,
    className: 'w-[60%]',
  },
}

export const Disabled: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
    disabled: true,
    className: 'w-[60%]',
  },
}

export const WithLabels: Story = {
  render: () => {
    const [value, setValue] = React.useState([50])

    return (
      <div className="w-[350px] space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Volume</span>
          <span>{value[0]}%</span>
        </div>
        <Slider value={value} onValueChange={setValue} max={100} step={1} />
      </div>
    )
  },
}

export const PriceRange: Story = {
  render: () => {
    const [value, setValue] = React.useState([100, 500])

    return (
      <div className="w-[350px] space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Price Range</span>
          <span className="font-medium">
            ${value[0]} - ${value[1]}
          </span>
        </div>
        <Slider value={value} onValueChange={setValue} max={1000} step={10} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span>$1000</span>
        </div>
      </div>
    )
  },
}
