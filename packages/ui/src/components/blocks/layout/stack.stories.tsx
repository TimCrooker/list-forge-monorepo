import type { Meta, StoryObj } from '@storybook/react'
import { Stack } from './stack'

const meta: Meta<typeof Stack> = {
  title: 'Blocks/Layout/Stack',
  component: Stack,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Stack>

const StackDemo = ({ children, ...props }: any) => (
  <div className="w-full max-w-4xl">
    <Stack {...props}>{children}</Stack>
  </div>
)

const StackItem = ({ children, ...props }: any) => (
  <div className="bg-primary/10 p-4 rounded-lg" {...props}>
    {children}
  </div>
)

export const Vertical: Story = {
  render: args => (
    <StackDemo {...args}>
      <StackItem>Item 1</StackItem>
      <StackItem>Item 2</StackItem>
      <StackItem>Item 3</StackItem>
      <StackItem>Item 4</StackItem>
    </StackDemo>
  ),
  args: {
    direction: 'vertical',
    spacing: 'md',
  },
}

export const Horizontal: Story = {
  render: args => (
    <StackDemo {...args}>
      <StackItem>Item 1</StackItem>
      <StackItem>Item 2</StackItem>
      <StackItem>Item 3</StackItem>
      <StackItem>Item 4</StackItem>
    </StackDemo>
  ),
  args: {
    direction: 'horizontal',
    spacing: 'md',
  },
}

export const Responsive: Story = {
  render: args => (
    <StackDemo {...args}>
      <StackItem>Item 1</StackItem>
      <StackItem>Item 2</StackItem>
      <StackItem>Item 3</StackItem>
      <StackItem>Item 4</StackItem>
    </StackDemo>
  ),
  args: {
    direction: 'responsive',
    spacing: 'md',
  },
}

export const DifferentSpacings: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Extra Small</h3>
        <StackDemo {...args} spacing="xs">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <StackDemo {...args} spacing="sm">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium</h3>
        <StackDemo {...args} spacing="md">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <StackDemo {...args} spacing="lg">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Extra Large</h3>
        <StackDemo {...args} spacing="xl">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">2X Large</h3>
        <StackDemo {...args} spacing="2xl">
          <StackItem>Item 1</StackItem>
          <StackItem>Item 2</StackItem>
          <StackItem>Item 3</StackItem>
        </StackDemo>
      </div>
    </div>
  ),
  args: {
    direction: 'vertical',
  },
}

export const DifferentAlignments: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Start</h3>
        <StackDemo {...args} align="start">
          <StackItem className="h-20">Item 1</StackItem>
          <StackItem className="h-32">Item 2</StackItem>
          <StackItem className="h-24">Item 3</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Center</h3>
        <StackDemo {...args} align="center">
          <StackItem className="h-20">Item 1</StackItem>
          <StackItem className="h-32">Item 2</StackItem>
          <StackItem className="h-24">Item 3</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">End</h3>
        <StackDemo {...args} align="end">
          <StackItem className="h-20">Item 1</StackItem>
          <StackItem className="h-32">Item 2</StackItem>
          <StackItem className="h-24">Item 3</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Stretch</h3>
        <StackDemo {...args} align="stretch">
          <StackItem className="h-20">Item 1</StackItem>
          <StackItem className="h-32">Item 2</StackItem>
          <StackItem className="h-24">Item 3</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Baseline</h3>
        <StackDemo {...args} align="baseline">
          <StackItem className="h-20">Item 1</StackItem>
          <StackItem className="h-32">Item 2</StackItem>
          <StackItem className="h-24">Item 3</StackItem>
        </StackDemo>
      </div>
    </div>
  ),
  args: {
    direction: 'horizontal',
    spacing: 'md',
  },
}

export const DifferentJustifications: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Start</h3>
        <StackDemo {...args} justify="start">
          <StackItem className="w-20">Item 1</StackItem>
          <StackItem className="w-20">Item 2</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Center</h3>
        <StackDemo {...args} justify="center">
          <StackItem className="w-20">Item 1</StackItem>
          <StackItem className="w-20">Item 2</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">End</h3>
        <StackDemo {...args} justify="end">
          <StackItem className="w-20">Item 1</StackItem>
          <StackItem className="w-20">Item 2</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Between</h3>
        <StackDemo {...args} justify="between">
          <StackItem className="w-20">Item 1</StackItem>
          <StackItem className="w-20">Item 2</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Around</h3>
        <StackDemo {...args} justify="around">
          <StackItem className="w-20">Item 1</StackItem>
          <StackItem className="w-20">Item 2</StackItem>
        </StackDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Evenly</h3>
        <StackDemo {...args} justify="evenly">
          <StackItem className="w-20">Item 1</StackItem>
          <StackItem className="w-20">Item 2</StackItem>
        </StackDemo>
      </div>
    </div>
  ),
  args: {
    direction: 'horizontal',
    spacing: 'md',
  },
}

export const WithWrap: Story = {
  render: args => (
    <StackDemo {...args}>
      <StackItem className="w-40">Item 1</StackItem>
      <StackItem className="w-40">Item 2</StackItem>
      <StackItem className="w-40">Item 3</StackItem>
      <StackItem className="w-40">Item 4</StackItem>
      <StackItem className="w-40">Item 5</StackItem>
      <StackItem className="w-40">Item 6</StackItem>
    </StackDemo>
  ),
  args: {
    direction: 'horizontal',
    spacing: 'md',
    wrap: true,
  },
}

export const Reversed: Story = {
  render: args => (
    <StackDemo {...args}>
      <StackItem>Item 1</StackItem>
      <StackItem>Item 2</StackItem>
      <StackItem>Item 3</StackItem>
      <StackItem>Item 4</StackItem>
    </StackDemo>
  ),
  args: {
    direction: 'vertical',
    spacing: 'md',
    reverse: true,
  },
}

export const CustomElement: Story = {
  render: args => (
    <StackDemo {...args} as="nav">
      <StackItem as="a" href="#" className="hover:bg-primary/20">
        Link 1
      </StackItem>
      <StackItem as="a" href="#" className="hover:bg-primary/20">
        Link 2
      </StackItem>
      <StackItem as="a" href="#" className="hover:bg-primary/20">
        Link 3
      </StackItem>
      <StackItem as="a" href="#" className="hover:bg-primary/20">
        Link 4
      </StackItem>
    </StackDemo>
  ),
  args: {
    direction: 'horizontal',
    spacing: 'md',
  },
}
