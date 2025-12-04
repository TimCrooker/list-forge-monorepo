import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  paddingX?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  background?: 'none' | 'subtle' | 'muted' | 'card' | 'primary' | 'secondary'
  border?: 'none' | 'top' | 'bottom' | 'both'
  rounded?: boolean
  fullHeight?: boolean
  as?: React.ElementType
}

const sizeClasses = {
  sm: 'max-w-screen-sm mx-auto',
  md: 'max-w-screen-md mx-auto',
  lg: 'max-w-screen-lg mx-auto',
  xl: 'max-w-screen-xl mx-auto',
  '2xl': 'max-w-screen-2xl mx-auto',
}

const paddingClasses = {
  none: '',
  sm: 'p-4 sm:p-6',
  md: 'p-6 sm:p-8 lg:p-10',
  lg: 'p-8 sm:p-10 lg:p-12',
  xl: 'p-10 sm:p-12 lg:p-16',
  '2xl': 'p-12 sm:p-16 lg:p-20',
}

const paddingXClasses = {
  none: '',
  sm: 'px-4 sm:px-6',
  md: 'px-6 sm:px-8 lg:px-10',
  lg: 'px-8 sm:px-10 lg:px-12',
  xl: 'px-10 sm:px-12 lg:px-16',
  '2xl': 'px-12 sm:px-16 lg:px-20',
}

const paddingYClasses = {
  none: '',
  sm: 'py-4 sm:py-6',
  md: 'py-6 sm:py-8 lg:py-10',
  lg: 'py-8 sm:py-10 lg:py-12',
  xl: 'py-10 sm:py-12 lg:py-16',
  '2xl': 'py-12 sm:py-16 lg:py-20',
}

const backgroundClasses = {
  none: '',
  subtle: 'bg-background/50',
  muted: 'bg-muted',
  card: 'bg-card',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
}

const borderClasses = {
  none: '',
  top: 'border-t',
  bottom: 'border-b',
  both: 'border-y',
}

export const Section = ({
  size,
  padding = 'md',
  paddingX,
  paddingY,
  background = 'none',
  border = 'none',
  rounded = false,
  fullHeight = false,
  as: Component = 'section',
  className,
  children,
  ...props
}: SectionProps) => {
  return (
    <Component
      className={cn(
        'w-full',
        backgroundClasses[background],
        borderClasses[border],
        rounded && 'rounded-lg',
        fullHeight && 'min-h-screen',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          size && sizeClasses[size],
          !paddingX && !paddingY && paddingClasses[padding],
          paddingX && paddingXClasses[paddingX],
          paddingY && paddingYClasses[paddingY],
        )}
      >
        {children}
      </div>
    </Component>
  )
}
