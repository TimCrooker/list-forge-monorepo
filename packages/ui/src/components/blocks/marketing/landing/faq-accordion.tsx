import * as React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQAccordionProps {
  title?: string
  description?: string
  items: FAQItem[]
  defaultOpenIndex?: number
}

export const FAQAccordion = ({
  title,
  description,
  items,
  defaultOpenIndex,
}: FAQAccordionProps) => {
  const defaultValue = defaultOpenIndex !== undefined ? `item-${defaultOpenIndex}` : undefined

  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          {(title || description) && (
            <div className="text-center mb-16">
              {title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>}
              {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
            </div>
          )}

          {/* FAQ Accordion */}
          <Accordion collapsible className="w-full" defaultValue={defaultValue} type="single">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
