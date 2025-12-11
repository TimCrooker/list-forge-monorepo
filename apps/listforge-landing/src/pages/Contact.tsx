'use client'

import { useState } from 'react'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { GridPattern } from '@/components/decorative/GridPattern'
import { HeroBackground } from '@/components/decorative/HeroBackground'
import { Mail, MessageSquare, Send, MapPin, Linkedin, Twitter, Github, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_SECTIONS } from '@/lib/constants'
import { useNavigate } from 'react-router-dom'

export function Contact() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: 'general',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create mailto link with form data
      const emailTo = formData.subject === 'sales' ? 'sales@listforge.io' : 'support@listforge.io'
      const subject = `Contact Form: ${formData.subject.charAt(0).toUpperCase() + formData.subject.slice(1).replace('_', ' ')}`
      const body = `Name: ${formData.name}\nEmail: ${formData.email}\n${formData.company ? `Company: ${formData.company}\n` : ''}${formData.phone ? `Phone: ${formData.phone}\n` : ''}\n\nMessage:\n${formData.message}`

      // Open default email client
      window.location.href = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

      // Show success message
      setTimeout(() => {
        setIsSubmitting(false)
        setSubmitStatus('success')
        setFormData({ name: '', email: '', company: '', phone: '', subject: 'general', message: '' })

        // Reset status after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000)
      }, 500)
    } catch (error) {
      setIsSubmitting(false)
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus('idle'), 5000)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <HeroBackground />

        <div className="container relative">
          <FadeIn direction="up" className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-16 lg:py-24">
        <GridPattern variant="dots" className="opacity-20" />

        <div className="container relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Form - Takes up 2 columns */}
            <div className="lg:col-span-2">
              <FadeIn direction="left">
                <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold mb-6">Send us a message</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    {/* Company & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          placeholder="Your Company"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="sales">Sales & Pricing</option>
                        <option value="partnership">Partnership Opportunities</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                        placeholder="Tell us how we can help you..."
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all',
                        isSubmitting
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover'
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </button>

                    {/* Status Messages */}
                    {submitStatus === 'success' && (
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400">
                        Your email client has been opened with your message. Please send the email to complete your inquiry.
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                        Unable to open email client. Please contact us directly at support@listforge.io
                      </div>
                    )}
                  </form>
                </div>
              </FadeIn>
            </div>

            {/* Contact Info Sidebar */}
            <div className="lg:col-span-1">
              <StaggerContainer className="space-y-6">
                {/* Contact Methods */}
                <StaggerItem>
                  <FadeIn direction="right">
                    <div className="bg-card border rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">Contact Information</h3>

                      <div className="space-y-4">
                        <a
                          href="mailto:support@listforge.io"
                          className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Email</div>
                            <div className="text-sm font-medium">support@listforge.io</div>
                          </div>
                        </a>

                        <a
                          href="mailto:sales@listforge.io"
                          className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <MessageSquare className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Sales</div>
                            <div className="text-sm font-medium">sales@listforge.io</div>
                          </div>
                        </a>

                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Location</div>
                            <div className="text-sm font-medium">San Francisco, CA</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                </StaggerItem>

                {/* Social Links */}
                <StaggerItem>
                  <FadeIn direction="right" delay={0.1}>
                    <div className="bg-card border rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">Follow Us</h3>

                      <div className="flex gap-3">
                        <a
                          href="https://twitter.com/listforge"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 text-primary transition-colors"
                          aria-label="Twitter"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                        <a
                          href="https://linkedin.com/company/listforge"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 text-primary transition-colors"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                        <a
                          href="https://github.com/listforge"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 text-primary transition-colors"
                          aria-label="GitHub"
                        >
                          <Github className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </FadeIn>
                </StaggerItem>

                {/* FAQ Teaser */}
                <StaggerItem>
                  <FadeIn direction="right" delay={0.2}>
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold mb-2">Looking for quick answers?</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Check out our FAQ section for instant answers to common questions.
                      </p>
                      <button
                        onClick={() => {
                          navigate('/')
                          // Navigate to home and scroll to FAQ after navigation
                          setTimeout(() => {
                            const element = document.querySelector(NAV_SECTIONS.faq)
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }, 100)
                        }}
                        className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
                      >
                        Visit FAQ
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </FadeIn>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
