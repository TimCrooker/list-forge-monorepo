'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { FadeIn } from '@/components/animations/FadeIn'
import { ChevronRight, FileText } from 'lucide-react'

interface Section {
  id: string
  title: string
  subsections?: { id: string; title: string }[]
}

const sections: Section[] = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description', title: '2. Description of Service' },
  { id: 'accounts', title: '3. User Accounts' },
  { id: 'billing', title: '4. Subscription and Billing' },
  { id: 'content', title: '5. User Content and Data' },
  { id: 'acceptable-use', title: '6. Acceptable Use Policy' },
  { id: 'intellectual-property', title: '7. Intellectual Property' },
  { id: 'third-party', title: '8. Third-Party Integrations' },
  { id: 'limitation', title: '9. Limitation of Liability' },
  { id: 'indemnification', title: '10. Indemnification' },
  { id: 'termination', title: '11. Termination' },
  { id: 'governing-law', title: '12. Governing Law' },
  { id: 'changes', title: '13. Changes to Terms' },
  { id: 'contact', title: '14. Contact Information' },
]

export function TermsOfService() {
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -80% 0px' }
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 border-b overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

        <div className="container mx-auto px-4 md:px-6 relative">
          <FadeIn direction="up">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Last updated: December 10, 2025
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Table of Contents Sidebar */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-24">
              <FadeIn direction="right">
                <div className="rounded-xl border bg-card p-6">
                  <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                    Table of Contents
                  </h2>
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-all flex items-center gap-2 group ${
                          activeSection === section.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <ChevronRight
                          className={`h-3 w-3 transition-transform ${
                            activeSection === section.id
                              ? 'translate-x-0'
                              : 'translate-x-0 group-hover:translate-x-1'
                          }`}
                        />
                        <span className="flex-1 truncate">{section.title}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </FadeIn>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-9 order-1 lg:order-2">
            <FadeIn direction="up" delay={0.1}>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="rounded-xl border bg-card p-8 space-y-12">
                  {/* Introduction */}
                  <section>
                    <p className="lead text-lg text-muted-foreground">
                      Welcome to ListForge. These Terms of Service ("Terms") govern your access to and
                      use of ListForge's AI-powered listing platform and related services. By accessing
                      or using ListForge, you agree to be bound by these Terms.
                    </p>
                  </section>

                  {/* 1. Acceptance of Terms */}
                  <section id="acceptance">
                    <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        By creating an account, accessing our platform, or using any of our services, you
                        acknowledge that you have read, understood, and agree to be bound by these Terms
                        and our Privacy Policy. If you do not agree to these Terms, you may not access or
                        use ListForge.
                      </p>
                      <p>
                        You represent that you are at least 18 years of age and have the legal capacity
                        to enter into this agreement. If you are using ListForge on behalf of an
                        organization, you represent that you have the authority to bind that organization
                        to these Terms.
                      </p>
                    </div>
                  </section>

                  {/* 2. Description of Service */}
                  <section id="description">
                    <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        ListForge is a Software-as-a-Service (SaaS) platform that provides AI-powered
                        tools for product research, pricing analysis, and marketplace listing creation.
                        Our services include:
                      </p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>AI-driven product identification and research</li>
                        <li>Automated pricing recommendations based on market data</li>
                        <li>Multi-marketplace listing generation and management</li>
                        <li>Integration with third-party marketplaces (eBay, Amazon, etc.)</li>
                        <li>Mobile applications for item capture and management</li>
                        <li>Analytics and performance tracking</li>
                      </ul>
                      <p>
                        We reserve the right to modify, suspend, or discontinue any part of the Service
                        at any time with reasonable notice to users. We are not liable for any
                        modification, suspension, or discontinuation of the Service.
                      </p>
                    </div>
                  </section>

                  {/* 3. User Accounts */}
                  <section id="accounts">
                    <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Account Creation:</strong> To use ListForge,
                        you must create an account by providing accurate, current, and complete
                        information. You are responsible for maintaining the confidentiality of your
                        account credentials and for all activities that occur under your account.
                      </p>
                      <p>
                        <strong className="text-foreground">Account Security:</strong> You must
                        immediately notify us of any unauthorized use of your account or any other
                        security breach. ListForge will not be liable for any loss or damage arising from
                        your failure to protect your account credentials.
                      </p>
                      <p>
                        <strong className="text-foreground">Account Accuracy:</strong> You agree to
                        provide accurate information and to update your account information promptly if it
                        changes. Providing false or misleading information may result in account
                        termination.
                      </p>
                      <p>
                        <strong className="text-foreground">One Account Per User:</strong> You may only
                        create one account unless you have our express written permission to create
                        additional accounts.
                      </p>
                    </div>
                  </section>

                  {/* 4. Subscription and Billing */}
                  <section id="billing">
                    <h2 className="text-2xl font-bold mb-4">4. Subscription and Billing</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Subscription Plans:</strong> ListForge offers
                        various subscription tiers with different features and usage limits. Current
                        pricing and plan details are available on our pricing page.
                      </p>
                      <p>
                        <strong className="text-foreground">Billing Cycle:</strong> Subscriptions are
                        billed on a recurring basis (monthly or annually) depending on the plan you
                        select. You authorize us to charge your payment method at the beginning of each
                        billing cycle.
                      </p>
                      <p>
                        <strong className="text-foreground">Price Changes:</strong> We reserve the right
                        to modify our pricing with at least 30 days' notice. Price changes will apply to
                        subsequent billing cycles. Continuing to use the Service after a price change
                        constitutes acceptance of the new pricing.
                      </p>
                      <p>
                        <strong className="text-foreground">Refunds:</strong> Subscription fees are
                        generally non-refundable. However, we may provide refunds at our sole discretion
                        for exceptional circumstances. Free trial periods, if offered, may be canceled at
                        any time without charge.
                      </p>
                      <p>
                        <strong className="text-foreground">Late Payment:</strong> If payment fails, we
                        may suspend or terminate your access to the Service. You remain responsible for
                        all outstanding fees.
                      </p>
                      <p>
                        <strong className="text-foreground">Cancellation:</strong> You may cancel your
                        subscription at any time through your account settings. Cancellation will be
                        effective at the end of your current billing period. You will retain access to
                        paid features until the end of the billing period.
                      </p>
                    </div>
                  </section>

                  {/* 5. User Content and Data */}
                  <section id="content">
                    <h2 className="text-2xl font-bold mb-4">5. User Content and Data</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Your Data:</strong> You retain all ownership
                        rights to the content, images, product data, and other materials you upload or
                        create using ListForge ("User Content"). By using our Service, you grant ListForge
                        a worldwide, non-exclusive, royalty-free license to use, store, process, and
                        display your User Content solely for the purpose of providing and improving the
                        Service.
                      </p>
                      <p>
                        <strong className="text-foreground">Data Responsibility:</strong> You are solely
                        responsible for the accuracy, legality, and appropriateness of your User Content.
                        You represent and warrant that you have all necessary rights to the User Content
                        you provide and that it does not violate any third-party rights or applicable laws.
                      </p>
                      <p>
                        <strong className="text-foreground">Data Backup:</strong> While we implement
                        industry-standard backup procedures, you are responsible for maintaining your own
                        backups of critical data. We are not liable for any loss or corruption of User
                        Content.
                      </p>
                      <p>
                        <strong className="text-foreground">Data Portability:</strong> You may export
                        your data at any time using our export tools. Upon account termination, we will
                        retain your data for a reasonable period to allow for data retrieval, after which
                        it may be permanently deleted.
                      </p>
                      <p>
                        <strong className="text-foreground">AI Training:</strong> We do not use your
                        User Content to train third-party AI models. However, we may use aggregated,
                        anonymized data to improve our own services and AI capabilities.
                      </p>
                    </div>
                  </section>

                  {/* 6. Acceptable Use Policy */}
                  <section id="acceptable-use">
                    <h2 className="text-2xl font-bold mb-4">6. Acceptable Use Policy</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        You agree not to use ListForge for any unlawful purpose or in any way that could
                        damage, disable, or impair the Service. Prohibited activities include, but are not
                        limited to:
                      </p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>
                          Violating any applicable laws, regulations, or third-party rights (including
                          intellectual property rights)
                        </li>
                        <li>
                          Listing prohibited, illegal, counterfeit, or stolen items on marketplaces
                        </li>
                        <li>
                          Using the Service to engage in fraudulent activities or price manipulation
                        </li>
                        <li>
                          Attempting to gain unauthorized access to our systems or other users' accounts
                        </li>
                        <li>
                          Interfering with or disrupting the Service or servers connected to the Service
                        </li>
                        <li>
                          Using automated means (bots, scrapers) to access the Service without permission
                        </li>
                        <li>Reverse engineering, decompiling, or attempting to extract source code</li>
                        <li>
                          Removing, obscuring, or altering any proprietary notices on the Service
                        </li>
                        <li>Using the Service to send spam or unsolicited communications</li>
                        <li>
                          Uploading malicious code, viruses, or any harmful content
                        </li>
                      </ul>
                      <p>
                        Violation of this Acceptable Use Policy may result in immediate account suspension
                        or termination without refund.
                      </p>
                    </div>
                  </section>

                  {/* 7. Intellectual Property */}
                  <section id="intellectual-property">
                    <h2 className="text-2xl font-bold mb-4">7. Intellectual Property</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">ListForge Ownership:</strong> All rights,
                        title, and interest in the ListForge platform, including all software, algorithms,
                        design, trademarks, logos, and documentation, are owned by ListForge or our
                        licensors. These Terms do not grant you any ownership rights to the Service.
                      </p>
                      <p>
                        <strong className="text-foreground">Limited License:</strong> Subject to your
                        compliance with these Terms, we grant you a limited, non-exclusive,
                        non-transferable, revocable license to access and use the Service for your
                        internal business purposes.
                      </p>
                      <p>
                        <strong className="text-foreground">Feedback:</strong> If you provide feedback,
                        suggestions, or ideas about ListForge, we may use them without any obligation or
                        compensation to you. You hereby assign all rights in such feedback to ListForge.
                      </p>
                      <p>
                        <strong className="text-foreground">Trademark Use:</strong> You may not use
                        ListForge's trademarks, logos, or branding without our prior written consent.
                      </p>
                    </div>
                  </section>

                  {/* 8. Third-Party Integrations */}
                  <section id="third-party">
                    <h2 className="text-2xl font-bold mb-4">8. Third-Party Integrations</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Marketplace Connections:</strong> ListForge
                        integrates with third-party marketplaces such as eBay, Amazon, and others. Your
                        use of these integrations is subject to the respective marketplace's terms of
                        service, policies, and guidelines.
                      </p>
                      <p>
                        <strong className="text-foreground">No Affiliation:</strong> ListForge is an
                        independent service and is not affiliated with, endorsed by, or sponsored by eBay,
                        Amazon, or any other integrated marketplace. eBay® and the eBay logo are
                        registered trademarks of eBay Inc. Amazon® and the Amazon logo are registered
                        trademarks of Amazon.com, Inc.
                      </p>
                      <p>
                        <strong className="text-foreground">Third-Party Compliance:</strong> You are
                        solely responsible for ensuring your listings and activities comply with each
                        marketplace's policies, including but not limited to listing policies, prohibited
                        items, and seller standards. ListForge is not responsible for marketplace policy
                        violations or account suspensions.
                      </p>
                      <p>
                        <strong className="text-foreground">API Access:</strong> Our integrations rely on
                        third-party APIs which may change, be restricted, or become unavailable. We are
                        not liable for any disruption to integrations caused by third-party changes.
                      </p>
                      <p>
                        <strong className="text-foreground">Authorization:</strong> You authorize
                        ListForge to access your marketplace accounts on your behalf using secure
                        authentication methods (OAuth). You may revoke this access at any time through
                        your account settings.
                      </p>
                      <p>
                        <strong className="text-foreground">Third-Party Links:</strong> The Service may
                        contain links to third-party websites. We are not responsible for the content,
                        policies, or practices of third-party sites.
                      </p>
                    </div>
                  </section>

                  {/* 9. Limitation of Liability */}
                  <section id="limitation">
                    <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Service Provided "As Is":</strong> THE
                        SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                        EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
                        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                      </p>
                      <p>
                        <strong className="text-foreground">No Guarantee of Results:</strong> While we
                        strive to provide accurate AI-powered research and pricing recommendations, we do
                        not guarantee the accuracy, completeness, or profitability of any information,
                        pricing analysis, or market research provided by the Service. You are solely
                        responsible for your business decisions.
                      </p>
                      <p>
                        <strong className="text-foreground">Limitation on Damages:</strong> TO THE
                        MAXIMUM EXTENT PERMITTED BY LAW, LISTFORGE SHALL NOT BE LIABLE FOR ANY INDIRECT,
                        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED
                        TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED TO
                        YOUR USE OF THE SERVICE.
                      </p>
                      <p>
                        <strong className="text-foreground">Cap on Liability:</strong> IN NO EVENT SHALL
                        LISTFORGE'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE AMOUNT YOU PAID TO
                        LISTFORGE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                      </p>
                      <p>
                        <strong className="text-foreground">Jurisdictional Limitations:</strong> Some
                        jurisdictions do not allow the exclusion or limitation of certain warranties or
                        damages. In such jurisdictions, our liability will be limited to the maximum
                        extent permitted by law.
                      </p>
                    </div>
                  </section>

                  {/* 10. Indemnification */}
                  <section id="indemnification">
                    <h2 className="text-2xl font-bold mb-4">10. Indemnification</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        You agree to indemnify, defend, and hold harmless ListForge, its affiliates,
                        officers, directors, employees, agents, and licensors from and against any claims,
                        liabilities, damages, losses, costs, expenses, or fees (including reasonable
                        attorneys' fees) arising from:
                      </p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Your use or misuse of the Service</li>
                        <li>Your violation of these Terms or any applicable law</li>
                        <li>
                          Your violation of any third-party rights, including intellectual property,
                          privacy, or publicity rights
                        </li>
                        <li>Your User Content or business activities</li>
                        <li>
                          Your marketplace activities, including listings, transactions, and policy
                          violations
                        </li>
                      </ul>
                      <p>
                        We reserve the right to assume the exclusive defense and control of any matter
                        subject to indemnification by you, and you agree to cooperate with our defense.
                      </p>
                    </div>
                  </section>

                  {/* 11. Termination */}
                  <section id="termination">
                    <h2 className="text-2xl font-bold mb-4">11. Termination</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Termination by You:</strong> You may
                        terminate your account at any time by canceling your subscription through your
                        account settings or by contacting our support team. Termination will be effective
                        at the end of your current billing period.
                      </p>
                      <p>
                        <strong className="text-foreground">Termination by Us:</strong> We reserve the
                        right to suspend or terminate your account immediately, without notice, if we
                        reasonably believe you have violated these Terms, engaged in fraudulent activity,
                        or if required by law.
                      </p>
                      <p>
                        <strong className="text-foreground">Effect of Termination:</strong> Upon
                        termination, your right to access and use the Service will immediately cease. We
                        may delete your User Content after a reasonable grace period, though some data may
                        be retained for legal or operational purposes.
                      </p>
                      <p>
                        <strong className="text-foreground">Survival:</strong> Provisions of these Terms
                        that by their nature should survive termination will survive, including ownership
                        provisions, warranty disclaimers, indemnification, and limitations of liability.
                      </p>
                    </div>
                  </section>

                  {/* 12. Governing Law */}
                  <section id="governing-law">
                    <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        These Terms shall be governed by and construed in accordance with the laws of the
                        State of Delaware, United States, without regard to its conflict of law
                        provisions.
                      </p>
                      <p>
                        <strong className="text-foreground">Dispute Resolution:</strong> Any dispute
                        arising out of or relating to these Terms or the Service shall be resolved through
                        binding arbitration in accordance with the American Arbitration Association's
                        Commercial Arbitration Rules. The arbitration shall take place in Delaware, and
                        judgment on the award may be entered in any court having jurisdiction.
                      </p>
                      <p>
                        <strong className="text-foreground">Class Action Waiver:</strong> You agree that
                        any arbitration or proceeding shall be conducted on an individual basis and not as
                        a class action, consolidated action, or representative action.
                      </p>
                      <p>
                        <strong className="text-foreground">Exceptions:</strong> Notwithstanding the
                        above, either party may seek injunctive or equitable relief in any court of
                        competent jurisdiction to prevent actual or threatened infringement of
                        intellectual property rights.
                      </p>
                    </div>
                  </section>

                  {/* 13. Changes to Terms */}
                  <section id="changes">
                    <h2 className="text-2xl font-bold mb-4">13. Changes to Terms</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        We reserve the right to modify these Terms at any time. When we make material
                        changes, we will provide notice through the Service, via email, or by posting the
                        updated Terms with a new "Last Updated" date.
                      </p>
                      <p>
                        Your continued use of the Service after the effective date of the updated Terms
                        constitutes acceptance of those changes. If you do not agree to the modified
                        Terms, you must stop using the Service and may cancel your account.
                      </p>
                      <p>
                        We encourage you to review these Terms periodically to stay informed of any
                        updates.
                      </p>
                    </div>
                  </section>

                  {/* 14. Contact Information */}
                  <section id="contact">
                    <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        If you have any questions, concerns, or complaints about these Terms or the
                        Service, please contact us:
                      </p>
                      <div className="bg-muted/50 rounded-lg p-6 space-y-2">
                        <p className="font-medium text-foreground">ListForge Support</p>
                        <p>Email: legal@listforge.io</p>
                        <p>Support: support@listforge.io</p>
                        <p>
                          Address: ListForge, Inc.
                          <br />
                          123 Commerce Street, Suite 500
                          <br />
                          Wilmington, DE 19801
                          <br />
                          United States
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Acknowledgment */}
                  <section className="border-t pt-8">
                    <p className="text-sm text-muted-foreground italic">
                      BY USING LISTFORGE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE,
                      UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS,
                      DO NOT ACCESS OR USE THE SERVICE.
                    </p>
                  </section>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* Back to Home Link */}
      <div className="container mx-auto px-4 md:px-6 pb-12">
        <FadeIn direction="up">
          <div className="text-center">
            <motion.a
              href="/"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Home
            </motion.a>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
