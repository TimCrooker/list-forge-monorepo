import type { Meta, StoryObj } from '@storybook/react'
import { Show, Hide } from './responsive'

const meta: Meta<typeof Show> = {
  title: 'Blocks/Layout/Responsive',
  component: Show,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Show>

const ResponsiveDemo = ({ children, ...props }: any) => (
  <div className="w-full max-w-4xl">
    <div className="bg-primary/10 p-4 rounded-lg">{children}</div>
  </div>
)

export const ShowAbove: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Above SM</h3>
        <ResponsiveDemo>
          <Show {...args} above="sm">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible above the SM breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Above MD</h3>
        <ResponsiveDemo>
          <Show {...args} above="md">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible above the MD breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Above LG</h3>
        <ResponsiveDemo>
          <Show {...args} above="lg">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible above the LG breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Above XL</h3>
        <ResponsiveDemo>
          <Show {...args} above="xl">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible above the XL breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Above 2XL</h3>
        <ResponsiveDemo>
          <Show {...args} above="2xl">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible above the 2XL breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
    </div>
  ),
}

export const ShowBelow: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Below SM</h3>
        <ResponsiveDemo>
          <Show {...args} below="sm">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible below the SM breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Below MD</h3>
        <ResponsiveDemo>
          <Show {...args} below="md">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible below the MD breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Below LG</h3>
        <ResponsiveDemo>
          <Show {...args} below="lg">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible below the LG breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Below XL</h3>
        <ResponsiveDemo>
          <Show {...args} below="xl">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible below the XL breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Below 2XL</h3>
        <ResponsiveDemo>
          <Show {...args} below="2xl">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible below the 2XL breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
    </div>
  ),
}

export const ShowAt: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">At SM</h3>
        <ResponsiveDemo>
          <Show {...args} at="sm">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible at the SM breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">At MD</h3>
        <ResponsiveDemo>
          <Show {...args} at="md">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible at the MD breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">At LG</h3>
        <ResponsiveDemo>
          <Show {...args} at="lg">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible at the LG breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">At XL</h3>
        <ResponsiveDemo>
          <Show {...args} at="xl">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible at the XL breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">At 2XL</h3>
        <ResponsiveDemo>
          <Show {...args} at="2xl">
            <div className="bg-white p-4 rounded-lg">
              This content is only visible at the 2XL breakpoint
            </div>
          </Show>
        </ResponsiveDemo>
      </div>
    </div>
  ),
}

export const HideAbove: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Above SM</h3>
        <ResponsiveDemo>
          <Hide {...args} above="sm">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden above the SM breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Above MD</h3>
        <ResponsiveDemo>
          <Hide {...args} above="md">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden above the MD breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Above LG</h3>
        <ResponsiveDemo>
          <Hide {...args} above="lg">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden above the LG breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Above XL</h3>
        <ResponsiveDemo>
          <Hide {...args} above="xl">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden above the XL breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Above 2XL</h3>
        <ResponsiveDemo>
          <Hide {...args} above="2xl">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden above the 2XL breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
    </div>
  ),
}

export const HideBelow: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Below SM</h3>
        <ResponsiveDemo>
          <Hide {...args} below="sm">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden below the SM breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Below MD</h3>
        <ResponsiveDemo>
          <Hide {...args} below="md">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden below the MD breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Below LG</h3>
        <ResponsiveDemo>
          <Hide {...args} below="lg">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden below the LG breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Below XL</h3>
        <ResponsiveDemo>
          <Hide {...args} below="xl">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden below the XL breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Below 2XL</h3>
        <ResponsiveDemo>
          <Hide {...args} below="2xl">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden below the 2XL breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
    </div>
  ),
}

export const HideAt: Story = {
  render: args => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">At SM</h3>
        <ResponsiveDemo>
          <Hide {...args} at="sm">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden at the SM breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">At MD</h3>
        <ResponsiveDemo>
          <Hide {...args} at="md">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden at the MD breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">At LG</h3>
        <ResponsiveDemo>
          <Hide {...args} at="lg">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden at the LG breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">At XL</h3>
        <ResponsiveDemo>
          <Hide {...args} at="xl">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden at the XL breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">At 2XL</h3>
        <ResponsiveDemo>
          <Hide {...args} at="2xl">
            <div className="bg-white p-4 rounded-lg">
              This content is hidden at the 2XL breakpoint
            </div>
          </Hide>
        </ResponsiveDemo>
      </div>
    </div>
  ),
}

export const CustomElement: Story = {
  render: args => (
    <ResponsiveDemo>
      <Show {...args} above="md" as="article">
        <div className="bg-white p-4 rounded-lg">
          This content is shown above MD breakpoint using a custom article element
        </div>
      </Show>
    </ResponsiveDemo>
  ),
}
