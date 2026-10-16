import { describe, expect, it } from 'vitest';
import { formatBusinessTime } from './business-hours';

describe('business clock display', () => {
  it('preserves local clock time from the Postgres UTC anchor without timezone shifts', () => {
    expect(formatBusinessTime('1970-01-01T11:30:00.000Z')).toBe('11:30');
    expect(formatBusinessTime('23:00')).toBe('23:00');
  });
  it('does not render invalid hours', () => {
    expect(formatBusinessTime('25:00')).toBe('Consultar');
    expect(formatBusinessTime('bad date')).toBe('Consultar');
  });
});
