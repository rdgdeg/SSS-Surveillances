import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkhawsjfyibvzvaptoap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraGF3c2pmeWlidnp2YXB0b2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNDkwNDAsImV4cCI6MjA3NzcyNTA0MH0.40aGVSt4z3Zi9DyUv4H2siiJKz8Xu5FXaqorzBptDtE';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
