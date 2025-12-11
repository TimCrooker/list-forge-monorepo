'use client'

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { scrollToSection, NAV_SECTIONS, LOGIN_URL, getSignupUrl } from '@/lib/constants'
import { FadeIn } from './animations/FadeIn'
import { Heart } from 'lucide-react'
import { Logo } from './ui/Logo'

const footerLinks = {
  product: [
    { label: 'Features', href: NAV_SECTIONS.features, isSection: true },
    { label: 'Pricing', href: NAV_SECTIONS.pricing, isSection: true },
    { label: 'Integrations', href: NAV_SECTIONS.integrations, isSection: true },
    { label: 'FAQ', href: NAV_SECTIONS.faq, isSection: true },
  ],
  company: [
    { label: 'About', href: '/about', isRoute: true },
    { label: 'Blog', href: '/blog', isRoute: true },
    { label: 'Careers', href: '/careers', isRoute: true },
    { label: 'Contact', href: '/contact', isRoute: true },
  ],
  resources: [
    { label: 'Documentation', href: '/docs', isRoute: true },
    { label: 'API Reference', href: '/api', isRoute: true },
    { label: 'Help Center', href: '/help', isRoute: true },
    { label: 'Status', href: '/status', isRoute: true },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy', isRoute: true },
    { label: 'Terms of Service', href: '/terms', isRoute: true },
    { label: 'Cookie Policy', href: '/cookie-policy', isRoute: true },
  ],
}

const socialLinks = [
  {
    label: 'Twitter',
    href: 'https://twitter.com/listforge',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/listforge',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@listforge',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

export function Footer() {
  const renderFooterLink = (link: any) => {
    if (link.isSection) {
      return (
        <button
          onClick={() => scrollToSection(link.href)}
          className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
        >
          {link.label}
        </button>
      )
    }

    if (link.isRoute) {
      return (
        <Link
          to={link.href}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {link.label}
        </Link>
      )
    }

    // Email or external link
    return (
      <a
        href={link.href}
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        {link.label}
      </a>
    )
  }

  return (
    <footer className="border-t bg-muted/30 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <FadeIn direction="up">
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {/* Logo + Tagline + Social */}
            <div className="sm:col-span-2 lg:col-span-1">
              <a href="/" className="flex items-center mb-4 group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                >
                  <Logo variant="full" size="md" />
                </motion.div>
              </a>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                AI-powered listing platform for resellers. Research, price, and list products across
                every marketplace in seconds.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((link) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label={link.label}
                  >
                    {link.icon}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    {renderFooterLink(link)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    {renderFooterLink(link)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    {renderFooterLink(link)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    {renderFooterLink(link)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>

        {/* Bottom Bar */}
        <FadeIn direction="up" delay={0.2}>
          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              &copy; {new Date().getFullYear()} ListForge. Made with{' '}
              <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for resellers.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={LOGIN_URL}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </a>
              <motion.a
                href={getSignupUrl()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors glow-primary-hover"
              >
                Get Started
              </motion.a>
            </div>
          </div>
        </FadeIn>
      </div>
    </footer>
  )
}
