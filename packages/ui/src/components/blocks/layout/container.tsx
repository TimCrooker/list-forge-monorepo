import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'prose'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
  as?: React.ElementType
}

const sizeClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
  prose: 'max-w-prose',
}

const paddingClasses = {
  none: '',
  sm: 'px-4 sm:px-6',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-6 sm:px-8 lg:px-10',
  xl: 'px-8 sm:px-10 lg:px-12',
}

export const Container = ({
  size = 'xl',
  padding = 'md',
  center = true,
  as: Component = 'div',
  className,
  children,
  ...props
}: ContainerProps) => {
  return (
    <Component
      className={cn(
        'w-full',
        sizeClasses[size],
        paddingClasses[padding],
        center && 'mx-auto',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
