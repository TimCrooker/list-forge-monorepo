import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Plus, Minus, ShoppingCart, X } from 'lucide-react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  variant?: string
}

export interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
  className?: string
  variant?: 'mini' | 'full'
  showImages?: boolean
  currency?: string
  emptyMessage?: string
  checkoutLabel?: string
  continueShoppingLabel?: string
  onContinueShopping?: () => void
}

export const Cart = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  className,
  variant = 'full',
  showImages = true,
  currency = '$',
  emptyMessage = 'Your cart is empty',
  checkoutLabel = 'Proceed to Checkout',
  continueShoppingLabel = 'Continue Shopping',
  onContinueShopping,
}: CartProps) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  if (variant === 'mini') {
    return (
      <Card className={cn('w-full max-w-sm', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Shopping Cart</CardTitle>
          <Badge variant="secondary">{itemCount} items</Badge>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-4">
                    {showImages && item.image && (
                      <img
                        alt={item.name}
                        className="h-16 w-16 rounded-md object-cover"
                        src={item.image}
                      />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.name}</p>
                        <Button
                          className="h-8 w-8"
                          size="icon"
                          variant="ghost"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground">{item.variant}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            className="h-8 w-8"
                            disabled={item.quantity <= 1}
                            size="icon"
                            variant="outline"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            className="h-8 w-8"
                            size="icon"
                            variant="outline"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm font-medium">
                          {currency}
                          {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
        {items.length > 0 && (
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex w-full items-center justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">
                {currency}
                {subtotal.toFixed(2)}
              </span>
            </div>
            <Button className="w-full" onClick={onCheckout}>
              {checkoutLabel}
            </Button>
            {onContinueShopping && (
              <Button className="w-full" variant="outline" onClick={onContinueShopping}>
                {continueShoppingLabel}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Shopping Cart</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">{emptyMessage}</p>
            {onContinueShopping && (
              <Button className="mt-4" variant="outline" onClick={onContinueShopping}>
                {continueShoppingLabel}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-start gap-6">
                  {showImages && item.image && (
                    <img
                      alt={item.name}
                      className="h-24 w-24 rounded-md object-cover"
                      src={item.image}
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">{item.variant}</p>
                        )}
                      </div>
                      <Button
                        className="h-8 w-8"
                        size="icon"
                        variant="ghost"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            className="h-8 w-8"
                            disabled={item.quantity <= 1}
                            size="icon"
                            variant="outline"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            className="w-16 text-center"
                            min="1"
                            type="number"
                            value={item.quantity}
                            onChange={e => onUpdateQuantity(item.id, parseInt(e.target.value))}
                          />
                          <Button
                            className="h-8 w-8"
                            size="icon"
                            variant="outline"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {currency}
                          {item.price.toFixed(2)} each
                        </p>
                      </div>
                      <p className="font-medium">
                        {currency}
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-medium">
                  {currency}
                  {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span className="text-sm text-muted-foreground">Calculated at checkout</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span className="text-sm text-muted-foreground">Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg font-medium">
                <span>Total</span>
                <span>
                  {currency}
                  {subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" onClick={onCheckout}>
            {checkoutLabel}
          </Button>
          {onContinueShopping && (
            <Button className="w-full" variant="outline" onClick={onContinueShopping}>
              {continueShoppingLabel}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
