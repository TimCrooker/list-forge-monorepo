# @listforge/ui

A comprehensive UI component library built with shadcn/ui components and Tailwind CSS. This library provides foundational UI components, complex application blocks, and specialized workflow components for building modern applications.

## Installation

```bash
pnpm add @listforge/ui
```

## Setup

1. Import the global styles in your app's main CSS file:

```css
@import '@listforge/ui/styles/globals.css';
```

2. Configure Tailwind to include the ui package:

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@listforge/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  // ... rest of your config
}
```

## Component Library Overview

### UI Components (`/src/components/ui/`)

Foundational UI components built with Radix UI primitives and Tailwind CSS.

- **Accordion** - Collapsible content sections with smooth animations
- **Alert** - Status messages and notifications with variants
- **AlertDialog** - Modal dialogs for destructive actions
- **AspectRatio** - Responsive aspect ratio containers
- **Avatar** - User profile images with fallbacks
- **Badge** - Status indicators and labels
- **Breadcrumb** - Navigation path indicators
- **Button** - Interactive buttons with multiple variants
- **Calendar** - Date selection interface
- **Card** - Content containers with header, body, and footer
- **Carousel** - Image and content sliders
- **Chart** - Data visualization components (Area, Bar, Line, Pie)
- **Checkbox** - Boolean input controls
- **Collapsible** - Expandable content sections
- **Command** - Command palette and search interface
- **ContextMenu** - Right-click context menus
- **Dialog** - Modal dialog windows
- **Drawer** - Slide-out panels and drawers
- **DropdownMenu** - Dropdown menu navigation
- **Form** - Form components with validation
- **HoverCard** - Contextual popover cards
- **Input** - Text input fields
- **InputOTP** - One-time password input
- **Label** - Form field labels
- **Menubar** - Horizontal menu navigation
- **NavigationMenu** - Site navigation menus
- **Pagination** - Page navigation controls
- **Popover** - Floating content panels
- **Progress** - Progress bars and indicators
- **RadioGroup** - Single-selection radio buttons
- **ResizablePanel** - Resizable layout panels
- **ScrollArea** - Custom scrollable areas
- **Select** - Dropdown selection inputs
- **Separator** - Visual content dividers
- **Sheet** - Side panels and overlays
- **Sidebar** - Application sidebar navigation
- **Skeleton** - Loading state placeholders
- **Slider** - Range selection controls
- **Sonner** - Toast notification system
- **Switch** - Toggle switches
- **Table** - Data tables with sorting and filtering
- **Tabs** - Tabbed content interfaces
- **Textarea** - Multi-line text inputs
- **Toast** - Notification messages
- **Toggle** - Toggle buttons
- **ToggleGroup** - Grouped toggle controls
- **Tooltip** - Contextual help tooltips

### Application Blocks (`/src/components/blocks/application/`)

Complex application components for admin panels and dashboards.

- **AppShell** - Main application layout structure
- **AppSidebar** - Application sidebar with navigation
- **AppNavbar** - Top navigation bar
- **AppContent** - Main content area wrapper
- **DashboardShell** - Dashboard layout container
- **OverviewCards** - Dashboard summary cards
- **QuickActions** - Dashboard action buttons
- **MetricsDashboard** - Real-time metrics display
- **NotificationsPanel** - Notifications management
- **UserProfile** - User profile management
- **SettingsPanel** - Application settings interface
- **APIExplorer** - API documentation and testing
- **LogViewer** - Application log viewer
- **ActivityWidgets** - Activity feed components
- **AnalyticsWidgets** - Analytics visualization

### Authentication Blocks (`/src/components/blocks/auth/`)

Complete authentication components with security features.

- **LoginForm** - User login interface
- **RegisterForm** - User registration form
- **SocialLogin** - Social media authentication
- **TwoFactorAuth** - Two-factor authentication
- **PasswordReset** - Password reset flow
- **MagicLink** - Magic link authentication
- **PermissionGate** - Role-based access control

### Content Blocks (`/src/components/blocks/content/`)

Content creation and management components.

- **RichTextEditor** - WYSIWYG text editor
- **MarkdownEditor** - Markdown editing interface
- **CodeEditor** - Syntax-highlighted code editor
- **FileUpload** - File upload and management
- **MediaGallery** - Image and video gallery

### Data Display Blocks (`/src/components/blocks/data-display/`)

Advanced data visualization and table components.

- **DataTable** - Feature-rich data tables
- **DataTableColumnHeader** - Sortable column headers
- **DataTableFacetedFilter** - Multi-select filters
- **DataTableRowActions** - Row action menus
- **AreaChart** - Area chart visualization
- **BarChart** - Bar chart display
- **LineChart** - Line chart graphs
- **PieChart** - Pie chart visualization
- **KPICard** - Key performance indicators
- **ActivityFeed** - Activity timeline
- **Timeline** - Event timeline display
- **KanbanBoard** - Task board interface

### E-commerce Blocks (`/src/components/blocks/ecommerce/`)

Shopping and commerce components.

- **ProductCard** - Product display cards
- **ProductGrid** - Product listing grid
- **Cart** - Shopping cart interface
- **Checkout** - Checkout process flow
- **OrderSummary** - Order summary display

### Form Blocks (`/src/components/blocks/forms/`)

Advanced form components with validation.

- **SearchFilters** - Advanced search and filtering

### Layout Blocks (`/src/components/blocks/layout/`)

Flexible layout and grid systems.

- **Container** - Content container wrapper
- **Grid** - CSS Grid layout system
- **Stack** - Flexbox stack layouts
- **Section** - Page section wrapper
- **Spacer** - Spacing utilities
- **Responsive** - Responsive layout helpers
- **BentoGrid** - Masonry-style grid layout

### Marketing Blocks (`/src/components/blocks/marketing/`)

Landing page and marketing components.

- **LogoCloud** - Client/partner logo display
- **HeroCentered** - Centered hero sections
- **HeroSplit** - Split-layout hero sections
- **FeaturesGrid** - Feature showcase grid
- **FeaturesAlternating** - Alternating feature sections
- **TestimonialsGrid** - Customer testimonials
- **PricingCards** - Pricing plan display
- **FAQAccordion** - Frequently asked questions
- **StatsSimple** - Statistics display
- **CTASimple** - Call-to-action sections

### Workflow Components (`/src/components/workflow/`)

Visual workflow builder and process management.

- **Canvas** - Drag-and-drop workflow canvas
- **Nodes** - Workflow node components
- **Connections** - Node connection system
- **Palette** - Component palette
- **Templates** - Workflow templates
- **DragDrop** - Drag and drop utilities
- **Hooks** - Workflow state management
- **Config** - Workflow configuration

## Documentation Structure

Each component category has detailed documentation in its respective directory:

- **[UI Components](./src/components/ui/README.md)** - Complete guide to foundational components
- **[Application Blocks](./src/components/blocks/application/README.md)** - Admin panel and dashboard components
- **[Authentication Blocks](./src/components/blocks/auth/README.md)** - Login, registration, and security components
- **[Content Blocks](./src/components/blocks/content/README.md)** - Text editing and media management
- **[Data Display Blocks](./src/components/blocks/data-display/README.md)** - Charts, tables, and data visualization
- **[E-commerce Blocks](./src/components/blocks/ecommerce/README.md)** - Shopping and commerce components
- **[Form Blocks](./src/components/blocks/forms/README.md)** - Advanced form and filtering components
- **[Layout Blocks](./src/components/blocks/layout/README.md)** - Grid systems and layout utilities
- **[Marketing Blocks](./src/components/blocks/marketing/README.md)** - Landing pages and conversion components
- **[Workflow Components](./src/components/workflow/README.md)** - Visual workflow builder system
- **[Theming Guide](./docs/THEMING.md)** - Runtime theming and dark mode support

## Key Features

- **TypeScript Support** - Fully typed components with intelligent IntelliSense
- **Accessibility** - WCAG 2.1 compliant with screen reader support
- **Theming** - CSS variables-based theming with dark mode support
- **Responsive Design** - Mobile-first responsive components
- **Performance** - Optimized bundle sizes with tree-shaking support
- **Customization** - Highly customizable with Tailwind CSS utilities

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Watch for changes
pnpm dev

# Run Storybook
pnpm storybook
```

## Usage Example

```tsx
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HeroCentered,
  DataTable
} from '@listforge/ui'

function MyApp() {
  return (
    <div>
      <HeroCentered
        title="Welcome to Our Platform"
        subtitle="Build amazing applications with our component library"
        actions={[
          { text: 'Get Started', href: '/signup' },
          { text: 'Learn More', href: '/docs', variant: 'outline' }
        ]}
      />

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Click me</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```



