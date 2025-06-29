// Config package exports
export const config = {
  supabase: {
    url: process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  },
  app: {
    name: 'ReelApps',
    version: '1.0.0',
  }
};