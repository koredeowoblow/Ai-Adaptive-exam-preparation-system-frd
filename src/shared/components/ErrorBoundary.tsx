import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card } from './Card';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-background">
          <Card className="max-w-[500px] w-full text-center px-lg py-2xl">
            <h1 className="text-2xl font-bold mb-4 text-danger">We hit a snag</h1>
            <p className="mb-6 text-text-muted">
              We couldn't load this page. Please try reloading or returning to your dashboard.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left bg-surface p-4 rounded-sm overflow-x-auto mb-8 text-sm">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => window.location.reload()} variant="primary">
                Reload Page
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} variant="secondary">
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
