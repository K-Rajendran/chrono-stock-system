'use client';

const ACCESS_TOKEN_KEY = 'sxt_token';
const REFRESH_TOKEN_KEY = 'sxt_refresh_token';
let refreshInFlight: Promise<string | null> | null = null;

type TokenResponse = {
  accessToken?: string;
  refreshToken?: string;
};

export function saveTokens({ accessToken, refreshToken }: TokenResponse) {
  if (typeof window === 'undefined') return;
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new Error('Invalid access token response');
  }
  if (typeof refreshToken !== 'string' || !refreshToken) {
    throw new Error('Invalid refresh token response');
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('sxt_user');
  window.dispatchEvent(new Event('auth-updated'));
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Another browser tab may have rotated the shared localStorage token.
        if (localStorage.getItem(REFRESH_TOKEN_KEY) !== refreshToken) {
          return localStorage.getItem(ACCESS_TOKEN_KEY);
        }
        return null;
      }

      const tokens: TokenResponse = await response.json();
      saveTokens(tokens);
      return tokens.accessToken ?? null;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

function buildRequest(input: RequestInfo | URL, init: RequestInit | undefined, accessToken: string | null) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));

  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  return input instanceof Request
    ? new Request(input, { ...init, headers })
    : new Request(input, { ...init, headers });
}

function redirectToLogin() {
  if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    window.location.assign('/login');
  }
}

/**
 * Sends an authenticated API request, refreshes a rotated token once after a
 * 401, and retries the original request once with the new access token.
 */
export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof window === 'undefined') return fetch(input, init);

  const tokenUsed = localStorage.getItem(ACCESS_TOKEN_KEY);
  const initialRequest = buildRequest(input, init, tokenUsed);
  const retrySource = initialRequest.clone();
  const response = await fetch(initialRequest);

  if (response.status !== 401 || !tokenUsed) return response;

  // A parallel request may already have completed the rotation.
  const currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshedToken = currentToken && currentToken !== tokenUsed
    ? currentToken
    : await refreshAccessToken();

  if (!refreshedToken) {
    clearAuthSession();
    redirectToLogin();
    return response;
  }

  const retryHeaders = new Headers(retrySource.headers);
  retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);
  return fetch(new Request(retrySource, { headers: retryHeaders }));
}
