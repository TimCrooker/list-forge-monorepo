import type { Meta, StoryObj } from '@storybook/react'
import { ProductGrid } from './product-grid'

const meta: Meta<typeof ProductGrid> = {
  title: 'Blocks/Ecommerce/ProductGrid',
  component: ProductGrid,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ProductGrid>

const generateProducts = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i + 1}`,
    name: `Product ${i + 1}`,
    description: `This is a sample product description for product ${i + 1}.`,
    price: Math.floor(Math.random() * 100) + 10,
    originalPrice: Math.random() > 0.5 ? Math.floor(Math.random() * 150) + 20 : undefined,
    currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format',
    ],
    rating: Math.floor(Math.random() * 5) + 1,
    reviews: Math.floor(Math.random() * 100),
    category: ['Clothing', 'Electronics', 'Home', 'Sports'][Math.floor(Math.random() * 4)],
    tags: ['new', 'sale', 'featured'].filter(() => Math.random() > 0.5),
    inStock: Math.random() > 0.2,
    stockCount: Math.floor(Math.random() * 50),
    featured: Math.random() > 0.7,
    isNew: Math.random() > 0.7,
    isSale: Math.random() > 0.7,
    discount: Math.floor(Math.random() * 30) + 10,
  }))
}

export const Default: Story = {
  args: {
    products: generateProducts(20),
    columns: 4,
    showFilters: true,
    showSorting: true,
    showPagination: true,
    itemsPerPage: 12,
    onAddToCart: (product, quantity) => alert(`Added ${quantity} ${product.name} to cart`),
    onQuickView: product => alert(`Quick view: ${product.name}`),
    onToggleFavorite: product => alert(`Toggled favorite: ${product.name}`),
  },
}

export const TwoColumns: Story = {
  args: {
    ...Default.args,
    columns: 2,
  },
}

export const ThreeColumns: Story = {
  args: {
    ...Default.args,
    columns: 3,
  },
}

export const FiveColumns: Story = {
  args: {
    ...Default.args,
    columns: 5,
  },
}

export const SixColumns: Story = {
  args: {
    ...Default.args,
    columns: 6,
  },
}

export const WithoutFilters: Story = {
  args: {
    ...Default.args,
    showFilters: false,
  },
}

export const WithoutSorting: Story = {
  args: {
    ...Default.args,
    showSorting: false,
  },
}

export const WithoutPagination: Story = {
  args: {
    ...Default.args,
    showPagination: false,
  },
}

export const CustomItemsPerPage: Story = {
  args: {
    ...Default.args,
    itemsPerPage: 8,
  },
}

export const WithFavorites: Story = {
  args: {
    ...Default.args,
    favorites: ['product-1', 'product-3', 'product-5'],
  },
}

export const SmallProductSet: Story = {
  args: {
    ...Default.args,
    products: generateProducts(6),
  },
}

export const LargeProductSet: Story = {
  args: {
    ...Default.args,
    products: generateProducts(50),
  },
}

export const NoProducts: Story = {
  args: {
    ...Default.args,
    products: [],
  },
}
