import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, WifiOff, Database, X } from 'lucide-react';
import { ErrorResponse, ErrorType } from '../../types';
import { Button } from './Button';

interface ErrorDisplayProps {
  error: ErrorResponse;
  onClose?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClose }) => {
  // Choisir l'icône selon le type d'erreur
  const getIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return <WifiOff className="h-6 w-6" />;
      case ErrorType.DATABASE_ERROR:
        return <Database className="h-6 w-6" />;
      case ErrorType.VALIDATION_ERROR:
        return <AlertTriangle className="h-6 w-6" />;
      case ErrorType.QUOTA_ERROR:
        return <AlertCircle className="h-6 w-6" />;
      default:
        return <XCircle className="h-6 w-6" />;
    }
  };

  // Choisir les couleurs selon le type d'erreur
  const getColorClasses = () => {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-300 dark:border-yellow-700',
          text: 'text-yellow-800 dark:text-yellow-300',
          icon: 'text-yellow-600 dark:text-yellow-400',
        };
      case ErrorType.NETWORK_ERROR:
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-300 dark:border-orange-700',
          text: 'text-orange-800 dark:text-orange-300',
          icon: 'text-orange-600 dark:text-orange-400',
        };
      default:
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-300 dark:border-red-700',
          text: 'text-red-800 dark:text-red-300',
          icon: 'text-red-600 dark:text-red-400',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <div className={`${colors.icon} flex-shrink-0 mt-0.5`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${colors.text} mb-1`}>
            {error.type === ErrorType.VALIDATION_ERROR && 'Erreur de validation'}
            {error.type === ErrorType.NETWORK_ERROR && 'Problème de connexion'}
            {error.type === ErrorType.DATABASE_ERROR && 'Erreur de base de données'}
            {error.type === ErrorType.QUOTA_ERROR && 'Quota dépassé'}
            {error.type === ErrorType.UNKNOWN_ERROR && 'Erreur inattendue'}
          </h3>
          
          <p className={`text-sm ${colors.text} mb-3`}>
            {error.userMessage}
          </p>

          {/* Actions correctives */}
          {error.actions && error.actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {error.actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  variant={action.primary ? 'default' : 'outline'}
                  size="sm"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Bouton de fermeture */}
        {onClose && (
          <button
            onClick={onClose}
            className={`${colors.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
