/**
 * Error Handler centralisé
 * 
 * Gère toutes les erreurs de l'application de manière cohérente
 * et génère des messages utilisateur clairs et actionnables.
 */

import { ErrorType, ErrorContext, ErrorResponse, ErrorAction } from '../types';
import * as auditLogger from './auditLogger';

/**
 * Classifie une erreur selon son type
 */
function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('offline') || message.includes('fetch')) {
    return ErrorType.NETWORK_ERROR;
  }
  
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return ErrorType.VALIDATION_ERROR;
  }
  
  if (message.includes('database') || message.includes('supabase') || message.includes('sql')) {
    return ErrorType.DATABASE_ERROR;
  }
  
  if (message.includes('quota') || message.includes('storage') || message.includes('exceeded')) {
    return ErrorType.QUOTA_ERROR;
  }

  return ErrorType.UNKNOWN_ERROR;
}

/**
 * Génère un message utilisateur clair selon le type d'erreur
 */
function generateUserMessage(type: ErrorType, error: Error): string {
  switch (type) {
    case ErrorType.NETWORK_ERROR:
      return 'Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.';
    
    case ErrorType.VALIDATION_ERROR:
      return error.message.replace('VALIDATION_ERROR:', '').trim() || 
             'Les données saisies sont invalides. Veuillez vérifier et corriger.';
    
    case ErrorType.DATABASE_ERROR:
      return 'Erreur lors de l\'enregistrement des données. Veuillez réessayer dans quelques instants.';
    
    case ErrorType.QUOTA_ERROR:
      return 'Espace de stockage insuffisant. Veuillez libérer de l\'espace ou contacter le support.';
    
    case ErrorType.UNKNOWN_ERROR:
      return 'Une erreur inattendue s\'est produite. Veuillez réessayer ou contacter le support si le problème persiste.';
    
    default:
      return 'Une erreur s\'est produite. Veuillez réessayer.';
  }
}

/**
 * Génère des actions correctives selon le type d'erreur
 */
function generateActions(
  type: ErrorType,
  context: ErrorContext,
  onRetry?: () => void,
  onDownload?: () => void,
  onContact?: () => void
): ErrorAction[] {
  const actions: ErrorAction[] = [];

  switch (type) {
    case ErrorType.NETWORK_ERROR:
      if (onRetry) {
        actions.push({
          label: 'Réessayer',
          action: onRetry,
          primary: true,
        });
      }
      if (onDownload) {
        actions.push({
          label: 'Télécharger une copie locale',
          action: onDownload,
          primary: false,
        });
      }
      break;

    case ErrorType.VALIDATION_ERROR:
      // Pas d'action automatique, l'utilisateur doit corriger
      break;

    case ErrorType.DATABASE_ERROR:
      if (onRetry) {
        actions.push({
          label: 'Réessayer',
          action: onRetry,
          primary: true,
        });
      }
      if (onContact) {
        actions.push({
          label: 'Contacter le support',
          action: onContact,
          primary: false,
        });
      }
      break;

    case ErrorType.QUOTA_ERROR:
      if (onContact) {
        actions.push({
          label: 'Contacter le support',
          action: onContact,
          primary: true,
        });
      }
      break;

    case ErrorType.UNKNOWN_ERROR:
      if (onRetry) {
        actions.push({
          label: 'Réessayer',
          action: onRetry,
          primary: true,
        });
      }
      if (onDownload) {
        actions.push({
          label: 'Télécharger une copie locale',
          action: onDownload,
          primary: false,
        });
      }
      if (onContact) {
        actions.push({
          label: 'Contacter le support',
          action: onContact,
          primary: false,
        });
      }
      break;
  }

  return actions;
}

/**
 * Gère une erreur et retourne une réponse structurée
 */
export function handle(
  error: Error,
  context: ErrorContext,
  callbacks?: {
    onRetry?: () => void;
    onDownload?: () => void;
    onContact?: () => void;
  }
): ErrorResponse {
  // Classifier l'erreur
  const type = classifyError(error);

  // Générer le message utilisateur
  const userMessage = generateUserMessage(type, error);

  // Générer les actions correctives
  const actions = generateActions(
    type,
    context,
    callbacks?.onRetry,
    callbacks?.onDownload,
    callbacks?.onContact
  );

  // Déterminer si l'erreur est récupérable
  const recoverable = type !== ErrorType.VALIDATION_ERROR;

  // Logger l'erreur dans la console
  console.error(`[${type}] ${context.operation}:`, error);

  // Logger dans audit_logs si pertinent (erreurs critiques uniquement)
  if (type === ErrorType.DATABASE_ERROR || type === ErrorType.UNKNOWN_ERROR) {
    auditLogger.log({
      operation: 'view', // Utiliser 'view' comme opération générique pour les erreurs
      entity: 'submission',
      entity_id: context.userId || 'unknown',
      user_email: context.userId || 'system',
      details: {
        error_type: type,
        error_message: error.message,
        operation: context.operation,
        timestamp: context.timestamp,
        payload: context.payload ? JSON.stringify(context.payload).substring(0, 500) : undefined,
      },
    }).catch(err => {
      console.error('Erreur lors du logging de l\'erreur:', err);
    });
  }

  return {
    type,
    message: error.message,
    userMessage,
    actions,
    recoverable,
  };
}

/**
 * Gère une erreur de manière simplifiée (sans callbacks)
 */
export function handleSimple(error: Error, operation: string): ErrorResponse {
  return handle(error, {
    operation,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Vérifie si une erreur est récupérable
 */
export function isRecoverable(error: Error): boolean {
  const type = classifyError(error);
  return type !== ErrorType.VALIDATION_ERROR;
}

/**
 * Extrait un message d'erreur lisible depuis différents formats
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  
  return 'Une erreur inconnue s\'est produite';
}
