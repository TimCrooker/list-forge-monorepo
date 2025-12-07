import { Badge, Button } from '@listforge/ui';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  onReconnect?: () => void;
  className?: string;
}

/**
 * ConnectionStatus Component
 * Phase 7 Slice 8
 *
 * Shows WebSocket connection status with visual indicator.
 * Provides reconnect button when disconnected.
 */
export function ConnectionStatus({
  isConnected,
  isConnecting,
  onReconnect,
  className,
}: ConnectionStatusProps) {
  const [showReconnect, setShowReconnect] = useState(false);

  // Auto-hide reconnect button after successful connection
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => setShowReconnect(false), 2000);
      return () => clearTimeout(timer);
    } else if (!isConnecting) {
      setShowReconnect(true);
    }
  }, [isConnected, isConnecting]);

  if (isConnected) {
    return (
      <Badge variant="secondary" className={`text-xs ${className || ''}`}>
        <Wifi className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    );
  }

  if (isConnecting) {
    return (
      <Badge variant="outline" className={`text-xs ${className || ''}`}>
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Connecting...
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Badge variant="destructive" className="text-xs">
        <WifiOff className="h-3 w-3 mr-1" />
        Disconnected
      </Badge>
      {showReconnect && onReconnect && (
        <Button
          size="sm"
          variant="outline"
          onClick={onReconnect}
          className="h-6 px-2 text-xs"
        >
          Reconnect
        </Button>
      )}
    </div>
  );
}
