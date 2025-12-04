import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BentoItem {
  title: string
  description: string
  icon?: LucideIcon
  className?: string
  content?: React.ReactNode
  background?: React.ReactNode
}

export interface BentoGridProps {
  title?: string
  description?: string
  items: BentoItem[]
  className?: string
}

export const BentoGrid = ({ title, description, items, className }: BentoGridProps) => {
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

        {/* Bento Grid */}
        <div className={cn('grid auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4', className)}>
          {items.map((item, i) => {
            const Icon = item.icon

            return (
              <Card
                key={i}
                className={cn(
                  'relative overflow-hidden transition-all hover:shadow-xl',
                  item.className,
                )}
              >
                {/* Background */}
                {item.background && <div className="absolute inset-0 z-0">{item.background}</div>}

                <CardHeader className="relative z-10">
                  {Icon && <Icon className="h-8 w-8 mb-2 text-primary" />}
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>

                {item.content && (
                  <CardContent className="relative z-10">{item.content}</CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Preset bento layouts for common use cases
export const BentoGridLayouts = {
  // 5 items: 1 large, 4 small
  fiveItems: [
    'md:col-span-2 md:row-span-2',
    'md:col-span-1',
    'md:col-span-1',
    'md:col-span-1',
    'md:col-span-1',
  ],
  // 6 items: 2 large, 4 small
  sixItems: [
    'md:col-span-2 md:row-span-1',
    'md:col-span-1 md:row-span-1',
    'md:col-span-1 md:row-span-2',
    'md:col-span-2 md:row-span-1',
    'md:col-span-1',
    'md:col-span-1',
  ],
  // 4 items: 1 extra large, 3 small
  fourItems: [
    'md:col-span-2 md:row-span-2',
    'md:col-span-1',
    'md:col-span-1',
    'md:col-span-1 md:row-start-2',
  ],
}
