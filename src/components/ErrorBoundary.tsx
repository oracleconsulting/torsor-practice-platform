import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChartErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ChartErrorBoundary] Uncaught error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Unable to Display Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 space-y-4">
              <p className="text-gray-700">
                There was an error displaying this chart.
              </p>
              <p className="text-sm text-gray-600">
                This may be due to incomplete or invalid data.
              </p>
              <Button 
                onClick={() => this.setState({ hasError: false, error: null })} 
                variant="outline"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Export as ErrorBoundary as well for backwards compatibility
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Something Went Wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  An unexpected error occurred. Please try refreshing the page.
                </p>
                {this.state.error && (
                  <details className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                    <summary className="cursor-pointer font-medium">Error Details</summary>
                    <pre className="mt-2 whitespace-pre-wrap">{this.state.error.toString()}</pre>
                  </details>
                )}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="default"
                  >
                    Refresh Page
                  </Button>
                  <Button 
                    onClick={() => this.setState({ hasError: false, error: null })} 
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

