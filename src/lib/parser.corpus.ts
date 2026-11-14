import type { ParsedEntry } from './parser';

// Spoken-style work-day sentences from UP construction workers, with the values
// a person would fill in. "Today" for every line is Saturday 14 Nov 2026.
export const CORPUS_TODAY = '2026-11-14';

const TODAY = '2026-11-14';
const YESTERDAY = '2026-11-13';
const DAY_BEFORE = '2026-11-12';
const MON = '2026-11-09';
const TUE = '2026-11-10';
const WED = '2026-11-11';
const THU = '2026-11-12';
const FRI = '2026-11-13';
const SUN = '2026-11-08';

export interface CorpusLine {
  text: string;
  expected: ParsedEntry;
}

const line = (text: string, expected: ParsedEntry): CorpusLine => ({ text, expected });

export const PARSER_CORPUS: CorpusLine[] = [
  // Devanagari Hindi, full sentences
  line('आज रमेश ठेकेदार के यहाँ गोमती नगर में मिस्त्री का काम किया, सात सौ तय हुए, पाँच सौ मिले', {
    date: TODAY, workType: 'mason', site: 'गोमती नगर', contractorName: 'रमेश', wageAgreed: 700, wagePaid: 500,
  }),
  line('कल सुरेश ठेकेदार के साथ आलमबाग में बेलदारी की, साढ़े चार सौ मिले', {
    date: YESTERDAY, workType: 'helper', site: 'आलमबाग', contractorName: 'सुरेश', wageAgreed: 450, wagePaid: 450,
  }),
  line('परसों पुताई का काम इंदिरा नगर में, छह सौ रुपये तय', {
    date: DAY_BEFORE, workType: 'painter', site: 'इंदिरा नगर', wageAgreed: 600,
  }),
  line('सोमवार को बिजली का काम किया अजय सिंह ठेकेदार के यहाँ, आठ सौ रुपये', {
    date: MON, workType: 'electrician', contractorName: 'अजय सिंह', wageAgreed: 800,
  }),
  line('मंगलवार को चिनहट में लेबर का काम, 450 रुपये, पूरे मिल गए', {
    date: TUE, workType: 'helper', site: 'चिनहट', wageAgreed: 450, wagePaid: 450,
  }),
  line('बुधवार को राजमिस्त्री का काम, दिहाड़ी 750, 250 बाकी', {
    date: WED, workType: 'mason', wageAgreed: 750, wagePaid: 500,
  }),
  line('शुक्रवार को पप्पू वर्मा ठेकेदार के यहाँ बेलदारी, 450 तय, 200 मिले', {
    date: FRI, workType: 'helper', contractorName: 'पप्पू वर्मा', wageAgreed: 450, wagePaid: 200,
  }),
  line('रविवार को नल का काम किया हज़रतगंज में, नौ सौ रुपये', {
    date: SUN, workType: 'plumber', site: 'हज़रतगंज', wageAgreed: 900,
  }),
  line('आज ७०० रुपये की दिहाड़ी, ५०० मिले', { date: TODAY, wageAgreed: 700, wagePaid: 500 }),
  line('कल ६५० तय हुए थे, पैसे नहीं मिले', { date: YESTERDAY, wageAgreed: 650, wagePaid: 0 }),
  line('आज साढ़े छह सौ की दिहाड़ी पर बेलदारी की', { date: TODAY, workType: 'helper', wageAgreed: 650 }),
  line('पाँच सौ पचास रुपये मिले आज', { date: TODAY, wageAgreed: 550, wagePaid: 550 }),
  line('कल बढ़ई का काम किया विकास नगर में, आठ सौ रुपये तय', {
    date: YESTERDAY, workType: 'carpenter', site: 'विकास नगर', wageAgreed: 800,
  }),
  line('ठेकेदार राजेश कुमार, साइट जानकीपुरम, मिस्त्री, 700', {
    contractorName: 'राजेश कुमार', site: 'जानकीपुरम', workType: 'mason', wageAgreed: 700,
  }),
  line('शर्मा जी के यहाँ पुताई की, 600 रुपये रोज, आज 400 मिले', {
    date: TODAY, workType: 'painter', contractorName: 'शर्मा', wageAgreed: 600, wagePaid: 400,
  }),
  line('वर्मा साहब के साथ बिजली की वायरिंग, 900 तय', {
    workType: 'electrician', contractorName: 'वर्मा', wageAgreed: 900,
  }),
  line('गुप्ता जी ठेकेदार के यहाँ अलीगंज में बेलदारी की, 500', {
    workType: 'helper', contractorName: 'गुप्ता', site: 'अलीगंज', wageAgreed: 500,
  }),
  line('आज मिस्त्री का काम, सात सौ तय, कुछ नहीं मिला', { date: TODAY, workType: 'mason', wageAgreed: 700, wagePaid: 0 }),
  line('कल हेल्पर का काम इंदिरा नगर में किया, चार सौ पचास', {
    date: YESTERDAY, workType: 'helper', site: 'इंदिरा नगर', wageAgreed: 450,
  }),
  line('परसों सलीम ठेकेदार के यहाँ चिनाई की, 700 में से 500 मिले, 200 बाकी', {
    date: DAY_BEFORE, workType: 'mason', contractorName: 'सलीम', wageAgreed: 700, wagePaid: 500,
  }),
  line('आज पेंटर का काम, आठ सौ रुपये, तीन सौ उधार', { date: TODAY, workType: 'painter', wageAgreed: 800, wagePaid: 500 }),
  line('कल प्लंबर का काम गोमती नगर विस्तार में, एक हज़ार रुपये तय', {
    date: YESTERDAY, workType: 'plumber', site: 'गोमती नगर विस्तार', wageAgreed: 1000,
  }),
  line('आज बिजली का काम, साढ़े सात सौ मिले', { date: TODAY, workType: 'electrician', wageAgreed: 750, wagePaid: 750 }),
  line('कल पौने आठ सौ की दिहाड़ी पर राजमिस्त्री का काम', { date: YESTERDAY, workType: 'mason', wageAgreed: 775 }),
  line('आज बेलदारी, सवा चार सौ', { date: TODAY, workType: 'helper', wageAgreed: 425 }),
  line('आज बारह सौ रुपये तय हुए, नौ सौ मिले', { date: TODAY, wageAgreed: 1200, wagePaid: 900 }),
  line('कल डेढ़ हज़ार की दिहाड़ी, बढ़ई का काम', { date: YESTERDAY, workType: 'carpenter', wageAgreed: 1500 }),
  line('5 तारीख को अमीनाबाद में मिस्त्री का काम, 700 रुपये', {
    date: '2026-11-05', site: 'अमीनाबाद', workType: 'mason', wageAgreed: 700,
  }),
  line('२० तारीख को बेलदारी की, ४५० तय', { date: '2026-10-20', workType: 'helper', wageAgreed: 450 }),
  line('12 तारीख को कैंट में पुताई, 650', { date: '2026-11-12', site: 'कैंट', workType: 'painter', wageAgreed: 650 }),
  line('ठेकेदार दिनेश यादव, आज मिस्त्री का काम, सात सौ', {
    contractorName: 'दिनेश यादव', date: TODAY, workType: 'mason', wageAgreed: 700,
  }),
  line('मुकेश ठेकेदार का नंबर 98765 43210 है, आज बेलदारी 450', {
    contractorName: 'मुकेश', contractorPhone: '9876543210', date: TODAY, workType: 'helper', wageAgreed: 450,
  }),
  line('ठेकेदार राकेश 9123456780, बिजली का काम, 800 तय', {
    contractorName: 'राकेश', contractorPhone: '9123456780', workType: 'electrician', wageAgreed: 800,
  }),
  line('आज सत्रह सौ रुपये मिले दो दिन के', { date: TODAY, wageAgreed: 1700, wagePaid: 1700 }),
  line('कल नल फिटिंग का काम, छह सौ पचास तय, पूरे मिले', { date: YESTERDAY, workType: 'plumber', wageAgreed: 650 }),
  line('आज राजू ठेकेदार के यहाँ लखनऊ के आशियाना में मजदूर का काम, 400', {
    date: TODAY, contractorName: 'राजू', site: 'आशियाना', workType: 'helper', wageAgreed: 400,
  }),
  line('कल चारबाग स्टेशन के पास मिस्त्री का काम, सात सौ पचास', {
    date: YESTERDAY, site: 'चारबाग स्टेशन', workType: 'mason', wageAgreed: 750,
  }),
  line('आज मेडिकल कॉलेज के पास बेलदारी, 450 तय, 450 मिले', {
    date: TODAY, site: 'मेडिकल कॉलेज', workType: 'helper', wageAgreed: 450, wagePaid: 450,
  }),
  line('परसों पॉलिटेक्निक चौराहे पर पेंट का काम, 600', {
    date: DAY_BEFORE, site: 'पॉलिटेक्निक चौराहे', workType: 'painter', wageAgreed: 600,
  }),
  line('गुरुवार को निशातगंज पे बिजली का काम, आठ सौ, चार सौ बाकी', {
    date: THU, site: 'निशातगंज', workType: 'electrician', wageAgreed: 800, wagePaid: 400,
  }),
  line('आज जानकीपुरम वाली साइट पर मिस्त्री का काम, 700', {
    date: TODAY, site: 'जानकीपुरम', workType: 'mason', wageAgreed: 700,
  }),
  line('कल अलीगंज वाली साइट पर बेलदारी, 450', { date: YESTERDAY, site: 'अलीगंज', workType: 'helper', wageAgreed: 450 }),
  line('बृहस्पतिवार को पुताई की, 500 रुपये', { date: THU, workType: 'painter', wageAgreed: 500 }),
  line('आज खान साहब के यहाँ कारपेंटर का काम, नौ सौ तय, पाँच सौ मिले', {
    date: TODAY, contractorName: 'खान', workType: 'carpenter', wageAgreed: 900, wagePaid: 500,
  }),
  line('कल यादव जी के यहाँ बेलदारी की, चार सौ पचास, पैसे बाद में मिलेंगे', {
    date: YESTERDAY, contractorName: 'यादव', workType: 'helper', wageAgreed: 450, wagePaid: 0,
  }),
  line('आज मिश्रा जी ठेकेदार के साथ पेंटर का काम, 700 रुपया', {
    date: TODAY, contractorName: 'मिश्रा', workType: 'painter', wageAgreed: 700,
  }),
  line('आज मालिक सेठ रामलाल के यहाँ मिस्त्री, 800', { date: TODAY, contractorName: 'रामलाल', workType: 'mason', wageAgreed: 800 }),
  line('कल आठ सौ रुपये तय थे, छह सौ मिले, दो सौ बाकी रह गए', { date: YESTERDAY, wageAgreed: 800, wagePaid: 600 }),
  line('आज 500 मिले 300 बाकी', { date: TODAY, wageAgreed: 800, wagePaid: 500 }),
  line('आज इलेक्ट्रीशियन का काम, ग्यारह सौ तय', { date: TODAY, workType: 'electrician', wageAgreed: 1100 }),
  line('कल बेलदार का काम किया, तीन सौ पचास मिले', { date: YESTERDAY, workType: 'helper', wageAgreed: 350, wagePaid: 350 }),
  line('आज छत की ढलाई में लेबर का काम, पाँच सौ', { date: TODAY, workType: 'helper', wageAgreed: 500 }),
  line('आज राजमिस्त्री का काम, सात सौ रुपये तय, आधे मिले साढ़े तीन सौ', {
    date: TODAY, workType: 'mason', wageAgreed: 700, wagePaid: 350,
  }),
  line('कल रंग का काम कपूरथला में, 650 तय', { date: YESTERDAY, workType: 'painter', site: 'कपूरथला', wageAgreed: 650 }),
  line('परसों वायरिंग का काम राजाजीपुरम में, 900', {
    date: DAY_BEFORE, workType: 'electrician', site: 'राजाजीपुरम', wageAgreed: 900,
  }),
  line('आज ठेकेदार अनिल जी के यहाँ बेलदारी की', { date: TODAY, contractorName: 'अनिल', workType: 'helper' }),
  line('आज सात सौ', { date: TODAY, wageAgreed: 700 }),
  line('कल का काम, 600 रुपये, सब मिल गए', { date: YESTERDAY, wageAgreed: 600, wagePaid: 600 }),
  line('सोमवार को पुताई, सलीम ठेकेदार, 550', { date: MON, workType: 'painter', contractorName: 'सलीम', wageAgreed: 550 }),
  line('आज विनोद शर्मा ठेकेदार के यहाँ कानपुर रोड पर मिस्त्री का काम, सात सौ', {
    date: TODAY, contractorName: 'विनोद शर्मा', site: 'कानपुर रोड', workType: 'mason', wageAgreed: 700,
  }),
  line('कल सिगरा में बिजली का काम, अजय सिंह ठेकेदार, साढ़े छह सौ', {
    date: YESTERDAY, site: 'सिगरा', workType: 'electrician', contractorName: 'अजय सिंह', wageAgreed: 650,
  }),
  line('आज लंका में पेंट का काम किया, ६५० रुपये तय, ३०० मिले', {
    date: TODAY, site: 'लंका', workType: 'painter', wageAgreed: 650, wagePaid: 300,
  }),
  line('आज भेलूपुर में नल का काम, आठ सौ रुपये पूरे मिल गए', {
    date: TODAY, site: 'भेलूपुर', workType: 'plumber', wageAgreed: 800, wagePaid: 800,
  }),
  line('कल पांडेय जी के यहाँ बेलदारी, 400, उधार रहा', {
    date: YESTERDAY, contractorName: 'पांडेय', workType: 'helper', wageAgreed: 400, wagePaid: 0,
  }),
  line('मंगलवार को सिविल लाइन्स में चिनाई का काम, 750 तय, 750 मिले', {
    date: TUE, site: 'सिविल लाइन्स', workType: 'mason', wageAgreed: 750, wagePaid: 750,
  }),
  line('आज प्रयागराज के झूँसी में मिस्त्री का काम, 700', {
    date: TODAY, site: 'झूँसी', workType: 'mason', wageAgreed: 700,
  }),
  line('कल गोरखपुर में बेलदारी, चार सौ', { date: YESTERDAY, site: 'गोरखपुर', workType: 'helper', wageAgreed: 400 }),
  line('आज मेरठ रोड पर पुताई, सात सौ तय, कुछ नहीं मिला', {
    date: TODAY, site: 'मेरठ रोड', workType: 'painter', wageAgreed: 700, wagePaid: 0,
  }),
  line('आज आगरा में ताजगंज के पास मिस्त्री का काम, 750', {
    date: TODAY, site: 'ताजगंज', workType: 'mason', wageAgreed: 750,
  }),
  line('कल बढ़ई का काम, 850 तय, 500 मिले, 350 बाकी', { date: YESTERDAY, workType: 'carpenter', wageAgreed: 850, wagePaid: 500 }),
  line('आज साढ़े पाँच सौ की बेलदारी', { date: TODAY, workType: 'helper', wageAgreed: 550 }),
  line('आज छः सौ रुपये तय, चार सौ मिले', { date: TODAY, wageAgreed: 600, wagePaid: 400 }),
  line('कल नौ सौ पचास की दिहाड़ी, बिजली का काम', { date: YESTERDAY, workType: 'electrician', wageAgreed: 950 }),
  line('आज दो हज़ार रुपये मिले तीन दिन के', { date: TODAY, wageAgreed: 2000, wagePaid: 2000 }),

  // Bhojpuri-flavoured Hindi
  line('काल्ह हमरा रामू ठीकेदार के इहाँ मिस्त्री के काम कइलीं, सात सौ रुपया तय रहल, पाँच सौ मिलल', {
    date: YESTERDAY, contractorName: 'रामू', workType: 'mason', wageAgreed: 700, wagePaid: 500,
  }),
  line('आजु बेलदारी कइलीं, चार सौ पचास मिलल', { date: TODAY, workType: 'helper', wageAgreed: 450, wagePaid: 450 }),
  line('परसो चिनाई के काम, छह सौ तय, तीन सौ बाकी बा', { date: DAY_BEFORE, workType: 'mason', wageAgreed: 600, wagePaid: 300 }),
  line('काल्ह मुगलसराय में पुताई के काम, छह सौ रुपया', {
    date: YESTERDAY, site: 'मुगलसराय', workType: 'painter', wageAgreed: 600,
  }),
  line('आजु बलिया में मिस्त्री के काम कइनी, सात सौ, पइसा ना मिलल', {
    date: TODAY, site: 'बलिया', workType: 'mason', wageAgreed: 700, wagePaid: 0,
  }),
  line('हम आज लालू ठेकेदार के साथे बेलदारी कइलीं, साढ़े चार सौ', {
    date: TODAY, contractorName: 'लालू', workType: 'helper', wageAgreed: 450,
  }),
  line('काल्ह बिजली के काम, आठ सौ रुपया तय, चार सौ मिलल, चार सौ बाकी', {
    date: YESTERDAY, workType: 'electrician', wageAgreed: 800, wagePaid: 400,
  }),
  line('आजु देवरिया में नल के काम, सात सौ पचास', { date: TODAY, site: 'देवरिया', workType: 'plumber', wageAgreed: 750 }),
  line('काल्ह सिंह साहब के इहाँ लेबर के काम, चार सौ, सब मिल गइल', {
    date: YESTERDAY, contractorName: 'सिंह', workType: 'helper', wageAgreed: 400, wagePaid: 400,
  }),
  line('परसो आजमगढ़ में राजमिस्त्री के काम, आठ सौ रुपया तय रहे', {
    date: DAY_BEFORE, site: 'आजमगढ़', workType: 'mason', wageAgreed: 800,
  }),
  line('हमार दिहाड़ी पाँच सौ, आजु तीन सौ मिलल', { date: TODAY, wageAgreed: 500, wagePaid: 300 }),
  line('काल्ह रंगाई पुताई के काम कइलीं, छह सौ', { date: YESTERDAY, workType: 'painter', wageAgreed: 600 }),
  line('आजु बढ़ई के काम, नौ सौ रुपया, उधार बा', { date: TODAY, workType: 'carpenter', wageAgreed: 900, wagePaid: 0 }),
  line('काल्ह गाजीपुर में बेलदारी, साढ़े तीन सौ मिलल', {
    date: YESTERDAY, site: 'गाजीपुर', workType: 'helper', wageAgreed: 350, wagePaid: 350,
  }),
  line('आजु मनोज ठीकेदार के इहाँ चिनाई, सात सौ', { date: TODAY, contractorName: 'मनोज', workType: 'mason', wageAgreed: 700 }),

  // Hinglish (Roman script)
  line('aaj Ramesh thekedar ke yahan Gomti Nagar mein mistri ka kaam, 700 tay hua, 500 mile', {
    date: TODAY, contractorName: 'Ramesh', site: 'Gomti Nagar', workType: 'mason', wageAgreed: 700, wagePaid: 500,
  }),
  line('kal beldari ki Alambagh me, saat sau tay, paanch sau mile', {
    date: YESTERDAY, workType: 'helper', site: 'Alambagh', wageAgreed: 700, wagePaid: 500,
  }),
  line('parson painter ka kaam 650 rupaye', { date: DAY_BEFORE, workType: 'painter', wageAgreed: 650 }),
  line('aaj plumber ka kaam Hazratganj mein 900 rupaye mile', {
    date: TODAY, workType: 'plumber', site: 'Hazratganj', wageAgreed: 900, wagePaid: 900,
  }),
  line('kal bijli ka kaam kiya, 800 tay, 300 baaki', { date: YESTERDAY, workType: 'electrician', wageAgreed: 800, wagePaid: 500 }),
  line('thekedar Mohan ke saath carpenter ka kaam, 850', { contractorName: 'Mohan', workType: 'carpenter', wageAgreed: 850 }),
  line('Sharma ji ke yahan putai ki, 600 rupaye', { contractorName: 'Sharma', workType: 'painter', wageAgreed: 600 }),
  line('aaj sadhe saat sau ki dihadi, mistri ka kaam', { date: TODAY, workType: 'mason', wageAgreed: 750 }),
  line('kal labour ka kaam, 450, paise nahi mile', { date: YESTERDAY, workType: 'helper', wageAgreed: 450, wagePaid: 0 }),
  line('aaj Indira Nagar mein helper ka kaam, chaar sau pachas', {
    date: TODAY, site: 'Indira Nagar', workType: 'helper', wageAgreed: 450,
  }),
  line('Ramesh thekedar 9876543210 bijli ka kaam 800', {
    contractorName: 'Ramesh', contractorPhone: '9876543210', workType: 'electrician', wageAgreed: 800,
  }),
  line('aaj Saleem bhai ke yahan chinai, 700 me se 400 mile', {
    date: TODAY, contractorName: 'Saleem', workType: 'mason', wageAgreed: 700, wagePaid: 400,
  }),
  line('somvar ko Chinhat mein beldari, 450', { date: MON, site: 'Chinhat', workType: 'helper', wageAgreed: 450 }),
  line('kal Verma sahab ke saath wiring ka kaam, 1000 tay', {
    date: YESTERDAY, contractorName: 'Verma', workType: 'electrician', wageAgreed: 1000,
  }),
  line('aaj dihadi 600, 200 udhar', { date: TODAY, wageAgreed: 600, wagePaid: 400 }),
  line('parso raj mistri ka kaam Aliganj pe, 750 rs', {
    date: DAY_BEFORE, workType: 'mason', site: 'Aliganj', wageAgreed: 750,
  }),
  line('aaj 500 mile 300 baki', { date: TODAY, wageAgreed: 800, wagePaid: 500 }),
  line('kal Gupta ji thekedar, Kapoorthala mein painter ka kaam, chhe sau', {
    date: YESTERDAY, contractorName: 'Gupta', site: 'Kapoorthala', workType: 'painter', wageAgreed: 600,
  }),
  line('aaj ek hazaar rupaye tay, kuch nahi mila', { date: TODAY, wageAgreed: 1000, wagePaid: 0 }),
  line('mangalvar ko nal ka kaam, 700', { date: TUE, workType: 'plumber', wageAgreed: 700 }),
  line('aaj Rs 650 ki dihadi beldari', { date: TODAY, workType: 'helper', wageAgreed: 650 }),
  line('kal site Janakipuram, mistri, saat sau', { date: YESTERDAY, site: 'Janakipuram', workType: 'mason', wageAgreed: 700 }),
  line('aaj Vikas Nagar mein carpenter ka kaam kiya 900 rupaye tay hue 900 mile', {
    date: TODAY, site: 'Vikas Nagar', workType: 'carpenter', wageAgreed: 900, wagePaid: 900,
  }),
  line('budhvar ko painter, 600, 100 baaki', { date: WED, workType: 'painter', wageAgreed: 600, wagePaid: 500 }),
  line('shukravar ko electrician ka kaam, saadhe aath sau', { date: FRI, workType: 'electrician', wageAgreed: 850 }),
  line('aaj Pappu thekedar ke yahan helper, 450 tay, 450 mile', {
    date: TODAY, contractorName: 'Pappu', workType: 'helper', wageAgreed: 450, wagePaid: 450,
  }),
  line('kal Charbagh station ke paas mistri ka kaam, 750', {
    date: YESTERDAY, site: 'Charbagh station', workType: 'mason', wageAgreed: 750,
  }),
  line('ravivar ko beldari ki, 400 rupaye mile', { date: SUN, workType: 'helper', wageAgreed: 400, wagePaid: 400 }),
  line('aaj Khan sahab ke saath painter, 700 tay, 350 mile, 350 baaki', {
    date: TODAY, contractorName: 'Khan', workType: 'painter', wageAgreed: 700, wagePaid: 350,
  }),
  line('kal plumbing ka kaam Gomti Nagar mein, 900', {
    date: YESTERDAY, workType: 'plumber', site: 'Gomti Nagar', wageAgreed: 900,
  }),
  line('aaj mazdoor ka kaam, teen sau pachas', { date: TODAY, workType: 'helper', wageAgreed: 350 }),
  line('kal Yadav ji thekedar ke yahan mistri, 750 tay, paise baad mein milenge', {
    date: YESTERDAY, contractorName: 'Yadav', workType: 'mason', wageAgreed: 750, wagePaid: 0,
  }),
  line('aaj 700', { date: TODAY, wageAgreed: 700 }),
  line('parson Aminabad mein putai, 650 rupaye, 650 mile', {
    date: DAY_BEFORE, site: 'Aminabad', workType: 'painter', wageAgreed: 650, wagePaid: 650,
  }),
  line('15 tarikh ko beldari, 450', { date: '2026-10-15', workType: 'helper', wageAgreed: 450 }),
  line('aaj thekedar Dinesh, bijli ka kaam, 800 rupees', {
    date: TODAY, contractorName: 'Dinesh', workType: 'electrician', wageAgreed: 800,
  }),
  line('kal Lanka mein mistri ka kaam, dedh hazaar do din ke', {
    date: YESTERDAY, site: 'Lanka', workType: 'mason', wageAgreed: 1500,
  }),
  line('aaj contractor Suresh, beldari 450, 200 mile', {
    date: TODAY, contractorName: 'Suresh', workType: 'helper', wageAgreed: 450, wagePaid: 200,
  }),
  line('kal 650 fix the, 650 mile', { date: YESTERDAY, wageAgreed: 650, wagePaid: 650 }),
];
