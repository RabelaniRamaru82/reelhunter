import React, { useEffect, useState } from 'react'
import { useAuthStore, initializeSupabase, initializeAuthListener } from '@reelapps/auth'
import { AppWrapper } from '@reelapps/ui'
import ReelHunter from './components/ReelHunter'
import './index.css'

function App() {
  const {
    initialize,
    isLoading,
    isInitializing: storeInitializing,
    isAuthenticated,
    user,
    profile,
    login,
    signup,
    sendPasswordResetEmail,
    error,
  } = useAuthStore();
  const [localInitializing, setLocalInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) throw new Error('Missing Supabase env');
        
        initializeSupabase(supabaseUrl, supabaseAnonKey);
        initializeAuthListener();
        await initialize();
      } catch (error) {
        setInitError(error instanceof Error ? error.message : 'Init error');
      } finally {
        setLocalInitializing(false);
      }
    };
    init();

    // Force dark mode and gradient background
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('gradient-background');
  }, [initialize]);

  if (localInitializing || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (initError) {
    return <div className="min-h-screen flex items-center justify-center">{initError}</div>;
  }

  return (
    <AppWrapper
      isAuthenticated={isAuthenticated}
      isInitializing={storeInitializing ?? false}
      user={user}
      error={error ?? null}
      onLogin={login}
      onSignup={signup}
      onPasswordReset={sendPasswordResetEmail}
      isLoading={isLoading ?? false}
    >
      {profile?.role !== 'recruiter' ? (
        <div className="min-h-screen flex items-center justify-center">
          <p>ReelHunter is only available for recruiters.</p>
        </div>
      ) : (
        <ReelHunter />
      )}
    </AppWrapper>
  );
}

export default App