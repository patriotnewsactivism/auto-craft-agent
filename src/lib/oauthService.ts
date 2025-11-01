/**
 * OAuth Service for One-Click Login
 * Handles OAuth flows for GitHub, Google (for Gemini), and Supabase
 */

import { apiKeyStorage, safeStorage } from './safeStorage';

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  provider: 'github' | 'google' | 'supabase';
}

class OAuthService {
  private readonly STORAGE_PREFIX = 'oauth_';

  /**
   * GitHub OAuth Login
   */
  async loginWithGitHub(): Promise<void> {
    const clientId = import.meta.env.VITE_GITHUB_OAUTH_CLIENT_ID || 'Ov23liAgeMtxgXIPOUSg';
    const redirectUri = `${window.location.origin}/oauth/github/callback`;
    const scope = 'repo user';

    // Store current URL for redirect after auth
    sessionStorage.setItem('oauth_redirect', window.location.pathname);

    // Open GitHub OAuth in popup
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    
    const popup = window.open(
      authUrl,
      'GitHub OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for OAuth callback
    return new Promise((resolve, reject) => {
      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          // Check if token was stored
          const token = this.getToken('github');
          if (token) {
            resolve();
          } else {
            reject(new Error('OAuth cancelled'));
          }
        }
      }, 1000);

      // Listen for message from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'github_oauth_success') {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          this.storeToken('github', {
            accessToken: event.data.token,
            provider: 'github'
          });
          popup?.close();
          resolve();
        } else if (event.data.type === 'github_oauth_error') {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  /**
   * Google OAuth Login (for Gemini API)
   */
  async loginWithGoogle(): Promise<void> {
    const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || '1090679958102-2ht9e5v7tvtvt64e28k4sgp6upglb5id.apps.googleusercontent.com';
    const redirectUri = `${window.location.origin}/oauth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/generative-language.tuning';

    sessionStorage.setItem('oauth_redirect', window.location.pathname);

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&access_type=offline`;

    const popup = window.open(
      authUrl,
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    return new Promise((resolve, reject) => {
      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          const token = this.getToken('google');
          if (token) {
            resolve();
          } else {
            reject(new Error('OAuth cancelled'));
          }
        }
      }, 1000);

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'google_oauth_success') {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          this.storeToken('google', {
            accessToken: event.data.token,
            refreshToken: event.data.refresh_token,
            expiresAt: event.data.expires_at,
            provider: 'google'
          });
          popup?.close();
          resolve();
        } else if (event.data.type === 'google_oauth_error') {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  /**
   * Supabase OAuth Login
   */
  async loginWithSupabase(): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    // For Supabase, we'll use their hosted auth UI
    const redirectUri = `${window.location.origin}/oauth/supabase/callback`;
    
    sessionStorage.setItem('oauth_redirect', window.location.pathname);

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(redirectUri)}`;

    const popup = window.open(
      authUrl,
      'Supabase OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    return new Promise((resolve, reject) => {
      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          const token = this.getToken('supabase');
          if (token) {
            resolve();
          } else {
            reject(new Error('OAuth cancelled'));
          }
        }
      }, 1000);

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'supabase_oauth_success') {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          this.storeToken('supabase', {
            accessToken: event.data.token,
            refreshToken: event.data.refresh_token,
            provider: 'supabase'
          });
          popup?.close();
          resolve();
        } else if (event.data.type === 'supabase_oauth_error') {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  /**
   * Store OAuth token securely
   */
  private storeToken(provider: 'github' | 'google' | 'supabase', token: OAuthToken): void {
    safeStorage.setJSON(`${this.STORAGE_PREFIX}${provider}`, token, { useBackup: true });
    
    // Also store in persistent API key storage for backwards compatibility
    if (provider === 'github') {
      apiKeyStorage.saveAPIKey('github_token', token.accessToken);
    } else if (provider === 'google') {
      apiKeyStorage.saveAPIKey('google_api_key', token.accessToken);
    } else if (provider === 'supabase') {
      apiKeyStorage.saveAPIKey('supabase_key', token.accessToken);
    }
  }

  /**
   * Get stored OAuth token
   */
  getToken(provider: 'github' | 'google' | 'supabase'): OAuthToken | null {
    return safeStorage.getJSON<OAuthToken>(`${this.STORAGE_PREFIX}${provider}`, null, { useBackup: true });
  }

  /**
   * Check if user is authenticated with a provider
   */
  isAuthenticated(provider: 'github' | 'google' | 'supabase'): boolean {
    const token = this.getToken(provider);
    if (!token) return false;

    // Check if token is expired
    if (token.expiresAt && token.expiresAt < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Logout from a provider
   */
  logout(provider: 'github' | 'google' | 'supabase'): void {
    safeStorage.removeItem(`${this.STORAGE_PREFIX}${provider}`);
    
    // Also remove from API key storage
    if (provider === 'github') {
      apiKeyStorage.removeAPIKey('github_token');
    } else if (provider === 'google') {
      apiKeyStorage.removeAPIKey('google_api_key');
    } else if (provider === 'supabase') {
      apiKeyStorage.removeAPIKey('supabase_key');
      apiKeyStorage.removeAPIKey('supabase_url');
    }
  }

  /**
   * Get user info from GitHub
   */
  async getGitHubUser(): Promise<any> {
    const token = this.getToken('github');
    if (!token) throw new Error('Not authenticated with GitHub');

    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub user');
    }

    return response.json();
  }
}

export const oauthService = new OAuthService();
