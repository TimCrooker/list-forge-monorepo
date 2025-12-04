import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, type LucideIcon } from 'lucide-react'

export interface AlternatingFeature {
  badge?: string
  title: string
  description: string
  image: {
    src: string
    alt: string
  }
  highlights?: string[]
  icon?: LucideIcon
}

export interface FeaturesAlternatingProps {
  title?: string
  description?: string
  features: AlternatingFeature[]
}

export const FeaturesAlternating = ({ title, description, features }: FeaturesAlternatingProps) => {
  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        {(title || description) && (
          <div className="mx-auto max-w-2xl text-center mb-16">
            {title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>}
            {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
          </div>
        )}

        {/* Features */}
        <div className="space-y-24">
          {features.map((feature, i) => {
            const Icon = feature.icon
            const isEven = i % 2 === 0

            const content = (
              <div className="flex flex-col justify-center">
                <div className="mx-auto max-w-xl">
                  {feature.badge && (
                    <Badge className="mb-4" variant="outline">
                      {feature.badge}
                    </Badge>
                  )}

                  <div className="flex items-start gap-4 mb-6">
                    {Icon && (
                      <div className="flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      {feature.title}
                    </h3>
                  </div>

                  <p className="text-lg text-muted-foreground">{feature.description}</p>

                  {feature.highlights && feature.highlights.length > 0 && (
                    <ul className="mt-8 space-y-3">
                      {feature.highlights.map((highlight, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                          <span className="text-muted-foreground">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )

            const image = (
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  <img
                    alt={feature.image.alt}
                    className="h-full w-full object-cover"
                    src={feature.image.src}
                  />
                </div>
              </div>
            )

            return (
              <div key={i} className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                {isEven ? (
                  <>
                    {content}
                    {image}
                  </>
                ) : (
                  <>
                    {image}
                    {content}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
