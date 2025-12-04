import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PricingFeature {
  text: string
  included: boolean
}

export interface PricingTier {
  name: string
  description: string
  price: {
    monthly?: number | string
    yearly?: number | string
    currency?: string
    custom?: string
  }
  features: PricingFeature[]
  cta: {
    text: string
    href?: string
    onClick?: () => void
  }
  highlighted?: boolean
  badge?: string
}

export interface PricingCardsProps {
  title?: string
  description?: string
  tiers: PricingTier[]
  billingPeriod?: 'monthly' | 'yearly'
  onBillingPeriodChange?: (period: 'monthly' | 'yearly') => void
}

export const PricingCards = ({
  title,
  description,
  tiers,
  billingPeriod = 'monthly',
  onBillingPeriodChange,
}: PricingCardsProps) => {
  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          {title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>}
          {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}

          {/* Billing Toggle */}
          {onBillingPeriodChange && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                className={cn(
                  'text-sm font-medium',
                  billingPeriod === 'monthly'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => onBillingPeriodChange('monthly')}
              >
                Monthly
              </button>
              <div className="relative h-6 w-11 rounded-full bg-muted">
                <div
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-all',
                    billingPeriod === 'monthly' ? 'left-0.5' : 'left-5',
                  )}
                />
              </div>
              <button
                className={cn(
                  'text-sm font-medium',
                  billingPeriod === 'yearly'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => onBillingPeriodChange('yearly')}
              >
                Yearly
                <Badge className="ml-2" variant="secondary">
                  Save 20%
                </Badge>
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
          {tiers.map((tier, i) => (
            <Card
              key={i}
              className={cn('relative', tier.highlighted && 'border-primary shadow-lg scale-105')}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge>{tier.badge}</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="mt-2">{tier.description}</CardDescription>

                <div className="mt-6">
                  {tier.price.custom ? (
                    <p className="text-3xl font-bold">{tier.price.custom}</p>
                  ) : (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        {tier.price.currency || '$'}
                        {billingPeriod === 'monthly' ? tier.price.monthly : tier.price.yearly}
                      </span>
                      <span className="text-muted-foreground">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-8">
                <ul className="space-y-3">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      {feature.included ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                      ) : (
                        <XCircle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      )}
                      <span className={cn('text-sm', !feature.included && 'text-muted-foreground')}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  asChild={tier.cta.href ? true : false}
                  className="w-full"
                  variant={tier.highlighted ? 'default' : 'outline'}
                  onClick={tier.cta.onClick}
                >
                  {tier.cta.href ? <a href={tier.cta.href}>{tier.cta.text}</a> : tier.cta.text}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
