import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  operationType: string;
  operationId: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * OperationRendererErrorBoundary - Catches rendering errors in operation widgets
 *
 * CRITICAL: Prevents a single malformed operation from crashing the entire activity feed.
 * Shows inline error instead of breaking the whole UI.
 */
export class OperationRendererErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[OperationRendererErrorBoundary] Error rendering operation ${this.props.operationType} (${this.props.operationId}):`,
      error,
      errorInfo
    );
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state if operation changes
    if (prevProps.operationId !== this.props.operationId) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-destructive">Error rendering operation</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
