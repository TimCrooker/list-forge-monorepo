import type { Meta, StoryObj } from '@storybook/react'
import { SearchFilters } from './search-filters'

const meta: Meta<typeof SearchFilters> = {
  title: 'Blocks/Forms/SearchFilters',
  component: SearchFilters,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SearchFilters>

const sampleFilterGroups = [
  {
    id: 'category',
    label: 'Category',
    type: 'select' as const,
    options: [
      { value: 'electronics', label: 'Electronics', count: 120 },
      { value: 'clothing', label: 'Clothing', count: 85 },
      { value: 'books', label: 'Books', count: 45 },
      { value: 'home', label: 'Home & Garden', count: 67 },
    ],
  },
  {
    id: 'brand',
    label: 'Brand',
    type: 'multiselect' as const,
    options: [
      { value: 'apple', label: 'Apple', count: 45 },
      { value: 'samsung', label: 'Samsung', count: 38 },
      { value: 'sony', label: 'Sony', count: 29 },
      { value: 'lg', label: 'LG', count: 22 },
    ],
  },
  {
    id: 'price',
    label: 'Price Range',
    type: 'range' as const,
    min: 0,
    max: 1000,
    step: 10,
  },
  {
    id: 'date',
    label: 'Date Range',
    type: 'daterange' as const,
  },
  {
    id: 'inStock',
    label: 'In Stock',
    type: 'toggle' as const,
  },
  {
    id: 'search',
    label: 'Search',
    type: 'search' as const,
  },
]

export const Inline: Story = {
  args: {
    filterGroups: sampleFilterGroups,
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    onSearch: query => alert(`Searching for: ${query}`),
    variant: 'inline',
    showSearch: true,
    searchPlaceholder: 'Search products...',
  },
}

export const Sidebar: Story = {
  args: {
    filterGroups: sampleFilterGroups,
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    onSearch: query => alert(`Searching for: ${query}`),
    variant: 'sidebar',
    showSearch: true,
    searchPlaceholder: 'Search products...',
  },
}

export const Popover: Story = {
  args: {
    filterGroups: sampleFilterGroups,
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    onSearch: query => alert(`Searching for: ${query}`),
    variant: 'popover',
    showSearch: true,
    searchPlaceholder: 'Search products...',
  },
}

export const WithoutSearch: Story = {
  args: {
    filterGroups: sampleFilterGroups,
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    variant: 'inline',
    showSearch: false,
  },
}

export const SingleFilter: Story = {
  args: {
    filterGroups: [sampleFilterGroups[0]!],
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    variant: 'inline',
    showSearch: true,
  },
}

export const OnlySelectFilters: Story = {
  args: {
    filterGroups: sampleFilterGroups.filter(group => group.type === 'select'),
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    variant: 'inline',
    showSearch: true,
  },
}

export const OnlyMultiselectFilters: Story = {
  args: {
    filterGroups: sampleFilterGroups.filter(group => group.type === 'multiselect'),
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    variant: 'inline',
    showSearch: true,
  },
}

export const OnlyRangeFilters: Story = {
  args: {
    filterGroups: sampleFilterGroups.filter(group => group.type === 'range'),
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    variant: 'inline',
    showSearch: true,
  },
}

export const OnlyToggleFilters: Story = {
  args: {
    filterGroups: sampleFilterGroups.filter(group => group.type === 'toggle'),
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    variant: 'inline',
    showSearch: true,
  },
}

export const CustomSearchPlaceholder: Story = {
  args: {
    filterGroups: sampleFilterGroups,
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    onSearch: query => alert(`Searching for: ${query}`),
    variant: 'inline',
    showSearch: true,
    searchPlaceholder: 'Type to search...',
  },
}

export const WithDefaultValues: Story = {
  args: {
    filterGroups: sampleFilterGroups.map(group => ({
      ...group,
      defaultValue: group.type === 'toggle' ? true : undefined,
    })),
    onFilterChange: filters => alert(JSON.stringify(filters, null, 2)),
    variant: 'inline',
    showSearch: true,
  },
}
