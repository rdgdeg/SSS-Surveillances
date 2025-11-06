
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './shared/Card';
import { Button } from './shared/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  // Fix: Replaced constructor with a public state property initializer to resolve type errors with `this.state` and `this.props`.
  public state: State = {
    hasError: false,
    error: undefined,
  };

  static getDerivedStateFromError(error: Error): State {
    // Mettre à jour l'état pour que le prochain rendu affiche l'interface de secours.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Vous pouvez également consigner l'erreur dans un service de rapport d'erreurs
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Vous pouvez rendre n'importe quelle interface de secours personnalisée
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
          <Card className="max-w-lg text-center border-red-500/50 shadow-lg shadow-red-500/10">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="mt-4 text-2xl text-red-800 dark:text-red-300">
                Oups! Une erreur est survenue
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                L'application a rencontré un problème inattendu. Notre équipe technique a été notifiée.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono bg-red-50 dark:bg-gray-800 p-3 rounded-md text-left text-red-700 dark:text-red-400 overflow-auto max-h-40">
                {this.state.error?.toString()}
              </p>
              <Button onClick={this.handleReload} className="mt-6 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">
                <RefreshCw className="mr-2 h-4 w-4" />
                Recharger l'application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
