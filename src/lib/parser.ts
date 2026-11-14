import { addDays, dayOfMonthOnOrBefore, weekdayOf } from './dates';
import type { WorkType } from './types';

export interface ParsedEntry {
  date?: string;
  workType?: WorkType;
  site?: string;
  contractorName?: string;
  contractorPhone?: string;
  wageAgreed?: number;
  wagePaid?: number;
}

export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/़/g, '')
    .replace(/ँ/g, 'ं')
    .normalize('NFC');
}

function keySet(words: string): Set<string> {
  return new Set(words.split(/\s+/).filter(Boolean).map(normalizeWord));
}

const UNIT_WORDS: Record<string, number> = {};

function addNumberWords(value: number, words: string): void {
  for (const word of keySet(words)) UNIT_WORDS[word] = value;
}

addNumberWords(1, 'ek एक');
addNumberWords(2, 'do दो');
addNumberWords(3, 'teen tin तीन');
addNumberWords(4, 'char chaar चार');
addNumberWords(5, 'paanch panch paach पाँच पांच');
addNumberWords(6, 'chhe chhah chah che छह छः छे');
addNumberWords(7, 'saat sat सात');
addNumberWords(8, 'aath aat आठ');
addNumberWords(9, 'nau नौ');
addNumberWords(10, 'das दस');
addNumberWords(11, 'gyarah gyara ग्यारह');
addNumberWords(12, 'barah bara बारह');
addNumberWords(13, 'terah tera तेरह');
addNumberWords(14, 'chaudah chauda चौदह');
addNumberWords(15, 'pandrah pandra पंद्रह पन्द्रह');
addNumberWords(16, 'solah sola सोलह');
addNumberWords(17, 'satrah satra सत्रह');
addNumberWords(18, 'atharah athara अठारह');
addNumberWords(19, 'unnees unnis उन्नीस');
addNumberWords(20, 'bees bis बीस');
addNumberWords(25, 'pachchees pachees pachis पच्चीस');
addNumberWords(30, 'tees tis तीस');
addNumberWords(35, 'paintees pentis पैंतीस');
addNumberWords(40, 'chalis chaalis chalees चालीस');
addNumberWords(45, 'paintalis पैंतालीस');
addNumberWords(50, 'pachas pachaas पचास');
addNumberWords(60, 'saath sath साठ');
addNumberWords(70, 'sattar सत्तर');
addNumberWords(75, 'pachattar pachhattar पचहत्तर');
addNumberWords(80, 'assi अस्सी');
addNumberWords(90, 'nabbe नब्बे');

const HUNDRED = keySet('sau so सौ');
const THOUSAND = keySet('hazaar hazar hajar hajaar हज़ार हजार');
const HALF_MORE = keySet('sadhe saadhe साढ़े साढे');
const QUARTER_MORE = keySet('sava savva सवा');
const QUARTER_LESS = keySet('paune पौने');
const ONE_AND_HALF = keySet('dedh derh डेढ़');
const TWO_AND_HALF = keySet('dhai dhaai ढाई');

const FRACTION_PREFIX = new Set([...HALF_MORE, ...QUARTER_MORE, ...QUARTER_LESS]);
const MULTIPLIERS = new Set([...HUNDRED, ...THOUSAND]);

function isDigits(word: string): boolean {
  return /^\d+$/.test(word);
}

function isNumberWord(norm: string): boolean {
  return (
    norm in UNIT_WORDS ||
    MULTIPLIERS.has(norm) ||
    FRACTION_PREFIX.has(norm) ||
    ONE_AND_HALF.has(norm) ||
    TWO_AND_HALF.has(norm)
  );
}

export function wordsToNumber(words: string[]): number | undefined {
  let total = 0;
  let current = 0;
  let adjust = 0;
  let consumed = false;
  for (const word of words.map(normalizeWord)) {
    if (isDigits(word)) {
      current += Number(word);
    } else if (word in UNIT_WORDS) {
      current += UNIT_WORDS[word];
    } else if (ONE_AND_HALF.has(word)) {
      current += 1.5;
    } else if (TWO_AND_HALF.has(word)) {
      current += 2.5;
    } else if (HALF_MORE.has(word)) {
      adjust = 0.5;
    } else if (QUARTER_MORE.has(word)) {
      adjust = 0.25;
    } else if (QUARTER_LESS.has(word)) {
      adjust = -0.25;
    } else if (HUNDRED.has(word)) {
      current = ((current || 1) + adjust) * 100;
      adjust = 0;
    } else if (THOUSAND.has(word)) {
      total += ((current || 1) + adjust) * 1000;
      current = 0;
      adjust = 0;
    } else {
      return undefined;
    }
    consumed = true;
  }
  return consumed ? Math.round(total + current) : undefined;
}

const TODAY_WORDS = keySet('aaj aj aaju आज आजु');
const YESTERDAY_WORDS = keySet('kal kalh kaalh कल काल्ह');
const DAY_BEFORE_WORDS = keySet('parson parso परसों परसो');
const WEEKDAY_WORDS = [
  'ravivar raviwar itvaar itwar रविवार इतवार',
  'somvar somwar सोमवार',
  'mangalvar mangalwar मंगलवार',
  'budhvar budhwar बुधवार',
  'guruvar guruwar brihaspativar वीरवार गुरुवार बृहस्पतिवार बीफे',
  'shukravar shukrawar शुक्रवार',
  'shanivar shaniwar सनिच्चर शनिवार',
].map(keySet);
const DATE_OF_MONTH_WORDS = keySet('tarikh tareekh tarik तारीख तारिख');

const PAID_WORDS = keySet('mile mila mil milay milal diye diya dia दिए दिये दिया मिले मिला मिल मिलल मिलले paid');
const NOT_WORDS = keySet('nahi nahin nhi na न ना नहीं नही');
const PAID_LATER_WORDS = keySet('milenge milega denge dega मिलेंगे मिलेगा देंगे देगा');
const PENDING_WORDS = keySet('baaki baki baqi bakaya udhar pending बाकी बाक़ी बकाया उधार');
const AGREED_WORDS = keySet('tay tai tey fix fixed rate dihadi dihari mazdoori majdoori तय फिक्स रेट दिहाड़ी दिहाडी मजदूरी मज़दूरी');

const CONTRACTOR_WORDS = keySet('thekedar thekedaar thekadar contractor malik seth ठेकेदार ठीकेदार कॉन्ट्रैक्टर मालिक सेठ');
const HONORIFICS = keySet('ji jee जी sahab saheb साहब bhai bhaiya भाई भैया');
const LOCATION_AFTER_WORDS = keySet('mein me mai main pe par में मे पे पर');
const NEAR_WORDS = keySet('paas pass पास');
const SITE_BEFORE_WORDS = keySet('site saait साइट');
const WALA_WORDS = keySet('wala wale wali वाला वाले वाली');
const OF_WORDS = keySet('ke ka ki के का की');
const EMPLOYER_PLACE_WORDS = keySet('yahan yaha ihan यहाँ यहां इहाँ');
const WITH_WORDS = keySet('saath sath saathe साथ साथे');

const WORK_TYPE_WORDS: Record<Exclude<WorkType, 'other'>, Set<string>> = {
  mason: keySet('mistri mistry mistree raj mason chinai मिस्त्री मिस्तरी राजमिस्त्री राज चिनाई'),
  helper: keySet('helper beldar beldari mazdoor majdoor labour labor हेल्पर बेलदार बेलदारी मजदूर मज़दूर लेबर'),
  plumber: keySet('plumber plumbing nal प्लंबर प्लम्बर नल'),
  painter: keySet('painter paint putai rang पेंटर पेंट पुताई रंग'),
  carpenter: keySet('carpenter badhai barhai कारपेंटर बढ़ई बढई'),
  electrician: keySet('electrician bijli wiring इलेक्ट्रीशियन बिजली वायरिंग'),
};

const STOP_WORDS = keySet(
  'ke ka ki ko ne se ho hai tha thi the aur kaam kam kiya kia kari kara karke hua hue hui yahan yaha wahan saath sath ' +
    'wala wale wali din roz roj rupaye rupay rupees rupye rs ru re ek ' +
    'के का की को ने से हो है था थी थे और काम किया करी करके हुआ हुए हुई यहाँ यहां वहाँ साथ वाला वाले वाली दिन रोज़ रोज रुपये रुपए रूपए रुपया ' +
    'hum humra hamar ihan paise paisa baad number naam हम हमरा हमार हमनी इहाँ उहाँ साथे कइलीं कइली कइनी कइल रहल रहे बा गइल ' +
    'पैसे पैसा पइसा बाद नंबर नाम',
);

const DAY_COUNT_WORDS = keySet('din dino dinon दिन दिनों');

const FILLER_AFTER_NUMBER = keySet(
  'rupaye rupay rupees rupye rupya rs ru re hua hue hui hai the ka ki poore pure pura sab ' +
    'रुपये रुपए रूपए रुपया हुआ हुए हुई है थे का की पूरे पूरा सब',
);

interface Token {
  raw: string;
  norm: string;
}

interface NumberGroup {
  value: number;
  start: number;
  end: number;
}

type Role = 'agreed' | 'paid' | 'pending';

function tokenize(text: string): Token[] {
  return text
    .replace(/[०-९]/g, (digit) => String(digit.charCodeAt(0) - 0x966))
    .replace(/(?:\+\s*91|(?<!\d)0?91)[\s-]*(?=[6-9]\d{4}[\s-]?\d{5}(?!\d))/g, ' ')
    .replace(/(?<!\d)([6-9]\d{4})[\s-](\d{5})(?!\d)/g, '$1$2')
    .replace(/₹\s*/g, ' ')
    .replace(/(\d)(rs|rupaye|रुपये)/gi, '$1 $2')
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean)
    .map((raw) => ({ raw, norm: normalizeWord(raw) }));
}

function isPhone(norm: string): boolean {
  return /^[6-9]\d{9}$/.test(norm);
}

function workTypeOf(norm: string): WorkType | undefined {
  for (const [type, words] of Object.entries(WORK_TYPE_WORDS)) {
    if (words.has(norm)) return type as WorkType;
  }
  return undefined;
}

function isKeyword(norm: string): boolean {
  return (
    STOP_WORDS.has(norm) ||
    TODAY_WORDS.has(norm) ||
    YESTERDAY_WORDS.has(norm) ||
    DAY_BEFORE_WORDS.has(norm) ||
    DATE_OF_MONTH_WORDS.has(norm) ||
    WEEKDAY_WORDS.some((words) => words.has(norm)) ||
    PAID_WORDS.has(norm) ||
    PAID_LATER_WORDS.has(norm) ||
    NOT_WORDS.has(norm) ||
    PENDING_WORDS.has(norm) ||
    AGREED_WORDS.has(norm) ||
    CONTRACTOR_WORDS.has(norm) ||
    HONORIFICS.has(norm) ||
    LOCATION_AFTER_WORDS.has(norm) ||
    NEAR_WORDS.has(norm) ||
    SITE_BEFORE_WORDS.has(norm) ||
    workTypeOf(norm) !== undefined
  );
}

function isNameLike(token: Token | undefined): token is Token {
  if (!token) return false;
  if (!/^[\p{L}\p{M}]+$/u.test(token.raw)) return false;
  return !isKeyword(token.norm) && !isNumberWord(token.norm);
}

function isDayCount(tokens: Token[], i: number): boolean {
  return !MULTIPLIERS.has(tokens[i].norm) && DAY_COUNT_WORDS.has(tokens[i + 1]?.norm ?? '');
}

function startsNumber(tokens: Token[], i: number): boolean {
  const { norm } = tokens[i];
  if (isPhone(norm) || isDayCount(tokens, i)) return false;
  if (isDigits(norm)) return true;
  if (!isNumberWord(norm)) return false;
  if (UNIT_WORDS[norm] === 60 && !norm.match(/[ऀ-ॿ]/)) {
    const previous = tokens[i - 1]?.norm;
    if (previous === 'ke' || previous === 'ki' || previous === 'ka') return false;
  }
  return true;
}

function findNumberGroups(tokens: Token[]): NumberGroup[] {
  const groups: NumberGroup[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (!startsNumber(tokens, i)) {
      i += 1;
      continue;
    }
    const start = i;
    let lastWasDigits = isDigits(tokens[i].norm);
    let sawHundred = HUNDRED.has(tokens[i].norm);
    let afterHundred = -1;
    i += 1;
    while (i < tokens.length) {
      const { norm } = tokens[i];
      if (lastWasDigits ? !MULTIPLIERS.has(norm) : !isNumberWord(norm)) break;
      if (isDayCount(tokens, i)) break;
      if (HUNDRED.has(norm)) {
        if (sawHundred && afterHundred > 0) {
          i = afterHundred;
          break;
        }
        sawHundred = true;
        afterHundred = -1;
      } else if (THOUSAND.has(norm)) {
        sawHundred = false;
        afterHundred = -1;
      } else if (sawHundred && afterHundred < 0) {
        afterHundred = i;
      }
      lastWasDigits = false;
      i += 1;
    }
    const value = wordsToNumber(tokens.slice(start, i).map((t) => t.norm));
    if (value !== undefined) groups.push({ value, start, end: i });
  }
  return groups;
}

function roleOf(norm: string): Role | 'date' | undefined {
  if (PAID_WORDS.has(norm)) return 'paid';
  if (PENDING_WORDS.has(norm)) return 'pending';
  if (AGREED_WORDS.has(norm)) return 'agreed';
  if (DATE_OF_MONTH_WORDS.has(norm)) return 'date';
  return undefined;
}

function classify(tokens: Token[], groups: NumberGroup[], index: number): Role | 'date' | undefined {
  const group = groups[index];
  const nextStart = groups[index + 1]?.start ?? tokens.length;
  for (let i = group.end; i < Math.min(nextStart, group.end + 3); i += 1) {
    const role = roleOf(tokens[i].norm);
    if (role) return role;
    if (!FILLER_AFTER_NUMBER.has(tokens[i].norm)) break;
  }
  const previousEnd = groups[index - 1]?.end ?? 0;
  for (let i = group.start - 1; i >= Math.max(previousEnd, group.start - 2); i -= 1) {
    const role = roleOf(tokens[i].norm);
    if (role && role !== 'date') return role;
  }
  return undefined;
}

function nameEndingAt(tokens: Token[], end: number): number[] {
  if (!isNameLike(tokens[end])) return [];
  return isNameLike(tokens[end - 1]) ? [end - 1, end] : [end];
}

function findContractor(tokens: Token[]): number[] {
  const k = tokens.findIndex((t) => CONTRACTOR_WORDS.has(t.norm));
  if (k >= 0) {
    let before = k - 1;
    while (before >= 0 && HONORIFICS.has(tokens[before].norm)) before -= 1;
    if (isNameLike(tokens[before])) return nameEndingAt(tokens, before);
    let after = k + 1;
    while (after < tokens.length && (CONTRACTOR_WORDS.has(tokens[after].norm) || HONORIFICS.has(tokens[after].norm))) after += 1;
    if (isNameLike(tokens[after])) {
      return isNameLike(tokens[after + 1]) ? [after, after + 1] : [after];
    }
    return [];
  }
  for (let i = 1; i + 1 < tokens.length; i += 1) {
    if (!OF_WORDS.has(tokens[i].norm)) continue;
    const place = tokens[i + 1].norm;
    if (HONORIFICS.has(tokens[i - 1].norm) && (EMPLOYER_PLACE_WORDS.has(place) || WITH_WORDS.has(place))) {
      return nameEndingAt(tokens, i - 2);
    }
    if (EMPLOYER_PLACE_WORDS.has(place)) return nameEndingAt(tokens, i - 1);
  }
  return [];
}

function findSite(tokens: Token[], taken: Set<number>): string | undefined {
  const usable = (i: number) => !taken.has(i) && isNameLike(tokens[i]);
  for (let i = 0; i < tokens.length; i += 1) {
    if (SITE_BEFORE_WORDS.has(tokens[i].norm)) {
      const words: string[] = [];
      for (let j = i + 1; j < tokens.length && words.length < 3 && usable(j); j += 1) {
        words.push(tokens[j].raw);
      }
      if (words.length) return words.join(' ');
    }
    const near = NEAR_WORDS.has(tokens[i].norm) && OF_WORDS.has(tokens[i - 1]?.norm ?? '');
    if (LOCATION_AFTER_WORDS.has(tokens[i].norm) || near) {
      let end = near ? i - 2 : i - 1;
      if (SITE_BEFORE_WORDS.has(tokens[end]?.norm ?? '') && WALA_WORDS.has(tokens[end - 1]?.norm ?? '')) end -= 2;
      const words: string[] = [];
      for (let j = end; j >= 0 && words.length < 3 && usable(j); j -= 1) {
        words.unshift(tokens[j].raw);
      }
      if (words.length) return words.join(' ');
    }
  }
  return undefined;
}

function saysUnpaid(tokens: Token[]): boolean {
  return tokens.some(
    ({ norm }, i) =>
      PAID_LATER_WORDS.has(norm) ||
      (PAID_WORDS.has(norm) && [tokens[i - 1], tokens[i - 2]].some((t) => t && NOT_WORDS.has(t.norm))),
  );
}

function findDate(tokens: Token[], today: string): string | undefined {
  for (const { norm } of tokens) {
    if (TODAY_WORDS.has(norm)) return today;
    if (YESTERDAY_WORDS.has(norm)) return addDays(today, -1);
    if (DAY_BEFORE_WORDS.has(norm)) return addDays(today, -2);
    const weekday = WEEKDAY_WORDS.findIndex((words) => words.has(norm));
    if (weekday >= 0) return addDays(today, -((weekdayOf(today) - weekday + 7) % 7));
  }
  return undefined;
}

export function parseEntryText(text: string, today: string): ParsedEntry {
  const tokens = tokenize(text);
  const result: ParsedEntry = {};

  let date = findDate(tokens, today);

  for (const token of tokens) {
    const type = workTypeOf(token.norm);
    if (type) {
      result.workType = type;
      break;
    }
  }

  const contractorIdx = findContractor(tokens);
  if (contractorIdx.length) {
    result.contractorName = contractorIdx.map((i) => tokens[i].raw).join(' ');
  }

  const phone = tokens.find((t) => isPhone(t.norm));
  if (phone) result.contractorPhone = phone.norm;

  const site = findSite(tokens, new Set(contractorIdx));
  if (site) result.site = site;

  const groups = findNumberGroups(tokens);
  const amounts: Partial<Record<Role, number>> = {};
  const unlabelled: number[] = [];
  groups.forEach((group, index) => {
    const role = classify(tokens, groups, index);
    if (role === 'date') {
      date = date ?? dayOfMonthOnOrBefore(today, group.value);
    } else if (role) {
      amounts[role] = amounts[role] ?? group.value;
    } else {
      unlabelled.push(group.value);
    }
  });

  let agreed = amounts.agreed ?? unlabelled[0];
  let paid = amounts.paid;
  const pending = amounts.pending;
  if (agreed === undefined && paid !== undefined) {
    agreed = pending !== undefined ? paid + pending : paid;
  }
  if (agreed === undefined && pending !== undefined) {
    agreed = pending;
  }
  if (paid === undefined && agreed !== undefined && pending !== undefined) {
    paid = Math.max(0, agreed - pending);
  }
  if (paid === undefined && agreed !== undefined && saysUnpaid(tokens)) {
    paid = 0;
  }

  if (date) result.date = date;
  if (agreed !== undefined) result.wageAgreed = agreed;
  if (paid !== undefined) result.wagePaid = paid;

  return result;
}
