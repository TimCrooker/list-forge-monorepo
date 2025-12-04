import type { Meta, StoryObj } from '@storybook/react'
import { TestimonialsGrid } from './testimonials-grid'

const meta: Meta<typeof TestimonialsGrid> = {
  title: 'Blocks/Marketing/Landing/TestimonialsGrid',
  component: TestimonialsGrid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TestimonialsGrid>

const sampleTestimonials = [
  {
    content:
      'This platform has transformed how we handle our business operations. The features are intuitive and the support team is always helpful.',
    author: {
      name: 'Sarah Johnson',
      role: 'CEO',
      company: 'TechStart Inc.',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
    },
    rating: 5,
  },
  {
    content:
      "The analytics features have given us valuable insights into our customer behavior. It's been a game-changer for our marketing strategy.",
    author: {
      name: 'Michael Chen',
      role: 'Marketing Director',
      company: 'GrowthLabs',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
    },
    rating: 5,
  },
  {
    content:
      "We've seen a significant improvement in our team's productivity since implementing this solution. The collaboration features are excellent.",
    author: {
      name: 'Emily Rodriguez',
      role: 'Product Manager',
      company: 'InnovateCo',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
    },
    rating: 4,
  },
]

export const Default: Story = {
  args: {
    title: 'What our customers say',
    description: "Don't just take our word for it - hear from some of our amazing customers",
    testimonials: sampleTestimonials,
  },
}

export const WithoutTitle: Story = {
  args: {
    testimonials: sampleTestimonials,
  },
}

export const WithoutDescription: Story = {
  args: {
    title: 'What our customers say',
    testimonials: sampleTestimonials,
  },
}

export const TwoColumns: Story = {
  args: {
    title: 'What our customers say',
    description: "Don't just take our word for it - hear from some of our amazing customers",
    testimonials: sampleTestimonials,
    columns: 2,
  },
}

export const WithoutRatings: Story = {
  args: {
    title: 'What our customers say',
    description: "Don't just take our word for it - hear from some of our amazing customers",
    testimonials: sampleTestimonials.map(({ rating, ...testimonial }) => testimonial),
  },
}

export const WithoutAvatars: Story = {
  args: {
    title: 'What our customers say',
    description: "Don't just take our word for it - hear from some of our amazing customers",
    testimonials: sampleTestimonials.map(testimonial => ({
      ...testimonial,
      author: {
        name: testimonial.author.name,
        role: testimonial.author.role,
        company: testimonial.author.company,
      },
    })),
  },
}

export const WithoutRoles: Story = {
  args: {
    title: 'What our customers say',
    description: "Don't just take our word for it - hear from some of our amazing customers",
    testimonials: sampleTestimonials.map(testimonial => ({
      ...testimonial,
      author: {
        name: testimonial.author.name,
        company: testimonial.author.company,
        avatar: testimonial.author.avatar,
      },
    })),
  },
}

export const WithoutCompanies: Story = {
  args: {
    title: 'What our customers say',
    description: "Don't just take our word for it - hear from some of our amazing customers",
    testimonials: sampleTestimonials.map(testimonial => ({
      ...testimonial,
      author: {
        name: testimonial.author.name,
        role: testimonial.author.role,
        avatar: testimonial.author.avatar,
      },
    })),
  },
}

export const LongContent: Story = {
  args: {
    title: 'What our customers say',
    description: "Don't just take our word for it - hear from some of our amazing customers",
    testimonials: [
      {
        content:
          "This platform has completely transformed how we handle our business operations. The features are incredibly intuitive and the support team is always helpful. We've seen a significant improvement in our team's productivity and the collaboration features have made it much easier to work together. The analytics capabilities have given us valuable insights that we couldn't get anywhere else.",
        author: {
          name: 'Sarah Johnson',
          role: 'CEO',
          company: 'TechStart Inc.',
          avatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
        },
        rating: 5,
      },
      {
        content:
          "The analytics features have given us valuable insights into our customer behavior. It's been a game-changer for our marketing strategy. We can now track every interaction and make data-driven decisions. The reporting tools are comprehensive yet easy to use, and the ability to export data in various formats has streamlined our workflow significantly.",
        author: {
          name: 'Michael Chen',
          role: 'Marketing Director',
          company: 'GrowthLabs',
          avatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
        },
        rating: 5,
      },
      {
        content:
          "We've seen a significant improvement in our team's productivity since implementing this solution. The collaboration features are excellent, allowing us to work together seamlessly regardless of location. The real-time updates and notifications keep everyone in the loop, and the file sharing capabilities have eliminated the need for multiple tools.",
        author: {
          name: 'Emily Rodriguez',
          role: 'Product Manager',
          company: 'InnovateCo',
          avatar:
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
        },
        rating: 4,
      },
    ],
  },
}

export const ManyTestimonials: Story = {
  args: {
    title: 'What our customers say',
    description: "Don't just take our word for it - hear from some of our amazing customers",
    testimonials: [
      ...sampleTestimonials,
      {
        content:
          "The customer support is outstanding. Every time we've had an issue, the team has been quick to respond and extremely helpful.",
        author: {
          name: 'David Kim',
          role: 'CTO',
          company: 'DataFlow Systems',
          avatar:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
        },
        rating: 5,
      },
      {
        content:
          "The platform's scalability has been crucial for our growing business. We've never had to worry about performance issues.",
        author: {
          name: 'Lisa Wang',
          role: 'Operations Director',
          company: 'ScaleUp Solutions',
          avatar:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
        },
        rating: 5,
      },
      {
        content:
          "The integration capabilities are impressive. We've been able to connect all our existing tools seamlessly.",
        author: {
          name: 'James Wilson',
          role: 'IT Manager',
          company: 'TechIntegrate',
          avatar:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
        },
        rating: 4,
      },
    ],
  },
}

export const DifferentRatings: Story = {
  args: {
    title: 'What our customers say',
    description: "Don't just take our word for it - hear from some of our amazing customers",
    testimonials: [
      {
        content:
          'This platform has transformed how we handle our business operations. The features are intuitive and the support team is always helpful.',
        author: {
          name: 'Sarah Johnson',
          role: 'CEO',
          company: 'TechStart Inc.',
          avatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
        },
        rating: 5,
      },
      {
        content:
          "The analytics features have given us valuable insights into our customer behavior. It's been a game-changer for our marketing strategy.",
        author: {
          name: 'Michael Chen',
          role: 'Marketing Director',
          company: 'GrowthLabs',
          avatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
        },
        rating: 4,
      },
      {
        content:
          "We've seen a significant improvement in our team's productivity since implementing this solution. The collaboration features are excellent.",
        author: {
          name: 'Emily Rodriguez',
          role: 'Product Manager',
          company: 'InnovateCo',
          avatar:
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80',
        },
        rating: 3,
      },
    ],
  },
}
