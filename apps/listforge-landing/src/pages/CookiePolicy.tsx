'use client'

import { motion } from 'framer-motion'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer } from '@/components/animations/StaggerContainer'
import { Cookie, Shield, Settings, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

export function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 border-b">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 md:px-6 relative">
          <FadeIn direction="up">
            <div className="flex items-center justify-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <Cookie className="h-8 w-8 text-primary" />
              </motion.div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6">
              Cookie Policy
            </h1>
            <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-4">
              How ListForge uses cookies to enhance your experience
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Last updated: December 10, 2025
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <StaggerContainer>
              {/* Introduction */}
              <FadeIn>
                <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                  <h2 className="text-3xl font-bold mb-4">What Are Cookies?</h2>
                  <p className="text-muted-foreground">
                    Cookies are small text files that are placed on your computer or mobile device when you
                    visit a website. They are widely used to make websites work more efficiently and provide
                    information to website owners. Cookies help us understand how you use our service,
                    remember your preferences, and improve your overall experience with ListForge.
                  </p>
                </div>
              </FadeIn>

              {/* Types of Cookies */}
              <FadeIn delay={0.1}>
                <div className="mb-12">
                  <h2 className="text-3xl font-bold mb-6">Types of Cookies We Use</h2>
                  <div className="grid gap-6">
                    {/* Essential Cookies */}
                    <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Essential Cookies</h3>
                          <p className="text-muted-foreground mb-3">
                            These cookies are strictly necessary for the operation of our website. They enable
                            core functionality such as security, network management, and accessibility. Without
                            these cookies, services you have requested cannot be provided.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Examples:</strong> Authentication tokens, session management, security
                            features, load balancing
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <svg
                            className="h-6 w-6 text-blue-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Analytics Cookies</h3>
                          <p className="text-muted-foreground mb-3">
                            These cookies help us understand how visitors interact with our website by
                            collecting and reporting information anonymously. We use this data to improve our
                            service, identify issues, and understand which features are most valuable to our
                            users.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Examples:</strong> Google Analytics, page view tracking, user behavior
                            analysis, feature usage statistics
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Functional Cookies */}
                    <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                          <Settings className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Functional Cookies</h3>
                          <p className="text-muted-foreground mb-3">
                            These cookies enable enhanced functionality and personalization. They remember your
                            preferences, such as language selection, theme choices, and display settings, to
                            provide a more personalized experience when you return to our website.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Examples:</strong> Language preferences, theme selection (dark/light mode),
                            layout preferences, saved filters
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                          <svg
                            className="h-6 w-6 text-purple-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Marketing Cookies</h3>
                          <p className="text-muted-foreground mb-3">
                            These cookies track your online activity to help advertisers deliver more relevant
                            advertising or limit how many times you see an ad. They may also be used to measure
                            the effectiveness of advertising campaigns and understand your interests.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Examples:</strong> Retargeting pixels, conversion tracking, ad campaign
                            measurement, third-party advertising networks
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Cookie Table */}
              <FadeIn delay={0.2}>
                <div className="mb-12">
                  <h2 className="text-3xl font-bold mb-6">Specific Cookies We Use</h2>
                  <div className="border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Cookie Name</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Provider</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Purpose</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Expiry</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono">session_token</td>
                            <td className="px-6 py-4 text-sm">ListForge</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              Maintains your logged-in session
                            </td>
                            <td className="px-6 py-4 text-sm">Session</td>
                          </tr>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono">auth_token</td>
                            <td className="px-6 py-4 text-sm">ListForge</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              Authenticates API requests
                            </td>
                            <td className="px-6 py-4 text-sm">7 days</td>
                          </tr>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono">theme_preference</td>
                            <td className="px-6 py-4 text-sm">ListForge</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              Remembers your theme choice (dark/light mode)
                            </td>
                            <td className="px-6 py-4 text-sm">1 year</td>
                          </tr>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono">_ga</td>
                            <td className="px-6 py-4 text-sm">Google Analytics</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              Distinguishes unique users for analytics
                            </td>
                            <td className="px-6 py-4 text-sm">2 years</td>
                          </tr>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono">_gid</td>
                            <td className="px-6 py-4 text-sm">Google Analytics</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              Distinguishes users for 24-hour analytics
                            </td>
                            <td className="px-6 py-4 text-sm">24 hours</td>
                          </tr>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono">_gat</td>
                            <td className="px-6 py-4 text-sm">Google Analytics</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              Throttles request rate for analytics
                            </td>
                            <td className="px-6 py-4 text-sm">1 minute</td>
                          </tr>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono">cookie_consent</td>
                            <td className="px-6 py-4 text-sm">ListForge</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              Stores your cookie consent preferences
                            </td>
                            <td className="px-6 py-4 text-sm">1 year</td>
                          </tr>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono">referral_source</td>
                            <td className="px-6 py-4 text-sm">ListForge</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              Tracks marketing campaign effectiveness
                            </td>
                            <td className="px-6 py-4 text-sm">30 days</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Managing Cookies */}
              <FadeIn delay={0.3}>
                <div className="mb-12">
                  <h2 className="text-3xl font-bold mb-6">How to Manage Cookies</h2>
                  <div className="border rounded-xl p-8 bg-card">
                    <p className="text-muted-foreground mb-6">
                      You have the right to decide whether to accept or reject cookies. You can exercise your
                      cookie preferences by setting or amending your web browser controls to accept or refuse
                      cookies.
                    </p>

                    <h3 className="text-xl font-semibold mb-4">Browser Settings</h3>
                    <p className="text-muted-foreground mb-4">
                      Most web browsers allow you to control cookies through their settings. You can set your
                      browser to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6 ml-4">
                      <li>Block all cookies</li>
                      <li>Block third-party cookies only</li>
                      <li>Clear all cookies when you close the browser</li>
                      <li>Open a private browsing session</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-4">Browser-Specific Instructions</h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <span className="font-medium">Google Chrome</span>
                        <a
                          href="https://support.google.com/chrome/answer/95647"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Instructions →
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <span className="font-medium">Mozilla Firefox</span>
                        <a
                          href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Instructions →
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <span className="font-medium">Safari</span>
                        <a
                          href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Instructions →
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <span className="font-medium">Microsoft Edge</span>
                        <a
                          href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Instructions →
                        </a>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                      <p className="text-sm text-amber-900 dark:text-amber-200">
                        <strong>Important:</strong> If you choose to block or delete cookies, some parts of our
                        website may not function properly. Essential cookies are required for the site to work,
                        and blocking them may prevent you from accessing certain features.
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Third-Party Cookies */}
              <FadeIn delay={0.4}>
                <div className="mb-12">
                  <h2 className="text-3xl font-bold mb-6">Third-Party Cookies</h2>
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-muted-foreground mb-4">
                      In addition to our own cookies, we may also use various third-party cookies to report
                      usage statistics of the Service and deliver advertisements. These third parties include:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-6">
                      <li>
                        <strong>Google Analytics:</strong> We use Google Analytics to understand how users
                        interact with our website. Google Analytics uses cookies to collect information
                        anonymously and report website trends.
                      </li>
                      <li>
                        <strong>Advertising Networks:</strong> We may use advertising cookies to deliver
                        relevant ads and measure campaign performance.
                      </li>
                      <li>
                        <strong>Social Media Platforms:</strong> If you share content from our site on social
                        media, these platforms may set cookies on your device.
                      </li>
                    </ul>
                    <p className="text-muted-foreground">
                      These third-party services have their own privacy policies, and we encourage you to review
                      them to understand how they use cookies and collect information.
                    </p>
                  </div>
                </div>
              </FadeIn>

              {/* Updates to Policy */}
              <FadeIn delay={0.5}>
                <div className="mb-12">
                  <h2 className="text-3xl font-bold mb-6">Updates to This Cookie Policy</h2>
                  <div className="border rounded-xl p-8 bg-card">
                    <p className="text-muted-foreground mb-4">
                      We may update this Cookie Policy from time to time to reflect changes in our practices or
                      for other operational, legal, or regulatory reasons. When we make changes, we will update
                      the "Last updated" date at the top of this policy.
                    </p>
                    <p className="text-muted-foreground">
                      We encourage you to review this Cookie Policy periodically to stay informed about how we
                      use cookies and how you can manage them. Your continued use of our website after any
                      changes indicates your acceptance of the updated policy.
                    </p>
                  </div>
                </div>
              </FadeIn>

              {/* Contact Section */}
              <FadeIn delay={0.6}>
                <div className="border rounded-xl p-8 bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-3">Questions About Cookies?</h2>
                      <p className="text-muted-foreground mb-4">
                        If you have any questions about our use of cookies or this Cookie Policy, please don't
                        hesitate to contact us. We're here to help and ensure you have a transparent
                        understanding of how we use cookies.
                      </p>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Email:</strong>{' '}
                          <a
                            href="mailto:privacy@listforge.io"
                            className="text-primary hover:underline"
                          >
                            privacy@listforge.io
                          </a>
                        </p>
                        <p>
                          <strong>Address:</strong> ListForge, Inc., 123 Commerce Street, San Francisco, CA
                          94105
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Back to Home */}
              <FadeIn delay={0.7}>
                <div className="mt-12 text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    ← Back to Home
                  </Link>
                </div>
              </FadeIn>
            </StaggerContainer>
          </div>
        </div>
      </section>
    </div>
  )
}
