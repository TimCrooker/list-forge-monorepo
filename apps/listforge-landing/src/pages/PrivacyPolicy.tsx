'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FadeIn } from '@/components/animations/FadeIn'
import { Shield, ChevronRight, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'information-collection', title: '1. Information We Collect' },
  { id: 'information-use', title: '2. How We Use Your Information' },
  { id: 'information-sharing', title: '3. Information Sharing and Disclosure' },
  { id: 'data-security', title: '4. Data Security' },
  { id: 'your-rights', title: '5. Your Rights and Choices' },
  { id: 'cookies', title: '6. Cookies and Tracking Technologies' },
  { id: 'third-party', title: '7. Third-Party Services' },
  { id: 'children', title: '8. Children\'s Privacy' },
  { id: 'international', title: '9. International Data Transfers' },
  { id: 'changes', title: '10. Changes to This Policy' },
  { id: 'contact', title: '11. Contact Us' },
]

export function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id)
      }))

      const scrollPosition = window.scrollY + 150

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i]
        if (section.element && section.element.offsetTop <= scrollPosition) {
          setActiveSection(section.id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.offsetTop - offset
      window.scrollTo({ top: elementPosition, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="absolute inset-0 grid-pattern opacity-50" />

        <div className="container relative mx-auto px-4 md:px-6 py-16 md:py-24">
          <FadeIn direction="up">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl">
              Your privacy is important to us. This Privacy Policy explains how ListForge collects, uses,
              discloses, and safeguards your information when you use our platform.
            </p>

            <p className="text-sm text-muted-foreground mt-6">
              <strong>Last Updated:</strong> December 10, 2025
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Table of Contents - Sidebar */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <FadeIn direction="right" delay={0.2}>
                <div className="rounded-xl border bg-card p-6">
                  <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                    Table of Contents
                  </h2>
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          "flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                          activeSection === section.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
                          activeSection === section.id && "translate-x-1"
                        )} />
                        <span className="flex-1">{section.title}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </FadeIn>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <FadeIn direction="up" delay={0.1}>
              <div className="prose prose-slate dark:prose-invert max-w-none">

                {/* Introduction */}
                <div className="mb-12 p-6 rounded-xl border bg-card">
                  <p className="text-base leading-relaxed m-0">
                    ListForge ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                    describes how we collect, use, share, and protect information about you when you use our
                    SaaS platform, including our web application, mobile application, and related services
                    (collectively, the "Service").
                  </p>
                </div>

                {/* Section 1: Information Collection */}
                <section id="information-collection" className="mb-12 scroll-mt-24">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                  </div>

                  <h3 className="text-xl font-semibold mb-3 mt-6">1.1 Information You Provide</h3>
                  <p className="mb-4">
                    We collect information you provide directly to us, including:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li><strong>Account Information:</strong> Name, email address, password, company name, and phone number when you create an account</li>
                    <li><strong>Profile Information:</strong> Profile photo, bio, and preferences</li>
                    <li><strong>Payment Information:</strong> Billing address and payment method details (processed securely through our payment processor)</li>
                    <li><strong>Product Data:</strong> Information about products you list, including titles, descriptions, photos, pricing, and inventory details</li>
                    <li><strong>Communications:</strong> Information you provide when contacting support, participating in surveys, or communicating with us</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-6">1.2 Automatically Collected Information</h3>
                  <p className="mb-4">
                    When you use our Service, we automatically collect:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers, and mobile network information</li>
                    <li><strong>Usage Information:</strong> Pages viewed, features used, time spent on pages, search queries, and interaction data</li>
                    <li><strong>Location Information:</strong> Approximate location based on IP address</li>
                    <li><strong>Cookies and Tracking:</strong> Data collected through cookies, web beacons, and similar technologies</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-6">1.3 Information from Third Parties</h3>
                  <p className="mb-4">
                    We may receive information from third-party services, including:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li><strong>Marketplace Integrations:</strong> When you connect eBay, Amazon, or other marketplace accounts, we receive information necessary to sync listings, orders, and inventory</li>
                    <li><strong>Authentication Services:</strong> If you sign in using Google, Facebook, or other OAuth providers</li>
                    <li><strong>Data Enrichment Services:</strong> Product information from UPC databases, pricing APIs, and market research tools</li>
                  </ul>
                </section>

                {/* Section 2: Information Use */}
                <section id="information-use" className="mb-12 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                  <p className="mb-4">
                    We use the collected information for the following purposes:
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Service Delivery</h3>
                  <ul className="space-y-2 mb-6">
                    <li>Provide, maintain, and improve our Service</li>
                    <li>Process your listings and publish to connected marketplaces</li>
                    <li>Perform AI-powered research, pricing analysis, and product optimization</li>
                    <li>Manage your account and provide customer support</li>
                    <li>Process payments and fulfill transactions</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Personalization and Analytics</h3>
                  <ul className="space-y-2 mb-6">
                    <li>Personalize your experience and provide tailored recommendations</li>
                    <li>Analyze usage patterns to improve our features and user interface</li>
                    <li>Generate aggregated, anonymized analytics and insights</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Communications</h3>
                  <ul className="space-y-2 mb-6">
                    <li>Send transactional emails (account confirmations, password resets, receipts)</li>
                    <li>Send service updates, feature announcements, and technical notices</li>
                    <li>Send marketing communications (with your consent, where required)</li>
                    <li>Respond to your inquiries and support requests</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-6">2.4 Security and Compliance</h3>
                  <ul className="space-y-2 mb-6">
                    <li>Detect and prevent fraud, abuse, and security incidents</li>
                    <li>Enforce our Terms of Service and other policies</li>
                    <li>Comply with legal obligations and regulatory requirements</li>
                    <li>Protect the rights, property, and safety of ListForge, our users, and the public</li>
                  </ul>
                </section>

                {/* Section 3: Information Sharing */}
                <section id="information-sharing" className="mb-12 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4">3. Information Sharing and Disclosure</h2>
                  <p className="mb-4">
                    We may share your information in the following circumstances:
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Service Providers</h3>
                  <p className="mb-4">
                    We share information with third-party service providers who perform services on our behalf:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li>Cloud hosting and infrastructure providers (AWS, Google Cloud)</li>
                    <li>Payment processors (Stripe)</li>
                    <li>Email service providers (SendGrid, Amazon SES)</li>
                    <li>Analytics providers (Google Analytics, Mixpanel)</li>
                    <li>AI and machine learning services (OpenAI)</li>
                    <li>Customer support tools (Intercom, Zendesk)</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Marketplace Partners</h3>
                  <p className="mb-4">
                    When you connect your eBay, Amazon, or other marketplace accounts, we share product listings
                    and related information with those platforms according to their respective terms and policies.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Business Transfers</h3>
                  <p className="mb-4">
                    If we are involved in a merger, acquisition, financing, reorganization, bankruptcy, or sale
                    of assets, your information may be transferred as part of that transaction.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">3.4 Legal Requirements</h3>
                  <p className="mb-4">
                    We may disclose information if required to do so by law or in response to:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li>Valid legal processes (subpoenas, court orders, search warrants)</li>
                    <li>Government or regulatory investigations</li>
                    <li>Requests to protect our rights, property, or safety</li>
                    <li>Emergency situations involving potential harm to persons</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-6">3.5 Aggregated Data</h3>
                  <p className="mb-4">
                    We may share aggregated, de-identified information that cannot reasonably be used to
                    identify you for research, analytics, or marketing purposes.
                  </p>
                </section>

                {/* Section 4: Data Security */}
                <section id="data-security" className="mb-12 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
                  <p className="mb-4">
                    We implement industry-standard security measures to protect your information:
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Technical Safeguards</h3>
                  <ul className="space-y-2 mb-6">
                    <li>Encryption in transit (TLS/SSL) and at rest (AES-256)</li>
                    <li>Secure authentication with bcrypt password hashing</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Automated vulnerability scanning and patching</li>
                    <li>Multi-factor authentication (MFA) options</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Organizational Safeguards</h3>
                  <ul className="space-y-2 mb-6">
                    <li>Role-based access controls limiting employee access to data</li>
                    <li>Security awareness training for all staff</li>
                    <li>Incident response and data breach notification procedures</li>
                    <li>Regular backups and disaster recovery planning</li>
                  </ul>

                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 mt-6">
                    <p className="text-sm m-0">
                      <strong>Note:</strong> While we implement robust security measures, no system is completely
                      secure. You are responsible for maintaining the confidentiality of your account credentials.
                    </p>
                  </div>
                </section>

                {/* Section 5: Your Rights */}
                <section id="your-rights" className="mb-12 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4">5. Your Rights and Choices</h2>

                  <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Access and Correction</h3>
                  <p className="mb-4">
                    You may access and update your account information at any time through your account settings.
                    You can also request a copy of your personal data by contacting us.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Data Deletion</h3>
                  <p className="mb-4">
                    You may request deletion of your account and associated data by contacting support. We will
                    delete your information within 30 days, except where we must retain it for legal or
                    regulatory purposes.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Marketing Opt-Out</h3>
                  <p className="mb-4">
                    You can unsubscribe from marketing emails by clicking the "unsubscribe" link in any
                    marketing email or by updating your communication preferences in your account settings.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">5.4 GDPR Rights (European Users)</h3>
                  <p className="mb-4">
                    If you are located in the European Economic Area, you have additional rights under GDPR:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li><strong>Right to Access:</strong> Request confirmation of whether we process your data and obtain a copy</li>
                    <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                    <li><strong>Right to Erasure:</strong> Request deletion of your data in certain circumstances</li>
                    <li><strong>Right to Restriction:</strong> Request limitation of processing in certain circumstances</li>
                    <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                    <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                    <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for processing based on consent</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-6">5.5 CCPA Rights (California Users)</h3>
                  <p className="mb-4">
                    If you are a California resident, you have rights under the California Consumer Privacy Act:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li><strong>Right to Know:</strong> Request disclosure of personal information collected about you</li>
                    <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                    <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (we do not sell personal information)</li>
                    <li><strong>Right to Non-Discrimination:</strong> Not be discriminated against for exercising your rights</li>
                  </ul>

                  <p className="text-sm text-muted-foreground mt-6">
                    To exercise any of these rights, please contact us at <a href="mailto:privacy@listforge.io" className="text-primary hover:underline">privacy@listforge.io</a>.
                    We will respond to your request within 30 days.
                  </p>
                </section>

                {/* Section 6: Cookies */}
                <section id="cookies" className="mb-12 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4">6. Cookies and Tracking Technologies</h2>
                  <p className="mb-4">
                    We use cookies and similar tracking technologies to collect information and improve our Service:
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">6.1 Types of Cookies</h3>
                  <ul className="space-y-2 mb-6">
                    <li><strong>Essential Cookies:</strong> Required for the Service to function (authentication, security)</li>
                    <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service</li>
                    <li><strong>Marketing Cookies:</strong> Track effectiveness of marketing campaigns (with consent)</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-6">6.2 Managing Cookies</h3>
                  <p className="mb-4">
                    Most browsers allow you to control cookies through their settings. You can block or delete cookies,
                    but this may limit functionality. You can also opt-out of analytics tracking through your account
                    settings or browser extensions like Google Analytics Opt-out.
                  </p>
                </section>

                {/* Section 7: Third-Party Services */}
                <section id="third-party" className="mb-12 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4">7. Third-Party Services</h2>
                  <p className="mb-4">
                    Our Service integrates with third-party platforms and services:
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">7.1 Marketplace Integrations</h3>
                  <p className="mb-4">
                    When you connect eBay, Amazon, or other marketplace accounts, those platforms' privacy
                    policies govern their collection and use of your information. We are not responsible for
                    their privacy practices.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">7.2 AI Services</h3>
                  <p className="mb-4">
                    We use OpenAI and other AI services to power research, pricing, and listing optimization.
                    Product data you submit may be processed by these services in accordance with their privacy policies.
                    We do not use your data to train third-party AI models.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">7.3 Links to Other Websites</h3>
                  <p className="mb-4">
                    Our Service may contain links to third-party websites. We are not responsible for the
                    privacy practices of these websites. We encourage you to review their privacy policies.
                  </p>
                </section>

                {/* Section 8: Children's Privacy */}
                <section id="children" className="mb-12 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
                  <p className="mb-4">
                    Our Service is not intended for children under 13 years of age (or 16 in the European
                    Economic Area). We do not knowingly collect personal information from children. If we
                    become aware that we have collected information from a child without parental consent,
                    we will take steps to delete that information.
                  </p>
                  <p className="mb-4">
                    If you believe we have collected information from a child, please contact us immediately
                    at <a href="mailto:privacy@listforge.io" className="text-primary hover:underline">privacy@listforge.io</a>.
                  </p>
                </section>

                {/* Section 9: International Transfers */}
                <section id="international" className="mb-12 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
                  <p className="mb-4">
                    Your information may be transferred to and processed in countries other than your country
                    of residence, including the United States. These countries may have data protection laws
                    that differ from your country.
                  </p>
                  <p className="mb-4">
                    When we transfer personal data from the European Economic Area to other countries, we use:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li>Standard Contractual Clauses approved by the European Commission</li>
                    <li>Privacy Shield certification (where applicable)</li>
                    <li>Other legally recognized transfer mechanisms</li>
                  </ul>
                  <p className="mb-4">
                    We take appropriate safeguards to ensure your information receives adequate protection
                    wherever it is processed.
                  </p>
                </section>

                {/* Section 10: Changes to Policy */}
                <section id="changes" className="mb-12 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4">10. Changes to This Policy</h2>
                  <p className="mb-4">
                    We may update this Privacy Policy from time to time. When we make material changes, we will:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li>Update the "Last Updated" date at the top of this policy</li>
                    <li>Notify you via email or through a prominent notice in the Service</li>
                    <li>Give you the opportunity to review the changes before they take effect</li>
                  </ul>
                  <p className="mb-4">
                    Your continued use of the Service after changes become effective constitutes acceptance
                    of the updated Privacy Policy.
                  </p>
                </section>

                {/* Section 11: Contact */}
                <section id="contact" className="mb-12 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
                  <p className="mb-4">
                    If you have questions, concerns, or requests regarding this Privacy Policy or our data practices,
                    please contact us:
                  </p>

                  <div className="p-6 rounded-xl border bg-card mt-6">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold mb-1">Email</p>
                        <a href="mailto:privacy@listforge.io" className="text-primary hover:underline">
                          privacy@listforge.io
                        </a>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Data Protection Officer</p>
                        <a href="mailto:dpo@listforge.io" className="text-primary hover:underline">
                          dpo@listforge.io
                        </a>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Mailing Address</p>
                        <address className="not-italic text-muted-foreground">
                          ListForge, Inc.<br />
                          Attn: Privacy Team<br />
                          123 Commerce Street, Suite 400<br />
                          San Francisco, CA 94102<br />
                          United States
                        </address>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mt-6">
                    <p className="text-sm m-0">
                      <strong>EU Representative:</strong> For users in the European Economic Area, our EU
                      representative can be contacted at <a href="mailto:eu-privacy@listforge.io" className="text-primary hover:underline">eu-privacy@listforge.io</a>.
                    </p>
                  </div>
                </section>

                {/* Footer Note */}
                <div className="mt-12 p-6 rounded-xl border bg-muted/50">
                  <p className="text-sm text-muted-foreground m-0">
                    This Privacy Policy is effective as of December 10, 2025. We encourage you to review this
                    policy periodically to stay informed about how we protect your information. Thank you for
                    trusting ListForge with your data.
                  </p>
                </div>

              </div>
            </FadeIn>
          </main>
        </div>
      </div>

      {/* Back to Top Button */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-8 right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all glow-primary-hover"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ArrowLeft className="h-5 w-5 rotate-90" />
      </motion.button>
    </div>
  )
}
