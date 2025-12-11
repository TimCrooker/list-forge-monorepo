import {
  Sparkles,
  DollarSign,
  Zap,
  Camera,
  Search,
  Globe,
  type LucideIcon,
} from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export const features: Feature[] = [
  {
    icon: Sparkles,
    title: 'Visual AI Recognition',
    description:
      'Upload photos and AI instantly identifies brand, model, category, and condition. OCR extracts UPC/EAN/Serial numbers automatically.',
  },
  {
    icon: DollarSign,
    title: 'Intelligent Pricing Engine',
    description:
      'Analyzes thousands of sold listings for comparables. Get floor, target, and ceiling prices with confidence scores and demand signals.',
  },
  {
    icon: Search,
    title: 'Multi-Source Research',
    description:
      'Cross-references vision AI, UPC databases, web search, and Amazon catalog. Every field tracked with confidence score and source attribution.',
  },
  {
    icon: Globe,
    title: 'Multi-Marketplace Publishing',
    description:
      'One-click publishing to eBay, Amazon, and Facebook Marketplace. Platform-specific formatting, category mapping, and inventory sync.',
  },
  {
    icon: Zap,
    title: 'SEO-Optimized Listings',
    description:
      'AI generates optimized titles, dynamic descriptions with bullet points, and smart attribute mapping for each marketplace.',
  },
  {
    icon: Camera,
    title: 'Offline-First Mobile App',
    description:
      'Capture items in warehouses without connectivity. Barcode scanning, background sync, and 45-second average time-to-list.',
  },
]

export interface ShowcaseFeature {
  badge: string
  title: string
  description: string
  image: {
    src: string
    alt: string
  }
  highlights: string[]
  icon: LucideIcon
}

export const showcaseFeatures: ShowcaseFeature[] = [
  {
    badge: 'Capture',
    title: 'Smart Visual Recognition',
    description:
      'Upload photos and AI identifies brand, model, category, and condition in seconds. OCR automatically extracts UPC, EAN, and serial numbers. 95% identification accuracy across 100+ product categories.',
    image: {
      src: '/screenshots/capture-flow.png',
      alt: 'Mobile app capture flow showing AI product identification',
    },
    highlights: [
      '95% product identification accuracy',
      'OCR for UPC/EAN/Serial number extraction',
      'Works offline - perfect for warehouses',
      'Per-field confidence tracking with sources',
    ],
    icon: Camera,
  },
  {
    badge: 'Research',
    title: 'Evidence-Based Pricing',
    description:
      'AI searches thousands of sold and active listings to find true comparables. Get floor, target, and ceiling price recommendations with confidence scores. Choose pricing strategy: Aggressive (fast sale), Balanced, or Premium (max profit).',
    image: {
      src: '/screenshots/research-panel.png',
      alt: 'Research panel showing comparable listings and pricing analysis',
    },
    highlights: [
      'Price bands with confidence scores',
      'Demand signals: sell-through rates, days-to-sell',
      'Amazon BSR and competition analysis',
      'Every recommendation shows evidence trail',
    ],
    icon: Search,
  },
  {
    badge: 'Publish',
    title: 'Multi-Marketplace Mastery',
    description:
      'One-click publishing to eBay, Amazon, and Facebook Marketplace. AI auto-formats for each platform: categories, item specifics, attributes. Inventory syncs automatically across all channels.',
    image: {
      src: '/screenshots/multi-marketplace.png',
      alt: 'Multi-marketplace publishing interface',
    },
    highlights: [
      'eBay, Amazon & Facebook integrations',
      'Platform-specific category mapping',
      'Auto-format item specifics per marketplace',
      'Synchronized inventory across all platforms',
    ],
    icon: Globe,
  },
]
