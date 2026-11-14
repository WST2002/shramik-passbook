import { describe, expect, it } from 'vitest';
import { codeFromHash, routeFromHash } from './routes';

describe('codeFromHash', () => {
  it('reads an encoded confirmation code', () => {
    expect(codeFromHash('#code=SP1-abcdef-12ab')).toBe('SP1-abcdef-12ab');
    expect(codeFromHash('#code=SP1%2Dabcdef%2D12ab')).toBe('SP1-abcdef-12ab');
  });

  it('does not throw on a cut-off percent escape from a forwarded link', () => {
    expect(codeFromHash('#code=SP1-abcdef-12ab%E0%A4')).toBe('SP1-abcdef-12ab%E0%A4');
  });
});

describe('routeFromHash', () => {
  it('falls back to home for unknown routes', () => {
    expect(routeFromHash('#/nope')).toBe('home');
    expect(routeFromHash('#/ledger')).toBe('ledger');
  });
});
