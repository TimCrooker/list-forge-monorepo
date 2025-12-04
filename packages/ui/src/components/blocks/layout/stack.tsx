import * as React from 'react'
import { cn } from '@/lib/utils'

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'vertical' | 'horizontal' | 'responsive'
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  reverse?: boolean
  as?: React.ElementType
}

const directionClasses = {
  vertical: 'flex-col',
  horizontal: 'flex-row',
  responsive: 'flex-col sm:flex-row',
}

const spacingClasses = {
  vertical: {
    none: '',
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
    '2xl': 'space-y-12',
  },
  horizontal: {
    none: '',
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
    xl: 'space-x-8',
    '2xl': 'space-x-12',
  },
  responsive: {
    none: '',
    xs: 'space-y-1 sm:space-y-0 sm:space-x-1',
    sm: 'space-y-2 sm:space-y-0 sm:space-x-2',
    md: 'space-y-4 sm:space-y-0 sm:space-x-4',
    lg: 'space-y-6 sm:space-y-0 sm:space-x-6',
    xl: 'space-y-8 sm:space-y-0 sm:space-x-8',
    '2xl': 'space-y-12 sm:space-y-0 sm:space-x-12',
  },
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

export const Stack = ({
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  reverse = false,
  as: Component = 'div',
  className,
  children,
  ...props
}: StackProps) => {
  return (
    <Component
      className={cn(
        'flex',
        directionClasses[direction],
        spacingClasses[direction][spacing],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        reverse && (direction === 'vertical' ? 'flex-col-reverse' : 'flex-row-reverse'),
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
