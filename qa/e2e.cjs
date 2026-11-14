// End-to-end QA of the live Shramik Passbook app, as every type of user.
// Usage: PLAYWRIGHT=path/to/node_modules/playwright node qa/e2e.cjs [baseUrl]
const { chromium, webkit } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = (process.argv[2] || 'https://wst2002.github.io/shramik-passbook/').replace(/\/?$/, '/');
const SHOTS = process.env.SHOTS;
const SIZES = [
  { width: 320, height: 640 },
  { width: 360, height: 740 },
  { width: 390, height: 844 },
];
const LANG_KEY = 'shramik-passbook:lang';
const results = [];

function check(user, name, ok, detail = '') {
  results.push({ user, name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${user}] ${name}${detail ? ` | ${detail}` : ''}`);
}

async function shot(page, name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

async function newPage(browser, size, lang) {
  const context = await browser.newContext({ viewport: size, acceptDownloads: true, hasTouch: true, isMobile: browser.browserType().name() === 'chromium' });
  await context.addInitScript(
    ([key, value]) => {
      try {
        if (!localStorage.getItem(key)) localStorage.setItem(key, value);
      } catch {
        // about:blank has no storage
      }
    },
    [LANG_KEY, lang],
  );
  const page = await context.newPage();
  const downloads = [];
  const errors = [];
  page.on('download', (d) => downloads.push(d.suggestedFilename()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { context, page, downloads, errors };
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// The app ignores taps for 350 ms after a screen change (ghost-tap guard), so wait that out.
async function ready(page, selector) {
  await page.waitForSelector(selector);
  await page.waitForTimeout(400);
}

async function noHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

async function topBack(page) {
  return page.locator('header.app-header .header-back');
}

async function startAsWorker(page, name, phone) {
  await page.goto(BASE);
  await ready(page, '#welcome-name');
  await page.fill('#welcome-name', name);
  if (phone) await page.fill('#welcome-phone', phone);
  await page.click('form.panel button[type=submit]');
  await ready(page, '.home');
}

async function fillFromText(page, text) {
  await page.fill('#heard', text);
  await page.click('.inline-form button[type=submit]');
  await ready(page, '.voice-box .notice');
}

async function readForm(page) {
  return page.evaluate(() => ({
    date: document.querySelector('#date').value,
    workType: document.querySelector('input[name=workType]:checked')?.value,
    site: document.querySelector('#site').value,
    contractor: document.querySelector('#contractor').value,
    phone: document.querySelector('#contractor-phone').value,
    agreed: document.querySelector('#agreed').value,
    paid: document.querySelector('#paid').value,
  }));
}

async function goTile(page, index) {
  await page.locator('.tile').nth(index).click();
}

async function newWorker(browser, size, lang) {
  const user = `new worker ${size.width} ${lang}`;
  const { context, page, errors } = await newPage(browser, size, lang);
  await page.goto(BASE);
  check(user, 'welcome shows name field', await page.waitForSelector('#welcome-name').then(() => true, () => false));
  check(user, 'start disabled while name empty', await page.isDisabled('form.panel button[type=submit]'));
  check(user, 'no horizontal scroll on welcome', await noHorizontalScroll(page));
  await startAsWorker(page, 'सुनीता', '98765 43210');
  check(user, 'home has no back button', (await (await topBack(page)).count()) === 0);
  check(user, 'no horizontal scroll on home', await noHorizontalScroll(page));

  await goTile(page, 2);
  await ready(page, '.screen-header');
  check(user, 'print disabled with no days', await page.isDisabled('main .big-button.primary'));
  await page.goBack();
  await ready(page, '.home');
  await goTile(page, 3);
  await ready(page, '.screen-header');
  check(user, 'backup and export disabled with no days', (await page.locator('main .big-button.secondary:disabled').count()) === 2);
  check(user, 'profile save disabled when unchanged', await page.isDisabled('form.panel button[type=submit]'));
  await page.fill('#name', 'सुनीता देवी');
  check(user, 'profile save enabled after a change', await page.isEnabled('form.panel button[type=submit]'));
  await page.click('form.panel button[type=submit]');
  await page.waitForFunction(() => document.querySelector('form.panel button[type=submit]').disabled);
  check(user, 'profile save disabled again after saving', true);
  await page.goBack();
  await ready(page, '.home');
  check(user, 'saved name shown on home', (await page.textContent('.greeting')).trim() === 'सुनीता देवी');

  await page.click('.home .big-button.primary');
  await ready(page, '#heard');
  check(user, 'add screen top-bar back visible', await (await topBack(page)).isVisible());
  check(user, 'fill button disabled while text box empty', await page.isDisabled('.inline-form button[type=submit]'));
  await page.fill('#contractor', 'Koi');
  await page.locator('label.work-option').first().click();
  await page.click('.entry-form button[type=submit]');
  check(user, 'empty site blocks save with a message next to it', await page.isVisible('#site-error'));
  check(user, 'site marked invalid', (await page.getAttribute('#site', 'aria-invalid')) === 'true');
  check(user, 'filled contractor has no error', (await page.locator('#contractorName-error').count()) === 0);
  check(user, 'still on add screen', (await page.locator('#heard').count()) === 1);
  await fillFromText(page, 'आज रमेश ठेकेदार के यहाँ लंका में मिस्त्री का काम, 700 तय, 500 मिले');
  let form = await readForm(page);
  check(user, 'Devanagari text parsed', form.contractor.includes('रमेश') && form.site.includes('लंका') && form.workType === 'mason' && form.agreed === '700' && form.paid === '500' && form.date === today(), JSON.stringify(form));
  await page.click('.entry-form button[type=submit]');
  await ready(page, '.home');
  check(user, 'save returns home', true);

  await page.click('.home .big-button.primary');
  await ready(page, '#heard');
  form = await readForm(page);
  check(user, 'repeat-day prefill', form.contractor.includes('रमेश') && form.agreed === '700' && form.paid === '700' && form.workType === 'mason', JSON.stringify(form));
  await fillFromText(page, 'kal suresh thekedar ke yahan sigra mein helper ka kaam, saat sau tay, paanch sau mile');
  form = await readForm(page);
  check(user, 'Hinglish + number words parsed', /suresh/i.test(form.contractor) && form.workType === 'helper' && form.agreed === '700' && form.paid === '500', JSON.stringify(form));
  await page.click('.entry-form button[type=submit]');
  await ready(page, '.home');

  await page.click('.home .big-button.primary');
  await ready(page, '#heard');
  await page.fill('#contractor', '');
  await page.click('.entry-form button[type=submit]');
  check(user, 'missing contractor shows error', await page.isVisible('.entry-form .error'));
  check(user, 'future date blocked by max attribute', (await page.getAttribute('#date', 'max')) === today());
  check(user, 'contractor error next to the field', await page.isVisible('#contractorName-error'));
  await page.fill('#heard', '');
  check(user, 'empty text keeps fill disabled', await page.isDisabled('.inline-form button[type=submit]'));
  await page.fill('#contractor', 'Manual Wala');
  check(user, 'contractor error clears once typed', (await page.locator('#contractorName-error').count()) === 0);
  await page.fill('#contractor-phone', '09876500001');
  await page.fill('#agreed', '600');
  await page.fill('#paid', '800');
  await page.locator('.entry-form button[type=submit]').dblclick();
  await ready(page, '.home');

  await goTile(page, 0);
  await ready(page, '.day-list');
  check(user, 'days list shows 3 days (double tap saved once)', (await page.locator('.day-card').count()) === 3);
  page.once('dialog', (d) => d.accept());
  await page.locator('.day-card').first().locator('button.danger').click();
  await page.waitForFunction(() => document.querySelectorAll('.day-card').length === 2);
  check(user, 'delete a day', true);
  check(user, 'delete shows a toast', /हटा दिया|deleted/.test(await page.textContent('.toast')));
  await page.goBack();
  await ready(page, '.home');
  check(user, 'history.back returns home from days', true);

  await goTile(page, 1);
  await ready(page, '.screen');
  check(user, 'ledger renders without NaN', !(await page.textContent('main')).includes('NaN'));
  await page.goBack();
  await ready(page, '.home');

  check(user, 'no page errors', errors.length === 0, errors.join('; '));
  await context.close();
}

async function confirmRoundTrip(browser, size, lang) {
  const user = `worker+contractor ${size.width} ${lang}`;
  const worker = await newPage(browser, size, lang);
  const { page } = worker;
  await startAsWorker(page, 'Raju', '+91 98765 43210');
  for (const text of ['aaj Ramesh thekedar ke yahan Lanka mein mistri ka kaam, 700 tay, 500 mile', 'kal Ramesh thekedar ke yahan Lanka mein mistri ka kaam, 700 tay, 700 mile']) {
    await page.click('.home .big-button.primary');
    await ready(page, '#heard');
    await fillFromText(page, text);
    await page.fill('#contractor-phone', '0 98765 11111');
    await page.click('.entry-form button[type=submit]');
    await ready(page, '.home');
  }
  await page.click('.home .big-button.primary');
  await ready(page, '#heard');
  await fillFromText(page, 'aaj Suresh thekedar ke yahan Sigra mein mistri ka kaam, nau sau tay');
  const switched = await readForm(page);
  check(user, 'new spoken contractor does not keep the old phone or paid wage', /suresh/i.test(switched.contractor) && switched.phone === '' && switched.agreed === '900' && switched.paid === '900', JSON.stringify(switched));
  await (await topBack(page)).click();
  await ready(page, '.home');
  await page.click('.home .big-button.confirm');
  await ready(page, '.choice-list');
  check(user, 'confirm screen top-bar back visible', await (await topBack(page)).isVisible());
  await page.locator('.choice').first().click();
  check(user, 'add confirmation disabled while code box empty', await page.isDisabled('.panel .big-button.confirm'));
  for (const box of await page.locator('.check-list input[type=checkbox]').all()) await box.uncheck();
  check(user, 'no day selected disables WhatsApp send', (await page.locator('button.whatsapp:disabled').count()) === 1 && (await page.locator('a.whatsapp').count()) === 0);
  for (const box of await page.locator('.check-list input[type=checkbox]').all()) await box.check();
  const href = await page.getAttribute('a.whatsapp', 'href');
  const url = new URL(href);
  check(user, 'wa.me number normalised from 0-prefix', url.pathname === '/919876511111', url.pathname);
  const text = url.searchParams.get('text');
  check(user, 'message names worker and day count', text.includes('Raju') && text.includes('2'), text.slice(0, 80));
  const link = text.match(/https?:\/\/\S+/)[0];
  check(user, 'message link points to confirm page', link.startsWith(`${BASE}confirm/#`), link.slice(0, 60));

  const contractor = await newPage(browser, size, lang);
  const c = contractor.page;
  contractor.context.on('page', (p) => p.close());
  await c.goto(link);
  await ready(c, '.confirm-list');
  check(user, 'contractor sees 2 days', (await c.locator('.confirm-day').count()) === 2);
  check(user, 'contractor page no horizontal scroll', await noHorizontalScroll(c));
  await c.locator('.confirm-day button').first().click();
  await c.locator('button.big-button.confirm').dblclick();
  const code = (await c.textContent('.code-box')).trim();
  check(user, 'contractor confirm button gone after confirming', (await c.locator('button.big-button.confirm').count()) === 0);
  check(user, 'contractor sees count and next step', /\b1\b/.test(await c.textContent('.notice.success')), await c.textContent('.notice.success'));
  await c.evaluate(() => document.querySelector('a.whatsapp').addEventListener('click', (e) => e.preventDefault()));
  await c.click('a.whatsapp');
  check(user, 'contractor sees done note after sending', await c.isVisible('.notice:not(.success)'));
  check(user, 'contractor gets code', /^SP1-[0-9a-z]{6}-[0-9a-z]{4}$/.test(code), code);
  const reply = new URL(await c.getAttribute('a.whatsapp', 'href'));
  check(user, 'reply goes to worker phone', reply.pathname === '/919876543210', reply.pathname);
  const replyText = reply.searchParams.get('text');
  await shot(c, `contractor-code-${size.width}-${lang}`);

  await c.goto(link);
  await c.reload();
  await ready(c, '.confirm-list');
  check(user, 'old link opens again', (await c.locator('.confirm-day').count()) === 2);
  const tampered = link.slice(0, -6) + 'zzzzzz';
  await c.goto('about:blank');
  await c.goto(tampered);
  check(user, 'tampered link shows error', await c.isVisible('.error'));
  await c.goto(`${BASE}confirm/#garbage!!`);
  check(user, 'garbled link shows error', await c.isVisible('.error'));
  check(user, 'contractor no page errors', contractor.errors.length === 0, contractor.errors.join('; '));
  await contractor.context.close();

  await page.fill('#code', 'SP1-abcdef-0000');
  await page.click('.panel .big-button.confirm');
  check(user, 'wrong code rejected', (await page.textContent('.notice')).length > 0);
  await page.fill('#code', replyText);
  await page.locator('.panel .big-button.confirm').dblclick();
  await ready(page, '.notice.success');
  const applied = await page.textContent('.notice.success');
  check(user, 'pasted WhatsApp message applied 1 day (singular)', /^1 (दिन पर|day is)/.test(applied), applied);
  check(user, 'code box cleared after applying', (await page.inputValue('#code')) === '');
  check(user, 'add confirmation disabled after applying', await page.isDisabled('.panel .big-button.confirm'));
  await page.fill('#code', replyText);
  const again = await page.textContent('.notice');
  check(user, 'same code again says already added', /पहले ही जुड़ चुकी|already added/.test(again), again);
  check(user, 'already-added code keeps button disabled', await page.isDisabled('.panel .big-button.confirm'));
  await page.goto(BASE);
  await ready(page, '.home');
  check(user, 'home ring shows 1 confirmed', (await page.textContent('.ring-number')).trim() === '1');

  const codeLink = replyText.match(/https?:\/\/\S+#code=\S+/)[0];
  await page.goto(codeLink);
  await ready(page, '#code');
  check(user, '#code link prefills code', (await page.inputValue('#code')).startsWith('SP1-'));
  check(user, '#code link of an applied code says already added', /पहले ही जुड़ चुकी|already added/.test(await page.textContent('.notice')));
  await (await topBack(page)).click();
  await ready(page, '.home');
  check(user, 'back from #code link lands home', true);

  const other = await newPage(browser, size, lang);
  await startAsWorker(other.page, 'Other', '');
  await other.page.goto(codeLink);
  await ready(other.page, '#code');
  await other.page.click('.panel .big-button.confirm');
  await ready(other.page, '.notice');
  check(user, 'code for unknown days says not found', (await other.page.textContent('.notice')).length > 0, await other.page.textContent('.notice'));
  await other.context.close();
  await worker.context.close();
}

async function demoVisitor(browser, size, lang) {
  const user = `judge/demo ${size.width} ${lang}`;
  const { context, page, downloads, errors } = await newPage(browser, size, lang);
  await page.goto(BASE);
  await ready(page, '.welcome');
  await page.locator('.welcome > .big-button.secondary').dblclick();
  await ready(page, '.demo-banner');
  check(user, 'demo from welcome', true);
  check(user, 'double tap on demo stays on home', (await page.evaluate(() => location.hash)) === '' && (await page.evaluate(() => scrollY)) === 0);
  await page.selectOption('#demo-worker', '1');
  await page.selectOption('#demo-worker', '2');
  await page.waitForTimeout(400);
  check(user, 'switch demo workers', (await page.locator('.greeting').textContent()).length > 0);
  await goTile(page, 3);
  await ready(page, '.screen-header');
  const demoBtn = page.locator('main section.panel .big-button.secondary').first();
  await demoBtn.dblclick();
  await page.waitForTimeout(500);
  check(user, 'no download on demo-off taps in settings', downloads.length === 0, downloads.join(','));
  await page.goto(BASE);
  await startAsWorker(page, 'Real', '');
  await goTile(page, 3);
  await ready(page, '.screen-header');
  for (let i = 0; i < 3; i += 1) {
    const btn = page.locator('main section.panel button', { hasText: /demo|डेमो/i }).first();
    const box = await btn.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
  }
  check(user, 'no download on fast double taps of demo toggle', downloads.length === 0, downloads.join(','));
  await shot(page, `demo-toggle-${size.width}-${lang}`);
  if (await page.isVisible('.demo-banner')) {
    const off = page.locator('.demo-banner button');
    const box = await off.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
  }
  check(user, 'no download on banner demo-off double tap', downloads.length === 0, downloads.join(','));
  await page.goto(BASE);
  await ready(page, '.home');
  check(user, 'real profile intact after demo', (await page.textContent('.greeting')).trim() === 'Real');
  await goTile(page, 0);
  check(user, 'demo days never mix into real data', (await page.locator('.day-card').count()) === 0);
  check(user, 'no page errors', errors.length === 0, errors.join('; '));
  await context.close();
}

async function navigationAndScreens(browser, size, lang) {
  const user = `navigation ${size.width} ${lang}`;
  const { context, page, downloads, errors } = await newPage(browser, size, lang);
  await page.goto(BASE);
  await ready(page, '.welcome');
  await page.locator('.welcome > .big-button.secondary').click();
  await ready(page, '.home');
  for (const route of ['add', 'days', 'ledger', 'confirm', 'register', 'settings']) {
    await page.goto(`${BASE}#/${route}`);
    await ready(page, '.screen-header');
  }
  await page.goto(BASE);
  await ready(page, '.welcome');
  await page.locator('.welcome > .big-button.secondary').click();
  await ready(page, '.home');
  for (let i = 0; i < 4; i += 1) {
    await goTile(page, i);
    await ready(page, '.screen-header');
    const back = await topBack(page);
    check(user, `tile ${i} has visible top-bar back`, await back.isVisible());
    check(user, `tile ${i} no horizontal scroll`, await noHorizontalScroll(page));
    await page.locator('.lang-button').click();
    check(user, `tile ${i} language toggles`, (await page.evaluate(() => document.documentElement.lang)) !== lang);
    await page.locator('.lang-button').click();
    await page.goBack();
    await ready(page, '.home');
  }
  await goTile(page, 2);
  await ready(page, '.summary, table');
  await page.emulateMedia({ media: 'print' });
  const print = await page.evaluate(() => ({
    headerHidden: getComputedStyle(document.querySelector('.app-header')).display === 'none',
    bannerHidden: !document.querySelector('.demo-banner') || getComputedStyle(document.querySelector('.demo-banner')).display === 'none',
    rows: document.querySelectorAll('table tbody tr').length,
  }));
  check(user, 'print hides UI and shows table', print.headerHidden && print.bannerHidden && print.rows > 0, JSON.stringify(print));
  await shot(page, `print-${size.width}-${lang}`);
  await page.emulateMedia({ media: 'screen' });
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('button, a.big-button, input:not([type=radio]):not([type=checkbox]):not(.visually-hidden), select')]
      .filter((el) => el.offsetParent)
      .map((el) => ({ el: el.className || el.id || el.tagName, ...el.getBoundingClientRect().toJSON() }))
      .filter((r) => r.height < 44)
      .map((r) => `${r.el}:${Math.round(r.height)}`),
  );
  check(user, 'targets at least 44px high on registration', small.length === 0, small.join(','));
  check(user, 'no downloads during navigation', downloads.length === 0, downloads.join(','));
  check(user, 'no page errors', errors.length === 0, errors.join('; '));
  await context.close();
}

// Reads the stored day list straight from IndexedDB (idb-keyval's default store).
async function storedDays(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('keyval-store');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains('keyval')) return resolve([]);
          const get = db.transaction('keyval').objectStore('keyval').get('entries');
          get.onsuccess = () => resolve(get.result || []);
          get.onerror = () => reject(get.error);
        };
      }),
  );
}

async function addDay(page, text) {
  await page.click('.home .big-button.primary');
  await ready(page, '#heard');
  await fillFromText(page, text);
  await page.click('.entry-form button[type=submit]');
  await ready(page, '.home');
}

async function reloadHome(page) {
  await page.goto(BASE);
  await page.reload();
  await ready(page, '.home');
}

async function persistence(browser, size, lang) {
  const user = `persistence ${size.width} ${lang}`;
  const { context, page, errors } = await newPage(browser, size, lang);
  await context.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (localStorage.getItem('qa:fail-writes')) throw new DOMException('disk full', 'QuotaExceededError');
      return put.apply(this, args);
    };
  });
  await startAsWorker(page, 'Persist', '');
  await reloadHome(page);
  check(user, 'profile survives reload', (await page.textContent('.greeting')).trim() === 'Persist');

  await addDay(page, 'aaj Ramesh thekedar ke yahan Lanka mein mistri ka kaam, 700 tay, 500 mile');
  await addDay(page, 'kal ramesh  thekedar ke yahan Lanka mein mistri ka kaam, 700 tay, 700 mile');
  let stored = await storedDays(page);
  check(user, 'two days stored with unique ids', stored.length === 2 && new Set(stored.map((d) => d.id)).size === 2, JSON.stringify(stored.map((d) => d.id)));
  check(user, 'stored days carry the site', stored.every((d) => d.site.trim().length > 0));
  check(user, 'one spelling per contractor', new Set(stored.map((d) => d.contractorName)).size === 1, stored.map((d) => d.contractorName).join('|'));
  await reloadHome(page);
  check(user, 'home total 2 after reload', (await page.textContent('.hero-total strong')).trim() === '2');

  await page.click('.home .big-button.primary');
  await ready(page, '#heard');
  await fillFromText(page, 'aaj Ramesh thekedar ke yahan Lanka mein mistri ka kaam, 700 tay');
  await page.click('.entry-form button[type=submit]');
  check(user, 'same day and contractor again is blocked next to the date', await page.isVisible('#date-error'));
  check(user, 'duplicate not stored', (await storedDays(page)).length === 2);
  await (await topBack(page)).click();
  await ready(page, '.home');

  await goTile(page, 1);
  await ready(page, '.ledger-list');
  check(user, 'ledger has one contractor row with 2 days', (await page.locator('.ledger-card').count()) === 1 && /2/.test(await page.textContent('.ledger-card .muted')));
  await page.goBack();
  await ready(page, '.home');

  await page.evaluate(() => localStorage.setItem('qa:fail-writes', '1'));
  await page.click('.home .big-button.primary');
  await ready(page, '#heard');
  await fillFromText(page, 'aaj Suresh thekedar ke yahan Sigra mein helper ka kaam, 500 tay');
  await page.click('.entry-form button[type=submit]');
  await page.waitForSelector('.toast');
  check(user, 'failed write shows the storage error', /सेव नहीं हो पा रहा|cannot be saved/.test(await page.textContent('.toast')), await page.textContent('.toast'));
  check(user, 'failed write keeps the form open', (await page.locator('#heard').count()) === 1);
  check(user, 'failed write re-enables save', await page.isEnabled('.entry-form button[type=submit]'));
  await page.evaluate(() => localStorage.removeItem('qa:fail-writes'));
  await reloadHome(page);
  check(user, 'failed write did not pretend: still 2 days', (await page.textContent('.hero-total strong')).trim() === '2');

  await goTile(page, 0);
  await ready(page, '.day-list');
  page.on('dialog', (d) => d.accept());
  // Both taps land before React re-renders, so each delete starts from the same list.
  await page.evaluate(() => document.querySelectorAll('.day-card button.danger').forEach((b) => b.click()));
  await page.waitForFunction(() => document.querySelectorAll('.day-card').length === 0);
  await reloadHome(page);
  check(user, 'two quick deletes both persist', (await storedDays(page)).length === 0 && (await page.textContent('.hero-total strong')).trim() === '0');

  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open('keyval-store');
        open.onsuccess = () => {
          const tx = open.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put([{ id: 'oldone', date: '2026-01-05', contractorName: 'Purana' }, { date: 'kal' }], 'entries');
          tx.oncomplete = resolve;
        };
      }),
  );
  await reloadHome(page);
  await goTile(page, 0);
  await ready(page, '.screen-header');
  check(user, 'old stored day without new fields still shows', (await page.locator('.day-card').count()) === 1);

  const beforeDemo = JSON.stringify(await storedDays(page));
  await page.goto(BASE);
  await ready(page, '.home');
  await goTile(page, 3);
  await ready(page, '.screen-header');
  await page.locator('main section.panel button', { hasText: /demo|डेमो/i }).first().click();
  await ready(page, '.demo-banner');
  await page.goto(`${BASE}#/add`);
  await ready(page, '#heard');
  await fillFromText(page, 'aaj Demo thekedar ke yahan Sigra mein helper ka kaam, 500 tay');
  await page.click('.entry-form button[type=submit]');
  await page.waitForTimeout(500);
  check(user, 'demo day never written to storage', JSON.stringify(await storedDays(page)) === beforeDemo);
  await page.locator('.demo-banner button').click();
  await page.waitForSelector('.demo-banner', { state: 'detached' });

  await page.goto(BASE);
  await ready(page, '.home');
  await goTile(page, 3);
  await ready(page, '.screen-header');
  await page.locator('button.danger').click();
  await ready(page, '#welcome-name');
  await page.reload();
  await ready(page, '#welcome-name');
  check(user, 'delete all survives reload', (await storedDays(page)).length === 0);
  check(user, 'no page errors', errors.length === 0, errors.join('; '));
  await context.close();
}

async function backupAndOffline(browser, size) {
  const user = `backup/offline ${size.width}`;
  const { context, page, errors } = await newPage(browser, size, 'en');
  await startAsWorker(page, 'Backup Test', '');
  await page.click('.home .big-button.primary');
  await ready(page, '#heard');
  await fillFromText(page, 'aaj Ramesh thekedar ke yahan Lanka mein mistri ka kaam, 700 tay, 500 mile');
  await page.click('.entry-form button[type=submit]');
  await ready(page, '.home');
  await goTile(page, 3);
  await ready(page, '.screen-header');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('button', { hasText: 'Save backup file' }).click()]);
  const backupPath = await download.path();
  check(user, 'backup file saved', fs.readFileSync(backupPath, 'utf8').includes('Ramesh'));
  const bad = path.join(path.dirname(backupPath), 'bad.json');
  fs.writeFileSync(bad, '{"hello":1}');
  await page.setInputFiles('.file-button input', bad);
  await ready(page, '.toast');
  check(user, 'wrong backup file rejected', (await page.textContent('.toast')).includes('not a Shramik'));
  page.once('dialog', (d) => d.accept());
  await page.locator('button.danger').click();
  await ready(page, '#welcome-name');
  check(user, 'delete all returns to welcome', true);
  await startAsWorker(page, 'Backup Test', '');
  await goTile(page, 3);
  await page.setInputFiles('.file-button input', backupPath);
  await ready(page, '.toast');
  check(user, 'restore says how many days came back', await page.waitForFunction(() => document.querySelector('.toast')?.textContent.includes('1 day restored')).then(() => true, () => false));
  await page.goto(BASE);
  await ready(page, '.home');
  await goTile(page, 0);
  await ready(page, '.screen-header');
  check(user, 'restore brings day back', (await page.locator('.day-card').count()) === 1);

  const manifest = await (await page.request.get(`${BASE}manifest.webmanifest`)).json();
  check(user, 'manifest has 192 and 512 icons', ['192x192', '512x512'].every((s) => manifest.icons.some((i) => i.sizes === s)));
  for (const icon of manifest.icons) check(user, `icon ${icon.src} reachable`, (await page.request.get(new URL(icon.src, BASE).href)).ok());
  await page.goto(BASE);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(3000);
  await page.reload();
  await ready(page, '.home');
  await context.setOffline(true);
  await page.reload();
  check(user, 'offline reload shows home', await page.waitForSelector('.home', { timeout: 5000 }).then(() => true, () => false));
  await page.goto(`${BASE}confirm/#abc`).catch(() => {});
  check(user, 'offline confirm page loads', await page.waitForSelector('.error', { timeout: 5000 }).then(() => true, () => false));
  await context.setOffline(false);
  check(user, 'no page errors', errors.length === 0, errors.join('; '));
  await context.close();
}

// ONLY=demo (or worker, contractor, navigation, backup) runs one suite.
const ONLY = process.env.ONLY;
async function suite(label, run) {
  if (ONLY && !label.includes(ONLY)) return;
  await run().catch((e) => check(label, 'run', false, e.message.split('\n')[0]));
}

(async () => {
  const browser = await chromium.launch();
  for (const size of SIZES) {
    for (const lang of ['hi', 'en']) {
      await suite(`new worker ${size.width} ${lang}`, () => newWorker(browser, size, lang));
      await suite(`worker+contractor ${size.width} ${lang}`, () => confirmRoundTrip(browser, size, lang));
      await suite(`judge/demo ${size.width} ${lang}`, () => demoVisitor(browser, size, lang));
      await suite(`navigation ${size.width} ${lang}`, () => navigationAndScreens(browser, size, lang));
    }
  }
  await suite('persistence hi', () => persistence(browser, SIZES[1], 'hi'));
  await suite('persistence en', () => persistence(browser, SIZES[2], 'en'));
  await suite('backup/offline', () => backupAndOffline(browser, SIZES[1]));
  await browser.close();
  if (process.env.WEBKIT) {
    const wk = await webkit.launch().catch(() => undefined);
    if (wk) {
      await newWorker(wk, SIZES[2], 'hi').catch((e) => check('webkit new worker', 'run', false, e.message.split('\n')[0]));
      await confirmRoundTrip(wk, SIZES[2], 'en').catch((e) => check('webkit round trip', 'run', false, e.message.split('\n')[0]));
      await wk.close();
    } else check('webkit', 'launch', false, 'WebKit not installed for this Playwright');
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
