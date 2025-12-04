import type { Meta, StoryObj } from '@storybook/react'
import { ProductCard } from './product-card'

const meta: Meta<typeof ProductCard> = {
  title: 'Blocks/Ecommerce/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ProductCard>

const sampleProduct = {
  id: '1',
  name: 'Premium Cotton T-Shirt',
  description:
    'A comfortable and stylish t-shirt made from 100% organic cotton. Perfect for everyday wear.',
  price: 29.99,
  originalPrice: 39.99,
  currency: 'USD',
  images: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format',
  ],
  rating: 4.5,
  reviews: 128,
  category: 'Clothing',
  tags: ['cotton', 'casual', 'summer'],
  inStock: true,
  stockCount: 50,
  featured: true,
  isNew: true,
  isSale: true,
  discount: 25,
}

export const Default: Story = {
  args: {
    product: sampleProduct,
    variant: 'default',
    showRating: true,
    showActions: true,
    isFavorite: false,
    onAddToCart: (product, quantity) => alert(`Added ${quantity} ${product.name} to cart`),
    onQuickView: product => alert(`Quick view: ${product.name}`),
    onToggleFavorite: product => alert(`Toggled favorite: ${product.name}`),
  },
}

export const Compact: Story = {
  args: {
    product: sampleProduct,
    variant: 'compact',
    showRating: true,
    showActions: true,
    isFavorite: false,
    onAddToCart: (product, quantity) => alert(`Added ${quantity} ${product.name} to cart`),
    onQuickView: product => alert(`Quick view: ${product.name}`),
    onToggleFavorite: product => alert(`Toggled favorite: ${product.name}`),
  },
}

export const Detailed: Story = {
  args: {
    product: sampleProduct,
    variant: 'detailed',
    showRating: true,
    showActions: true,
    isFavorite: false,
    onAddToCart: (product, quantity) => alert(`Added ${quantity} ${product.name} to cart`),
    onQuickView: product => alert(`Quick view: ${product.name}`),
    onToggleFavorite: product => alert(`Toggled favorite: ${product.name}`),
  },
}

export const WithoutActions: Story = {
  args: {
    product: sampleProduct,
    variant: 'default',
    showRating: true,
    showActions: false,
  },
}

export const WithoutRating: Story = {
  args: {
    product: sampleProduct,
    variant: 'default',
    showRating: false,
    showActions: true,
  },
}

export const Favorited: Story = {
  args: {
    product: sampleProduct,
    variant: 'default',
    showRating: true,
    showActions: true,
    isFavorite: true,
    onAddToCart: (product, quantity) => alert(`Added ${quantity} ${product.name} to cart`),
    onQuickView: product => alert(`Quick view: ${product.name}`),
    onToggleFavorite: product => alert(`Toggled favorite: ${product.name}`),
  },
}

export const OutOfStock: Story = {
  args: {
    product: {
      ...sampleProduct,
      inStock: false,
      stockCount: 0,
    },
    variant: 'default',
    showRating: true,
    showActions: true,
  },
}

export const LowStock: Story = {
  args: {
    product: {
      ...sampleProduct,
      stockCount: 3,
    },
    variant: 'default',
    showRating: true,
    showActions: true,
  },
}

export const NoDiscount: Story = {
  args: {
    product: {
      ...sampleProduct,
      originalPrice: undefined,
      isSale: false,
      discount: undefined,
    },
    variant: 'default',
    showRating: true,
    showActions: true,
  },
}

export const NoImages: Story = {
  args: {
    product: {
      ...sampleProduct,
      images: [],
    },
    variant: 'default',
    showRating: true,
    showActions: true,
  },
}

export const SingleImage: Story = {
  args: {
    product: {
      ...sampleProduct,
      images: [sampleProduct.images[0]],
    },
    variant: 'default',
    showRating: true,
    showActions: true,
  },
}
