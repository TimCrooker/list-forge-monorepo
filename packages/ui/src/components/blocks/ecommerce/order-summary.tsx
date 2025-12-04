import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Package, Truck, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  variant?: string
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface OrderSummaryProps {
  orderId: string
  items: OrderItem[]
  status: OrderStatus
  orderDate: string
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  shippingMethod: {
    name: string
    price: number
    estimatedDays: string
  }
  paymentMethod: {
    type: string
    last4?: string
  }
  subtotal: number
  shipping: number
  tax: number
  total: number
  className?: string
  currency?: string
  onTrackOrder?: () => void
  onViewDetails?: () => void
  onCancelOrder?: () => void
  onContactSupport?: () => void
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800',
    icon: Package,
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    icon: AlertCircle,
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-gray-100 text-gray-800',
    icon: AlertCircle,
  },
}

export const OrderSummary = ({
  orderId,
  items,
  status,
  orderDate,
  shippingAddress,
  shippingMethod,
  paymentMethod,
  subtotal,
  shipping,
  tax,
  total,
  className,
  currency = '$',
  onTrackOrder,
  onViewDetails,
  onCancelOrder,
  onContactSupport,
}: OrderSummaryProps) => {
  const statusInfo = statusConfig[status]
  const StatusIcon = statusInfo.icon

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Order #{orderId}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(orderDate).toLocaleDateString()}
            </p>
          </div>
          <Badge className={cn('flex items-center gap-1', statusInfo.color)} variant="secondary">
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex items-center space-x-4">
              {item.image && (
                <img
                  alt={item.name}
                  className="h-16 w-16 rounded-md object-cover"
                  src={item.image}
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                {item.variant && <p className="text-sm text-muted-foreground">{item.variant}</p>}
                <p className="text-sm text-muted-foreground">
                  {item.quantity} × {currency}
                  {item.price.toFixed(2)}
                </p>
              </div>
              <p className="font-medium">
                {currency}
                {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-medium">Shipping Address</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {shippingAddress.name}
              <br />
              {shippingAddress.address}
              <br />
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
              <br />
              {shippingAddress.country}
            </p>
          </div>
          <div>
            <h3 className="font-medium">Shipping Method</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {shippingMethod.name}
              <br />
              Estimated delivery: {shippingMethod.estimatedDays}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>
              {currency}
              {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>
              {currency}
              {shipping.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Tax</span>
            <span>
              {currency}
              {tax.toFixed(2)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-lg font-medium">
            <span>Total</span>
            <span>
              {currency}
              {total.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-medium">Payment Method</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {paymentMethod.type}
            {paymentMethod.last4 && ` ending in ${paymentMethod.last4}`}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {onTrackOrder && status === 'shipped' && (
          <Button variant="outline" onClick={onTrackOrder}>
            <Truck className="mr-2 h-4 w-4" />
            Track Order
          </Button>
        )}
        {onViewDetails && (
          <Button variant="outline" onClick={onViewDetails}>
            View Details
          </Button>
        )}
        {onCancelOrder && (status === 'pending' || status === 'processing') && (
          <Button variant="destructive" onClick={onCancelOrder}>
            Cancel Order
          </Button>
        )}
        {onContactSupport && (
          <Button variant="outline" onClick={onContactSupport}>
            Contact Support
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
