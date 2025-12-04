import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CTASimpleProps {
  title: string
  description?: string
  primaryCta?: {
    text: string
    href?: string
    onClick?: () => void
  }
  secondaryCta?: {
    text: string
    href?: string
    onClick?: () => void
  }
  variant?: 'default' | 'gradient' | 'subtle'
}

export const CTASimple = ({
  title,
  description,
  primaryCta,
  secondaryCta,
  variant = 'default',
}: CTASimpleProps) => {
  const variants = {
    default: 'bg-primary/5',
    gradient: 'bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20',
    subtle: 'bg-muted',
  }

  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl py-16 px-8 md:py-24 md:px-12',
            variants[variant],
          )}
        >
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>

            {description && (
              <p className="mt-6 text-lg leading-8 text-muted-foreground">{description}</p>
            )}

            {(primaryCta || secondaryCta) && (
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {primaryCta && (
                  <Button
                    asChild={primaryCta.href ? true : false}
                    size="lg"
                    onClick={primaryCta.onClick}
                  >
                    {primaryCta.href ? (
                      <a href={primaryCta.href}>
                        {primaryCta.text}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    ) : (
                      <>
                        {primaryCta.text}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
                {secondaryCta && (
                  <Button
                    asChild={secondaryCta.href ? true : false}
                    size="lg"
                    variant="outline"
                    onClick={secondaryCta.onClick}
                  >
                    {secondaryCta.href ? (
                      <a href={secondaryCta.href}>{secondaryCta.text}</a>
                    ) : (
                      secondaryCta.text
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Background decoration */}
          {variant === 'gradient' && (
            <>
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
