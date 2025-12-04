import type { Meta, StoryObj } from '@storybook/react'
import { Container } from './container'

const meta: Meta<typeof Container> = {
  title: 'Blocks/Layout/Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Container>

const ContainerDemo = ({ children, ...props }: any) => (
  <div className="bg-gray-100 min-h-screen">
    <Container {...props}>
      <div className="bg-white p-8 rounded-lg shadow-sm">{children}</div>
    </Container>
  </div>
)

export const Small: Story = {
  render: args => (
    <ContainerDemo {...args}>
      <h2 className="text-2xl font-bold mb-4">Small Container</h2>
      <p className="text-gray-600">
        This is a small container that's perfect for focused content like forms or single-column
        layouts.
      </p>
    </ContainerDemo>
  ),
  args: {
    size: 'sm',
    padding: 'md',
  },
}

export const Medium: Story = {
  render: args => (
    <ContainerDemo {...args}>
      <h2 className="text-2xl font-bold mb-4">Medium Container</h2>
      <p className="text-gray-600">
        A medium container is great for most content sections and provides a good balance between
        readability and space utilization.
      </p>
    </ContainerDemo>
  ),
  args: {
    size: 'md',
    padding: 'md',
  },
}

export const Large: Story = {
  render: args => (
    <ContainerDemo {...args}>
      <h2 className="text-2xl font-bold mb-4">Large Container</h2>
      <p className="text-gray-600">
        The large container is ideal for main content areas and can accommodate multi-column layouts
        while maintaining good readability.
      </p>
    </ContainerDemo>
  ),
  args: {
    size: 'lg',
    padding: 'md',
  },
}

export const ExtraLarge: Story = {
  render: args => (
    <ContainerDemo {...args}>
      <h2 className="text-2xl font-bold mb-4">Extra Large Container</h2>
      <p className="text-gray-600">
        Extra large containers are perfect for full-width layouts that need to maintain some maximum
        width constraints for optimal viewing on large screens.
      </p>
    </ContainerDemo>
  ),
  args: {
    size: 'xl',
    padding: 'md',
  },
}

export const TwoExtraLarge: Story = {
  render: args => (
    <ContainerDemo {...args}>
      <h2 className="text-2xl font-bold mb-4">2XL Container</h2>
      <p className="text-gray-600">
        The 2XL container provides maximum width while still maintaining some constraints for the
        largest screens.
      </p>
    </ContainerDemo>
  ),
  args: {
    size: '2xl',
    padding: 'md',
  },
}

export const Full: Story = {
  render: args => (
    <ContainerDemo {...args}>
      <h2 className="text-2xl font-bold mb-4">Full Width Container</h2>
      <p className="text-gray-600">
        A full-width container that extends to the edges of the screen, useful for hero sections or
        full-width content.
      </p>
    </ContainerDemo>
  ),
  args: {
    size: 'full',
    padding: 'md',
  },
}

export const Prose: Story = {
  render: args => (
    <ContainerDemo {...args}>
      <h2 className="text-2xl font-bold mb-4">Prose Container</h2>
      <p className="text-gray-600">
        The prose container is optimized for long-form content like articles or documentation, with
        a width that's perfect for comfortable reading.
      </p>
    </ContainerDemo>
  ),
  args: {
    size: 'prose',
    padding: 'md',
  },
}

export const DifferentPaddings: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">No Padding</h3>
        <ContainerDemo {...args} padding="none">
          <p className="text-gray-600">Container with no padding</p>
        </ContainerDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Small Padding</h3>
        <ContainerDemo {...args} padding="sm">
          <p className="text-gray-600">Container with small padding</p>
        </ContainerDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium Padding</h3>
        <ContainerDemo {...args} padding="md">
          <p className="text-gray-600">Container with medium padding</p>
        </ContainerDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large Padding</h3>
        <ContainerDemo {...args} padding="lg">
          <p className="text-gray-600">Container with large padding</p>
        </ContainerDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Extra Large Padding</h3>
        <ContainerDemo {...args} padding="xl">
          <p className="text-gray-600">Container with extra large padding</p>
        </ContainerDemo>
      </div>
    </div>
  ),
  args: {
    size: 'md',
  },
}

export const NotCentered: Story = {
  render: args => (
    <ContainerDemo {...args}>
      <h2 className="text-2xl font-bold mb-4">Not Centered Container</h2>
      <p className="text-gray-600">
        This container is not centered and will align to the left of the screen.
      </p>
    </ContainerDemo>
  ),
  args: {
    size: 'md',
    padding: 'md',
    center: false,
  },
}

export const CustomElement: Story = {
  render: args => (
    <ContainerDemo {...args} as="main">
      <h2 className="text-2xl font-bold mb-4">Custom Element Container</h2>
      <p className="text-gray-600">
        This container uses a custom HTML element (main) instead of the default div.
      </p>
    </ContainerDemo>
  ),
  args: {
    size: 'md',
    padding: 'md',
  },
}
