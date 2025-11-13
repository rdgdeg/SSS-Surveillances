import { SubmissionResult } from '../types';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

/**
 * Vérifie si le navigateur est en ligne
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Écoute les changements de connexion réseau
 */
export function onConnectionChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Retourne une fonction de nettoyage
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Calcule le délai avant la prochaine tentative avec backoff exponentiel
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Attend pendant un délai spécifié
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Soumet des données avec retry logic et backoff exponentiel
 */
export async function submitWithRetry<T>(
  submitFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<SubmissionResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      // Vérifier la connexion avant chaque tentative
      if (!isOnline()) {
        throw new Error('NETWORK_OFFLINE');
      }

      const result = await submitFn();
      
      return {
        success: true,
        data: result,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error as Error;
      
      // Ne pas réessayer si c'est une erreur de validation ou d'authentification
      if (
        lastError.message.includes('VALIDATION_ERROR') ||
        lastError.message.includes('AUTH_ERROR') ||
        lastError.message.includes('DUPLICATE_SUBMISSION')
      ) {
        return {
          success: false,
          error: lastError,
          attempts: attempt + 1,
        };
      }

      // Si ce n'est pas la dernière tentative, attendre avant de réessayer
      if (attempt < opts.maxAttempts - 1) {
        const delay = calculateDelay(attempt, opts);
        console.log(`Tentative ${attempt + 1}/${opts.maxAttempts} échouée. Nouvelle tentative dans ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // Toutes les tentatives ont échoué
  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts: opts.maxAttempts,
  };
}

/**
 * Teste la connectivité réseau en effectuant une requête ping
 */
export async function testConnectivity(url: string = '/api/health'): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}
