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

  it('reads weekday names as the latest such day, today included', () => {
    expect(parseEntryText('सोमवार को बेलदारी', TODAY).date).toBe('2026-11-09');
    expect(parseEntryText('ravivar ko kaam', TODAY).date).toBe('2026-11-08');
    expect(parseEntryText('बृहस्पतिवार को पुताई', TODAY).date).toBe('2026-11-12');
    expect(parseEntryText('शनिवार को पुताई', TODAY).date).toBe(TODAY);
  });

  it('reads Bhojpuri day words', () => {
    expect(parseEntryText('काल्ह मिस्त्री के काम', TODAY).date).toBe('2026-11-13');
    expect(parseEntryText('आजु बेलदारी', TODAY).date).toBe(TODAY);
  });

  it('reads Devanagari digits', () => {
    const result = parseEntryText('आज ७०० रुपये की दिहाड़ी, ५०० मिले', TODAY);
    expect(result.wageAgreed).toBe(700);
    expect(result.wagePaid).toBe(500);
  });

  it('joins a phone number spoken in two halves', () => {
    const result = parseEntryText('मुकेश ठेकेदार का नंबर 98765 43210 है, बेलदारी 450', TODAY);
    expect(result.contractorPhone).toBe('9876543210');
    expect(result.wageAgreed).toBe(450);
    expect(parseEntryText('thekedar Rakesh +91 91234 56780, 800 tay', TODAY)).toMatchObject({
      contractorPhone: '9123456780',
      wageAgreed: 800,
    });
  });

  it('keeps two spoken hundreds as two amounts', () => {
    const result = parseEntryText('बिजली का काम, आठ सौ, चार सौ बाकी', TODAY);
    expect(result.wageAgreed).toBe(800);
    expect(result.wagePaid).toBe(400);
  });

  it('does not add a count of days to the wage', () => {
    expect(parseEntryText('kal mistri ka kaam, dedh hazaar do din ke', TODAY).wageAgreed).toBe(1500);
  });

  it('reads a contractor named with ji or sahab and ke yahan', () => {
    expect(parseEntryText('शर्मा जी के यहाँ पुताई की, 600', TODAY).contractorName).toBe('शर्मा');
    expect(parseEntryText('kal Verma sahab ke saath wiring ka kaam', TODAY).contractorName).toBe('Verma');
    expect(parseEntryText('काल्ह सिंह साहब के इहाँ लेबर के काम', TODAY).contractorName).toBe('सिंह');
    expect(parseEntryText('आज मालिक सेठ रामलाल के यहाँ मिस्त्री', TODAY).contractorName).toBe('रामलाल');
  });

  it('does not take Bhojpuri pronouns or day words as names or sites', () => {
    const result = parseEntryText('काल्ह हमरा रामू ठीकेदार के इहाँ मिस्त्री के काम कइलीं', TODAY);
    expect(result.contractorName).toBe('रामू');
    expect(parseEntryText('आजु बलिया में मिस्त्री के काम', TODAY).site).toBe('बलिया');
  });

  it('reads a site said with ke paas or wali site par', () => {
    expect(parseEntryText('कल चारबाग स्टेशन के पास मिस्त्री का काम', TODAY).site).toBe('चारबाग स्टेशन');
    expect(parseEntryText('आज जानकीपुरम वाली साइट पर मिस्त्री का काम', TODAY).site).toBe('जानकीपुरम');
  });

  it('does not take talk about money as a site', () => {
    expect(parseEntryText('चार सौ पचास, पैसे बाद में मिलेंगे', TODAY).site).toBeUndefined();
  });

  it('records nothing paid when the worker says the money did not come', () => {
    expect(parseEntryText('कल ६५० तय हुए थे, पैसे नहीं मिले', TODAY)).toMatchObject({ wageAgreed: 650, wagePaid: 0 });
    expect(parseEntryText('aaj ek hazaar rupaye tay, kuch nahi mila', TODAY)).toMatchObject({ wageAgreed: 1000, wagePaid: 0 });
    expect(parseEntryText('450, paise baad mein milenge', TODAY)).toMatchObject({ wageAgreed: 450, wagePaid: 0 });
    expect(parseEntryText('आजु मिस्त्री के काम, सात सौ, पइसा ना मिलल', TODAY)).toMatchObject({ wageAgreed: 700, wagePaid: 0 });
  });

  it('treats an amount that is all owed as the wage with nothing paid', () => {
    expect(parseEntryText('बेलदारी, 400, उधार रहा', TODAY)).toMatchObject({ wageAgreed: 400, wagePaid: 0 });
  });

  it('reads Bhojpuri paid words and fully paid phrases', () => {
    expect(parseEntryText('सात सौ रुपया तय रहल, पाँच सौ मिलल', TODAY)).toMatchObject({ wageAgreed: 700, wagePaid: 500 });
    expect(parseEntryText('आठ सौ रुपये पूरे मिल गए', TODAY)).toMatchObject({ wageAgreed: 800, wagePaid: 800 });
  });
});
