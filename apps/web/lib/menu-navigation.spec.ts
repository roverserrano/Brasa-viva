import { describe, expect, it } from 'vitest';
import { menuHref, normalizeMenuSearch, readMenuContext, withCartBranch } from './menu-navigation';

describe('menu navigation context', () => {
  it('resumes a cart branch while preserving search, category and fragment', () => {
    const href = withCartBranch('/menu?q=pollo&category=combos#lista', 'centro');
    const url = new URL(href, 'https://example.test');
    expect(url.searchParams.get('branch')).toBe('centro');
    expect(url.searchParams.get('q')).toBe('pollo');
    expect(url.searchParams.get('category')).toBe('combos');
    expect(url.hash).toBe('#lista');
  });
  it('never replaces an explicit branch or an unrelated destination', () => {
    for (const href of [
      '/menu?branch=norte',
      '/menu?branch=',
      '/sucursales',
      '/menu/producto?branch=norte',
      'https://example.test/menu'
    ])
      expect(withCartBranch(href, 'centro')).toBe(href);
    expect(withCartBranch('/menu')).toBe('/menu');
  });
  it('roundtrips a filtered product link into a menu link', () => {
    const context = { branch: 'centro', q: 'Pollo & papas', category: 'pollos' };
    const product = new URL(menuHref(context, 'broaster'), 'https://example.test');
    expect(product.pathname).toBe('/menu/broaster');
    expect(menuHref(readMenuContext(Object.fromEntries(product.searchParams)))).toBe(
      menuHref(context)
    );
  });
  it('ignores repeated or unknown parameters and bounds user text', () => {
    expect(
      readMenuContext({
        branch: ['a', 'b'],
        q: ' pollo ',
        category: '',
        redirect: 'https://example.test'
      })
    ).toEqual({ q: 'pollo' });
    expect(readMenuContext({ q: 'a'.repeat(200) }).q).toHaveLength(160);
  });
  it('matches Spanish names regardless of accents and letter case', () => {
    expect(normalizeMenuSearch('  CLÁSICO  ')).toBe('clasico');
    expect(normalizeMenuSearch('Pollo clásico')).toContain(normalizeMenuSearch('clasico'));
  });
  it('roundtrips only supported sort options with product links', () => {
    const context = readMenuContext({ branch: 'centro', q: 'pollo con papas', sort: 'price-asc' });
    expect(
      readMenuContext(
        Object.fromEntries(new URL(menuHref(context, 'pollo'), 'https://example.test').searchParams)
      )
    ).toEqual(context);
    expect(readMenuContext({ sort: 'arbitrary' })).toEqual({});
    expect(readMenuContext({ sort: ['price-asc', 'price-desc'] })).toEqual({});
  });
});
