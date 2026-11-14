# Shramik Passbook (श्रमिक पासबुक)

A worker-owned record of construction work days, confirmed by the contractor over WhatsApp, shaped for the UP BOCW self-declaration.

Built during Code for India's **Code for a Billion** hackathon (impact area: Livelihood for the Uneducated).

## The problem

Construction workers in Uttar Pradesh can register with the UP Building and Other Construction Workers (BOCW) Welfare Board ([upbocw.in](https://upbocw.in)) for pensions, accident cover, children's scholarships, maternity help and more. Registration needs proof of at least 90 days of construction work in the last 12 months. Since August 2020, UP has allowed workers to self-certify their days of work ([CAG performance audit of the UP BOCW Welfare Board, 2025](https://cag.gov.in/uploads/download_audit_report/2025/Final-rReport-No.04-WOBCW-English-UP---signed-07-05-2025-0689b2ec7244ad9.46184642.pdf)), but the worker still has to name the sites and periods worked.

Workers move between many small contractors and keep no record, so they cannot say where and when they worked. Indus Action's 2025 brief recommends a hybrid worker passbook, employer phone confirmation and geotagged worksite photos. Existing attendance apps (HajariBook, Laborbook, Labour Mistri) keep the record on the contractor's phone, and UP's Digital Labour Chowk app is for job matching, not a work record.

Shramik Passbook is the record the worker owns, and it complements upbocw.in rather than replacing it.

## How it works

1. **Log a day.** Date, type of work (icons), site (text and optional GPS), contractor name and phone, wage agreed and wage paid. The form is pre-filled from the last entry, so a repeat day is two taps. The worker can also speak the day in Hindi or Hinglish ("aaj Ramesh thekedar ke yahan Gomti Nagar mein mistri ka kaam, 700 tay, 500 mile"); the parsed fields are highlighted for checking before saving.
2. **Ask the contractor to confirm.** The app builds a WhatsApp message with a link to the confirm page of the same static site. The days travel inside the link itself (`confirm/#<payload>`), so no server is involved. The contractor sees the days in Hindi, unticks any wrong day, and taps "हाँ, सही है".
3. **Get the confirmation back.** The confirm page opens WhatsApp with a short code for the worker (`SP1-<entry ids>-<checksum>`). The worker taps the link or pastes the message, and those days are marked "ठेकेदार ने पुष्टि की".
4. **Track 90 days.** The home screen shows contractor-confirmed days towards 90 as the headline, with self-reported days shown separately, and how many more days are needed.
5. **Wage ledger.** Agreed vs paid per contractor and the total pending.
6. **Registration ready.** A Hindi checklist of what UP BOCW registration needs (age 18 to 60, 90 days in 12 months, Aadhaar, bank passbook, photo, self-declaration; apply at upbocw.in or a Jan Seva Kendra/CSC) and a printable work evidence summary grouped by site and contractor, with every date and its confirmation status. The summary is clearly titled as a supporting record prepared by the worker and states that it is **not a government certificate**.

Evidence levels per day: self-reported, photo attached (optional worksite photo with timestamp and GPS if allowed; the app asks for no faces), contractor confirmed.

### Demo mode

Settings → "Sample data (demo)" loads three sample workers so the full flow can be seen without typing. Demo data lives only in memory, is never mixed with real data, and a yellow banner stays on screen while it is on.

### Voice parser and the agent interface

`src/lib/parser.ts` is a deterministic parser for common Hindi and Hinglish phrasing: number words in Devanagari and Latin script (including साढ़े, डेढ़, ढाई), digits, `aaj` / `kal` / `parson`, "5 tarikh", contractor names next to "thekedar", sites before "mein", and amounts tagged as agreed (`tay`, `dihadi`), paid (`mile`, `diye`) or pending (`baaki`).

`src/agent/index.ts` defines an `EntryParserAgent` interface. If `VITE_PARSER_ENDPOINT` is set at build time, the app POSTs `{ text, today }` to that endpoint (for example a serverless function that calls an LLM such as Gemini with a server-side key) and falls back to the deterministic parser on any error. No API key is ever placed in the client. See `.env.example`.

## Privacy

- No backend, no accounts. Everything is stored on the worker's phone (IndexedDB and localStorage).
- Only a name and an optional phone number are asked for. No Aadhaar number is collected.
- The confirm page stores nothing; the days travel inside the WhatsApp link.
- "Export my summary" downloads counts only (days, confirmed days, photo days, number of contractors, pending wages) with no names or numbers, so pilot numbers can be counted by hand with the worker's consent.
- "Delete all my data" wipes everything on the phone.

### Limits to know

- The confirmation code has a checksum to catch typing mistakes. It is not a cryptographic signature, so it shows that a contractor was asked and replied on WhatsApp, not tamper-proof proof. The WhatsApp chat itself is the stronger record.
- Data lives on one phone. If the phone is lost, the record is lost; a backup/restore option is planned.
- Voice input uses the browser's Web Speech API, which works in Chrome on Android with an internet connection. Typing works everywhere, offline included.

## Setup

Requires Node.js 20 or newer.

```bash
npm install
npm run dev      # start the dev server
npm test         # run the unit tests (Vitest)
npm run build    # type-check and build to dist/
```

## Deploy to GitHub Pages

The Vite base path is read from the `BASE_PATH` environment variable (default `/`).

```bash
BASE_PATH=/shramik-passbook/ npm run build
```

The included workflow `.github/workflows/deploy.yml` builds with `BASE_PATH=/<repository name>/` and publishes `dist/` on every push to `main`. In the repository settings, set Pages → Source to "GitHub Actions". The confirm page is built as its own `confirm/index.html`, so `/<repo>/confirm/#...` links work on Pages without a 404 workaround.

## Sources

- Indus Action, "Innovations for Construction Worker Validation Protocols" (2025): https://indusaction.org/wp-content/uploads/2025/11/Innovations_For_Construction_Worker_Validation_protocols_IApdf.pdf
- Uttar Pradesh Building and Other Construction Workers Welfare Board: https://upbocw.in

## Project structure

- `src/lib/` parser, 90-day counter, wage ledger, confirmation payload and code, storage, demo data
- `src/agent/` pluggable parser agent (deterministic by default, optional remote endpoint)
- `src/screens/` app screens, including the contractor confirm page
- `public/sw.js` service worker for offline use

## License

MIT, see `LICENSE`.

Made by **Wageesha Tripathi** · [LinkedIn](https://www.linkedin.com/in/wst2002/) · [Email](mailto:tripathiwageesha2002@gmail.com) · [GitHub](https://github.com/WST2002)
