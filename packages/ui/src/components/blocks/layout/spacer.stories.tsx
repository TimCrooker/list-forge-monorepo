import type { Meta, StoryObj } from '@storybook/react'
import { Spacer, Center } from './spacer'

const meta: Meta<typeof Spacer> = {
  title: 'Blocks/Layout/Spacer',
  component: Spacer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Spacer>

const SpacerDemo = ({ children, ...props }: any) => (
  <div className="flex items-center justify-center">
    <div className="bg-primary/10 p-4 rounded-lg">Content</div>
    <Spacer {...props} />
    <div className="bg-primary/10 p-4 rounded-lg">Content</div>
  </div>
)

export const Vertical: Story = {
  render: args => (
    <div className="flex flex-col">
      <div className="bg-primary/10 p-4 rounded-lg">Content</div>
      <Spacer {...args} />
      <div className="bg-primary/10 p-4 rounded-lg">Content</div>
    </div>
  ),
  args: {
    axis: 'vertical',
    size: 'md',
  },
}

export const Horizontal: Story = {
  render: args => <SpacerDemo {...args} />,
  args: {
    axis: 'horizontal',
    size: 'md',
  },
}

export const Both: Story = {
  render: args => (
    <div className="flex flex-col">
      <div className="bg-primary/10 p-4 rounded-lg">Content</div>
      <Spacer {...args} />
      <div className="bg-primary/10 p-4 rounded-lg">Content</div>
    </div>
  ),
  args: {
    axis: 'both',
    size: 'md',
  },
}

export const DifferentSizes: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Extra Small</h3>
        <SpacerDemo {...args} size="xs" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <SpacerDemo {...args} size="sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium</h3>
        <SpacerDemo {...args} size="md" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <SpacerDemo {...args} size="lg" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Extra Large</h3>
        <SpacerDemo {...args} size="xl" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">2XL</h3>
        <SpacerDemo {...args} size="2xl" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">3XL</h3>
        <SpacerDemo {...args} size="3xl" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">4XL</h3>
        <SpacerDemo {...args} size="4xl" />
      </div>
    </div>
  ),
  args: {
    axis: 'horizontal',
  },
}

const CenterDemo = ({ children, ...props }: any) => (
  <div className="w-full h-64 bg-gray-100">
    <Center {...props}>
      <div className="bg-white p-8 rounded-lg shadow-sm">{children}</div>
    </Center>
  </div>
)

export const CenterHorizontal: Story = {
  render: () => (
    <CenterDemo horizontally={true} vertically={false}>
      <h2 className="text-2xl font-bold mb-4">Centered Content</h2>
      <p className="text-gray-600">This content is centered horizontally within its container.</p>
    </CenterDemo>
  ),
}

export const CenterVertical: Story = {
  render: () => (
    <CenterDemo horizontally={false} vertically={true}>
      <h2 className="text-2xl font-bold mb-4">Centered Content</h2>
      <p className="text-gray-600">This content is centered vertically within its container.</p>
    </CenterDemo>
  ),
}

export const CenterBoth: Story = {
  render: () => (
    <CenterDemo horizontally={true} vertically={true}>
      <h2 className="text-2xl font-bold mb-4">Centered Content</h2>
      <p className="text-gray-600">
        This content is centered both horizontally and vertically within its container.
      </p>
    </CenterDemo>
  ),
}

export const CenterMaxWidths: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <CenterDemo horizontally={true} vertically={true} maxWidth="sm">
          <p className="text-gray-600">Small max width content</p>
        </CenterDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium</h3>
        <CenterDemo horizontally={true} vertically={true} maxWidth="md">
          <p className="text-gray-600">Medium max width content</p>
        </CenterDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <CenterDemo horizontally={true} vertically={true} maxWidth="lg">
          <p className="text-gray-600">Large max width content</p>
        </CenterDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Extra Large</h3>
        <CenterDemo horizontally={true} vertically={true} maxWidth="xl">
          <p className="text-gray-600">Extra large max width content</p>
        </CenterDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">2XL</h3>
        <CenterDemo horizontally={true} vertically={true} maxWidth="2xl">
          <p className="text-gray-600">2XL max width content</p>
        </CenterDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Prose</h3>
        <CenterDemo horizontally={true} vertically={true} maxWidth="prose">
          <p className="text-gray-600">Prose max width content</p>
        </CenterDemo>
      </div>
    </div>
  ),
}

export const CenterMinHeight: Story = {
  render: () => (
    <CenterDemo horizontally={true} vertically={true} minHeight={true}>
      <h2 className="text-2xl font-bold mb-4">Full Height Centered</h2>
      <p className="text-gray-600">
        This content is centered in a container with minimum height set to the viewport height.
      </p>
    </CenterDemo>
  ),
}

export const CenterCustomElement: Story = {
  render: () => (
    <CenterDemo horizontally={true} vertically={true} as="main">
      <h2 className="text-2xl font-bold mb-4">Custom Element Center</h2>
      <p className="text-gray-600">
        This center uses a custom HTML element (main) instead of the default div.
      </p>
    </CenterDemo>
  ),
}
