# E-commerce Blocks

This directory contains e-commerce specific components including product displays, shopping cart, checkout flows, and order management. These blocks provide complete e-commerce functionality.

## Components

### Product Card

**Purpose**: Product display card with image, details, and actions
**Use Cases**: Product listings, catalogs, recommendations
**Key Props**: `product`, `layout`, `showActions`, `onAddToCart`, `onQuickView`

```tsx
<ProductCard
  product={{
    id: '1',
    name: 'Premium Headphones',
    price: 199.99,
    originalPrice: 249.99,
    images: ['/headphones-1.jpg', '/headphones-2.jpg'],
    rating: 4.5,
    reviews: 128,
    badge: 'Best Seller',
    inStock: true
  }}
  layout="standard"
  showActions={true}
  onAddToCart={handleAddToCart}
  onQuickView={handleQuickView}
  onWishlist={handleWishlist}
/>
```

### Product Grid

**Purpose**: Responsive grid layout for product collections
**Use Cases**: Category pages, search results, product listings
**Key Props**: `products`, `columns`, `loading`, `filters`, `sorting`

```tsx
<ProductGrid
  products={products}
  columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
  loading={isLoading}
  sortBy="price"
  sortOrder="asc"
  onProductSelect={handleProductSelect}
  onLoadMore={handleLoadMore}
  hasMore={hasMoreProducts}
/>
```

### Shopping Cart

**Purpose**: Shopping cart with item management and calculations
**Use Cases**: Cart sidebar, cart page, mini cart
**Key Props**: `items`, `onUpdateQuantity`, `onRemove`, `onCheckout`, `taxes`

```tsx
<Cart
  items={[
    {
      id: '1',
      product: {
        name: 'Premium Headphones',
        image: '/headphones.jpg',
        price: 199.99
      },
      quantity: 2,
      variant: 'Black'
    }
  ]}
  onUpdateQuantity={handleUpdateQuantity}
  onRemoveItem={handleRemoveItem}
  onCheckout={handleCheckout}
  showShipping={true}
  showTaxes={true}
  promoCode={promoCode}
  onApplyPromo={handleApplyPromo}
/>
```

### Checkout Form

**Purpose**: Complete checkout flow with payment and shipping
**Use Cases**: Checkout pages, order processing
**Key Props**: `onSubmit`, `paymentMethods`, `shippingOptions`, `billingInfo`

```tsx
<Checkout
  cartItems={cartItems}
  onSubmit={handleCheckout}
  paymentMethods={[
    { id: 'card', name: 'Credit Card', icon: <CreditCard /> },
    { id: 'paypal', name: 'PayPal', icon: <PayPal /> },
    { id: 'apple-pay', name: 'Apple Pay', icon: <Apple /> }
  ]}
  shippingOptions={[
    { id: 'standard', name: 'Standard (5-7 days)', price: 5.99 },
    { id: 'express', name: 'Express (2-3 days)', price: 12.99 },
    { id: 'overnight', name: 'Overnight', price: 24.99 }
  ]}
  onPaymentMethodChange={handlePaymentMethodChange}
  onShippingChange={handleShippingChange}
/>
```

### Order Summary

**Purpose**: Order details summary with calculations
**Use Cases**: Checkout confirmation, order reviews, receipts
**Key Props**: `order`, `showDetails`, `editable`, `currency`

```tsx
<OrderSummary
  order={{
    items: cartItems,
    subtotal: 399.98,
    shipping: 12.99,
    tax: 32.99,
    discount: -50.00,
    total: 395.96,
    currency: 'USD'
  }}
  showDetails={true}
  editable={false}
  onEditItem={handleEditItem}
  promoCode="SAVE10"
  onRemovePromo={handleRemovePromo}
/>
```

## Features

### Product Display

- Multiple layout options (grid, list, carousel)
- Image galleries with zoom
- Product variants (size, color, etc.)
- Stock status indicators
- Price displays with discounts
- Rating and review integration
- Wishlist functionality
- Quick view modals

### Shopping Cart Features

- Real-time quantity updates
- Item variant management
- Price calculations
- Shipping estimates
- Tax calculations
- Promo code support
- Save for later
- Recently viewed items

### Checkout Process

- Multi-step checkout flow
- Guest checkout support
- Multiple payment methods
- Address validation
- Shipping calculations
- Order confirmation
- Email notifications
- Receipt generation

### Payment Integration

- Stripe integration
- PayPal support
- Apple Pay / Google Pay
- Cryptocurrency options
- Buy now, pay later
- Subscription billing
- Refund processing

### Inventory Management

- Stock level tracking
- Low stock warnings
- Out of stock handling
- Pre-order support
- Variant inventory
- Reserved quantities

## Usage Examples

### Product Catalog Page

```tsx
function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex gap-6">
      <aside className="w-64">
        <SearchFilters
          filters={[
            {
              id: 'category',
              label: 'Category',
              type: 'select',
              options: categories
            },
            {
              id: 'priceRange',
              label: 'Price Range',
              type: 'range',
              min: 0,
              max: 1000
            },
            {
              id: 'brand',
              label: 'Brand',
              type: 'checkbox',
              options: brands
            },
            {
              id: 'rating',
              label: 'Rating',
              type: 'rating',
              max: 5
            }
          ]}
          onFiltersChange={setFilters}
        />
      </aside>

      <main className="flex-1">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Products</h1>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Customer Rating</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ProductGrid
          products={products}
          columns={{ sm: 1, md: 2, lg: 3 }}
          loading={loading}
          onAddToCart={handleAddToCart}
          onQuickView={handleQuickView}
        />
      </main>
    </div>
  );
}
```

### Shopping Cart Sidebar

```tsx
function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, updateQuantity, removeItem, total } = useCart();

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="relative">
        <ShoppingCart className="h-4 w-4" />
        {items.length > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
            {items.reduce((sum, item) => sum + item.quantity, 0)}
          </Badge>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Shopping Cart</SheetTitle>
            <SheetDescription>
              {items.length} items in your cart
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto py-6">
            <Cart
              items={items}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              showShipping={false}
              showTaxes={false}
            />
          </div>

          <SheetFooter>
            <div className="flex flex-col gap-4 w-full">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Button
                className="w-full"
                onClick={() => navigate('/checkout')}
                disabled={items.length === 0}
              >
                Checkout
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

### Complete Checkout Flow

```tsx
function CheckoutPage() {
  const [step, setStep] = useState(1);
  const { items, total } = useCart();
  const [customerInfo, setCustomerInfo] = useState({});
  const [paymentInfo, setPaymentInfo] = useState({});

  const steps = [
    { id: 1, title: 'Customer Information' },
    { id: 2, title: 'Shipping' },
    { id: 3, title: 'Payment' },
    { id: 4, title: 'Review' }
  ];

  return (
    <Container size="lg" className="py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-8">
            <nav className="flex space-x-8">
              {steps.map((stepItem) => (
                <div
                  key={stepItem.id}
                  className={cn(
                    "flex items-center space-x-2",
                    step >= stepItem.id ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      step >= stepItem.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {stepItem.id}
                  </div>
                  <span className="font-medium">{stepItem.title}</span>
                </div>
              ))}
            </nav>
          </div>

          {step === 1 && (
            <CustomerInfoForm
              onSubmit={(data) => {
                setCustomerInfo(data);
                setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <ShippingForm
              onSubmit={(data) => {
                setCustomerInfo({ ...customerInfo, ...data });
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <PaymentForm
              onSubmit={(data) => {
                setPaymentInfo(data);
                setStep(4);
              }}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && (
            <OrderReview
              customerInfo={customerInfo}
              paymentInfo={paymentInfo}
              onSubmit={handlePlaceOrder}
              onBack={() => setStep(3)}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderSummary
                  order={{
                    items,
                    subtotal: total,
                    shipping: 12.99,
                    tax: total * 0.08,
                    total: total + 12.99 + (total * 0.08)
                  }}
                  showDetails={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
```
