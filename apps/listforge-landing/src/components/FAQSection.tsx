'use client'

import { useState } from 'react'
import { faqs } from '@/data/faqs'
import { FadeIn } from './animations/FadeIn'
import { StaggerContainer, StaggerItem } from './animations/StaggerContainer'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative py-24 bg-muted/30">
      <div className="container max-w-3xl">
        <FadeIn direction="up" className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl icon-gradient mb-4">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Got questions? We've got answers. Can't find what you're looking for?{' '}
            <a href="mailto:support@listforge.io" className="text-primary hover:underline">
              Contact our support team
            </a>
            .
          </p>
        </FadeIn>

        <StaggerContainer className="space-y-3">
          {faqs.map((faq, index) => (
            <StaggerItem key={index}>
              <div
                className={cn(
                  'rounded-xl border transition-all duration-200',
                  openIndex === index
                    ? 'bg-card border-primary/30 shadow-sm'
                    : 'bg-card/50 border-border/50 hover:border-border'
                )}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex items-center justify-between w-full p-5 text-left"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className={cn(
                      'h-5 w-5 transition-colors',
                      openIndex === index ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0 text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
