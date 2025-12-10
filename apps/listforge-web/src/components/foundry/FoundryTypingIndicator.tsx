import { motion } from 'framer-motion';
import { cn } from '@listforge/ui';
import { FoundryAvatar } from './FoundryAvatar';
import type { FoundryTypingIndicatorProps } from './types';

/**
 * FoundryTypingIndicator - A convenience wrapper that displays the Foundry avatar
 * in a typing/thinking state alongside an optional label.
 *
 * This component is designed for use in chat UIs to indicate that the assistant
 * is generating a response.
 */
export function FoundryTypingIndicator({
  state,
  label = 'Foundry is generating...',
  size = 'sm',
  mode = 'dark',
  className,
}: FoundryTypingIndicatorProps) {
  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-full',
        'bg-muted/50 border border-border/50',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <FoundryAvatar state={state} size={size} mode={mode} />
      {label && (
        <span className="text-sm text-muted-foreground font-medium">
          {label}
        </span>
      )}
    </motion.div>
  );
}
