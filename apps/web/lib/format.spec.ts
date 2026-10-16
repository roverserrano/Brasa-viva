import { describe, expect, it } from 'vitest';
import { formatBs, formatCount } from './format';

describe('formatBs', () => {
  it('formats numbers with boliviano symbol and two decimals', () => {
    expect(formatBs(32.5)).toBe('Bs\u00A032,50');
    expect(formatBs(0)).toBe('Bs\u00A00,00');
  });

  it('accepts decimal strings from the API', () => {
    expect(formatBs('32.00')).toBe('Bs\u00A032,00');
    expect(formatBs('1234.5')).toBe('Bs\u00A01.234,50');
  });
});

describe('formatCount', () => {
  it('groups thousands with the local separator', () => {
    expect(formatCount(1240)).toBe('1.240');
    expect(formatCount(7)).toBe('7');
  });
});
