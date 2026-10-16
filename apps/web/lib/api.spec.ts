import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './api';

describe('resolveApiBaseUrl', () => {
  it('uses the configured public API URL and removes its trailing slash', () => {
    expect(resolveApiBaseUrl('https://api.example.com/api/v1/', 'production')).toBe(
      'https://api.example.com/api/v1'
    );
  });

  it('uses the local API endpoint during development when no URL is configured', () => {
    expect(resolveApiBaseUrl(undefined, 'development')).toBe('http://127.0.0.1:4000/api/v1');
  });

  it('requires an explicit URL outside development', () => {
    expect(resolveApiBaseUrl(undefined, 'production')).toBeUndefined();
  });
});
