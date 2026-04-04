import { describe, it, expect } from 'vitest';

describe('CSRF (logic tests)', () => {
  const CSRF_TOKEN_COOKIE = 'csrf_token';

  function getCsrfTokenFromString(cookies: string): string | null {
    const cookieList = cookies ? cookies.split('; ') : [];
    for (const cookie of cookieList) {
      const [name, ...valueParts] = cookie.split('=');
      if (name === CSRF_TOKEN_COOKIE) {
        return valueParts.join('=') || null;
      }
    }
    return null;
  }

  function csrfHeadersFromToken(token: string | null): Record<string, string> {
    if (!token) return {};
    return { 'x-csrf-token': token };
  }

  it('returns null when empty string', () => {
    expect(getCsrfTokenFromString('')).toBeNull();
  });

  it('returns null when no matching cookie', () => {
    expect(getCsrfTokenFromString('other=value')).toBeNull();
  });

  it('extracts token from cookies', () => {
    expect(getCsrfTokenFromString('csrf_token=test-token; other=value')).toBe('test-token');
  });

  it('handles equals in token value', () => {
    expect(getCsrfTokenFromString('csrf_token=abc=def; other=value')).toBe('abc=def');
  });

  it('handles multiple cookies', () => {
    expect(getCsrfTokenFromString('a=1; csrf_token=my-token; b=2')).toBe('my-token');
  });

  describe('csrfHeaders', () => {
    it('returns empty when null', () => {
      expect(csrfHeadersFromToken(null)).toEqual({});
    });

    it('returns empty when empty string', () => {
      expect(csrfHeadersFromToken('')).toEqual({});
    });

    it('includes token when present', () => {
      expect(csrfHeadersFromToken('my-token')).toEqual({ 'x-csrf-token': 'my-token' });
    });
  });
});
