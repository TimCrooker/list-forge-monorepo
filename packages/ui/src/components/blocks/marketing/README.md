# Marketing Blocks

This directory contains marketing and landing page components including hero sections, testimonials, pricing, features, and promotional content. These blocks are designed for conversion-focused pages.

## Components

### Logo Cloud

**Purpose**: Display collection of client/partner logos
**Use Cases**: Social proof, partner showcases, client testimonials
**Key Props**: `logos`, `layout`, `animated`, `grayscale`

```tsx
<LogoCloud
  logos={[
    { name: 'Company A', src: '/logos/company-a.svg', url: 'https://company-a.com' },
    { name: 'Company B', src: '/logos/company-b.svg', url: 'https://company-b.com' },
    { name: 'Company C', src: '/logos/company-c.svg', url: 'https://company-c.com' }
  ]}
  layout="grid"
  animated={true}
  grayscale={true}
  title="Trusted by industry leaders"
/>
```

## Landing Page Components

### Hero Centered

**Purpose**: Centered hero section with call-to-action
**Use Cases**: Landing pages, product launches, marketing campaigns
**Key Props**: `title`, `subtitle`, `actions`, `image`, `background`

```tsx
<HeroCentered
  title="Build Amazing Products"
  subtitle="Create beautiful, responsive applications with our comprehensive component library and design system."
  actions={[
    { text: 'Get Started', href: '/signup', variant: 'default' },
    { text: 'View Demo', href: '/demo', variant: 'outline' }
  ]}
  image={{
    src: '/hero-image.jpg',
    alt: 'Product screenshot'
  }}
  background="gradient"
/>
```

### Hero Split

**Purpose**: Split-layout hero with content on one side, visual on the other
**Use Cases**: Product showcases, feature introductions
**Key Props**: `title`, `description`, `actions`, `media`, `reversed`

```tsx
<HeroSplit
  title="Streamline Your Workflow"
  description="Our powerful tools help teams collaborate more effectively and deliver projects faster than ever before."
  actions={[
    { text: 'Start Free Trial', href: '/trial' },
    { text: 'Schedule Demo', href: '/demo', variant: 'ghost' }
  ]}
  media={{
    type: 'video',
    src: '/product-demo.mp4',
    poster: '/video-poster.jpg'
  }}
  reversed={false}
  stats={[
    { value: '10,000+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' }
  ]}
/>
```

### Features Grid

**Purpose**: Grid layout showcasing product features
**Use Cases**: Feature pages, product overviews
**Key Props**: `features`, `columns`, `showIcons`, `layout`

```tsx
<FeaturesGrid
  features={[
    {
      title: 'Fast Performance',
      description: 'Lightning-fast loading times and smooth interactions.',
      icon: <Zap className="h-6 w-6" />,
      image: '/feature-performance.jpg'
    },
    {
      title: 'Secure by Default',
      description: 'Enterprise-grade security built into every component.',
      icon: <Shield className="h-6 w-6" />,
      image: '/feature-security.jpg'
    },
    {
      title: 'Fully Responsive',
      description: 'Perfect on desktop, tablet, and mobile devices.',
      icon: <Smartphone className="h-6 w-6" />,
      image: '/feature-responsive.jpg'
    }
  ]}
  columns={3}
  showIcons={true}
  layout="card"
/>
```

### Features Alternating

**Purpose**: Alternating feature sections with detailed descriptions
**Use Cases**: Detailed feature explanations, product benefits
**Key Props**: `features`, `imagePosition`, `spacing`

```tsx
<FeaturesAlternating
  features={[
    {
      title: 'Advanced Analytics',
      description: 'Get deep insights into your application performance with our comprehensive analytics dashboard.',
      image: '/analytics-dashboard.jpg',
      benefits: [
        'Real-time monitoring',
        'Custom dashboards',
        'Automated alerts',
        'Export capabilities'
      ],
      cta: { text: 'Learn More', href: '/analytics' }
    },
    {
      title: 'Team Collaboration',
      description: 'Work together seamlessly with built-in collaboration tools and real-time updates.',
      image: '/collaboration.jpg',
      benefits: [
        'Real-time editing',
        'Comment system',
        'Version history',
        'Permission management'
      ],
      cta: { text: 'Try Collaboration', href: '/collaboration' }
    }
  ]}
  imagePosition="alternating"
  spacing="xl"
/>
```

### Testimonials Grid

**Purpose**: Customer testimonials in grid layout
**Use Cases**: Social proof, customer stories, reviews
**Key Props**: `testimonials`, `layout`, `showRatings`, `showCompany`

```tsx
<TestimonialsGrid
  testimonials={[
    {
      id: '1',
      content: 'This product has transformed how our team works. The interface is intuitive and the features are powerful.',
      author: {
        name: 'Sarah Johnson',
        title: 'CEO',
        company: 'TechCorp',
        avatar: '/avatars/sarah.jpg'
      },
      rating: 5,
      featured: true
    },
    {
      id: '2',
      content: 'Outstanding customer support and a product that just works. Highly recommended!',
      author: {
        name: 'Mike Chen',
        title: 'Product Manager',
        company: 'StartupXYZ',
        avatar: '/avatars/mike.jpg'
      },
      rating: 5
    }
  ]}
  layout="masonry"
  showRatings={true}
  showCompany={true}
  title="What our customers say"
/>
```

### Pricing Cards

**Purpose**: Pricing plans with feature comparisons
**Use Cases**: Subscription pages, plan selection, pricing tiers
**Key Props**: `plans`, `billing`, `featured`, `onSelectPlan`

```tsx
<PricingCards
  plans={[
    {
      id: 'basic',
      name: 'Basic',
      price: { monthly: 9, yearly: 90 },
      description: 'Perfect for small teams',
      features: [
        'Up to 5 team members',
        '10GB storage',
        'Email support',
        'Basic analytics'
      ],
      cta: 'Start Basic'
    },
    {
      id: 'pro',
      name: 'Professional',
      price: { monthly: 29, yearly: 290 },
      description: 'For growing businesses',
      features: [
        'Up to 25 team members',
        '100GB storage',
        'Priority support',
        'Advanced analytics',
        'Integrations'
      ],
      featured: true,
      cta: 'Start Pro'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: { monthly: 99, yearly: 990 },
      description: 'For large organizations',
      features: [
        'Unlimited team members',
        'Unlimited storage',
        '24/7 phone support',
        'Custom integrations',
        'SLA guarantee'
      ],
      cta: 'Contact Sales'
    }
  ]}
  billing="monthly"
  onBillingChange={setBilling}
  onSelectPlan={handleSelectPlan}
/>
```

### FAQ Accordion

**Purpose**: Frequently asked questions in accordion format
**Use Cases**: Support pages, product information, help sections
**Key Props**: `faqs`, `searchable`, `categories`, `defaultOpen`

```tsx
<FAQAccordion
  faqs={[
    {
      id: '1',
      question: 'How do I get started?',
      answer: 'Simply sign up for an account and follow our onboarding guide. You\'ll be up and running in minutes.',
      category: 'getting-started'
    },
    {
      id: '2',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for enterprise customers.',
      category: 'billing'
    },
    {
      id: '3',
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.',
      category: 'billing'
    }
  ]}
  searchable={true}
  categories={[
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'billing', label: 'Billing' },
    { id: 'technical', label: 'Technical' }
  ]}
  title="Frequently Asked Questions"
/>
```

### Stats Simple

**Purpose**: Key statistics and metrics display
**Use Cases**: Company metrics, product stats, achievement highlights
**Key Props**: `stats`, `layout`, `animated`, `prefix`, `suffix`

```tsx
<StatsSimple
  stats={[
    {
      value: '10M+',
      label: 'Downloads',
      description: 'Monthly active downloads'
    },
    {
      value: '99.9%',
      label: 'Uptime',
      description: 'Service availability'
    },
    {
      value: '150+',
      label: 'Countries',
      description: 'Global reach'
    },
    {
      value: '24/7',
      label: 'Support',
      description: 'Customer service'
    }
  ]}
  layout="grid"
  animated={true}
  title="Trusted by millions worldwide"
/>
```

### CTA Simple

**Purpose**: Call-to-action section with compelling message
**Use Cases**: Newsletter signup, trial conversion, contact forms
**Key Props**: `title`, `description`, `actions`, `background`, `centered`

```tsx
<CTASimple
  title="Ready to get started?"
  description="Join thousands of teams already building amazing products with our platform."
  actions={[
    { text: 'Start Free Trial', href: '/signup', variant: 'default' },
    { text: 'Contact Sales', href: '/contact', variant: 'outline' }
  ]}
  background="primary"
  centered={true}
/>
```

## Features

### Conversion Optimization

- A/B testing support
- Conversion tracking
- Performance analytics
- Heat map integration
- User behavior tracking

### Responsive Design

- Mobile-first approach
- Touch-friendly interactions
- Adaptive layouts
- Progressive enhancement
- Cross-browser compatibility

### SEO Optimization

- Semantic HTML structure
- Meta tag management
- Structured data support
- Performance optimization
- Accessibility compliance

### Customization

- Brand theming
- Custom animations
- Flexible layouts
- Content management
- Design variations

## Usage Examples

### Complete Landing Page

```tsx
function LandingPage() {
  return (
    <div>
      <HeroCentered
        title="Build the Future"
        subtitle="The most advanced development platform for modern applications"
        actions={[
          { text: 'Start Building', href: '/signup' },
          { text: 'Watch Demo', href: '/demo', variant: 'outline' }
        ]}
        image={{ src: '/hero-dashboard.jpg', alt: 'Dashboard' }}
      />

      <LogoCloud
        logos={clientLogos}
        title="Trusted by industry leaders"
        grayscale={true}
      />

      <FeaturesGrid
        features={keyFeatures}
        columns={3}
        title="Why choose our platform?"
      />

      <FeaturesAlternating
        features={detailedFeatures}
        imagePosition="alternating"
      />

      <TestimonialsGrid
        testimonials={customerTestimonials}
        layout="grid"
        title="What our customers say"
      />

      <PricingCards
        plans={pricingPlans}
        billing={billingPeriod}
        onSelectPlan={handlePlanSelection}
      />

      <StatsSimple
        stats={companyStats}
        title="Numbers that matter"
      />

      <FAQAccordion
        faqs={frequentlyAskedQuestions}
        searchable={true}
      />

      <CTASimple
        title="Ready to transform your business?"
        description="Join thousands of companies already using our platform"
        actions={[
          { text: 'Get Started Today', href: '/signup' }
        ]}
      />
    </div>
  );
}
```

### Product Feature Page

```tsx
function FeaturePage() {
  return (
    <div>
      <HeroSplit
        title="Advanced Analytics"
        description="Get deep insights into your application performance with real-time monitoring and custom dashboards."
        media={{
          type: 'image',
          src: '/analytics-hero.jpg',
          alt: 'Analytics Dashboard'
        }}
        actions={[
          { text: 'Try Analytics', href: '/trial' },
          { text: 'View Pricing', href: '/pricing', variant: 'outline' }
        ]}
      />

      <FeaturesGrid
        features={analyticsFeatures}
        columns={2}
        layout="detailed"
      />

      <TestimonialsGrid
        testimonials={analyticsTestimonials}
        layout="carousel"
        showCompany={true}
      />

      <CTASimple
        title="Ready to gain insights?"
        description="Start tracking your application performance today"
        actions={[
          { text: 'Start Free Trial', href: '/trial' }
        ]}
      />
    </div>
  );
}
