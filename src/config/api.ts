/**
 * API Configuration and URL Helpers
 */

// Get base API URL from environment or fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Get the API base URL with proper protocol and no trailing slash
 */
export const getApiUrl = (): string => {
  // Remove trailing slash if present
  const cleanUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  
  // Force HTTPS in production (but not for localhost)
  if (cleanUrl.startsWith('http://') && !cleanUrl.includes('localhost') && !cleanUrl.includes('127.0.0.1')) {
    return cleanUrl.replace('http://', 'https://');
  }
  
  return cleanUrl;
};

/**
 * Build a full API URL ensuring no double slashes
 */
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${getApiUrl()}/${cleanEndpoint}`;
};

/**
 * Get common headers for API requests
 */
export const getCommonHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

/**
 * Log API request details in development
 */
export const logApiRequest = (method: string, url: string, headers: HeadersInit): void => {
  if (import.meta.env.DEV) {
    console.log(`[API ${method}] ${url}`, {
      headers: { ...headers },
      baseUrl: getApiUrl(),
      environment: import.meta.env.MODE,
    });
  }
}; 