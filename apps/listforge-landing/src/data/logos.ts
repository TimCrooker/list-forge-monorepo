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
    src: 'https://img.logo.dev/ebay.com?format=png',
    href: 'https://www.ebay.com',
  },
  {
    name: 'Amazon',
    src: 'https://img.logo.dev/amazon.com?format=png',
    href: 'https://www.amazon.com',
  },
  {
    name: 'Facebook Marketplace',
    src: 'https://img.logo.dev/facebook.com?format=png',
    href: 'https://www.facebook.com/marketplace',
  },
  {
    name: 'Etsy',
    src: 'https://img.logo.dev/etsy.com?format=png',
    href: 'https://www.etsy.com',
  },
  {
    name: 'Poshmark',
    src: 'https://img.logo.dev/poshmark.com?format=png',
    href: 'https://www.poshmark.com',
  },
]
