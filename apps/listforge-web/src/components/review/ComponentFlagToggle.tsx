import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from '@listforge/ui';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@listforge/ui';

type ComponentStatus = 'ok' | 'needs_review' | 'flagged';

interface ComponentFlagToggleProps {
  status: ComponentStatus;
  onStatusChange: (status: ComponentStatus) => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const STATUS_OPTIONS: { value: ComponentStatus; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'ok',
    label: 'OK',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-500',
  },
  {
    value: 'needs_review',
    label: 'Needs Review',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-yellow-500',
  },
  {
    value: 'flagged',
    label: 'Flagged',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-500',
  },
];

export function ComponentFlagToggle({
  status,
  onStatusChange,
  disabled = false,
  size = 'sm',
}: ComponentFlagToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === status) || STATUS_OPTIONS[0];

  const handleStatusChange = async (newStatus: ComponentStatus) => {
    if (newStatus === status || isUpdating) return;

    setIsUpdating(true);
    setIsOpen(false);

    try {
      await onStatusChange(newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'sm' : 'default'}
          disabled={disabled || isUpdating}
          className={cn(
            'gap-1 px-2',
            size === 'sm' && 'h-7 text-xs'
          )}
        >
          {isUpdating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span className={currentOption.color}>{currentOption.icon}</span>
          )}
          <span className="hidden sm:inline">{currentOption.label}</span>
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className={cn(
              'gap-2',
              status === option.value && 'bg-muted'
            )}
          >
            <span className={option.color}>{option.icon}</span>
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
