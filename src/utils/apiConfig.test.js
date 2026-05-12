import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getApiUrl', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('builds /api path from VITE_API_URL without trailing slash', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:5400');
    vi.stubEnv('DEV', true);
    vi.stubEnv('MODE', 'development');
    const { getApiUrl } = await import('./apiConfig.js');
    expect(getApiUrl('/student/lessons')).toBe('http://localhost:5400/api/student/lessons');
  });

  it('strips /api suffix from VITE_API_URL if present', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api');
    vi.stubEnv('DEV', true);
    vi.stubEnv('MODE', 'development');
    const { getApiUrl } = await import('./apiConfig.js');
    expect(getApiUrl('auth/login')).toBe('http://localhost:3000/api/auth/login');
  });
});
