import type { Meta, StoryObj } from '@storybook/react'
import { Grid, GridItem } from './grid'

const meta: Meta<typeof Grid> = {
  title: 'Blocks/Layout/Grid',
  component: Grid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Grid>

const GridDemo = ({ children, ...props }: any) => (
  <div className="w-full max-w-4xl">
    <Grid {...props}>{children}</Grid>
  </div>
)

const GridItemDemo = ({ children, ...props }: any) => (
  <GridItem {...props} className="bg-primary/10 p-4 rounded-lg">
    {children}
  </GridItem>
)

export const Basic: Story = {
  render: args => (
    <GridDemo {...args}>
      <GridItemDemo>Item 1</GridItemDemo>
      <GridItemDemo>Item 2</GridItemDemo>
      <GridItemDemo>Item 3</GridItemDemo>
      <GridItemDemo>Item 4</GridItemDemo>
    </GridDemo>
  ),
  args: {
    cols: 2,
    gap: 'md',
  },
}

export const Responsive: Story = {
  render: args => (
    <GridDemo {...args}>
      <GridItemDemo>Item 1</GridItemDemo>
      <GridItemDemo>Item 2</GridItemDemo>
      <GridItemDemo>Item 3</GridItemDemo>
      <GridItemDemo>Item 4</GridItemDemo>
    </GridDemo>
  ),
  args: {
    cols: 1,
    sm: 2,
    md: 3,
    lg: 4,
    gap: 'md',
  },
}

export const DifferentGaps: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Extra Small Gap</h3>
        <GridDemo {...args} gap="xs">
          <GridItemDemo>Item 1</GridItemDemo>
          <GridItemDemo>Item 2</GridItemDemo>
          <GridItemDemo>Item 3</GridItemDemo>
          <GridItemDemo>Item 4</GridItemDemo>
        </GridDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Small Gap</h3>
        <GridDemo {...args} gap="sm">
          <GridItemDemo>Item 1</GridItemDemo>
          <GridItemDemo>Item 2</GridItemDemo>
          <GridItemDemo>Item 3</GridItemDemo>
          <GridItemDemo>Item 4</GridItemDemo>
        </GridDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium Gap</h3>
        <GridDemo {...args} gap="md">
          <GridItemDemo>Item 1</GridItemDemo>
          <GridItemDemo>Item 2</GridItemDemo>
          <GridItemDemo>Item 3</GridItemDemo>
          <GridItemDemo>Item 4</GridItemDemo>
        </GridDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large Gap</h3>
        <GridDemo {...args} gap="lg">
          <GridItemDemo>Item 1</GridItemDemo>
          <GridItemDemo>Item 2</GridItemDemo>
          <GridItemDemo>Item 3</GridItemDemo>
          <GridItemDemo>Item 4</GridItemDemo>
        </GridDemo>
      </div>
    </div>
  ),
  args: {
    cols: 2,
  },
}

export const DifferentAlignments: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Start</h3>
        <GridDemo {...args} align="start">
          <GridItemDemo className="h-20">Item 1</GridItemDemo>
          <GridItemDemo className="h-32">Item 2</GridItemDemo>
          <GridItemDemo className="h-24">Item 3</GridItemDemo>
          <GridItemDemo className="h-28">Item 4</GridItemDemo>
        </GridDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Center</h3>
        <GridDemo {...args} align="center">
          <GridItemDemo className="h-20">Item 1</GridItemDemo>
          <GridItemDemo className="h-32">Item 2</GridItemDemo>
          <GridItemDemo className="h-24">Item 3</GridItemDemo>
          <GridItemDemo className="h-28">Item 4</GridItemDemo>
        </GridDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">End</h3>
        <GridDemo {...args} align="end">
          <GridItemDemo className="h-20">Item 1</GridItemDemo>
          <GridItemDemo className="h-32">Item 2</GridItemDemo>
          <GridItemDemo className="h-24">Item 3</GridItemDemo>
          <GridItemDemo className="h-28">Item 4</GridItemDemo>
        </GridDemo>
      </div>
    </div>
  ),
  args: {
    cols: 2,
    gap: 'md',
  },
}

export const DifferentJustifications: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Start</h3>
        <GridDemo {...args} justify="start">
          <GridItemDemo className="w-20">Item 1</GridItemDemo>
          <GridItemDemo className="w-20">Item 2</GridItemDemo>
        </GridDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Center</h3>
        <GridDemo {...args} justify="center">
          <GridItemDemo className="w-20">Item 1</GridItemDemo>
          <GridItemDemo className="w-20">Item 2</GridItemDemo>
        </GridDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">End</h3>
        <GridDemo {...args} justify="end">
          <GridItemDemo className="w-20">Item 1</GridItemDemo>
          <GridItemDemo className="w-20">Item 2</GridItemDemo>
        </GridDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Between</h3>
        <GridDemo {...args} justify="between">
          <GridItemDemo className="w-20">Item 1</GridItemDemo>
          <GridItemDemo className="w-20">Item 2</GridItemDemo>
        </GridDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Around</h3>
        <GridDemo {...args} justify="around">
          <GridItemDemo className="w-20">Item 1</GridItemDemo>
          <GridItemDemo className="w-20">Item 2</GridItemDemo>
        </GridDemo>
      </div>
    </div>
  ),
  args: {
    cols: 4,
    gap: 'md',
  },
}

export const GridItemSpanning: Story = {
  render: args => (
    <GridDemo {...args}>
      <GridItemDemo span={2}>Spans 2 columns</GridItemDemo>
      <GridItemDemo>Regular item</GridItemDemo>
      <GridItemDemo>Regular item</GridItemDemo>
      <GridItemDemo span={3}>Spans 3 columns</GridItemDemo>
      <GridItemDemo>Regular item</GridItemDemo>
      <GridItemDemo span="full">Spans full width</GridItemDemo>
    </GridDemo>
  ),
  args: {
    cols: 4,
    gap: 'md',
  },
}

export const GridItemPositioning: Story = {
  render: args => (
    <GridDemo {...args}>
      <GridItemDemo start={2} span={2}>
        Starts at 2, spans 2
      </GridItemDemo>
      <GridItemDemo>Regular item</GridItemDemo>
      <GridItemDemo>Regular item</GridItemDemo>
      <GridItemDemo start={1} end={3}>
        Starts at 1, ends at 3
      </GridItemDemo>
      <GridItemDemo>Regular item</GridItemDemo>
      <GridItemDemo>Regular item</GridItemDemo>
    </GridDemo>
  ),
  args: {
    cols: 4,
    gap: 'md',
  },
}

export const DenseGrid: Story = {
  render: args => (
    <GridDemo {...args}>
      <GridItemDemo>Item 1</GridItemDemo>
      <GridItemDemo span={2}>Item 2 (spans 2)</GridItemDemo>
      <GridItemDemo>Item 3</GridItemDemo>
      <GridItemDemo>Item 4</GridItemDemo>
      <GridItemDemo span={2}>Item 5 (spans 2)</GridItemDemo>
      <GridItemDemo>Item 6</GridItemDemo>
    </GridDemo>
  ),
  args: {
    cols: 3,
    gap: 'md',
    flow: 'dense',
  },
}

export const CustomElement: Story = {
  render: args => (
    <GridDemo {...args} as="section">
      <GridItemDemo as="article">Article 1</GridItemDemo>
      <GridItemDemo as="article">Article 2</GridItemDemo>
      <GridItemDemo as="article">Article 3</GridItemDemo>
      <GridItemDemo as="article">Article 4</GridItemDemo>
    </GridDemo>
  ),
  args: {
    cols: 2,
    gap: 'md',
  },
}
