import { Badge } from '@listforge/ui';
import { cn } from '@listforge/ui';
import { ShoppingCart, Package, Store } from 'lucide-react';

interface MarketplaceBadgeProps {
  /** Marketplace name */
  marketplace: 'ebay' | 'amazon' | 'walmart' | string;
  /** Badge variant */
  variant?: 'default' | 'outline';
  /** Size variant */
  size?: 'sm' | 'default';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Marketplace configuration
 */
const marketplaceConfig: Record<
  string,
  {
    label: string;
    icon: typeof ShoppingCart;
    className: string;
  }
> = {
  ebay: {
    label: 'eBay',
    icon: ShoppingCart,
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  },
  amazon: {
    label: 'Amazon',
    icon: Package,
    className:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400 border-orange-300 dark:border-orange-700',
  },
  walmart: {
    label: 'Walmart',
    icon: Store,
    className:
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400 border-cyan-300 dark:border-cyan-700',
  },
};

/**
 * MarketplaceBadge component for displaying marketplace indicators
 *
 * @example
 * ```tsx
 * <MarketplaceBadge marketplace="ebay" />
 * <MarketplaceBadge marketplace="amazon" variant="outline" />
 * ```
 */
export function MarketplaceBadge({
  marketplace,
  variant = 'outline',
  size = 'default',
  className,
}: MarketplaceBadgeProps) {
  const marketplaceLower = marketplace.toLowerCase();
  const config =
    marketplaceConfig[marketplaceLower] || {
      label: marketplace,
      icon: Store,
      className:
        'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400 border-gray-300 dark:border-gray-700',
    };

  const Icon = config.icon;

  return (
    <Badge
      variant={variant}
      className={cn(
        'flex items-center gap-1',
        config.className,
        size === 'sm' && 'text-xs px-2 py-0.5',
        className
      )}
    >
      <Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span>{config.label}</span>
    </Badge>
  );
}
