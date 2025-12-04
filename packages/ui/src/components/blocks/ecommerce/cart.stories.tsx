import type { Meta, StoryObj } from '@storybook/react'
import { Cart } from './cart'
import { useState } from 'react'

const meta: Meta<typeof Cart> = {
  title: 'Blocks/Ecommerce/Cart',
  component: Cart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Cart>

const sampleItems = [
  {
    id: '1',
    name: 'Classic White T-Shirt',
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
  {
    id: '3',
    name: 'Leather Sneakers',
    price: 129.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format',
    variant: 'US 10 / Black',
  },
]

const CartWithState = (args: any) => {
  const [items, setItems] = useState(sampleItems)

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setItems(items.map(item => (item.id === id ? { ...item, quantity } : item)))
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  return (
    <Cart
      {...args}
      items={items}
      onUpdateQuantity={handleUpdateQuantity}
      onRemoveItem={handleRemoveItem}
      onCheckout={() => alert('Proceeding to checkout...')}
      onContinueShopping={() => alert('Continuing shopping...')}
    />
  )
}

export const FullCart: Story = {
  render: args => <CartWithState {...args} />,
  args: {
    variant: 'full',
    showImages: true,
    currency: '$',
    emptyMessage: 'Your cart is empty',
    checkoutLabel: 'Proceed to Checkout',
    continueShoppingLabel: 'Continue Shopping',
  },
}

export const MiniCart: Story = {
  render: args => <CartWithState {...args} />,
  args: {
    variant: 'mini',
    showImages: true,
    currency: '$',
    emptyMessage: 'Your cart is empty',
    checkoutLabel: 'Checkout',
    continueShoppingLabel: 'Continue Shopping',
  },
}

export const EmptyCart: Story = {
  render: args => (
    <Cart
      {...args}
      items={[]}
      onUpdateQuantity={() => {}}
      onRemoveItem={() => {}}
      onCheckout={() => {}}
      onContinueShopping={() => alert('Continuing shopping...')}
    />
  ),
  args: {
    variant: 'full',
    showImages: true,
    currency: '$',
    emptyMessage: 'Your cart is empty',
    checkoutLabel: 'Proceed to Checkout',
    continueShoppingLabel: 'Continue Shopping',
  },
}

export const WithoutImages: Story = {
  render: args => <CartWithState {...args} />,
  args: {
    variant: 'full',
    showImages: false,
    currency: '$',
    emptyMessage: 'Your cart is empty',
    checkoutLabel: 'Proceed to Checkout',
    continueShoppingLabel: 'Continue Shopping',
  },
}

export const EuroCurrency: Story = {
  render: args => <CartWithState {...args} />,
  args: {
    variant: 'full',
    showImages: true,
    currency: '€',
    emptyMessage: 'Your cart is empty',
    checkoutLabel: 'Proceed to Checkout',
    continueShoppingLabel: 'Continue Shopping',
  },
}

export const CustomMessages: Story = {
  render: args => <CartWithState {...args} />,
  args: {
    variant: 'full',
    showImages: true,
    currency: '$',
    emptyMessage: 'No items in your shopping cart',
    checkoutLabel: 'Complete Purchase',
    continueShoppingLabel: 'Keep Shopping',
  },
}
