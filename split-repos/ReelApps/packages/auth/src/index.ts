// Auth package exports
export * from './sso';

import { create } from 'zustand';

// Enhanced error types
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface AuthState {
  user: any | null;
  profile: any | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string, role?: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  clearError: () => void;
}

// Enhanced auth store with better error handling
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitializing: false,
  isAuthenticated: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    set({ isInitializing: true, error: null });
    try {
      // Mock initialization - in real app this would check for existing session
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ isInitializing: false });
    } catch (error) {
      set({ 
        isInitializing: false, 
        error: { 
          code: 'INIT_ERROR', 
          message: 'Failed to initialize authentication',
          details: error
        }
      });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Mock login - in real app this would call Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate login failure for demo
      if (email === 'fail@example.com') {
        throw new Error('Invalid credentials');
      }
      
      set({ 
        isLoading: false, 
        isAuthenticated: true,
        user: { id: '1', email },
        profile: { id: '1', first_name: 'Demo', last_name: 'User', role: 'recruiter' }
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: { 
          code: 'LOGIN_ERROR', 
          message: error instanceof Error ? error.message : 'Login failed',
          details: error
        }
      });
      throw error;
    }
  },

  signup: async (email: string, password: string, firstName: string, lastName: string, role = 'candidate') => {
    set({ isLoading: true, error: null });
    try {
      if (!email || !password || !firstName || !lastName) {
        throw new Error('All fields are required');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Mock signup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      set({ 
        isLoading: false, 
        isAuthenticated: true,
        user: { id: '1', email },
        profile: { id: '1', first_name: firstName, last_name: lastName, role }
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: { 
          code: 'SIGNUP_ERROR', 
          message: error instanceof Error ? error.message : 'Signup failed',
          details: error
        }
      });
      throw error;
    }
  },

  sendPasswordResetEmail: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      
      // Mock password reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: { 
          code: 'PASSWORD_RESET_ERROR', 
          message: error instanceof Error ? error.message : 'Password reset failed',
          details: error
        }
      });
      throw error;
    }
  },
}));

export const initializeSupabase = (url: string, key: string) => {
  console.log('Initializing Supabase with:', { url: url.substring(0, 20) + '...', key: key.substring(0, 10) + '...' });
};

export const getSupabaseClient = () => ({
  functions: {
    invoke: async (functionName: string, options?: any) => {
      try {
        // Mock function calls with realistic delays
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Simulate different responses based on function name
        if (functionName === 'match-candidates') {
          return { 
            data: [], 
            error: null 
          };
        }
        
        if (functionName === 'analyze-job') {
          return {
            data: {
              clarity: 75 + Math.random() * 25,
              realism: 70 + Math.random() * 30,
              inclusivity: 80 + Math.random() * 20,
              suggestions: [
                'Consider adding more specific technical requirements',
                'Include information about team size and structure',
                'Mention opportunities for professional development'
              ]
            },
            error: null
          };
        }
        
        return { data: null, error: null };
      } catch (error) {
        return { 
          data: null, 
          error: { 
            message: error instanceof Error ? error.message : 'Function call failed',
            code: 'FUNCTION_ERROR'
          }
        };
      }
    }
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null })
      })
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ data: null, error: null })
      })
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null })
        })
      })
    }),
    delete: () => ({
      eq: async () => ({ error: null })
    })
  })
});