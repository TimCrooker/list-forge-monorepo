import { Package, MessageSquare, LayoutDashboard, ListChecks } from 'lucide-react';
import { cn } from '@listforge/ui';

export function ContextBadge({
  type,
  title,
  className,
}: {
  type: 'item_scoped' | 'general' | 'dashboard' | 'review_queue' | 'custom';
  title?: string | null;
  className?: string;
}) {
  const config = {
    item_scoped: {
      icon: Package,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      label: title || 'Item',
    },
    general: {
      icon: MessageSquare,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
      label: 'General',
    },
    dashboard: {
      icon: LayoutDashboard,
      color: 'bg-green-500/10 text-green-600 border-green-200',
      label: 'Dashboard',
    },
    review_queue: {
      icon: ListChecks,
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
      label: 'Review',
    },
    custom: {
      icon: MessageSquare,
      color: 'bg-gray-500/10 text-gray-600 border-gray-200',
      label: title || 'Custom',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border',
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}
