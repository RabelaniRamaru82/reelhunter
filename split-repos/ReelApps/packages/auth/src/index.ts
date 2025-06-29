// Auth package exports
export * from './sso';
export * from './authStore';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Enhanced error types
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// Module-level variable to hold the Supabase client
let supabaseClientInstance: SupabaseClient | null = null;

export const initializeSupabase = (url: string, key: string) => {
  console.log('Initializing Supabase with:', { url: url.substring(0, 20) + '...', key: key.substring(0, 10) + '...' });
  supabaseClientInstance = createClient(url, key);
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClientInstance) {
    throw new Error('Supabase client not initialized. Call initializeSupabase first.');
  }
  return supabaseClientInstance;
};