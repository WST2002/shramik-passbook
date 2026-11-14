import { describe, expect, it } from 'vitest';
import {
  buildRequest,
  checksum,
  markConfirmed,
  MAX_DAYS_PER_REQUEST,
  decodeConfirmationCode,
  decodeRequest,
  encodeConfirmationCode,
  encodeRequest,
  findConfirmationCode,
  newEntryId,
  type ConfirmRequest,
} from './payload';
import type { WorkEntry } from './types';

const request: ConfirmRequest = {
  v: 1,
  worker: 'रामू',
  workerPhone: '9876543210',
  contractor: 'रमेश ठेकेदार',
  days: [
    { id: 'a1b2c3', date: '2026-11-10', site: 'गोमती नगर', workType: 'mason', wage: 700 },
    { id: 'd4e5f6', date: '2026-11-11', site: 'Gomti Nagar', workType: 'helper', wage: 500 },
  ],
};

describe('request payload', () => {
  it('round-trips Hindi text through a URL-safe string', () => {
    const encoded = encodeRequest(request);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeRequest(encoded)).toEqual(request);
  });

  it('accepts a leading hash', () => {
    expect(decodeRequest(`#${encodeRequest(request)}`)).toEqual(request);
  });

  it('rejects broken or foreign payloads', () => {
    expect(decodeRequest('not-base64!!')).toBeUndefined();
    expect(decodeRequest(btoa('{"v":2}'))).toBeUndefined();
    expect(decodeRequest(btoa('{"v":1,"worker":"x","contractor":"y","days":[{"id":"zz"}]}'))).toBeUndefined();
  });
});

describe('confirmation code', () => {
  it('round-trips the confirmed entry ids', () => {
    const code = encodeConfirmationCode(['a1b2c3', 'd4e5f6']);
    expect(code).toMatch(/^SP1-a1b2c3d4e5f6-[0-9a-z]{4}$/);
    expect(decodeConfirmationCode(code)).toEqual({ ok: true, ids: ['a1b2c3', 'd4e5f6'] });
  });

  it('detects a typing mistake through the checksum', () => {
    const code = encodeConfirmationCode(['a1b2c3']);
    const typo = code.replace('a1b2c3', 'a1b2c4');
    expect(decodeConfirmationCode(typo)).toEqual({ ok: false, reason: 'checksum' });
  });

  it('rejects text that is not a code', () => {
    expect(decodeConfirmationCode('hello')).toEqual({ ok: false, reason: 'format' });
    expect(decodeConfirmationCode('SP1-abc-0000')).toEqual({ ok: false, reason: 'format' });
  });

  it('finds the code inside a forwarded WhatsApp message', () => {
    const code = encodeConfirmationCode(['a1b2c3']);
    const message = `रमेश ने 1 दिन की पुष्टि की।\nकोड: ${code}\nhttps://example.org/#code=${code}`;
    expect(findConfirmationCode(message)).toBe(code);
    expect(findConfirmationCode('no code here')).toBeUndefined();
  });

  it('uses a stable four character checksum', () => {
    expect(checksum('a1b2c3')).toBe(checksum('a1b2c3'));
    expect(checksum('a1b2c3')).not.toBe(checksum('a1b2c4'));
    expect(checksum('')).toHaveLength(4);
  });
});

describe('newEntryId', () => {
  it('creates six character lowercase ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newEntryId()));
    for (const id of ids) expect(id).toMatch(/^[0-9a-z]{6}$/);
    expect(ids.size).toBe(200);
  });
});

function workEntry(id: string, date: string): WorkEntry {
  return {
    id,
    date,
    workType: 'mason',
    site: 'गोमती नगर',
    contractorName: 'रमेश',
    contractorPhone: '',
    wageAgreed: 700,
    wagePaid: 700,
    createdAt: `${date}T10:00:00.000Z`,
  };
}

describe('buildRequest', () => {
  it('builds a request that survives encoding and caps the day count', () => {
    const entries = Array.from({ length: 40 }, (_, i) => workEntry(`a${String(i).padStart(5, '0')}`, '2026-11-01'));
    const built = buildRequest({ name: 'रामू', phone: '' }, 'रमेश', entries);
    expect(built.days).toHaveLength(MAX_DAYS_PER_REQUEST);
    expect(built.workerPhone).toBeUndefined();
    expect(decodeRequest(encodeRequest(built))).toEqual(JSON.parse(JSON.stringify(built)));
  });
});

describe('markConfirmed', () => {
  it('marks only the confirmed ids and counts them', () => {
    const entries = [workEntry('aaaaaa', '2026-11-01'), workEntry('bbbbbb', '2026-11-02')];
    const result = markConfirmed(entries, ['bbbbbb', 'zzzzzz'], '2026-11-03T00:00:00.000Z');
    expect(result.applied).toBe(1);
    expect(result.entries[0].confirmation).toBeUndefined();
    expect(result.entries[1].confirmation).toEqual({ confirmedAt: '2026-11-03T00:00:00.000Z', contractorName: 'रमेश' });
  });

  it('keeps the first confirmation time when the same code is applied again', () => {
    const first = markConfirmed([workEntry('aaaaaa', '2026-11-01')], ['aaaaaa'], '2026-11-03T00:00:00.000Z');
    const again = markConfirmed(first.entries, ['aaaaaa'], '2026-11-20T00:00:00.000Z');
    expect(again.applied).toBe(1);
    expect(again.entries[0].confirmation?.confirmedAt).toBe('2026-11-03T00:00:00.000Z');
  });
});
