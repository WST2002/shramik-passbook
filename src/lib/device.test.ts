import { describe, expect, it } from 'vitest';
import { waNumber, whatsappLink } from './device';

describe('waNumber', () => {
  it('adds 91 to a bare 10-digit mobile number', () => {
    expect(waNumber('98765 43210')).toBe('919876543210');
  });

  it('keeps a number that already has +91', () => {
    expect(waNumber('+91 98765 43210')).toBe('919876543210');
  });

  it('drops the trunk 0 before a 10-digit mobile number', () => {
    expect(waNumber('098765 43210')).toBe('919876543210');
  });

  it('drops the 00 international prefix', () => {
    expect(waNumber('0091 98765 43210')).toBe('919876543210');
  });

  it('returns nothing for an empty number so WhatsApp opens the contact picker', () => {
    expect(waNumber('')).toBe('');
  });
});

describe('whatsappLink', () => {
  it('encodes Hindi text', () => {
    const link = new URL(whatsappLink('9876543210', 'नमस्ते जी'));
    expect(link.pathname).toBe('/919876543210');
    expect(link.searchParams.get('text')).toBe('नमस्ते जी');
  });
});
