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

  await page.click('.home .big-button.primary');
  await ready(page, '#heard');
  check(user, 'add screen top-bar back visible', await (await topBack(page)).isVisible());
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
  await page.fill('#heard', '');
  await page.click('.inline-form button[type=submit]');
  check(user, 'empty text does nothing', (await page.locator('.voice-box .notice').count()) === 0);
  await page.fill('#contractor', 'Manual Wala');
  await page.fill('#contractor-phone', '09876500001');
  await page.fill('#agreed', '600');
  await page.fill('#paid', '800');
  await page.click('.entry-form button[type=submit]');
  await ready(page, '.home');

  await goTile(page, 0);
  await ready(page, '.day-list');
  check(user, 'days list shows 3 days', (await page.locator('.day-card').count()) === 3);
  page.once('dialog', (d) => d.accept());
  await page.locator('.day-card').first().locator('button.danger').click();
  await page.waitForFunction(() => document.querySelectorAll('.day-card').length === 2);
  check(user, 'delete a day', true);
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
  const href = await page.getAttribute('a.whatsapp', 'href');
  const url = new URL(href);
  check(user, 'wa.me number normalised from 0-prefix', url.pathname === '/919876511111', url.pathname);
  const text = url.searchParams.get('text');
  check(user, 'message names worker and day count', text.includes('Raju') && text.includes('2'), text.slice(0, 80));
  const link = text.match(/https?:\/\/\S+/)[0];
  check(user, 'message link points to confirm page', link.startsWith(`${BASE}confirm/#`), link.slice(0, 60));

  const contractor = await newPage(browser, size, lang);
  const c = contractor.page;
  await c.goto(link);
  await ready(c, '.confirm-list');
  check(user, 'contractor sees 2 days', (await c.locator('.confirm-day').count()) === 2);
  check(user, 'contractor page no horizontal scroll', await noHorizontalScroll(c));
  await c.locator('.confirm-day button').first().click();
  await c.click('button.big-button.confirm');
  const code = (await c.textContent('.code-box')).trim();
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
  await page.click('.panel .big-button.confirm');
  await ready(page, '.notice');
  check(user, 'pasted WhatsApp message applied 1 day', /1/.test(await page.textContent('.notice')), await page.textContent('.notice'));
  await page.goto(BASE);
  await ready(page, '.home');
  check(user, 'home ring shows 1 confirmed', (await page.textContent('.ring-number')).trim() === '1');

  const codeLink = replyText.match(/https?:\/\/\S+#code=\S+/)[0];
  await page.goto(codeLink);
  await ready(page, '#code');
  check(user, '#code link prefills code', (await page.inputValue('#code')).startsWith('SP1-'));
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
