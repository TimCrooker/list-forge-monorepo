import * as React from 'react'
import { cn } from '@/lib/utils'

export interface Logo {
  name: string
  src: string
  href?: string
}

export interface LogoCloudProps {
  title?: string
  description?: string
  logos: Logo[]
  variant?: 'default' | 'grid' | 'marquee'
  columns?: 3 | 4 | 5 | 6 | 7 | 8
  grayscale?: boolean
  className?: string
}

export const LogoCloud = ({
  title,
  description,
  logos,
  variant = 'default',
  columns = 5,
  grayscale = true,
  className,
}: LogoCloudProps) => {
  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    7: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-7',
    8: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-8',
  }

  if (variant === 'marquee') {
    return (
      <section className={cn('py-12 sm:py-16', className)}>
        <div className="container mx-auto px-4 md:px-6">
          {(title || description) && (
            <div className="mx-auto max-w-2xl text-center mb-12">
              {title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>}
              {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
            </div>
          )}

          <div className="relative overflow-hidden">
            <div className="flex animate-marquee">
              {[...logos, ...logos].map((logo, index) => (
                <LogoItem
                  key={`${logo.name}-${index}`}
                  className="mx-8 flex-shrink-0"
                  grayscale={grayscale}
                  logo={logo}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={cn('py-12 sm:py-16', className)}>
      <div className="container mx-auto px-4 md:px-6">
        {(title || description) && (
          <div className="mx-auto max-w-2xl text-center mb-12">
            {title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>}
            {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
          </div>
        )}

        <div
          className={cn(
            'grid gap-8 items-center justify-items-center',
            variant === 'grid' ? gridCols[columns] : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
          )}
        >
          {logos.map(logo => (
            <LogoItem key={logo.name} grayscale={grayscale} logo={logo} />
          ))}
        </div>
      </div>
    </section>
  )
}

const LogoItem = ({
  logo,
  grayscale,
  className,
}: {
  logo: Logo
  grayscale?: boolean
  className?: string
}) => {
  const imageClasses = cn(
    'h-12 w-auto object-contain',
    grayscale &&
      'grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300',
    className,
  )

  if (logo.href) {
    return (
      <a
        className="flex items-center justify-center"
        href={logo.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        <img alt={logo.name} className={imageClasses} src={logo.src} />
      </a>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <img alt={logo.name} className={imageClasses} src={logo.src} />
    </div>
  )
}
