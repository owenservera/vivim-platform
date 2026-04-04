const CSRF_TOKEN_COOKIE = 'csrf_token';

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=');
    if (name === CSRF_TOKEN_COOKIE) {
      return valueParts.join('=') || null;
    }
  }
  
  return null;
}

export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  if (!token) return {};
  
  return {
    'x-csrf-token': token
  };
}
