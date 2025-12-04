import type { Meta, StoryObj } from '@storybook/react'
import { Calendar, type CalendarProps } from './calendar'

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    mode: 'single',
    selected: new Date(),
    className: 'rounded-md border',
  } as CalendarProps,
}
