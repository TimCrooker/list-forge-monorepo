export interface Testimonial {
  content: string
  author: {
    name: string
    role: string
    company: string
    avatar?: string
  }
  rating: number
  highlight?: string
}

export const testimonials: Testimonial[] = [
  {
    content:
      "The per-field confidence scores are a game-changer. I can immediately see Brand: 0.98, UPC: 1.0, Price: 0.85 and know exactly what needs a second look. No more blind trust in AI—I see the evidence for every recommendation.",
    author: {
      name: 'Sarah Martinez',
      role: 'Full-time eBay Seller',
      company: 'VintageFindsbyS',
    },
    rating: 5,
    highlight: 'Evidence-based decisions',
  },
  {
    content:
      "I was skeptical about 'AI pricing' until I saw the comparables analysis. It's not generic averages—it shows me 20+ actual sold listings with dates, prices, and sell-through rates. The floor/target/ceiling bands give me real flexibility based on how fast I need to move inventory.",
    author: {
      name: 'Jessica Chen',
      role: 'Multi-Marketplace Seller',
      company: 'JessicasCloset',
    },
    rating: 5,
    highlight: 'Real comparables, not averages',
  },
  {
    content:
      "We process 500+ items daily at our warehouse. The offline mobile app is essential—our team scans barcodes and captures photos in the receiving area with zero WiFi. Everything syncs when they walk back to the office. Cut our intake time by 60%.",
    author: {
      name: 'Michael Thompson',
      role: 'Operations Director',
      company: 'ResellerPro Logistics',
    },
    rating: 5,
    highlight: '60% faster intake',
  },
  {
    content:
      "Found a vintage designer handbag at an estate sale. Snapped a photo and ListForge identified the exact model, year, and condition grade. The OCR pulled the serial number from a tiny label I almost missed. Priced it at $850 based on comps—sold in 3 days.",
    author: {
      name: 'Amanda Rodriguez',
      role: 'Luxury Reseller',
      company: 'Curated Luxe',
    },
    rating: 5,
    highlight: 'OCR catches hidden details',
  },
  {
    content:
      "The multi-marketplace formatting is brilliant. One click and my listing goes to eBay, Amazon, and Facebook Marketplace with platform-specific categories and attributes. No more manually reformatting for each site. Cross-listing 100 items used to take all day—now it's 30 minutes.",
    author: {
      name: 'David Park',
      role: 'Multi-Platform Seller',
      company: 'SoleSource Resale',
    },
    rating: 5,
    highlight: 'Cross-listing made easy',
  },
  {
    content:
      "The demand signals are gold. Seeing 'sell-through rate: 73%, average days-to-sell: 12' helps me decide whether to price aggressively or hold for max profit. Amazon BSR integration tells me if a category is saturated. Data-driven decisions instead of gut feelings.",
    author: {
      name: 'Rachel Kim',
      role: 'Amazon & eBay Seller',
      company: 'Second Act Resale',
    },
    rating: 5,
    highlight: 'Data-driven pricing',
  },
]
