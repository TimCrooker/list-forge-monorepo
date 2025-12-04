import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './textarea'
import { Label } from './label'
import { Button } from './button'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Type your message here.',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  ),
}

export const WithText: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message-2">Your message</Label>
      <Textarea placeholder="Type your message here." id="message-2" />
      <p className="text-sm text-muted-foreground">
        Your message will be copied to the support team.
      </p>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
  },
}

export const WithButton: Story = {
  render: () => (
    <div className="grid w-full gap-2">
      <Textarea placeholder="Type your message here." />
      <Button>Send message</Button>
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <form className="w-full max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell us a little bit about yourself"
          className="resize-none"
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          You can @mention other users and organizations.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback">Feedback</Label>
        <Textarea
          id="feedback"
          placeholder="What do you think about our product?"
          className="min-h-[100px]"
        />
      </div>
      <Button type="submit">Submit</Button>
    </form>
  ),
}

export const CharacterCount: Story = {
  render: () => {
    const [value, setValue] = React.useState('')
    const maxLength = 280

    return (
      <div className="w-full max-w-md space-y-2">
        <Label htmlFor="tweet">Compose tweet</Label>
        <Textarea
          id="tweet"
          placeholder="What's happening?"
          value={value}
          onChange={e => setValue(e.target.value.slice(0, maxLength))}
          className="resize-none"
          rows={3}
        />
        <div className="flex justify-between text-sm">
          <p className="text-muted-foreground">
            {value.length === 0
              ? 'Enter your message'
              : `${value.length} character${value.length !== 1 ? 's' : ''}`}
          </p>
          <p
            className={
              value.length > maxLength * 0.9 ? 'text-destructive' : 'text-muted-foreground'
            }
          >
            {maxLength - value.length} remaining
          </p>
        </div>
      </div>
    )
  },
}
