# UI Components

This directory contains foundational UI components built with Radix UI primitives and styled with Tailwind CSS. These components follow the shadcn/ui pattern and provide the building blocks for more complex interfaces.

## Components

### Accordion

**Purpose**: Collapsible content sections with smooth animations
**Use Cases**: FAQ sections, settings panels, content organization
**Key Props**: `type` (single/multiple), `collapsible`, `disabled`

```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section Title</AccordionTrigger>
    <AccordionContent>Content goes here</AccordionContent>
  </AccordionItem>
</Accordion>
```

### Alert & Alert Dialog

**Purpose**: Display important messages and confirmations
**Use Cases**: Error messages, warnings, destructive actions confirmation
**Key Props**: `variant` (default/destructive), `onOpenChange`, `onConfirm`

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>
```

### Avatar

**Purpose**: Display user profile images with fallbacks
**Use Cases**: User profiles, comment systems, team listings
**Key Props**: `src`, `alt`, `fallback`

```tsx
<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Badge

**Purpose**: Small status indicators and labels
**Use Cases**: Status indicators, tags, categories
**Key Props**: `variant` (default/secondary/destructive/outline)

```tsx
<Badge variant="secondary">New</Badge>
```

### Breadcrumb

**Purpose**: Navigation hierarchy display
**Use Cases**: Page navigation, file paths, multi-step processes
**Key Props**: `separator`, `ellipsis`

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>Current</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Button

**Purpose**: Interactive trigger elements with multiple variants
**Use Cases**: Forms, navigation, actions, CTAs
**Key Props**: `variant` (default/destructive/outline/secondary/ghost/link), `size` (default/sm/lg/icon), `asChild`

```tsx
<Button variant="outline" size="lg">Click me</Button>
```

### Calendar

**Purpose**: Date selection interface
**Use Cases**: Date pickers, scheduling, event planning
**Key Props**: `mode`, `selected`, `onSelect`, `disabled`

```tsx
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-md border"
/>
```

### Card

**Purpose**: Content containers with consistent styling
**Use Cases**: Product cards, information panels, dashboard widgets
**Key Props**: Standard div props with styled variants

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Carousel

**Purpose**: Swipeable content slider
**Use Cases**: Image galleries, product showcases, testimonials
**Key Props**: `orientation`, `opts`, `plugins`

```tsx
<Carousel className="w-full max-w-xs">
  <CarouselContent>
    <CarouselItem>Item 1</CarouselItem>
    <CarouselItem>Item 2</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```

### Chart

**Purpose**: Data visualization components
**Use Cases**: Analytics dashboards, reporting, data presentation
**Key Props**: `config`, `data`, `type`

```tsx
<ChartContainer config={chartConfig} className="h-[200px]">
  <BarChart data={data}>
    <Bar dataKey="value" fill="var(--color-primary)" />
  </BarChart>
</ChartContainer>
```

### Checkbox

**Purpose**: Boolean input control
**Use Cases**: Forms, filters, multi-selection
**Key Props**: `checked`, `onCheckedChange`, `disabled`

```tsx
<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
  id="terms"
/>
```

### Collapsible

**Purpose**: Show/hide content sections
**Use Cases**: Expandable content, space-saving layouts
**Key Props**: `open`, `onOpenChange`

```tsx
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger>Toggle</CollapsibleTrigger>
  <CollapsibleContent>Content</CollapsibleContent>
</Collapsible>
```

### Command & Command Dialog

**Purpose**: Command palette and search interface
**Use Cases**: Quick actions, search, navigation
**Key Props**: `value`, `onValueChange`, `filter`

```tsx
<Command>
  <CommandInput placeholder="Search..." />
  <CommandList>
    <CommandGroup heading="Suggestions">
      <CommandItem>Item 1</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

### Context Menu

**Purpose**: Right-click contextual actions
**Use Cases**: Advanced interactions, shortcuts, bulk actions
**Key Props**: `onOpenChange`, trigger elements

```tsx
<ContextMenu>
  <ContextMenuTrigger>Right click me</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Item 1</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### Dialog & Drawer

**Purpose**: Modal overlays for forms and content
**Use Cases**: Forms, details, confirmations, mobile-friendly overlays
**Key Props**: `open`, `onOpenChange`, `modal`

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content
  </DialogContent>
</Dialog>
```

### Dropdown Menu

**Purpose**: Contextual action menus
**Use Cases**: User menus, options, bulk actions
**Key Props**: `onOpenChange`, alignment options

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Form

**Purpose**: Form validation and layout utilities
**Use Cases**: All form implementations with validation
**Key Props**: React Hook Form integration

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### Hover Card

**Purpose**: Contextual information on hover
**Use Cases**: User profiles, tooltips, previews
**Key Props**: `openDelay`, `closeDelay`

```tsx
<HoverCard>
  <HoverCardTrigger>Hover me</HoverCardTrigger>
  <HoverCardContent>Info content</HoverCardContent>
</HoverCard>
```

### Input & Input OTP

**Purpose**: Text input fields and OTP verification
**Use Cases**: Forms, authentication, data entry
**Key Props**: `type`, `placeholder`, `disabled`, `maxLength` (OTP)

```tsx
<Input type="email" placeholder="Email" />
<InputOTP maxLength={6} value={value} onChange={setValue}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
  </InputOTPGroup>
</InputOTP>
```

### Label

**Purpose**: Form field labels with accessibility
**Use Cases**: Form labeling, accessibility
**Key Props**: `htmlFor`

```tsx
<Label htmlFor="email">Email Address</Label>
```

### Menubar & Navigation Menu

**Purpose**: Application menus and navigation
**Use Cases**: App navigation, desktop-style menus
**Key Props**: Menu structure, keyboard navigation

```tsx
<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

### Pagination

**Purpose**: Navigate through paginated content
**Use Cases**: Data tables, search results, galleries
**Key Props**: `totalPages`, `currentPage`, `onPageChange`

```tsx
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

### Popover

**Purpose**: Floating content containers
**Use Cases**: Dropdowns, pickers, additional info
**Key Props**: `open`, `onOpenChange`, positioning

```tsx
<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent>Content</PopoverContent>
</Popover>
```

### Progress

**Purpose**: Show task completion status
**Use Cases**: Loading states, form progress, uploads
**Key Props**: `value`, `max`

```tsx
<Progress value={33} className="w-full" />
```

### Radio Group

**Purpose**: Single selection from multiple options
**Use Cases**: Forms, settings, exclusive choices
**Key Props**: `value`, `onValueChange`

```tsx
<RadioGroup value={value} onValueChange={setValue}>
  <RadioGroupItem value="option1" id="option1" />
  <Label htmlFor="option1">Option 1</Label>
</RadioGroup>
```

### Resizable

**Purpose**: Adjustable layout panels
**Use Cases**: Split panes, adjustable sidebars
**Key Props**: `direction`, `onLayout`

```tsx
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel>Panel 1</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel>Panel 2</ResizablePanel>
</ResizablePanelGroup>
```

### Scroll Area

**Purpose**: Custom scrollable containers
**Use Cases**: Chat messages, long lists, content areas
**Key Props**: `className`, scroll behavior

```tsx
<ScrollArea className="h-72 w-48 rounded-md border">
  <div className="p-4">Scrollable content</div>
</ScrollArea>
```

### Select

**Purpose**: Dropdown selection input
**Use Cases**: Forms, filters, configuration
**Key Props**: `value`, `onValueChange`, `placeholder`

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Separator

**Purpose**: Visual content dividers
**Use Cases**: Section breaks, menu dividers
**Key Props**: `orientation` (horizontal/vertical)

```tsx
<Separator className="my-4" />
```

### Sheet

**Purpose**: Slide-out panels (mobile drawer alternative)
**Use Cases**: Mobile navigation, side panels, forms
**Key Props**: `side` (top/right/bottom/left), `open`, `onOpenChange`

```tsx
<Sheet>
  <SheetTrigger>Open</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
    </SheetHeader>
  </SheetContent>
</Sheet>
```

### Sidebar

**Purpose**: Application navigation sidebar
**Use Cases**: App navigation, menu organization
**Key Props**: `collapsible`, `variant`, `side`

```tsx
<Sidebar>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Home</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>
```

### Skeleton

**Purpose**: Loading state placeholders
**Use Cases**: Content loading, placeholders
**Key Props**: `className`

```tsx
<Skeleton className="h-4 w-[250px]" />
```

### Slider

**Purpose**: Range input control
**Use Cases**: Settings, filters, numeric input
**Key Props**: `value`, `onValueChange`, `min`, `max`, `step`

```tsx
<Slider
  value={[50]}
  onValueChange={(value) => setValue(value)}
  max={100}
  step={1}
/>
```

### Sonner & Toast

**Purpose**: Notification messages
**Use Cases**: Success messages, errors, alerts
**Key Props**: Toast options, positioning

```tsx
<Toaster />
// Usage: toast("Message", { description: "Details" })
```

### Switch

**Purpose**: Toggle control
**Use Cases**: Settings, preferences, feature toggles
**Key Props**: `checked`, `onCheckedChange`

```tsx
<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
/>
```

### Table

**Purpose**: Structured data display
**Use Cases**: Data tables, reports, listings
**Key Props**: Standard table structure

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Tabs

**Purpose**: Organize content in tabs
**Use Cases**: Settings panels, content organization
**Key Props**: `value`, `onValueChange`

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
</Tabs>
```

### Textarea

**Purpose**: Multi-line text input
**Use Cases**: Comments, descriptions, long text
**Key Props**: `placeholder`, `rows`, `disabled`

```tsx
<Textarea
  placeholder="Enter your message..."
  className="resize-none"
/>
```

### Toggle & Toggle Group

**Purpose**: Binary and group selection controls
**Use Cases**: Formatting options, view modes
**Key Props**: `pressed`, `onPressedChange`, `type` (single/multiple for group)

```tsx
<Toggle pressed={pressed} onPressedChange={setPressed}>
  Bold
</Toggle>

<ToggleGroup type="multiple" value={value} onValueChange={setValue}>
  <ToggleGroupItem value="bold">B</ToggleGroupItem>
  <ToggleGroupItem value="italic">I</ToggleGroupItem>
</ToggleGroup>
```

### Tooltip

**Purpose**: Contextual help and information
**Use Cases**: Help text, explanations, shortcuts
**Key Props**: `delayDuration`, `disableHoverableContent`

```tsx
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>
    <p>Helpful information</p>
  </TooltipContent>
</Tooltip>
```

## Usage Notes

- All components are fully typed with TypeScript
- Components follow Radix UI accessibility standards
- Styling is handled via CSS classes and CSS variables for theming
- Most components support `className` prop for custom styling
- Form components integrate with React Hook Form
- All components support ref forwarding
- Icons are from Lucide React
