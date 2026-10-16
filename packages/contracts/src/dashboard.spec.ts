import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { dashboardInsightsSchema, dashboardQuerySchema } from './dashboard';
describe('dashboard input bounds', () => {
  it('accepts only the supported periods and valid branch identities', () => {
    expect(dashboardQuerySchema.parse({})).toEqual({ days: 30 });
    expect(dashboardQuerySchema.parse({ days: '7' })).toEqual({ days: 7 });
    for (const days of ['365', '0', '-1', '7.5', 'anything', ['7', '30']])
      expect(dashboardQuerySchema.safeParse({ days }).success).toBe(false);
    expect(dashboardQuerySchema.safeParse({ branchId: "' OR 1=1" }).success).toBe(false);
  });
  it('publishes its response as OpenAPI without transforms that break API startup', () => {
    const schema = z.toJSONSchema(dashboardInsightsSchema, { target: 'openapi-3.0' });
    expect(schema.type).toBe('object');
    expect(schema.properties).toHaveProperty('current');
    expect(dashboardInsightsSchema.shape.current.shape.amount.parse('10000000000.00')).toBe(
      '10000000000.00'
    );
  });
});
