import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export interface HeroSplitProps {
  badge?: {
    text: string
    icon?: React.ReactNode
  }
  title: string
  description: string
  features?: string[]
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
  image?: {
    src: string
    alt: string
  }
  imagePosition?: 'left' | 'right'
  stats?: Array<{
    value: string
    label: string
  }>
  backgroundImage?: {
    src: string
    alt?: string
    opacity?: number
  }
}

export const HeroSplit = ({
  badge,
  title,
  description,
  features,
  primaryCta,
  secondaryCta,
  image,
  imagePosition = 'right',
  stats,
  backgroundImage,
}: HeroSplitProps) => {
  const contentSection = (
    <div className="flex flex-col justify-center">
      <div className="mx-auto max-w-xl">
        {/* Badge */}
        {badge && (
          <div className="mb-6">
            <Badge className="gap-1 px-3 py-1" variant="secondary">
              {badge.icon}
              {badge.text}
            </Badge>
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">{title}</h1>

        {/* Description */}
        <p className="mt-6 text-lg leading-8 text-muted-foreground">{description}</p>

        {/* Features List */}
        {features && features.length > 0 && (
          <ul className="mt-8 space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          {primaryCta && (
            <Button asChild={primaryCta.href ? true : false} size="lg" onClick={primaryCta.onClick}>
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

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="mt-16 grid grid-cols-2 gap-8 border-t pt-8 sm:grid-cols-3">
            {stats.map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const imageSection = image && (
    <div className="relative">
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted lg:aspect-auto lg:h-full">
        <img alt={image.alt} className="h-full w-full object-cover" src={image.src} />
      </div>
    </div>
  )

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background Image */}
      {backgroundImage && (
        <div
          aria-label={backgroundImage.alt}
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"
          style={{
            backgroundImage: `url("${backgroundImage.src}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: backgroundImage.opacity || 0.7,
          }}
        />
      )}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {imagePosition === 'left' ? (
            <>
              {imageSection}
              {contentSection}
            </>
          ) : (
            <>
              {contentSection}
              {imageSection}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
