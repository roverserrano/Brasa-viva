import { describe, expect, it } from 'vitest';
import { RequestBudget } from './rate-limit.guard';

describe('request budget', () => {
  it('blocks abuse, isolates clients and renews expired windows', () => {
    const budget = new RequestBudget();
    expect(budget.consume('orders:client-a', 1, 0)).toBe(0);
    expect(budget.consume('orders:client-a', 1, 1)).toBe(60);
    expect(budget.consume('orders:client-b', 1, 1)).toBe(0);
    expect(budget.consume('orders:client-a', 1, 60_000)).toBe(0);
  });

  it('bounds memory and does not evict active clients to bypass limits', () => {
    const budget = new RequestBudget(1);
    expect(budget.consume('a', 1, 0)).toBe(0);
    expect(budget.consume('b', 1, 1)).toBe(60);
    expect(budget.consume('a', 1, 1)).toBe(60);
    expect(budget.consume('b', 1, 60_000)).toBe(0);
  });
});
