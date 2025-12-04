import type { Meta, StoryObj } from '@storybook/react'
import { LogoCloud } from './logo-cloud'

const meta: Meta<typeof LogoCloud> = {
  title: 'Blocks/Marketing/LogoCloud',
  component: LogoCloud,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof LogoCloud>

const sampleLogos = [
  {
    name: 'Company 1',
    src: 'https://placehold.co/200x80/2563eb/ffffff?text=Company+1',
    href: 'https://company1.com',
  },
  {
    name: 'Company 2',
    src: 'https://placehold.co/200x80/2563eb/ffffff?text=Company+2',
    href: 'https://company2.com',
  },
  {
    name: 'Company 3',
    src: 'https://placehold.co/200x80/2563eb/ffffff?text=Company+3',
    href: 'https://company3.com',
  },
  {
    name: 'Company 4',
    src: 'https://placehold.co/200x80/2563eb/ffffff?text=Company+4',
    href: 'https://company4.com',
  },
  {
    name: 'Company 5',
    src: 'https://placehold.co/200x80/2563eb/ffffff?text=Company+5',
    href: 'https://company5.com',
  },
  {
    name: 'Company 6',
    src: 'https://placehold.co/200x80/2563eb/ffffff?text=Company+6',
    href: 'https://company6.com',
  },
  {
    name: 'Company 7',
    src: 'https://placehold.co/200x80/2563eb/ffffff?text=Company+7',
    href: 'https://company7.com',
  },
  {
    name: 'Company 8',
    src: 'https://placehold.co/200x80/2563eb/ffffff?text=Company+8',
    href: 'https://company8.com',
  },
]

export const Default: Story = {
  args: {
    title: 'Trusted by leading companies',
    description: 'Join thousands of satisfied customers who trust our platform',
    logos: sampleLogos,
    variant: 'default',
    columns: 5,
    grayscale: true,
  },
}

export const Grid: Story = {
  args: {
    title: 'Our Partners',
    description: 'Working together to build the future',
    logos: sampleLogos,
    variant: 'grid',
    columns: 4,
    grayscale: true,
  },
}

export const Marquee: Story = {
  args: {
    title: 'Featured In',
    description: 'Recognized by industry leaders',
    logos: sampleLogos,
    variant: 'marquee',
    grayscale: true,
  },
}

export const WithoutGrayscale: Story = {
  args: {
    title: 'Our Partners',
    description: 'Working together to build the future',
    logos: sampleLogos,
    variant: 'default',
    columns: 5,
    grayscale: false,
  },
}

export const ThreeColumns: Story = {
  args: {
    title: 'Our Partners',
    description: 'Working together to build the future',
    logos: sampleLogos.slice(0, 3),
    variant: 'grid',
    columns: 3,
    grayscale: true,
  },
}

export const SixColumns: Story = {
  args: {
    title: 'Our Partners',
    description: 'Working together to build the future',
    logos: sampleLogos.slice(0, 6),
    variant: 'grid',
    columns: 6,
    grayscale: true,
  },
}

export const EightColumns: Story = {
  args: {
    title: 'Our Partners',
    description: 'Working together to build the future',
    logos: sampleLogos,
    variant: 'grid',
    columns: 8,
    grayscale: true,
  },
}

export const WithoutTitle: Story = {
  args: {
    logos: sampleLogos,
    variant: 'default',
    columns: 5,
    grayscale: true,
  },
}

export const WithoutDescription: Story = {
  args: {
    title: 'Our Partners',
    logos: sampleLogos,
    variant: 'default',
    columns: 5,
    grayscale: true,
  },
}

export const WithoutLinks: Story = {
  args: {
    title: 'Our Partners',
    description: 'Working together to build the future',
    logos: sampleLogos.map(({ name, src }) => ({ name, src })),
    variant: 'default',
    columns: 5,
    grayscale: true,
  },
}
