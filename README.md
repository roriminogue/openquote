# OpenQuote AU

Free, open-source AI quoting for tradies, on your iPhone. Describe a job the way you'd tell a mate on the phone,
and OpenQuote AU breaks it into stages and prices every line with your own rates. Edit it, then send it to your
client as a PDF from your phone.

**Try it:** open **https://openquote-au.pages.dev** (on your phone or computer) and tap **Try it with sample quotes**
to look around a made-up business with four priced jobs. No sign-up or AI key needed. To use it for real, add it to
your iPhone's Home Screen and set up your own business.

- **Price a job in under a minute.** Stages, quantities, labour and materials, with your rates used first.
- **Real prices, not guesses.** A built-in price book of checked material prices, and calculators that work out
  fences and decks post by post and board by board. Anything the AI had to estimate is marked "Check price".
- **Edit anything.** Change quantities, prices and descriptions, and add or remove lines and stages.
- **Send it.** A clean PDF quote with your logo and terms, shared by text, WhatsApp or email from your phone. Mark
  it accepted or declined when the client answers.
- **Everything stays on your phone.** No account to make and no server holding your quotes. They're saved on the
  phone, and the app reminds you to back them up to a file.
- **Costs nothing to run.** Pay only for the AI you use, with your own AI key: a few cents a quote.

<p>
  <img src="docs/screenshots/2-new-estimate.jpg" width="200" alt="New estimate: describe the job or tap Talk, then Price this job">
  <img src="docs/screenshots/3-estimate.jpg" width="200" alt="An estimate: the total, your cost and margin, and where the money goes">
  <img src="docs/screenshots/4-quote.jpg" width="200" alt="The quote your client gets, with your business details, ready to share as a PDF">
  <img src="docs/screenshots/1-estimates.jpg" width="200" alt="Every job you've priced, with its total and status">
</p>

## Get it on your iPhone

**The easy way (no computer, never expires):** open **https://openquote-au.pages.dev** in Safari on your iPhone,
tap **•••** → **Share** → **View More** → **Add to Home Screen**, and leave **Open as Web App** on. OpenQuote then has
its own icon and opens full screen like any other app, even with no signal. Your quotes are saved on your phone,
not on a server.

**The native app (needs a Mac):** a Mac with Xcode (free), your iPhone and a USB cable. A free Apple ID works, but
Apple makes apps installed this way stop opening after 7 days, so you plug in and run the install again each week
(your data stays). Step-by-step instructions: [ios/README.md](ios/README.md).

**The first time you open it:**

1. **Set up your business:** your name and business name.
2. **Add your AI key** in **Settings → AI**: an Anthropic key is recommended
   ([get one here](https://console.anthropic.com/settings/keys)); OpenAI, Google and OpenRouter keys work too. You pay
   the AI company directly, usually a few cents a quote.
3. **Fill in your details:** ABN, logo and contact details in **Settings → Business**, and your labour rate and
   materials in **Settings → Rates and pricing**. They go on every quote.

To move your quotes between phones or versions: **Settings → Your data → Back up to a file**, then **Restore from a
file** on the other.

## What it costs

| | |
|---|---|
| OpenQuote AU | Free (AGPL-3.0) |
| Running it | Nothing: there's no server or database to pay for |
| AI | Your own key, pay-as-you-go (typically a few cents per estimate) |

**Prices are a starting point for Melbourne, Victoria (checked October 2026).** The built-in price book covers
fencing, decking and carpentry materials. Labour times haven't been checked by a tradie yet. Your own rates in
**Settings → Rates and pricing** always come first, so set those up, especially outside Victoria.

## Your data and privacy

**Your quotes stay on your phone.** OpenQuote AU has no account and no server holding anyone's data. Everything you
enter (business details, rates, clients, quotes) is saved inside the app on your phone: in the iPhone app, a SQLite
database in its Library folder, included in the phone's iCloud backups; in the Home Screen version, the same
database in that app's own storage on the phone.

**What leaves your phone, and only when you do it:**

- **Pricing a job:** your job description, site address and rates go to the AI service you chose (Anthropic,
  OpenAI, Google, OpenRouter or your own Ollama) to be priced. Nothing else is sent.
- **Sharing:** the quote PDFs and backup files you choose to send.

**Who else is involved:** the Home Screen version's files are served by Cloudflare Pages, which sees that the app
was loaded, like any website. Nobody else gets anything: no
analytics, no ads, no tracking.

**Backups:** **Settings → Your data → Back up to a file** saves everything to one file you can keep in iCloud
Drive, Files or email; **Restore from a file** brings it back on the same phone or a new one. The app reminds you
when it's been a while. AI keys are never put in backups: in the iPhone app they're in the Keychain, in the Home
Screen version in that app's storage.

## Optional: Sign in with publik

The code can also run as a [publik](https://publikhq.com) app (Sign in with publik, and pay for AI with a publik
plan): put publik's app token in `publik-app-token.txt` at the top of the repo and rebuild. Without that file, which
is the default, none of it runs. The pieces: `ios/App/App/Publik.swift` (iPhone app), `src/lib/publik-web.ts` (web
version) and `functions/publik` (a Cloudflare Pages relay, since publik's API doesn't take calls from web pages).

## Case study

**The problem.** Small trade businesses (fencers, deck builders, carpenters) lose evenings to quoting. The job is
clear in their head after a site visit, but turning it into a priced, itemised quote means counting posts and
boards, looking up material prices and adding labour, often days later. Slow quotes lose jobs. The quoting tools
that exist are built for office staff at a desk, cost a monthly fee, and mostly leave the pricing to you.

**Who it's for.** A sole trader or small crew who quotes from the ute, on a phone, straight after looking at the job.
They know their own rates; they want the counting and the paperwork done for them.

**Key decisions.**

- **The AI proposes, code prices.** The model breaks the job into stages and line items with quantities. It never
  does the arithmetic. Prices come from the tradie's own rates first, then a price book of checked material prices,
  and fences and decks are worked out by calculators (posts, rails, boards, screws) rather than guessed. Anything the
  model had to estimate is flagged "Check price". This is what makes the totals trustworthy.
- **Everything on the phone, no server.** The first version was a Next.js site on Vercel with a Supabase database,
  which meant every user needed their own hosting and accounts to set up. I rebuilt it to run entirely on the
  phone: SQLite (sql.js) in the app, the AI called straight from the phone with the user's own key, and quotes sent
  as a PDF through the iPhone's Share sheet. It costs nothing to run, there's no account, and there's no customer
  data on anyone's server to lose.
- **A Home Screen web app as the main way in.** The same build ships as a native Capacitor app and as a web app on
  Cloudflare Pages. Without a paid Apple developer account, natively installed apps stop opening after 7 days, so the
  web version (offline with a service worker, data stored on the phone) is the one people actually use. The native
  app stays for features the web can't do as well, like the Keychain and native PDFs.
- **Backups instead of sync.** With no server, the phone is the only copy. The app saves a single backup file the
  user can keep in iCloud Drive or email, restores it on another phone, and reminds them when it's been a while.
- **A sample business to try first.** "Try it with sample quotes" loads a made-up business with four priced jobs, so
  anyone can see the whole flow without setting anything up or paying for AI.

**What didn't work.** I listed the app on [publik](https://publikhq.com), a marketplace with its own sign-in and
AI billing. Getting it working needed a relay (its API doesn't accept calls from web pages), and its Google sign-in
couldn't return to a Home Screen app on the iPhone, so signing in kept stranding people in Safari. It added friction
for no real gain, so I took it out. The code is still in the repo, switched off.

**What I learnt.**

- Treat the model as a planner, not a calculator. Splitting "what's in the job" from "what it costs" made the
  output checkable and the prices consistent.
- Removing the server removed whole categories of work: accounts, hosting bills, data protection, outages.
- Phone-first means testing on a real phone. The on-screen keyboard, safe areas, Share sheet and Home Screen
  behaviour all differ from a desktop browser and from the Simulator.
- Distribution on the iPhone is a product decision, not a detail. How people install the app shaped the
  architecture more than any feature did.

## For developers

Prerequisites: Node 22+. For the iPhone app, a Mac with Xcode.

```bash
npm install
npm run dev                    # http://localhost:5173, the whole app in a browser (data in IndexedDB)
npm run ios                    # build the app's screens and copy them into the Xcode project
```

| Script | What it does |
|---|---|
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | New migration in `src/db/migrations` from `src/db/schema.ts` changes (the app applies it on launch) |
| `npm run ai:try -- "job description"` | Run the AI estimate pipeline once with `ANTHROPIC_API_KEY` |
| `npm run bench` | Run the reference jobs and compare them with earlier results and market prices (spends AI credit) |
| `./scripts/deploy-web.sh` | Build and publish the web version to Cloudflare Pages |
| `./ios/install-on-iphone.sh` | Build and install the native app on a plugged-in iPhone |

**Moving from the old hosted version:** `npx tsx scripts/export-from-web.ts` reads a business from its Postgres
database (`DATABASE_URL` in `.env.local`) and writes a backup file to `exports/`; restore it in the app.

**Stack:** React, TypeScript, Vite and React Router · the Astryx design system and Tailwind · SQLite in the app
(sql.js) with Drizzle ORM · Vercel AI SDK, calling the AI provider straight from the phone · Capacitor for the
iPhone app, with a small native plugin (`ios/App/App/OpenQuoteNative.swift`) for the Keychain, PDFs and Sign in
with publik · Vitest. Product spec and data model: [SPEC.md](SPEC.md). Design system: [DESIGN.md](DESIGN.md).

**Principles:**

- **Money is integer cents, ex-GST.** GST is applied once, on the document total.
- **Prices come from data.** `src/lib/price-book/items.json` holds the checked material prices (date, region and
  sources included); `src/lib/estimate/assemblies.ts` holds the fence and deck rules.
- **The LLM proposes, code prices.** The model outputs structured line items; all arithmetic lives in
  `lib/pricing.ts`.
- **Every change is a version.** AI and manual edits write an `estimate_versions` snapshot.

## Contributing

Bug reports, ideas and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). To report a security
problem privately, see [SECURITY.md](SECURITY.md).

## License

[AGPL-3.0](LICENSE). You can use, change and share OpenQuote AU for free. If you run a modified version for other
people to use over the internet, you must share your changes under the same license.

OpenQuote AU is an independent project. It contains no code, prompts or assets from any commercial quoting tool.
Estimates are a starting point; check every quote before you send it.
