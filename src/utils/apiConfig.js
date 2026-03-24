/**
 * API Configuration Utility
 * Handles API base URL with proper path management
 */

/**
 * Safely get window hostname
 * @returns {string|null} Hostname or null if not available
 */
const getHostname = () => {
  try {
    if (typeof globalThis !== 'undefined' && 
        globalThis.window && 
        globalThis.window.location && 
        globalThis.window.location.hostname) {
      return globalThis.window.location.hostname;
    }
  } catch (error) {
    // Silently fail if window is not available (SSR, build time, etc.)
  }
  return null;
};

/**
 * Get the base API URL without trailing slashes or /api
 * @returns {string} Base API URL
 */
export const getApiBaseUrl = () => {
  let baseUrl;
  let source;

  // Priority 1: Check environment variable first
  if (import.meta.env.VITE_API_URL) {
    baseUrl = String(import.meta.env.VITE_API_URL).replace(/\/+$/, '');
    // Remove /api if it exists at the end (to prevent double /api/api)
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4);
    }
    source = 'VITE_API_URL env var';
  }
  // Priority 2: Runtime check - If running on production domain, use same domain for API
  else {
    const hostname = getHostname();
    if (hostname) {
      // If running on itweb1068.cpkku.com, use same domain for API
      if (hostname === 'itweb1068.cpkku.com') {
        baseUrl = 'https://itweb1068.cpkku.com';
        source = `hostname: ${hostname}`;
      }
      // If running on Vercel frontend, use Vercel backend
      else if (hostname.includes('vercel.app') || hostname.includes('bearthai-frontend')) {
        baseUrl = 'https://bearthai-backend.vercel.app';
        source = `hostname: ${hostname} (Vercel frontend)`;
      }
      // If not localhost and not production domain, use Vercel backend
      else if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168.') && !hostname.includes('10.')) {
      baseUrl = 'https://bearthai-backend.vercel.app';
      source = `hostname: ${hostname}`;
      }
    }
  }
  // Priority 3: Check build mode
  if (!baseUrl && import.meta.env.MODE === 'production') {
    // Default to backend URL in production
    const hostname = getHostname();
    if (hostname === 'itweb1068.cpkku.com') {
      baseUrl = 'https://itweb1068.cpkku.com';
      source = 'production mode (itweb1068)';
    } else {
    baseUrl = 'https://bearthai-backend.vercel.app';
      source = 'production mode (Vercel)';
    }
  }
  // Priority 4: Default to localhost for development
  if (!baseUrl) {
    baseUrl = 'http://localhost:3000';
    source = 'default (dev)';
  }

  // Log only in development to reduce console noise; production uses same URL
  try {
    if (import.meta.env.DEV) {
      console.log(`[API Config] Using backend URL: ${baseUrl} (source: ${source})`);
      const hostname = getHostname();
      if (hostname) console.log(`[API Config] Current hostname: ${hostname}`);
    }
  } catch (_) {}

  return baseUrl;
};

/**
 * Get full API URL for a specific endpoint
 * Automatically adds /api prefix if not already in base URL
 * @param {string} endpoint - API endpoint (e.g., '/auth/login' or 'auth/login')
 * @returns {string} Full API URL
 */
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();

  // Remove leading slash from endpoint if exists
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Ensure /api is included
  const apiPath = cleanEndpoint.startsWith('api/')
    ? cleanEndpoint
    : `api/${cleanEndpoint}`;

  return `${baseUrl}/${apiPath}`;
};

