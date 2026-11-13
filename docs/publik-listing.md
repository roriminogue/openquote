# publik listing (draft)

What OpenQuote AU's listing on [publik](https://publikhq.com) says. Field names and limits are publik's
(`/skills/publish.md`); the listing itself is made with publik's publish flow, which asks for one approval in the
browser.

| Field | Value |
|---|---|
| `name` (max 18) | OpenQuote AU |
| `summary` (max 80, no links) | Describe a job, get it priced with your rates, send the quote as a PDF. |
| `category` | Business |
| `alternativeTo` | Tradify, ServiceM8, Fergus |
| `license` | AGPL-3.0 |
| `platforms` | iPhone (Home Screen web app, any iPhone; native app for Mac owners), Android and desktop browsers |
| `publikApi.enabled` | true |
| `publikApi.products` | `ai.chat` |

## Description

Free AI quoting for Australian tradies. Tell OpenQuote AU about the job the way you'd tell a mate on the phone,
typing or talking, and it breaks it into stages and prices every line: materials, labour and subbies, with your own
rates first and a checked price book for fencing, decking and carpentry. Fix anything, then send your client a clean
PDF quote with your logo and terms from your phone, and mark it accepted when they say yes.

Everything stays on your phone: no account to make and no server holding your quotes. The app reminds you to back
them up to a file. Pay only for the AI you use, with your publik plan or your own key.

**Install:** open https://openquote-au.pages.dev in Safari on your iPhone, tap Share → Add to Home Screen. No
computer, no App Store, and it doesn't expire.

## Run

- **Use it:** https://openquote-au.pages.dev (add to the Home Screen).
- **Build the web version:** `npm install`, then `npm run build` (output in `dist/`); publish with
  `./scripts/deploy-web.sh`.
- **Native iPhone app (Mac):** `./ios/install-on-iphone.sh`, see [ios/README.md](../ios/README.md).

## Screenshots

In `docs/screenshots/`, taken at iPhone size with made-up sample data:

1. `2-new-estimate.jpg`: describe the job, or tap Talk
2. `3-estimate.jpg`: the total, your cost, margin and where the money goes
3. `4-quote.jpg`: the quote your client gets, shared as a PDF
4. `1-estimates.jpg`: every job you've priced
5. `5-estimates-dark.jpg`: dark mode

## After listing

1. Put publik's app token in `publik-app-token.txt` at the top of the repo and commit it (publik intends it to be
   public; it identifies the app, it isn't a password).
2. `./scripts/deploy-web.sh` and `./ios/install-on-iphone.sh`: both versions then open behind Sign in with publik.
3. Check the real sign-in on a phone, then run publik's self-test.
