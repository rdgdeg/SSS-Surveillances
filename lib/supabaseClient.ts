import { createClient } from '@supabase/supabase-js';
import { env } from '../src/config/env';

/**
 * Supabase client instance
 * Configuration is loaded from environment variables and validated at startup
 */
export const supabase = createClient(env.supabase.url, env.supabase.anonKey);
