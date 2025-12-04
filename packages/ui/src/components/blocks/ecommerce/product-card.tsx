import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import {
  ShoppingCart,
  Heart,
  Star,
  Eye,
  Plus,
  Minus,
  ShoppingBag,
  Zap,
  TrendingUp,
  Clock,
  Package,
} from 'lucide-react'

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  originalPrice?: number
  currency?: string
  images: string[]
  rating?: number
  reviews?: number
  category?: string
  tags?: string[]
  inStock?: boolean
  stockCount?: number
  featured?: boolean
  isNew?: boolean
  isSale?: boolean
  discount?: number
}

export interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'detailed'
  onAddToCart?: (product: Product, quantity: number) => void
  onQuickView?: (product: Product) => void
  onToggleFavorite?: (product: Product) => void
  isFavorite?: boolean
  showRating?: boolean
  showActions?: boolean
  className?: string
}

export const ProductCard = ({
  product,
  variant = 'default',
  onAddToCart,
  onQuickView,
  onToggleFavorite,
  isFavorite = false,
  showRating = true,
  showActions = true,
  className,
}: ProductCardProps) => {
  const [quantity, setQuantity] = React.useState(1)
  const [imageIndex, setImageIndex] = React.useState(0)

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price)
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discount || 0

  if (variant === 'compact') {
    return (
      <Card className={cn('group relative overflow-hidden', className)}>
        <div className="relative">
          <AspectRatio ratio={1}>
            <img
              alt={product.name}
              className="object-cover w-full h-full transition-transform group-hover:scale-105"
              src={product.images[0]}
            />
          </AspectRatio>

          {(product.isSale || product.isNew) && (
            <div className="absolute top-2 left-2 flex gap-2">
              {product.isSale && <Badge variant="destructive">-{discountPercentage}%</Badge>}
              {product.isNew && <Badge variant="secondary">New</Badge>}
            </div>
          )}

          {showActions && (
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onToggleFavorite && (
                <Button
                  className="h-8 w-8"
                  size="icon"
                  variant="secondary"
                  onClick={e => {
                    e.preventDefault()
                    onToggleFavorite(product)
                  }}
                >
                  <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
                </Button>
              )}
              {onQuickView && (
                <Button
                  className="h-8 w-8"
                  size="icon"
                  variant="secondary"
                  onClick={e => {
                    e.preventDefault()
                    onQuickView(product)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('group overflow-hidden', className)}>
      <div className="relative">
        <AspectRatio ratio={4 / 3}>
          <img
            alt={product.name}
            className="object-cover w-full h-full"
            src={product.images[imageIndex]}
          />
        </AspectRatio>

        {product.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {product.images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'h-1.5 w-1.5 rounded-full bg-white/50 transition-colors',
                  index === imageIndex && 'bg-white',
                )}
                onClick={() => setImageIndex(index)}
              />
            ))}
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-2">
          {product.isSale && <Badge variant="destructive">Sale -{discountPercentage}%</Badge>}
          {product.isNew && <Badge variant="secondary">New</Badge>}
          {product.featured && (
            <Badge className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Featured
            </Badge>
          )}
        </div>

        {showActions && (
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            {onToggleFavorite && (
              <Button
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                size="icon"
                variant="secondary"
                onClick={e => {
                  e.preventDefault()
                  onToggleFavorite(product)
                }}
              >
                <Heart className={cn('h-4 w-4', isFavorite && 'fill-current text-red-500')} />
              </Button>
            )}
            {onQuickView && (
              <Button
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                size="icon"
                variant="secondary"
                onClick={e => {
                  e.preventDefault()
                  onQuickView(product)
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-1">
          {product.category && <p className="text-xs text-muted-foreground">{product.category}</p>}
          <h3 className="font-semibold line-clamp-2">{product.name}</h3>
          {variant === 'detailed' && product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          )}
        </div>

        {showRating && product.rating !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < Math.floor(product.rating!)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300',
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} {product.reviews && `(${product.reviews})`}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {product.inStock !== undefined && (
              <p className={cn('text-sm', product.inStock ? 'text-green-600' : 'text-red-600')}>
                {product.inStock ? (
                  <>
                    <Package className="inline h-3 w-3 mr-1" />
                    {product.stockCount ? `${product.stockCount} in stock` : 'In stock'}
                  </>
                ) : (
                  'Out of stock'
                )}
              </p>
            )}
          </div>
        </div>
      </CardContent>

      {onAddToCart && (
        <CardFooter className="p-4 pt-0">
          {variant === 'detailed' ? (
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center border rounded-md">
                <Button
                  className="h-9 w-9"
                  disabled={!product.inStock}
                  size="icon"
                  variant="ghost"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-3 min-w-[3rem] text-center">{quantity}</span>
                <Button
                  className="h-9 w-9"
                  disabled={!product.inStock || quantity >= (product.stockCount || 99)}
                  size="icon"
                  variant="ghost"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="flex-1"
                disabled={!product.inStock}
                onClick={() => onAddToCart(product, quantity)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              disabled={!product.inStock}
              onClick={() => onAddToCart(product, 1)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

export interface QuickShopCardProps {
  product: Product
  onAddToCart?: (product: Product, quantity: number) => void
  className?: string
}

export const QuickShopCard = ({ product, onAddToCart, className }: QuickShopCardProps) => {
  const [selectedSize, setSelectedSize] = React.useState<string>()
  const [selectedColor, setSelectedColor] = React.useState<string>()

  const sizes = ['XS', 'S', 'M', 'L', 'XL']
  const colors = ['Black', 'White', 'Navy', 'Gray']

  return (
    <Card className={cn('w-full max-w-sm', className)}>
      <CardHeader>
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: product.currency || 'USD',
            }).format(product.price)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Size</label>
          <div className="flex gap-2">
            {sizes.map(size => (
              <Button
                key={size}
                size="sm"
                variant={selectedSize === size ? 'default' : 'outline'}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <div className="flex gap-2">
            {colors.map(color => (
              <Button
                key={color}
                size="sm"
                variant={selectedColor === color ? 'default' : 'outline'}
                onClick={() => setSelectedColor(color)}
              >
                {color}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!selectedSize || !selectedColor}
          onClick={() => onAddToCart?.(product, 1)}
        >
          <Zap className="mr-2 h-4 w-4" />
          Quick Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}
