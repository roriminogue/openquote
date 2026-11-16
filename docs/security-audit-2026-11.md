# Security audit, November 2026

A review of OpenQuote AU as it runs today: the web version (a Home Screen app served by Cloudflare Pages at
openquote.roriminogue.com), the native iPhone app (Capacitor), the source and its git history, its dependencies, and
the old hosted version that is still online. Done on 16 November 2026, with fixes in the same change.

## How the app is exposed

OpenQuote AU has no server and no accounts. Everything a tradie enters is saved on their phone (SQLite in the app),
and the only things that leave it are the job description and rates sent to the AI provider they chose, with their
own key, and the PDFs and backup files they choose to share. So the things worth protecting are:

- **the AI key**, which can spend the tradie's money: in the iPhone app's Keychain, and in the web version's site
  storage on the phone;
- **the quotes and client details** on the phone and in backup files;
- **the integrity of prices**, which come from the tradie's rates, a price book and calculators.

The ways in are the web page itself (anything that could run script on it), files coming in (restoring a backup),
the hosting (headers, what else the site serves), the code the app ships (dependencies), and the development tools.

## Findings

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | jsPDF 3.0.4 had critical advisories (PDF injection, path traversal, DoS) | High | Fixed: upgraded to 4.2.1 |
| 2 | No Content-Security-Policy, while the web version keeps the AI key in site storage | High | Fixed: strict policy |
| 3 | The publik relay (`/publik/*`) was still live: an open proxy to publik's API on this domain | Medium | Fixed on the live site; old deployments still have it (see below) |
| 4 | The old hosted version (Vercel + Supabase, with the original data) is still online | Medium | Open: needs the owner's decision |
| 5 | No clickjacking protection, HSTS or Permissions-Policy | Low | Fixed |
| 6 | Dev-only key route could be read by a website using DNS rebinding while the dev server runs | Low | Fixed |
| 7 | Restoring a backup kept any triggers or views in the file, which could alter prices later | Low | Fixed |
| 8 | 16 moderate/low advisories in build tools (eslint, drizzle-kit, workbox-build) | Low | Accepted: not shipped; npm's only "fixes" are downgrades |
| 9 | publik's app token is in git history (`publik-app-token.txt`) | Info | Public by design; the listing was removed. Revoke it in publik's dashboard if it still exists |
| 10 | Quotes and backups are stored unencrypted on the phone | Info | Accepted: protected by the phone's own encryption and passcode; backups are the tradie's file to keep safe |

### 1. jsPDF advisories (fixed)

`npm audit` flagged jsPDF ≤ 4.2.0 as critical: several PDF-injection and parsing advisories. The app only feeds jsPDF
its own JPEG renders of the quote (`src/lib/pdf-web.ts`), so the AcroForm, `addJS`, BMP/GIF and new-window paths
aren't reached, but it's the library that builds the document sent to clients. Upgraded to 4.2.1; PDF making checked
on the preview deployment. `npm audit --omit=dev` now reports 0 vulnerabilities.

### 2. Content-Security-Policy (fixed)

In the web version the AI key sits in the site's `localStorage` (the iPhone app uses the Keychain). Nothing found lets
an attacker run script on the page (no `innerHTML`, `dangerouslySetInnerHTML`, `eval` or HTML built from data; React
escapes everything; SQL is always parameterised), but there was no second line of defence. `public/_headers` now
sets a policy that allows scripts only from the site itself (plus WebAssembly for SQLite) and lets the page connect
only to itself and the supported AI providers (Anthropic, OpenAI, Google, OpenRouter, a local Ollama). The one inline
script (applying the saved Light/Dark choice) moved to `public/boot.js` so inline scripts can be refused.

Checked on the preview deployment: the app, sample quotes, PDF making and the offline service worker all work; each
AI provider is reachable; a request to any other site is refused by the policy (`connect-src`). The deploy script
refuses to publish if the headers are missing.

Trade-off: an Ollama server reached over https somewhere other than this computer isn't allowed. Add its address to
`connect-src` if that's ever needed.

### 3. Open publik relay (fixed on the live site)

`functions/publik` passed requests, including `Authorization` and `x-api-key` headers, from
`openquote.roriminogue.com/publik/*` to publik's API. Publik was switched off on 13 November, but the relay kept
answering: anyone could route publik AI calls through this domain and use up the free plan's daily function requests.
It is removed (publik's client code stays, switched off; the README says to restore the relay first).

**Still open:** every Cloudflare Pages deployment keeps its own copy of the site at a permanent address
(`<id>.openquote-au.pages.dev`), and the 25 earlier deployments still have the relay and lack the new headers.
Deleting the old deployments in Cloudflare closes this.

### 4. Old hosted version (open)

`openquote-rust.vercel.app` and `openquote-app.vercel.app` still serve the earlier Next.js version, backed by the
Supabase project `quoteai-dev`, which holds the original business data and sign-in. Supabase's advisor reports no
exposed tables (RLS is on; the two tables without policies are closed to everyone) and only that leaked-password
protection is off (sign-in used email codes). It isn't used any more, so the safest step is to export anything worth
keeping (`scripts/export-from-web.ts`) and then delete the Vercel projects and pause or delete the Supabase project.

### 5. Other headers (fixed)

Added `X-Frame-Options: DENY` and `frame-ancestors 'none'` (the app can't be framed by another site),
`Strict-Transport-Security`, `Permissions-Policy` (microphone for Talk only; camera, location, payment off) and
`Cross-Origin-Opener-Policy: same-origin`.

### 6. Development key route (fixed)

For local testing, the dev server can hand the page a testing key from `.env.local` (`/__dev/ai-key`, never in a
build). It checked that requests came from this computer, but a website can point its own domain at 127.0.0.1 (DNS
rebinding), and the route ran before Vite's own host check. It now also requires the request to be addressed to
`localhost` or `127.0.0.1` and not to come from another site (`Sec-Fetch-Site`). Checked: a normal request works, a
rebinding-style request and a cross-site request are refused.

### 7. Restoring a backup (fixed)

A backup is a SQLite file that could come from anyone. The app checked it was an OpenQuote database and asked before
replacing anything, but a doctored file could carry a trigger that, say, doubles every new line's cost. Restore now
drops every trigger and view (the app's schema has none) and refuses files over 50 MB. Covered by
`src/db/restore.test.ts`.

## Checked and fine

- **Secrets in the repo and its history:** none. Database URLs in history are placeholders; `.env.local` is ignored.
  The live site's files contain no keys (checked for the development key route too).
- **iPhone app:** App Transport Security is at its secure default (no exceptions); AI keys are stored in the Keychain
  with `AfterFirstUnlockThisDeviceOnly` (not synced, not in backups); the `openquote://` URL scheme isn't handled by the
  web code.
- **AI output:** shown as text, never as HTML; prices come from code, not from the model; anything the model guessed
  is flagged "Check price".
- **Links and windows:** only blob URLs the app made itself and same-site links; no open redirects.
- **Service worker:** caches only the app's own files; never caches AI requests.

## Recommendations for later

- Delete the old Cloudflare deployments and the old Vercel/Supabase version (findings 3 and 4).
- Delete any AI key that has been pasted into a chat or shared, and use a separate key with a spending limit for testing.
- Re-run `npm audit` before each release, and this review when a new provider, file import or server piece is added.
