import * as React from 'react';
import { cn } from '../../../lib/utils';

export interface EmptyStateProps {
  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;
  /** Main title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action button or element */
  action?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: 'h-6 w-6',
    title: 'text-sm',
    description: 'text-xs',
    spacing: 'py-4 space-y-2',
  },
  md: {
    icon: 'h-8 w-8',
    title: 'text-base',
    description: 'text-sm',
    spacing: 'py-6 space-y-3',
  },
  lg: {
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-base',
    spacing: 'py-8 space-y-4',
  },
};

/**
 * EmptyState component for displaying empty states with consistent styling
 *
 * @example
 * ```tsx
 * import { EmptyState } from '@listforge/ui/blocks/layout'
 * import { PackageX } from 'lucide-react'
 *
 * <EmptyState
 *   icon={PackageX}
 *   title="No items found"
 *   description="Get started by adding your first item"
 *   action={<Button>Add Item</Button>}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center text-muted-foreground',
        config.spacing,
        className
      )}
    >
      <Icon className={cn(config.icon, 'mx-auto mb-2 opacity-50')} />
      <p className={cn('font-medium', config.title)}>{title}</p>
      {description && (
        <p className={cn('text-muted-foreground mt-1', config.description)}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
