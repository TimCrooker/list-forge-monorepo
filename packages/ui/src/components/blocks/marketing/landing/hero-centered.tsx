import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Star } from 'lucide-react'

export interface HeroCenteredProps {
  announcement?: {
    text: string
    href?: string
    icon?: React.ReactNode
    variant?: 'badge' | 'pill'
  }
  title: string
  description: string
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
  socialProof?: {
    rating?: number
    reviews?: number
    avatars?: string[]
    text?: string
  }
  backgroundImage?: {
    src: string
    alt?: string
    opacity?: number
  }
  size?: 'default' | 'large' | 'xl'
  showScrollIndicator?: boolean
}

export const HeroCentered = ({
  announcement,
  title,
  description,
  primaryCta,
  secondaryCta,
  socialProof,
  backgroundImage,
  size = 'default',
  showScrollIndicator = false,
}: HeroCenteredProps) => {
  // Size configurations
  const sizeConfig = {
    default: {
      container: 'max-w-2xl',
      title: 'text-4xl font-bold tracking-tight sm:text-6xl',
      description: 'text-lg leading-8',
      spacing: 'space-y-6',
    },
    large: {
      container: 'max-w-3xl',
      title: 'text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl',
      description: 'text-lg sm:text-xl',
      spacing: 'space-y-8',
    },
    xl: {
      container: 'max-w-4xl',
      title: 'text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl',
      description: 'text-xl sm:text-2xl',
      spacing: 'space-y-10',
    },
  }

  const config = sizeConfig[size]

  return (
    <section
      className={`relative overflow-hidden ${
        backgroundImage ? 'min-h-screen flex items-center justify-center' : 'py-24 sm:py-32'
      }`}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
          <img
            alt={backgroundImage.alt || ''}
            className="w-full h-full object-cover"
            src={backgroundImage.src}
            style={{ opacity: backgroundImage.opacity || 0.8 }}
          />
        </div>
      )}
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className={`mx-auto ${config.container} text-center`}>
          <div className={config.spacing}>
            {/* Announcement Banner */}
            {announcement && (
              <div className="flex justify-center">
                {announcement.variant === 'pill' ? (
                  <div className="inline-flex items-center rounded-full border bg-background/80 backdrop-blur-sm px-4 py-2 text-sm">
                    {announcement.icon && (
                      <span className="text-primary font-medium mr-1">{announcement.icon}</span>
                    )}
                    <span className="text-primary font-medium">{announcement.text}</span>
                  </div>
                ) : (
                  <a
                    className="inline-flex items-center gap-x-2 rounded-full border bg-muted px-3 py-1 text-sm transition hover:border-foreground/20"
                    href={announcement.href || '#'}
                  >
                    {announcement.icon ? (
                      <span className="text-primary">{announcement.icon}</span>
                    ) : (
                      <Badge className="px-2 py-0.5" variant="secondary">
                        New
                      </Badge>
                    )}
                    <span>{announcement.text}</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {/* Title */}
            <h1 className={config.title}>{title}</h1>

            {/* Description */}
            <p className={`${config.description} text-muted-foreground`}>{description}</p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-x-6">
              {primaryCta && (
                <Button
                  asChild={primaryCta.href ? true : false}
                  size="lg"
                  onClick={primaryCta.onClick}
                >
                  {primaryCta.href ? (
                    <a href={primaryCta.href}>{primaryCta.text}</a>
                  ) : (
                    primaryCta.text
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

            {/* Social Proof */}
            {socialProof && (
              <div className="mt-16 flex flex-col items-center gap-4">
                {socialProof.avatars && socialProof.avatars.length > 0 && (
                  <div className="flex -space-x-2">
                    {socialProof.avatars.slice(0, 5).map((avatar, i) => (
                      <img
                        key={i}
                        alt=""
                        className="inline-block h-10 w-10 rounded-full ring-2 ring-background"
                        src={avatar}
                      />
                    ))}
                    {socialProof.avatars.length > 5 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                        <span className="text-xs font-medium">
                          +{socialProof.avatars.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {socialProof.rating && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < socialProof.rating!
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                    {socialProof.reviews && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({socialProof.reviews.toLocaleString()} reviews)
                      </span>
                    )}
                  </div>
                )}

                {socialProof.text && (
                  <p className="text-sm text-muted-foreground">{socialProof.text}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-muted-foreground" />
            <svg
              className="h-4 w-4 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
        </div>
      )}
    </section>
  )
}
