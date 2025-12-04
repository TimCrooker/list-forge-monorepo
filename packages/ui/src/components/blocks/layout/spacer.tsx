import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  axis?: 'horizontal' | 'vertical' | 'both'
}

const sizeClasses = {
  horizontal: {
    xs: 'w-1',
    sm: 'w-2',
    md: 'w-4',
    lg: 'w-6',
    xl: 'w-8',
    '2xl': 'w-12',
    '3xl': 'w-16',
    '4xl': 'w-20',
  },
  vertical: {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
    '2xl': 'h-12',
    '3xl': 'h-16',
    '4xl': 'h-20',
  },
  both: {
    xs: 'w-1 h-1',
    sm: 'w-2 h-2',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-12 h-12',
    '3xl': 'w-16 h-16',
    '4xl': 'w-20 h-20',
  },
}

export const Spacer = ({ size = 'md', axis = 'vertical', className, ...props }: SpacerProps) => {
  return (
    <div
      aria-hidden="true"
      className={cn(sizeClasses[axis][size], axis === 'horizontal' && 'flex-shrink-0', className)}
      {...props}
    />
  )
}

export interface CenterProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'prose' | 'none'
  horizontally?: boolean
  vertically?: boolean
  minHeight?: boolean
  as?: React.ElementType
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  prose: 'max-w-prose',
  none: '',
}

export const Center = ({
  maxWidth = 'none',
  horizontally = true,
  vertically = false,
  minHeight = false,
  as: Component = 'div',
  className,
  children,
  ...props
}: CenterProps) => {
  return (
    <Component
      className={cn(
        'flex',
        horizontally && 'justify-center',
        vertically && 'items-center',
        minHeight && 'min-h-screen',
        'w-full',
        className,
      )}
      {...props}
    >
      <div className={cn('w-full', maxWidthClasses[maxWidth])}>{children}</div>
    </Component>
  )
}
