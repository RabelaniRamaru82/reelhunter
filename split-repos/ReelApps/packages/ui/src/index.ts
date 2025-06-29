// UI package exports
import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-content gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500'
  };
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`.trim();
  
  return React.createElement('button', {
    type,
    className: finalClassName,
    disabled,
    onClick: disabled ? undefined : onClick,
    ...props
  }, children);
};

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
  interactive?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  variant = 'default',
  interactive = false,
  onClick,
  ...props 
}) => {
  const baseClasses = 'rounded-xl p-6 transition-all duration-300';
  
  const variantClasses = {
    default: 'border border-slate-700/50',
    glass: 'backdrop-blur-sm border border-slate-700/30',
    gradient: 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
  };
  
  // Always use the same background as the main app
  const backgroundStyle = variant === 'gradient' 
    ? {} 
    : { background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)' };
  
  const interactiveClasses = interactive ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : '';
  
  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`.trim();
  
  return React.createElement('div', {
    className: finalClassName,
    style: backgroundStyle,
    onClick: interactive ? onClick : undefined,
    ...props
  }, children);
};

export interface AppWrapperProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: any;
  error: any;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, firstName: string, lastName: string, role?: string) => Promise<void>;
  onPasswordReset: (email: string) => Promise<void>;
  isLoading: boolean;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({ 
  children, 
  isAuthenticated, 
  isInitializing,
  error,
  onLogin,
  onSignup,
  onPasswordReset,
  isLoading
}) => {
  const [showLogin, setShowLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Clear local error when global error changes
  React.useEffect(() => {
    if (error) {
      setLocalError(error.message);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    try {
      if (showLogin) {
        await onLogin(email, password);
      } else {
        await onSignup(email, password, firstName, lastName, 'recruiter');
      }
    } catch (err) {
      // Error is already handled in the store
    }
  };

  const authBackgroundStyle = {
    background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
    backgroundAttachment: 'fixed'
  };

  if (isInitializing) {
    return React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center',
      style: authBackgroundStyle
    }, React.createElement('div', {
      className: 'text-center'
    }, [
      React.createElement('div', {
        key: 'spinner',
        className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'
      }),
      React.createElement('p', {
        key: 'text',
        className: 'text-slate-400'
      }, 'Initializing...')
    ]));
  }

  if (!isAuthenticated) {
    return React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center',
      style: authBackgroundStyle
    }, React.createElement('div', {
      className: 'w-full max-w-md p-8 rounded-xl shadow-lg border border-slate-700/50',
      style: { background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)' }
    }, [
      React.createElement('h2', {
        key: 'title',
        className: 'text-2xl font-bold text-white mb-6 text-center'
      }, showLogin ? 'Sign In' : 'Sign Up'),
      
      localError && React.createElement('div', {
        key: 'error',
        className: 'mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm'
      }, localError),
      
      React.createElement('form', {
        key: 'form',
        onSubmit: handleSubmit,
        className: 'space-y-4'
      }, [
        !showLogin && React.createElement('div', {
          key: 'names',
          className: 'grid grid-cols-2 gap-4'
        }, [
          React.createElement('input', {
            key: 'firstName',
            type: 'text',
            placeholder: 'First Name',
            value: firstName,
            onChange: (e: any) => setFirstName(e.target.value),
            className: 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
            required: !showLogin
          }),
          React.createElement('input', {
            key: 'lastName',
            type: 'text',
            placeholder: 'Last Name',
            value: lastName,
            onChange: (e: any) => setLastName(e.target.value),
            className: 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
            required: !showLogin
          })
        ]),
        
        React.createElement('input', {
          key: 'email',
          type: 'email',
          placeholder: 'Email',
          value: email,
          onChange: (e: any) => setEmail(e.target.value),
          className: 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
          required: true
        }),
        
        React.createElement('input', {
          key: 'password',
          type: 'password',
          placeholder: 'Password',
          value: password,
          onChange: (e: any) => setPassword(e.target.value),
          className: 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
          required: true
        }),
        
        React.createElement('button', {
          key: 'submit',
          type: 'submit',
          disabled: isLoading,
          className: 'w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        }, isLoading ? 'Loading...' : (showLogin ? 'Sign In' : 'Sign Up')),
        
        React.createElement('button', {
          key: 'toggle',
          type: 'button',
          onClick: () => {
            setShowLogin(!showLogin);
            setLocalError(null);
          },
          className: 'w-full text-blue-400 hover:text-blue-300 text-sm transition-colors'
        }, showLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in')
      ])
    ]));
  }

  return React.createElement('div', {}, children);
};

// Error Boundary Component
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return React.createElement(this.props.fallback, { error: this.state.error! });
      }
      
      return React.createElement('div', {
        className: 'min-h-screen flex items-center justify-center',
        style: { background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)' }
      }, React.createElement('div', {
        className: 'text-center p-8 rounded-xl max-w-md border border-slate-700/50',
        style: { background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)' }
      }, [
        React.createElement('h2', {
          key: 'title',
          className: 'text-xl font-bold text-red-400 mb-4'
        }, 'Something went wrong'),
        React.createElement('p', {
          key: 'message',
          className: 'text-slate-300 mb-4'
        }, this.state.error?.message || 'An unexpected error occurred'),
        React.createElement('button', {
          key: 'reload',
          onClick: () => window.location.reload(),
          className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        }, 'Reload Page')
      ]));
    }

    return this.props.children;
  }
}