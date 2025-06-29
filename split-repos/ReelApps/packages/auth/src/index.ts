// Auth package exports
export * from './sso';

// Mock exports for development
export const useAuthStore = () => ({
  initialize: async () => {},
  isLoading: false,
  isInitializing: false,
  isAuthenticated: false,
  user: null,
  profile: null,
  login: async () => {},
  signup: async () => {},
  sendPasswordResetEmail: async () => {},
  error: null,
});

export const initializeSupabase = () => {};

export const getSupabaseClient = () => ({
  functions: {
    invoke: async () => ({ data: null, error: null })
  }
});