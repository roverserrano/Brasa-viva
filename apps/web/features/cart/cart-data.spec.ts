import { describe, expect, it } from 'vitest';
import { readSavedCart } from './cart-data';

const branch = { id: '00000000-0000-4000-8000-000000000001', name: 'Centro', slug: 'centro' };
const item = {
  productId: '00000000-0000-4000-8000-000000000002',
  name: 'Pollo',
  unitPrice: '32.00',
  quantity: 2
};
describe('saved cart recovery', () => {
  it('restores a valid cart without trusting saved actions', () => {
    expect(readSavedCart({ branch, items: [item], clear: 'malicious' })).toEqual({
      branch,
      items: [item]
    });
  });
  it('discards malformed, duplicated or oversized carts', () => {
    for (const items of [
      [{ ...item, quantity: 100 }],
      [item, item],
      [{ ...item, unitPrice: 'NaN' }]
    ]) {
      expect(readSavedCart({ branch, items })).toEqual({ branch: null, items: [] });
    }
    expect(readSavedCart({ branch: null, items: [item] })).toEqual({ branch: null, items: [] });
  });
});
