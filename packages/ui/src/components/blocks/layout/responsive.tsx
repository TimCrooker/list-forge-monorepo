import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ShowProps extends React.HTMLAttributes<HTMLDivElement> {
  above?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  below?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  at?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  as?: React.ElementType
}

export interface HideProps extends React.HTMLAttributes<HTMLDivElement> {
  above?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  below?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  at?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  as?: React.ElementType
}

const showAboveClasses = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
  xl: 'hidden xl:block',
  '2xl': 'hidden 2xl:block',
}

const showBelowClasses = {
  sm: 'block sm:hidden',
  md: 'block md:hidden',
  lg: 'block lg:hidden',
  xl: 'block xl:hidden',
  '2xl': 'block 2xl:hidden',
}

const showAtClasses = {
  sm: 'hidden sm:block md:hidden',
  md: 'hidden md:block lg:hidden',
  lg: 'hidden lg:block xl:hidden',
  xl: 'hidden xl:block 2xl:hidden',
  '2xl': 'hidden 2xl:block',
}

const hideAboveClasses = {
  sm: 'block sm:hidden',
  md: 'block md:hidden',
  lg: 'block lg:hidden',
  xl: 'block xl:hidden',
  '2xl': 'block 2xl:hidden',
}

const hideBelowClasses = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
  xl: 'hidden xl:block',
  '2xl': 'hidden 2xl:block',
}

const hideAtClasses = {
  sm: 'block sm:hidden md:block',
  md: 'block md:hidden lg:block',
  lg: 'block lg:hidden xl:block',
  xl: 'block xl:hidden 2xl:block',
  '2xl': 'block 2xl:hidden',
}

export const Show = ({
  above,
  below,
  at,
  as: Component = 'div',
  className,
  children,
  ...props
}: ShowProps) => {
  return (
    <Component
      className={cn(
        above && showAboveClasses[above],
        below && showBelowClasses[below],
        at && showAtClasses[at],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export const Hide = ({
  above,
  below,
  at,
  as: Component = 'div',
  className,
  children,
  ...props
}: HideProps) => {
  return (
    <Component
      className={cn(
        above && hideAboveClasses[above],
        below && hideBelowClasses[below],
        at && hideAtClasses[at],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
