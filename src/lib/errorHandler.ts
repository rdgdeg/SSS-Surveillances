/**
 * Error Handler
 * 
 * Maps various error types to AppError instances.
 * Provides consistent error handling across the application.
 */

import { AppError, ErrorCode, ErrorFactory } from './errors';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Check if error is a Supabase/Postgrest error
 */
function isSupabaseError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    );
  }
  return false;
}

/**
 * Check if error is a timeout error
 */
function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('timeout') ||
      error.message.includes('timed out')
    );
  }
  return false;
}

/**
 * Map Supabase error codes to AppError
 */
function mapSupabaseError(error: PostgrestError): AppError {
  const { code, message, details, hint } = error;

  // Map common Postgrest error codes
  switch (code) {
    case 'PGRST116': // Not found
      return ErrorFactory.notFoundError('Ressource');

    case '23505': // Unique violation
      return ErrorFactory.alreadyExistsError('Enregistrement');

    case '23503': // Foreign key violation
      return new AppError(
        ErrorCode.CONFLICT,
        message,
        'Impossible de supprimer : des données liées existent.',
        false,
        { code, details, hint }
      );

    case '23502': // Not null violation
      return ErrorFactory.validationError(
        'Required field missing',
        { code, details, hint }
      );

    case '42501': // Insufficient privilege
      return ErrorFactory.authorizationError();

    case 'PGRST301': // JWT expired
      return new AppError(
        ErrorCode.SESSION_EXPIRED,
        'Session expired',
        'Votre session a expiré. Veuillez vous reconnecter.',
        false
      );

    default:
      // Generic database error
      return ErrorFactory.databaseError(message);
  }
}

/**
 * Main error handler - converts any error to AppError
 */
export function handleApiError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Supabase/Postgrest error
  if (isSupabaseError(error)) {
    return mapSupabaseError(error);
  }

  // Network error
  if (isNetworkError(error)) {
    return ErrorFactory.networkError();
  }

  // Timeout error
  if (isTimeoutError(error)) {
    return ErrorFactory.timeoutError();
  }

  // Generic Error object
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return ErrorFactory.authenticationError();
    }
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return ErrorFactory.authorizationError();
    }
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return ErrorFactory.notFoundError('Ressource');
    }
    if (error.message.includes('409') || error.message.includes('Conflict')) {
      return ErrorFactory.conflictError(error.message);
    }
    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return ErrorFactory.serverError(error.message);
    }

    // Unknown error with message
    return ErrorFactory.unknownError(error);
  }

  // Completely unknown error
  return ErrorFactory.unknownError();
}

/**
 * Log error to console (and potentially to monitoring service)
 */
export function logError(error: AppError, context?: Record<string, any>): void {
  const errorData = {
    ...error.toJSON(),
    context,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Application Error:', errorData);
  }

  // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
  // Example:
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, { extra: errorData });
  // }
}

/**
 * Handle error with logging and user notification
 */
export function handleError(
  error: unknown,
  context?: Record<string, any>
): AppError {
  const appError = handleApiError(error);
  logError(appError, context);
  return appError;
}
