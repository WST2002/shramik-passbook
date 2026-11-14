import { describe, expect, it } from 'vitest';
import { parseEntryText, wordsToNumber } from './parser';

const TODAY = '2026-11-14';

describe('wordsToNumber', () => {
  it('reads Hindi number words in Devanagari', () => {
    expect(wordsToNumber(['सात', 'सौ'])).toBe(700);
    expect(wordsToNumber(['पाँच', 'सौ', 'पचास'])).toBe(550);
    expect(wordsToNumber(['एक', 'हज़ार', 'दो', 'सौ'])).toBe(1200);
  });

  it('reads Hinglish number words', () => {
    expect(wordsToNumber(['saat', 'sau'])).toBe(700);
    expect(wordsToNumber(['dhai', 'sau'])).toBe(250);
    expect(wordsToNumber(['sadhe', 'teen', 'sau'])).toBe(350);
    expect(wordsToNumber(['dedh', 'hazaar'])).toBe(1500);
  });

  it('returns undefined for words that are not numbers', () => {
    expect(wordsToNumber(['ramesh'])).toBeUndefined();
  });
});

describe('parseEntryText', () => {
  it('parses a full Hinglish sentence', () => {
    const result = parseEntryText(
      'aaj Ramesh thekedar ke yahan Gomti Nagar mein mistri ka kaam, 700 tay hua, ₹500 mile, 200 baaki',
      TODAY,
    );
    expect(result).toEqual({
      date: '2026-11-14',
      workType: 'mason',
      contractorName: 'Ramesh',
      site: 'Gomti Nagar',
      wageAgreed: 700,
      wagePaid: 500,
    });
  });

  it('parses Devanagari speech output with number words', () => {
    const result = parseEntryText(
      'कल सुरेश ठेकेदार के यहाँ आलमबाग में बेलदारी की सात सौ तय हुए पाँच सौ मिले',
      TODAY,
    );
    expect(result.date).toBe('2026-11-13');
    expect(result.workType).toBe('helper');
    expect(result.contractorName).toBe('सुरेश');
    expect(result.site).toBe('आलमबाग');
    expect(result.wageAgreed).toBe(700);
    expect(result.wagePaid).toBe(500);
  });

  it('works out the paid amount from agreed and pending', () => {
    const result = parseEntryText('dihadi 600, 200 baaki', TODAY);
    expect(result.wageAgreed).toBe(600);
    expect(result.wagePaid).toBe(400);
  });

  it('works out the agreed amount from paid and pending', () => {
    const result = parseEntryText('500 mile 300 baaki', TODAY);
    expect(result.wageAgreed).toBe(800);
    expect(result.wagePaid).toBe(500);
  });

  it('treats a lone amount as the agreed wage', () => {
    expect(parseEntryText('painter ka kaam 650 rupaye', TODAY)).toEqual({
      workType: 'painter',
      wageAgreed: 650,
    });
  });

  it('reads parson and a date of the month', () => {
    expect(parseEntryText('parson plumber', TODAY).date).toBe('2026-11-12');
    expect(parseEntryText('5 tarikh ko kaam kiya', TODAY).date).toBe('2026-11-05');
    expect(parseEntryText('20 तारीख', TODAY).date).toBe('2026-10-20');
  });

  it('picks the contractor name after the word thekedar', () => {
    const result = parseEntryText('thekedar Mohan ke saath carpenter', TODAY);
    expect(result.contractorName).toBe('Mohan');
    expect(result.workType).toBe('carpenter');
  });

  it('reads a 10 digit phone number without treating it as money', () => {
    const result = parseEntryText('Ramesh thekedar 9876543210 bijli ka kaam 800', TODAY);
    expect(result.contractorPhone).toBe('9876543210');
    expect(result.workType).toBe('electrician');
    expect(result.wageAgreed).toBe(800);
  });

  it('returns an empty object for empty input', () => {
    expect(parseEntryText('   ', TODAY)).toEqual({});
  });
});
