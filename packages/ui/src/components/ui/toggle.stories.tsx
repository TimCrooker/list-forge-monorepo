import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Toggle } from './toggle'
import { Bold, Italic, Underline } from 'lucide-react'

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outline'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg'],
    },
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Toggle aria-label="Toggle italic">
      <Italic className="h-4 w-4" />
    </Toggle>
  ),
}

export const WithText: Story = {
  render: () => (
    <Toggle aria-label="Toggle italic">
      <Italic className="mr-2 h-4 w-4" />
      Italic
    </Toggle>
  ),
}

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
  render: args => (
    <Toggle {...args} aria-label="Toggle italic">
      <Italic className="h-4 w-4" />
    </Toggle>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Toggle aria-label="Toggle italic" disabled>
      <Italic className="h-4 w-4" />
    </Toggle>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Toggle size="sm" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle size="default" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle size="lg" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </Toggle>
    </div>
  ),
}

export const TextFormatting: Story = {
  render: () => {
    const [bold, setBold] = React.useState(false)
    const [italic, setItalic] = React.useState(false)
    const [underline, setUnderline] = React.useState(false)

    return (
      <div className="flex items-center gap-2">
        <Toggle pressed={bold} onPressedChange={setBold} aria-label="Toggle bold">
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle pressed={italic} onPressedChange={setItalic} aria-label="Toggle italic">
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle pressed={underline} onPressedChange={setUnderline} aria-label="Toggle underline">
          <Underline className="h-4 w-4" />
        </Toggle>
      </div>
    )
  },
}
