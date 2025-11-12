/**
 * Token management utilities
 */

const ACCESS_TOKEN_KEY = 'musicify_access_token';
const TOKEN_EXPIRY_KEY = 'musicify_token_expiry';

/**
 * Store access token and expiry time
 * @param {string} token - Access token
 * @param {number} expiresIn - Expiry time in seconds
 */
export function storeToken(token, expiresIn) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  const expiryTime = Date.now() + (expiresIn * 1000);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Get stored access token
 * @returns {string|null} Access token or null if not found/expired
 */
export function getToken() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) {
    return null;
  }

  // Check if token is expired
  if (Date.now() > parseInt(expiry)) {
    clearToken();
    return null;
  }

  return token;
}

/**
 * Check if token is expired
 * @returns {boolean}
 */
export function isTokenExpired() {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry);
}

/**
 * Clear stored token
 */
export function clearToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Refresh access token using backend endpoint
 * @returns {Promise<string|null>} New access token or null if refresh failed
 */
export async function refreshToken() {
  try {
    const base =
      import.meta.env.VITE_API_BASE_URL ||
      (typeof window !== 'undefined' && window.__API_BASE__) ||
      (import.meta.env.PROD ? 'https://musicify-backend.onrender.com' : 'http://localhost:5000');
    const response = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    storeToken(data.access_token, data.expires_in);
    return data.access_token;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearToken();
    return null;
  }
}

