import type { Meta, StoryObj } from '@storybook/react'
import { Section } from './section'

const meta: Meta<typeof Section> = {
  title: 'Blocks/Layout/Section',
  component: Section,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Section>

const SectionDemo = ({ children, ...props }: any) => (
  <Section {...props}>
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Section Title</h2>
      <p className="text-gray-600">
        This is a section component that can be used to create distinct content areas with various
        styling options.
      </p>
    </div>
  </Section>
)

export const Small: Story = {
  render: args => <SectionDemo {...args} />,
  args: {
    size: 'sm',
    padding: 'md',
  },
}

export const Medium: Story = {
  render: args => <SectionDemo {...args} />,
  args: {
    size: 'md',
    padding: 'md',
  },
}

export const Large: Story = {
  render: args => <SectionDemo {...args} />,
  args: {
    size: 'lg',
    padding: 'md',
  },
}

export const ExtraLarge: Story = {
  render: args => <SectionDemo {...args} />,
  args: {
    size: 'xl',
    padding: 'md',
  },
}

export const TwoExtraLarge: Story = {
  render: args => <SectionDemo {...args} />,
  args: {
    size: '2xl',
    padding: 'md',
  },
}

export const DifferentPaddings: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">No Padding</h3>
        <SectionDemo {...args} padding="none" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Small Padding</h3>
        <SectionDemo {...args} padding="sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium Padding</h3>
        <SectionDemo {...args} padding="md" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large Padding</h3>
        <SectionDemo {...args} padding="lg" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Extra Large Padding</h3>
        <SectionDemo {...args} padding="xl" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">2XL Padding</h3>
        <SectionDemo {...args} padding="2xl" />
      </div>
    </div>
  ),
  args: {
    size: 'md',
  },
}

export const DifferentBackgrounds: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">None</h3>
        <SectionDemo {...args} background="none" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Subtle</h3>
        <SectionDemo {...args} background="subtle" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Muted</h3>
        <SectionDemo {...args} background="muted" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Card</h3>
        <SectionDemo {...args} background="card" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Primary</h3>
        <SectionDemo {...args} background="primary" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Secondary</h3>
        <SectionDemo {...args} background="secondary" />
      </div>
    </div>
  ),
  args: {
    size: 'md',
    padding: 'md',
  },
}

export const DifferentBorders: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">None</h3>
        <SectionDemo {...args} border="none" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Top</h3>
        <SectionDemo {...args} border="top" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Bottom</h3>
        <SectionDemo {...args} border="bottom" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Both</h3>
        <SectionDemo {...args} border="both" />
      </div>
    </div>
  ),
  args: {
    size: 'md',
    padding: 'md',
  },
}

export const Rounded: Story = {
  render: args => <SectionDemo {...args} />,
  args: {
    size: 'md',
    padding: 'md',
    rounded: true,
    background: 'card',
  },
}

export const FullHeight: Story = {
  render: args => <SectionDemo {...args} />,
  args: {
    size: 'md',
    padding: 'md',
    fullHeight: true,
    background: 'muted',
  },
}

export const CustomPadding: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Custom X Padding</h3>
        <SectionDemo {...args} paddingX="xl" paddingY="md" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Custom Y Padding</h3>
        <SectionDemo {...args} paddingX="md" paddingY="xl" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Custom Both</h3>
        <SectionDemo {...args} paddingX="lg" paddingY="2xl" />
      </div>
    </div>
  ),
  args: {
    size: 'md',
  },
}

export const CustomElement: Story = {
  render: args => (
    <SectionDemo {...args} as="article">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Article Section</h2>
        <p className="text-gray-600">
          This section uses a custom HTML element (article) instead of the default section element.
        </p>
      </div>
    </SectionDemo>
  ),
  args: {
    size: 'md',
    padding: 'md',
  },
}
