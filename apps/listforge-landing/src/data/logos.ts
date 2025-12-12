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
    src: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
    href: 'https://www.ebay.com',
  },
  {
    name: 'Amazon',
    src: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    href: 'https://www.amazon.com',
  },
  {
    name: 'Facebook Marketplace',
    src: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Facebook_Marketplace_Logo.png',
    href: 'https://www.facebook.com/marketplace',
  },
  {
    name: 'Etsy',
    src: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Etsy_logo.svg',
    href: 'https://www.etsy.com',
  },
  {
    name: 'Poshmark',
    src: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Poshmark_logo.png',
    href: 'https://www.poshmark.com',
  },
]
