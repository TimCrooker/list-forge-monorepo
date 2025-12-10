import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from './button';
import { cn } from '../../lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Text to display when loading */
  loadingText?: string;
  /** Icon to show when loading (defaults to spinner) */
  loadingIcon?: React.ReactNode;
}

/**
 * LoadingButton component - Button with built-in loading state
 *
 * @example
 * ```tsx
 * import { LoadingButton } from '@listforge/ui'
 *
 * <LoadingButton
 *   isLoading={isSaving}
 *   loadingText="Saving..."
 *   onClick={handleSave}
 * >
 *   Save Changes
 * </LoadingButton>
 * ```
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      isLoading = false,
      loadingText,
      loadingIcon,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(className)}
        {...props}
      >
        {isLoading ? (
          <>
            {loadingIcon || <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
