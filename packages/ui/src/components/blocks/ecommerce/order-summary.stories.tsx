import type { Meta, StoryObj } from '@storybook/react'
import { OrderSummary } from './order-summary'

const meta: Meta<typeof OrderSummary> = {
  title: 'Blocks/Ecommerce/OrderSummary',
  component: OrderSummary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof OrderSummary>

const sampleOrder = {
  orderId: 'ORD-123456',
  items: [
    {
      id: '1',
      name: 'Premium Cotton T-Shirt',
      price: 29.99,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format',
      variant: 'Medium / White',
    },
    {
      id: '2',
      name: 'Slim Fit Jeans',
      price: 79.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format',
      variant: '32 / Blue',
    },
  ],
  orderDate: '2024-03-15T10:30:00Z',
  shippingAddress: {
    name: 'John Doe',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'United States',
  },
  shippingMethod: {
    name: 'Express Shipping',
    price: 15.99,
    estimatedDays: '2-3 business days',
  },
  paymentMethod: {
    type: 'Credit Card',
    last4: '4242',
  },
  subtotal: 139.97,
  shipping: 15.99,
  tax: 14.0,
  total: 169.96,
}

export const Pending: Story = {
  args: {
    ...sampleOrder,
    status: 'pending',
    onTrackOrder: () => alert('Track order clicked'),
    onViewDetails: () => alert('View details clicked'),
    onCancelOrder: () => alert('Cancel order clicked'),
    onContactSupport: () => alert('Contact support clicked'),
  },
}

export const Processing: Story = {
  args: {
    ...sampleOrder,
    status: 'processing',
    onTrackOrder: () => alert('Track order clicked'),
    onViewDetails: () => alert('View details clicked'),
    onCancelOrder: () => alert('Cancel order clicked'),
    onContactSupport: () => alert('Contact support clicked'),
  },
}

export const Shipped: Story = {
  args: {
    ...sampleOrder,
    status: 'shipped',
    onTrackOrder: () => alert('Track order clicked'),
    onViewDetails: () => alert('View details clicked'),
    onCancelOrder: () => alert('Cancel order clicked'),
    onContactSupport: () => alert('Contact support clicked'),
  },
}

export const Delivered: Story = {
  args: {
    ...sampleOrder,
    status: 'delivered',
    onTrackOrder: () => alert('Track order clicked'),
    onViewDetails: () => alert('View details clicked'),
    onCancelOrder: () => alert('Cancel order clicked'),
    onContactSupport: () => alert('Contact support clicked'),
  },
}

export const Cancelled: Story = {
  args: {
    ...sampleOrder,
    status: 'cancelled',
    onTrackOrder: () => alert('Track order clicked'),
    onViewDetails: () => alert('View details clicked'),
    onCancelOrder: () => alert('Cancel order clicked'),
    onContactSupport: () => alert('Contact support clicked'),
  },
}

export const Refunded: Story = {
  args: {
    ...sampleOrder,
    status: 'refunded',
    onTrackOrder: () => alert('Track order clicked'),
    onViewDetails: () => alert('View details clicked'),
    onCancelOrder: () => alert('Cancel order clicked'),
    onContactSupport: () => alert('Contact support clicked'),
  },
}

export const EuroCurrency: Story = {
  args: {
    ...sampleOrder,
    status: 'processing',
    currency: '€',
    onTrackOrder: () => alert('Track order clicked'),
    onViewDetails: () => alert('View details clicked'),
    onCancelOrder: () => alert('Cancel order clicked'),
    onContactSupport: () => alert('Contact support clicked'),
  },
}

export const WithoutImages: Story = {
  args: {
    ...sampleOrder,
    status: 'processing',
    items: sampleOrder.items.map(({ image, ...item }) => item),
    onTrackOrder: () => alert('Track order clicked'),
    onViewDetails: () => alert('View details clicked'),
    onCancelOrder: () => alert('Cancel order clicked'),
    onContactSupport: () => alert('Contact support clicked'),
  },
}

export const SingleItem: Story = {
  args: {
    ...sampleOrder,
    status: 'processing',
    items: [sampleOrder.items[0]],
    subtotal: 59.98,
    shipping: 15.99,
    tax: 7.0,
    total: 82.97,
    onTrackOrder: () => alert('Track order clicked'),
    onViewDetails: () => alert('View details clicked'),
    onCancelOrder: () => alert('Cancel order clicked'),
    onContactSupport: () => alert('Contact support clicked'),
  },
}

export const MultipleItems: Story = {
  args: {
    ...sampleOrder,
    status: 'processing',
    items: [
      ...sampleOrder.items,
      {
        id: '3',
        name: 'Leather Sneakers',
        price: 129.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format',
        variant: 'US 10 / Black',
      },
    ],
    subtotal: 269.96,
    shipping: 15.99,
    tax: 28.0,
    total: 313.95,
    onTrackOrder: () => alert('Track order clicked'),
    onViewDetails: () => alert('View details clicked'),
    onCancelOrder: () => alert('Cancel order clicked'),
    onContactSupport: () => alert('Contact support clicked'),
  },
}
