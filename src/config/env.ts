/**
 * Environment Configuration
 * 
 * This module validates and exports environment variables.
 * It ensures all required variables are present at startup.
 */

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    environment: 'development' | 'production' | 'test';
    debug: boolean;
  };
}

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required variable is missing
 */
export function validateEnv(): void {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    // In production, log warning instead of throwing to prevent blank page
    const errorMessage = `Missing required environment variables:\n${missing.map(key => `  - ${key}`).join('\n')}\n\nPlease configure environment variables in Vercel dashboard.`;
    
    if (import.meta.env.MODE === 'development') {
      throw new Error(errorMessage);
    } else {
      console.error(errorMessage);
      // Don't throw in production to allow app to load with error boundary
    }
    return;
  }

  // Validate Supabase URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co'))) {
    const errorMessage = `Invalid VITE_SUPABASE_URL format: ${supabaseUrl}\nExpected format: https://your-project.supabase.co`;
    
    if (import.meta.env.MODE === 'development') {
      throw new Error(errorMessage);
    } else {
      console.error(errorMessage);
    }
  }
}

/**
 * Validated and typed environment configuration
 */
export const env: EnvironmentConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  app: {
    environment: (import.meta.env.VITE_APP_ENV || 'development') as 'development' | 'production' | 'test',
    debug: import.meta.env.VITE_DEBUG === 'true',
  },
};

// Validate on module load
validateEnv();
