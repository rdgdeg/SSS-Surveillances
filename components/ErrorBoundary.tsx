
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './shared/Card';
import { Button } from './shared/Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { handleError } from '../src/lib/errorHandler';
import { AppError, getUserMessage } from '../src/lib/errors';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  appError?: AppError;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
    appError: undefined,
    errorCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Handle and log the error
    const appError = handleError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState(prevState => ({
      appError,
      errorCount: prevState.errorCount + 1,
    }));
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      appError: undefined,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, appError, errorCount } = this.state;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(error!, this.handleReset);
      }

      // Get user-friendly message
      const userMessage = appError 
        ? appError.userMessage 
        : getUserMessage(error);

      // Show different UI if errors are recurring
      const isRecurring = errorCount > 2;

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
          <Card className="max-w-lg text-center border-red-500/50 shadow-lg shadow-red-500/10">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="mt-4 text-2xl text-red-800 dark:text-red-300">
                {isRecurring ? 'Erreur Persistante' : 'Oups! Une erreur est survenue'}
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                {userMessage}
              </CardDescription>
              {isRecurring && (
                <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                  Cette erreur se répète. Veuillez contacter le support technique.
                </p>
              )}
            </CardHeader>
            <CardContent>
              {import.meta.env.MODE === 'development' && error && (
                <details className="text-left mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Détails techniques (dev only)
                  </summary>
                  <p className="text-xs font-mono bg-red-50 dark:bg-gray-800 p-3 rounded-md text-red-700 dark:text-red-400 overflow-auto max-h-40">
                    {error.toString()}
                    {error.stack && (
                      <>
                        <br /><br />
                        {error.stack}
                      </>
                    )}
                  </p>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {appError?.retryable && !isRecurring && (
                  <Button 
                    onClick={this.handleReset} 
                    variant="default"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Réessayer
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleGoHome} 
                  variant="outline"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Button>
                
                {isRecurring && (
                  <Button 
                    onClick={this.handleReload} 
                    variant="default"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recharger l'application
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
