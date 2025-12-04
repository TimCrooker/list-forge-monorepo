import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, Quote } from 'lucide-react'

export interface Testimonial {
  content: string
  author: {
    name: string
    role?: string
    company?: string
    avatar?: string
  }
  rating?: number
}

export interface TestimonialsGridProps {
  title?: string
  description?: string
  testimonials: Testimonial[]
  columns?: 2 | 3
}

export const TestimonialsGrid = ({
  title,
  description,
  testimonials,
  columns = 3,
}: TestimonialsGridProps) => {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
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

        {/* Testimonials Grid */}
        <div className={`grid gap-8 ${gridCols[columns]}`}>
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="relative">
              <CardContent className="pt-8 pb-6">
                {/* Quote Icon */}
                <Quote className="absolute top-6 right-6 h-8 w-8 text-muted-foreground/20" />

                {/* Rating */}
                {testimonial.rating && (
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className={`h-4 w-4 ${
                          j < testimonial.rating!
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Content */}
                <blockquote className="text-muted-foreground mb-6">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage alt={testimonial.author.name} src={testimonial.author.avatar} />
                    <AvatarFallback>
                      {testimonial.author.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.author.name}</p>
                    {(testimonial.author.role || testimonial.author.company) && (
                      <p className="text-sm text-muted-foreground">
                        {testimonial.author.role}
                        {testimonial.author.role && testimonial.author.company && ', '}
                        {testimonial.author.company}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
