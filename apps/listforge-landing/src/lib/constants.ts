// App URLs
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.listforge.io'
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.listforge.io'

// Auth URLs
export const LOGIN_URL = `${APP_URL}/login`
export const REGISTER_URL = `${APP_URL}/register`

// Helper to create signup URLs with tracking
export const getSignupUrl = (options?: {
  plan?: string
  trial?: boolean
  source?: string
}) => {
  const params = new URLSearchParams({
    utm_source: options?.source || 'landing',
    utm_medium: 'web',
  })

  if (options?.plan) {
    params.set('plan', options.plan)
  }

  if (options?.trial) {
    params.set('trial', 'true')
  }

  return `${REGISTER_URL}?${params.toString()}`
}

// Navigation sections
export const NAV_SECTIONS = {
  features: '#features',
  pricing: '#pricing',
  integrations: '#integrations',
  faq: '#faq',
} as const

// Smooth scroll to section
export const scrollToSection = (sectionId: string) => {
  const element = document.querySelector(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
