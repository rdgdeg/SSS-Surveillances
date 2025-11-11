/**
 * Error Handling System
 * 
 * Centralized error types and handling for the application.
 * Provides consistent error messages and retry logic.
 */

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Authentication/Authorization errors
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Business logic errors
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_STATE = 'INVALID_STATE',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom application error class with additional context
 */
export class AppError extends Error {
  /**
   * @param code - Error code for categorization
   * @param message - Technical error message (for logging)
   * @param userMessage - User-friendly error message (for display)
   * @param retryable - Whether the operation can be retried
   * @param details - Additional error context
   */
  constructor(
    public code: ErrorCode,
    message: string,
    public userMessage: string,
    public retryable: boolean = false,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      retryable: this.retryable,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Factory functions for common error types
 */
export const ErrorFactory = {
  networkError: (message?: string): AppError => 
    new AppError(
      ErrorCode.NETWORK_ERROR,
      message || 'Network request failed',
      'Problème de connexion. Vérifiez votre réseau et réessayez.',
      true
    ),

  timeoutError: (): AppError =>
    new AppError(
      ErrorCode.TIMEOUT_ERROR,
      'Request timeout',
      'La requête a pris trop de temps. Veuillez réessayer.',
      true
    ),

  validationError: (message: string, details?: Record<string, any>): AppError =>
    new AppError(
      ErrorCode.VALIDATION_ERROR,
      message,
      'Les données saisies sont invalides. Veuillez vérifier et réessayer.',
      false,
      details
    ),

  authenticationError: (): AppError =>
    new AppError(
      ErrorCode.AUTHENTICATION_ERROR,
      'Authentication failed',
      'Authentification échouée. Veuillez vous reconnecter.',
      false
    ),

  authorizationError: (): AppError =>
    new AppError(
      ErrorCode.AUTHORIZATION_ERROR,
      'Insufficient permissions',
      'Vous n\'avez pas les permissions nécessaires pour cette action.',
      false
    ),

  notFoundError: (resource: string): AppError =>
    new AppError(
      ErrorCode.NOT_FOUND,
      `${resource} not found`,
      `${resource} introuvable.`,
      false
    ),

  alreadyExistsError: (resource: string): AppError =>
    new AppError(
      ErrorCode.ALREADY_EXISTS,
      `${resource} already exists`,
      `${resource} existe déjà.`,
      false
    ),

  conflictError: (message: string): AppError =>
    new AppError(
      ErrorCode.CONFLICT,
      message,
      'Un conflit est survenu. Les données ont peut-être été modifiées par un autre utilisateur.',
      true
    ),

  serverError: (message?: string): AppError =>
    new AppError(
      ErrorCode.SERVER_ERROR,
      message || 'Internal server error',
      'Une erreur serveur est survenue. Veuillez réessayer plus tard.',
      true
    ),

  databaseError: (message: string): AppError =>
    new AppError(
      ErrorCode.DATABASE_ERROR,
      message,
      'Erreur de base de données. Veuillez réessayer.',
      true
    ),

  quotaExceededError: (quota: number): AppError =>
    new AppError(
      ErrorCode.QUOTA_EXCEEDED,
      `Quota exceeded: ${quota}`,
      `Le quota de ${quota} a été dépassé.`,
      false
    ),

  invalidStateError: (message: string): AppError =>
    new AppError(
      ErrorCode.INVALID_STATE,
      message,
      'L\'opération ne peut pas être effectuée dans l\'état actuel.',
      false
    ),

  operationNotAllowedError: (operation: string): AppError =>
    new AppError(
      ErrorCode.OPERATION_NOT_ALLOWED,
      `Operation not allowed: ${operation}`,
      'Cette opération n\'est pas autorisée.',
      false
    ),

  unknownError: (originalError?: Error): AppError =>
    new AppError(
      ErrorCode.UNKNOWN_ERROR,
      originalError?.message || 'Unknown error occurred',
      'Une erreur inattendue est survenue. Veuillez réessayer.',
      true,
      originalError ? { originalError: originalError.message } : undefined
    ),
};

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.retryable;
  }
  // By default, network errors are retryable
  return error instanceof TypeError && error.message.includes('fetch');
}

/**
 * Get user-friendly message from any error
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return 'Une erreur est survenue. Veuillez réessayer.';
  }
  return 'Une erreur inattendue est survenue.';
}
