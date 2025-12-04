import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export interface FeaturesGridProps {
  title?: string
  description?: string
  features: Feature[]
  columns?: 2 | 3 | 4
}

export const FeaturesGrid = ({ title, description, features, columns = 3 }: FeaturesGridProps) => {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }

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

        {/* Features Grid */}
        <div className={`grid gap-8 ${gridCols[columns]}`}>
          {features.map((feature, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
