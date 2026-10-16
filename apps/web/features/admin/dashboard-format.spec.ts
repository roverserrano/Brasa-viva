import { describe, expect, it } from 'vitest';
import { comparisonLabel } from './dashboard-format';
describe('executive comparison labels', () => {
  it('does not invent growth for missing comparison data', () => {
    expect(comparisonLabel(30, 0)).toBe('Sin base comparable');
    expect(comparisonLabel(0, 0)).toBe('Sin variación');
    expect(comparisonLabel(120, 100)).toBe('+20.0% vs. período anterior');
    expect(comparisonLabel(0, 100)).toBe('-100.0% vs. período anterior');
  });
});
