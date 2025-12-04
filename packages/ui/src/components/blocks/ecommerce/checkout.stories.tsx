import type { Meta, StoryObj } from '@storybook/react'
import { Checkout } from './checkout'
import { CreditCard, Lock } from 'lucide-react'

const meta: Meta<typeof Checkout> = {
  title: 'Blocks/Ecommerce/Checkout',
  component: Checkout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Checkout>

const sampleItems = [
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
]

const shippingMethods = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    price: 5.99,
    estimatedDays: '5-7 business days',
  },
  {
    id: 'express',
    name: 'Express Shipping',
    price: 15.99,
    estimatedDays: '2-3 business days',
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    price: 29.99,
    estimatedDays: '1 business day',
  },
]

const paymentMethods = [
  {
    id: 'credit_card',
    type: 'credit_card' as const,
    label: 'Credit Card',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: 'paypal',
    type: 'paypal' as const,
    label: 'PayPal',
  },
  {
    id: 'apple_pay',
    type: 'apple_pay' as const,
    label: 'Apple Pay',
  },
  {
    id: 'google_pay',
    type: 'google_pay' as const,
    label: 'Google Pay',
  },
]

export const Default: Story = {
  args: {
    items: sampleItems,
    shippingMethods,
    paymentMethods,
    onPlaceOrder: orderData => alert(JSON.stringify(orderData, null, 2)),
    onBack: () => alert('Back clicked'),
  },
}

export const WithDefaultMethods: Story = {
  args: {
    ...Default.args,
    defaultShippingMethod: 'express',
    defaultPaymentMethod: 'credit_card',
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
}

export const EuroCurrency: Story = {
  args: {
    ...Default.args,
    currency: '€',
  },
}

export const SingleItem: Story = {
  args: {
    ...Default.args,
    items: [sampleItems[0]],
  },
}

export const MultipleItems: Story = {
  args: {
    ...Default.args,
    items: [
      ...sampleItems,
      {
        id: '3',
        name: 'Leather Sneakers',
        price: 129.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format',
        variant: 'US 10 / Black',
      },
    ],
  },
}

export const WithoutImages: Story = {
  args: {
    ...Default.args,
    items: sampleItems.map(({ image, ...item }) => item),
  },
}

export const LimitedShippingMethods: Story = {
  args: {
    ...Default.args,
    shippingMethods: [shippingMethods[0]],
  },
}

export const LimitedPaymentMethods: Story = {
  args: {
    ...Default.args,
    paymentMethods: [paymentMethods[0]],
  },
}

export const WithoutBackButton: Story = {
  args: {
    ...Default.args,
    onBack: undefined,
  },
}
