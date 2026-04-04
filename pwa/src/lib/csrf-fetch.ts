import { getCsrfToken, csrfHeaders } from './csrf';

export interface CsrfFetchOptions extends RequestInit {
  skipCsrf?: boolean;
}

const CSRF_SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export async function csrfFetch(
  url: string,
  options: CsrfFetchOptions = {}
): Promise<Response> {
  const { skipCsrf = false, ...fetchOptions } = options;
  
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const isCsrfSafe = CSRF_SAFE_METHODS.includes(method) || skipCsrf;
  
  const headers = new Headers(fetchOptions.headers);
  
  if (!isCsrfSafe) {
    const csrfHeader = csrfHeaders();
    Object.entries(csrfHeader).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  const finalOptions: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include',
  };
  
  return fetch(url, finalOptions);
}
