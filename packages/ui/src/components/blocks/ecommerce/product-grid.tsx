import * as React from 'react'
import { cn } from '@/lib/utils'
import { type Product, ProductCard } from './product-card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  Filter,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react'

export interface ProductGridProps {
  products: Product[]
  onAddToCart?: (product: Product, quantity: number) => void
  onQuickView?: (product: Product) => void
  onToggleFavorite?: (product: Product) => void
  favorites?: string[]
  columns?: 2 | 3 | 4 | 5 | 6
  showFilters?: boolean
  showSorting?: boolean
  showPagination?: boolean
  itemsPerPage?: number
  className?: string
}

export interface FilterOptions {
  categories?: string[]
  priceRange?: [number, number]
  tags?: string[]
  inStock?: boolean
  onSale?: boolean
  rating?: number
}

export interface SortOption {
  value: string
  label: string
}

const defaultSortOptions: SortOption[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'Name: A-Z' },
]

export const ProductGrid = ({
  products,
  onAddToCart,
  onQuickView,
  onToggleFavorite,
  favorites = [],
  columns = 4,
  showFilters = true,
  showSorting = true,
  showPagination = true,
  itemsPerPage = 12,
  className,
}: ProductGridProps) => {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortBy, setSortBy] = React.useState('featured')
  const [gridColumns, setGridColumns] = React.useState(columns)
  const [filters, setFilters] = React.useState<FilterOptions>({})
  const [showMobileFilters, setShowMobileFilters] = React.useState(false)

  // Extract unique categories and tags from products
  const categories = React.useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return Array.from(cats) as string[]
  }, [products])

  const allTags = React.useMemo(() => {
    const tags = new Set(products.flatMap(p => p.tags || []))
    return Array.from(tags)
  }, [products])

  const priceRange = React.useMemo(() => {
    const prices = products.map(p => p.price)
    return [Math.min(...prices), Math.max(...prices)]
  }, [products])

  // Filter products
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      if (filters.categories?.length && !filters.categories.includes(product.category || '')) {
        return false
      }
      if (filters.priceRange) {
        const [min, max] = filters.priceRange
        if (product.price < min || product.price > max) return false
      }
      if (filters.tags?.length && !filters.tags.some(tag => product.tags?.includes(tag))) {
        return false
      }
      if (filters.inStock !== undefined && product.inStock !== filters.inStock) {
        return false
      }
      if (filters.onSale && !product.isSale) {
        return false
      }
      if (filters.rating && (product.rating || 0) < filters.rating) {
        return false
      }
      return true
    })
  }, [products, filters])

  // Sort products
  const sortedProducts = React.useMemo(() => {
    const sorted = [...filteredProducts]
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price)
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price)
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'newest':
        return sorted.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1
          if (!a.isNew && b.isNew) return 1
          return 0
        })
      default:
        return sorted.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return 0
        })
    }
  }, [filteredProducts, sortBy])

  // Paginate products
  const paginatedProducts = React.useMemo(() => {
    if (!showPagination) return sortedProducts
    const start = (currentPage - 1) * itemsPerPage
    return sortedProducts.slice(start, start + itemsPerPage)
  }, [sortedProducts, currentPage, itemsPerPage, showPagination])

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)

  const gridColsClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div className="space-y-3">
        <h3 className="font-medium">Categories</h3>
        <div className="space-y-2">
          {categories.map(category => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                checked={filters.categories?.includes(category)}
                id={category}
                onCheckedChange={checked => {
                  setFilters(prev => ({
                    ...prev,
                    categories: checked
                      ? [...(prev.categories || []), category]
                      : prev.categories?.filter(c => c !== category),
                  }))
                }}
              />
              <Label className="text-sm font-normal cursor-pointer" htmlFor={category}>
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-medium">Price Range</h3>
        <div className="space-y-4">
          <Slider
            className="w-full"
            max={priceRange[1]}
            min={priceRange[0]}
            step={10}
            value={filters.priceRange || priceRange}
            onValueChange={value =>
              setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))
            }
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${filters.priceRange?.[0] || priceRange[0]}</span>
            <span>${filters.priceRange?.[1] || priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Other Filters */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={filters.inStock}
            id="in-stock"
            onCheckedChange={checked =>
              setFilters(prev => ({ ...prev, inStock: checked as boolean }))
            }
          />
          <Label className="text-sm font-normal cursor-pointer" htmlFor="in-stock">
            In Stock Only
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={filters.onSale}
            id="on-sale"
            onCheckedChange={checked =>
              setFilters(prev => ({ ...prev, onSale: checked as boolean }))
            }
          />
          <Label className="text-sm font-normal cursor-pointer" htmlFor="on-sale">
            On Sale
          </Label>
        </div>
      </div>

      {/* Active Filters */}
      {Object.keys(filters).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Active Filters</h3>
            <Button size="sm" variant="ghost" onClick={() => setFilters({})}>
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.categories?.map(cat => (
              <Badge key={cat} className="gap-1" variant="secondary">
                {cat}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      categories: prev.categories?.filter(c => c !== cat),
                    }))
                  }
                />
              </Badge>
            ))}
            {filters.onSale && (
              <Badge className="gap-1" variant="secondary">
                On Sale
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters(prev => ({ ...prev, onSale: false }))}
                />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {showFilters && (
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetTrigger asChild>
                <Button className="lg:hidden" size="sm" variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>Narrow down your product search</SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          )}

          <p className="text-sm text-muted-foreground">{sortedProducts.length} products</p>
        </div>

        <div className="flex items-center gap-2">
          {showSorting && (
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {defaultSortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="hidden md:flex items-center gap-1">
            <Button
              size="icon"
              variant={gridColumns === 2 ? 'default' : 'ghost'}
              onClick={() => setGridColumns(2)}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={gridColumns === 3 ? 'default' : 'ghost'}
              onClick={() => setGridColumns(3)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={gridColumns === 4 ? 'default' : 'ghost'}
              onClick={() => setGridColumns(4)}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Desktop Filters */}
        {showFilters && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterPanel />
          </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          <div className={cn(`grid gap-4 ${gridColsClass[gridColumns]}`)}>
            {paginatedProducts.map(product => (
              <ProductCard
                key={product.id}
                isFavorite={favorites.includes(product.id)}
                product={product}
                variant={gridColumns > 3 ? 'compact' : 'default'}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>

          {/* Pagination */}
          {showPagination && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                disabled={currentPage === 1}
                size="icon"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  className={cn(
                    totalPages > 7 &&
                      Math.abs(page - currentPage) > 2 &&
                      page !== 1 &&
                      page !== totalPages &&
                      'hidden',
                  )}
                  size="icon"
                  variant={currentPage === page ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                disabled={currentPage === totalPages}
                size="icon"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
