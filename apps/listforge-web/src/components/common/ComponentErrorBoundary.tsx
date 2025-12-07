import { Component, ReactNode, ErrorInfo } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@listforge/ui';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string; // e.g., "chat", "research"
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ComponentErrorBoundary Component
 * Phase 7 Slice 8
 *
 * Reusable error boundary for individual components.
 * Provides a retry mechanism and context-specific error messages.
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ComponentErrorBoundary caught an error (${this.props.context || 'unknown'}):`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  getErrorMessage(): string {
    const { context } = this.props;
    const errorMessage = this.state.error?.message || 'An unexpected error occurred';

    if (context === 'chat') {
      return 'Failed to load chat. Please try again.';
    }
    if (context === 'research') {
      return 'Failed to load research data. Please try again.';
    }

    return errorMessage;
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {this.getErrorMessage()}
            </p>
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
