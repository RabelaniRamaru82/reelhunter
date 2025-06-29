// SSO utilities for cross-subdomain authentication
export const SSO_CONFIG = {
  MAIN_DOMAIN: 'reelapps.co.za',
  COOKIE_DOMAIN: '.reelapps.co.za',
  AUTH_COOKIE_NAME: 'reelapps_auth_token',
  REFRESH_COOKIE_NAME: 'reelapps_refresh_token',
};

export function getAuthDomain(): string {
  return import.meta.env.VITE_AUTH_DOMAIN || SSO_CONFIG.MAIN_DOMAIN;
}

export function getCurrentDomain(): string {
  return import.meta.env.VITE_DOMAIN || (typeof window !== 'undefined' ? window.location.hostname : '');
}

export function isMainDomain(): boolean {
  return getCurrentDomain() === getAuthDomain() || getCurrentDomain().includes('localhost');
}

export function shouldRedirectToAuth(): boolean {
  return !isMainDomain() && !hasValidAuthToken();
}

export function createAuthRedirectUrl(returnUrl?: string): string {
  const authDomain = getAuthDomain();
  const currentDomain = getCurrentDomain();
  const redirectUrl = returnUrl || `https://${currentDomain}`;
  return `https://${authDomain}/login?redirect=${encodeURIComponent(redirectUrl)}`;
}

export function handleAuthRedirect(): void {
  if (shouldRedirectToAuth()) {
    const redirectUrl = createAuthRedirectUrl();
    window.location.href = redirectUrl;
  }
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

export function hasValidAuthToken(): boolean {
  const token = getCookie(SSO_CONFIG.AUTH_COOKIE_NAME);
  if (!token) return false;
  
  try {
    // Basic JWT validation - check if not expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function setAuthCookies(accessToken: string, refreshToken?: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
  
  const cookieOptions = `expires=${expires.toUTCString()}; domain=${SSO_CONFIG.COOKIE_DOMAIN}; path=/; secure; samesite=lax`;
  
  document.cookie = `${SSO_CONFIG.AUTH_COOKIE_NAME}=${accessToken}; ${cookieOptions}`;
  
  if (refreshToken) {
    const refreshExpires = new Date();
    refreshExpires.setTime(refreshExpires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    const refreshCookieOptions = `expires=${refreshExpires.toUTCString()}; domain=${SSO_CONFIG.COOKIE_DOMAIN}; path=/; secure; samesite=lax; httponly`;
    document.cookie = `${SSO_CONFIG.REFRESH_COOKIE_NAME}=${refreshToken}; ${refreshCookieOptions}`;
  }
}

export function clearAuthCookies(): void {
  const expiredDate = 'Thu, 01 Jan 1970 00:00:00 UTC';
  const cookieOptions = `expires=${expiredDate}; domain=${SSO_CONFIG.COOKIE_DOMAIN}; path=/;`;
  
  document.cookie = `${SSO_CONFIG.AUTH_COOKIE_NAME}=; ${cookieOptions}`;
  document.cookie = `${SSO_CONFIG.REFRESH_COOKIE_NAME}=; ${cookieOptions}`;
}

export function getAuthToken(): string | null {
  return getCookie(SSO_CONFIG.AUTH_COOKIE_NAME);
}

export function getRefreshToken(): string | null {
  return getCookie(SSO_CONFIG.REFRESH_COOKIE_NAME);
}

// SSO initialization for subdomain apps
export function initializeSSO(): Promise<boolean> {
  return new Promise((resolve) => {
    if (isMainDomain()) {
      // Main domain handles auth directly
      resolve(true);
      return;
    }
    
    // Check for auth token
    if (hasValidAuthToken()) {
      resolve(true);
      return;
    }
    
    // Check URL for auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (token) {
      // Store tokens from auth callback
      setAuthCookies(token, refreshToken || undefined);
      
      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      resolve(true);
      return;
    }
    
    // No valid auth, redirect to main domain
    resolve(false);
  });
}

// Cross-domain message handling for iframe-based SSO (alternative approach)
export function setupCrossDomainAuth(): void {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('message', (event) => {
    // Verify origin
    if (event.origin !== `https://${getAuthDomain()}`) return;
    
    if (event.data.type === 'AUTH_SUCCESS') {
      const { accessToken, refreshToken } = event.data;
      setAuthCookies(accessToken, refreshToken);
      window.location.reload();
    } else if (event.data.type === 'AUTH_LOGOUT') {
      clearAuthCookies();
      window.location.reload();
    }
  });
}

// Utility to post auth state to parent window (for iframe usage)
export function postAuthStateToParent(authState: { user: any; token: string | null }): void {
  if (typeof window === 'undefined' || window.parent === window) return;
  
  window.parent.postMessage({
    type: 'AUTH_STATE_UPDATE',
    authState
  }, `https://${getAuthDomain()}`);
} 