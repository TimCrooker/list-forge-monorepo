export interface Logo {
  name: string
  src: string
  href?: string
}

// ListForge brand logos
export const listForgeLogo = {
  full: '/assets/full_logo.png',
  icon: '/assets/icon_logo.png',
  text: '/assets/text_logo.png',
} as const

export const marketplaceLogos: Logo[] = [
  {
    name: 'eBay',
    src: 'https://logo.clearbit.com/ebay.com',
    href: 'https://www.ebay.com',
  },
  {
    name: 'Amazon',
    src: 'https://logo.clearbit.com/amazon.com',
    href: 'https://www.amazon.com',
  },
  {
    name: 'Facebook Marketplace',
    src: 'https://logo.clearbit.com/facebook.com',
    href: 'https://www.facebook.com/marketplace',
  },
]
