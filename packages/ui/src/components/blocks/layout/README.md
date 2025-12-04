# Layout Blocks

This directory contains flexible layout components for organizing content including grids, containers, spacing utilities, and responsive design components. These blocks provide the structural foundation for building complex layouts.

## Components

### Container
**Purpose**: Content wrapper with consistent max-width and padding
**Use Cases**: Page layouts, content sections, responsive design
**Key Props**: `size`, `padding`, `centered`, `fluid`
```tsx
<Container size="lg" padding="md" centered={true}>
  <h1>Page Content</h1>
  <p>This content is properly contained and centered.</p>
</Container>
```

### Grid
**Purpose**: Flexible CSS Grid layout with responsive breakpoints
**Use Cases**: Dashboard layouts, card grids, complex layouts
**Key Props**: `columns`, `gap`, `responsive`, `autoFit`, `minItemWidth`
```tsx
<Grid
  columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
  gap="md"
  autoFit={true}
  minItemWidth="250px"
>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</Grid>
```

### Stack
**Purpose**: Vertical or horizontal stacking with consistent spacing
**Use Cases**: Form layouts, list items, button groups
**Key Props**: `direction`, `spacing`, `align`, `justify`, `wrap`
```tsx
<Stack direction="vertical" spacing="md" align="center">
  <Button>Primary Action</Button>
  <Button variant="outline">Secondary Action</Button>
  <Button variant="ghost">Cancel</Button>
</Stack>

<Stack direction="horizontal" spacing="sm" justify="space-between">
  <div>Left Content</div>
  <div>Right Content</div>
</Stack>
```

### Section
**Purpose**: Content section with background, padding, and borders
**Use Cases**: Page sections, feature blocks, content divisions
**Key Props**: `background`, `padding`, `border`, `rounded`, `shadow`
```tsx
<Section
  background="muted"
  padding="xl"
  rounded="lg"
  shadow="sm"
  border={true}
>
  <h2>Section Title</h2>
  <p>Section content goes here.</p>
</Section>
```

### Spacer
**Purpose**: Flexible spacing component for layout control
**Use Cases**: Vertical spacing, layout padding, responsive gaps
**Key Props**: `size`, `responsive`, `axis`, `min`, `max`
```tsx
<div>
  <h1>Title</h1>
  <Spacer size="lg" />
  <p>Content with controlled spacing above.</p>
  <Spacer size={{ sm: 'md', lg: 'xl' }} />
  <Button>Action</Button>
</div>
```

### Responsive
**Purpose**: Conditional rendering based on breakpoints
**Use Cases**: Responsive layouts, device-specific content
**Key Props**: `show`, `hide`, `breakpoint`, `fallback`
```tsx
<div>
  <Responsive show="desktop">
    <DesktopNavigation />
  </Responsive>

  <Responsive show="mobile">
    <MobileNavigation />
  </Responsive>

  <Responsive hide="mobile" fallback={<MobileFallback />}>
    <ComplexDataTable />
  </Responsive>
</div>
```

### Bento Grid
**Purpose**: Modern bento-box style grid layout
**Use Cases**: Modern dashboards, feature showcases, portfolio layouts
**Key Props**: `items`, `autoSize`, `gap`, `minHeight`
```tsx
<BentoGrid
  items={[
    { id: '1', content: <MetricCard />, span: { cols: 2, rows: 1 } },
    { id: '2', content: <ChartWidget />, span: { cols: 1, rows: 2 } },
    { id: '3', content: <QuickActions />, span: { cols: 1, rows: 1 } },
    { id: '4', content: <ActivityFeed />, span: { cols: 2, rows: 2 } }
  ]}
  gap="md"
  autoSize={true}
  minHeight="200px"
/>
```

## Layout Utilities

### Sizing System
```tsx
// Size tokens
const sizes = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Usage in components
<Container size="xl">Large container</Container>
<Grid columns={{ sm: 1, md: 2, xl: 4 }}>Responsive grid</Grid>
```

### Spacing System
```tsx
// Spacing tokens
const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem'     // 64px
};

// Usage
<Stack spacing="lg">Consistent spacing</Stack>
<Spacer size="xl" />
```

## Features

### Responsive Design
- Mobile-first approach
- Flexible breakpoint system
- Responsive utilities
- Container queries support
- Adaptive layouts

### Accessibility
- Semantic HTML structure
- ARIA landmarks
- Focus management
- Screen reader support
- Keyboard navigation

### Performance
- CSS Grid and Flexbox optimization
- Efficient re-renders
- Minimal layout shifts
- Responsive image handling

### Customization
- CSS custom properties
- Tailwind integration
- Design token system
- Theme-aware components

## Usage Examples

### Dashboard Layout
```tsx
function Dashboard() {
  return (
    <Container size="full" padding="lg">
      <Stack spacing="xl">
        <Section padding="md">
          <h1>Dashboard Overview</h1>
        </Section>

        <Grid columns={{ sm: 1, lg: 3 }} gap="lg">
          <div className="lg:col-span-2">
            <BentoGrid
              items={[
                { id: 'metrics', content: <MetricsGrid />, span: { cols: 2, rows: 1 } },
                { id: 'chart1', content: <RevenueChart />, span: { cols: 1, rows: 2 } },
                { id: 'chart2', content: <UsersChart />, span: { cols: 1, rows: 1 } },
                { id: 'activity', content: <ActivityFeed />, span: { cols: 2, rows: 1 } }
              ]}
              gap="md"
            />
          </div>

          <aside>
            <Stack spacing="lg">
              <Section background="muted" padding="md" rounded="lg">
                <QuickActions />
              </Section>

              <Section background="muted" padding="md" rounded="lg">
                <NotificationsList />
              </Section>
            </Stack>
          </aside>
        </Grid>
      </Stack>
    </Container>
  );
}
```

### Responsive Content Layout
```tsx
function ContentPage() {
  return (
    <Container size="lg">
      <Stack spacing="xl">
        <header>
          <h1>Article Title</h1>
          <Spacer size="md" />
          <Stack direction="horizontal" spacing="sm" align="center">
            <Avatar src="/author.jpg" />
            <div>
              <p>John Doe</p>
              <p className="text-sm text-muted-foreground">January 15, 2024</p>
            </div>
          </Stack>
        </header>

        <Spacer size="lg" />

        <Grid columns={{ sm: 1, lg: 4 }} gap="xl">
          <article className="lg:col-span-3">
            <Stack spacing="lg">
              <img src="/featured-image.jpg" alt="Featured" className="rounded-lg" />
              <div className="prose prose-lg">
                <p>Article content...</p>
              </div>
            </Stack>
          </article>

          <Responsive show="desktop">
            <aside>
              <div className="sticky top-4">
                <Stack spacing="lg">
                  <Section background="muted" padding="md" rounded="lg">
                    <h3>Table of Contents</h3>
                    <nav>
                      <ul className="space-y-2">
                        <li><a href="#section1">Introduction</a></li>
                        <li><a href="#section2">Main Content</a></li>
                        <li><a href="#section3">Conclusion</a></li>
                      </ul>
                    </nav>
                  </Section>

                  <Section background="muted" padding="md" rounded="lg">
                    <h3>Related Articles</h3>
                    <Stack spacing="sm">
                      <a href="#" className="block">Article 1</a>
                      <a href="#" className="block">Article 2</a>
                      <a href="#" className="block">Article 3</a>
                    </Stack>
                  </Section>
                </Stack>
              </div>
            </aside>
          </Responsive>
        </Grid>
      </Stack>
    </Container>
  );
}
```

### Modern Landing Page Layout
```tsx
function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <Section background="gradient" padding="2xl">
        <Container size="lg">
          <Stack spacing="xl" align="center">
            <h1 className="text-6xl font-bold text-center">
              Build Amazing Apps
            </h1>
            <p className="text-xl text-center max-w-2xl">
              Create beautiful, responsive applications with our component library.
            </p>
            <Stack direction="horizontal" spacing="md">
              <Button size="lg">Get Started</Button>
              <Button variant="outline" size="lg">Learn More</Button>
            </Stack>
          </Stack>
        </Container>
      </Section>

      <Spacer size="3xl" />

      {/* Features Section */}
      <Container size="lg">
        <BentoGrid
          items={[
            {
              id: 'feature1',
              content: <FeatureCard title="Fast" description="Lightning fast performance" />,
              span: { cols: 1, rows: 1 }
            },
            {
              id: 'feature2',
              content: <FeatureCard title="Flexible" description="Highly customizable" />,
              span: { cols: 1, rows: 1 }
            },
            {
              id: 'showcase',
              content: <ShowcaseDemo />,
              span: { cols: 2, rows: 2 }
            },
            {
              id: 'testimonial',
              content: <TestimonialCard />,
              span: { cols: 2, rows: 1 }
            }
          ]}
          gap="lg"
          minHeight="250px"
        />
      </Container>
    </div>
  );
}
```