# OpenQuote AU

Free, open-source AI quoting for tradies. Describe a job the way you'd tell a mate on the phone, and OpenQuote AU
breaks it into stages and prices every line with your own rates. Edit it, send it to your client as a link, and
they can accept it from their phone.

- **Price a job in under a minute.** Stages, quantities, labour and materials, with your rates used first.
- **Real prices, not guesses.** A built-in price book of checked material prices, and calculators that work out
  fences and decks post by post and board by board. Anything the AI had to estimate is marked "Check price".
- **Edit anything.** Change quantities, prices and descriptions, and add or remove lines and stages.
- **Send it.** A branded quote page for your client with your logo and terms, plus Accept and Decline buttons.
- **See what happened.** Know when they opened it, and who accepted or declined it.
- **Your own AI key.** You pay your AI provider directly (a few cents a quote). OpenQuote AU itself is free.

## Run your own OpenQuote AU (free)

You get your own private copy, on free accounts that you control. Nobody else can see your quotes. It takes about
20 minutes, and you don't need to write any code.

**You'll need:** a free [Supabase](https://supabase.com) account (the database), a free
[Vercel](https://vercel.com) account (hosting), and an [Anthropic](https://console.anthropic.com) account with
some API credit for the AI. US$5 goes a long way.

### Step 1: Make the database

1. Sign in to Supabase and click **New project**. Pick the region closest to you (Sydney for Australia), and
   write down the database password you choose.
2. When it's ready, click **Connect** at the top of the project and keep that page open. You'll copy three
   things from it in step 2:
   - the **Project URL** (`https://xxxx.supabase.co`)
   - the **Publishable key** (starts with `sb_publishable_`)
   - the **Transaction pooler** connection string (ends in `:6543/postgres`). Replace `[YOUR-PASSWORD]` in it
     with your database password.

### Step 2: Put it online

1. Make an encryption key. It protects the AI keys you save. Copy the result of one of these:
   - **Mac or Linux:** open Terminal and run `openssl rand -base64 32`
   - **Windows:** open PowerShell and run
     `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`
2. Click this button and sign in to Vercel:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Froriminogue%2Fopenquote&project-name=openquote&repository-name=openquote&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,DATABASE_URL,ENCRYPTION_KEY&envDescription=Your%20Supabase%20project%20details%20and%20an%20encryption%20key&envLink=https%3A%2F%2Fgithub.com%2Froriminogue%2Fopenquote%23step-2-put-it-online)

   The server runs in Sydney (`vercel.json`), next to an Australian database. If you picked a different Supabase
   region, change `syd1` in `vercel.json` to the [Vercel region](https://vercel.com/docs/regions) closest to it,
   or every page will be slow.
3. Paste in the four values: the Supabase Project URL, the publishable key, the pooler string (as
   `DATABASE_URL`) and your encryption key. Click **Deploy**. The first deploy also sets up your database tables.

### Step 3: Finish setting up

1. Open your new site and go to **`/setup`** (for example `https://openquote-abc.vercel.app/setup`). It checks
   everything and tells you exactly what to fix if anything is missing.
2. Make sign-in emails show a code. OpenQuote AU signs you in with a 6-digit code on every device. Supabase only
   lets you change its emails once they go through your own email service, so:
   - In Supabase → **Authentication → Emails → SMTP Settings**, connect a free email service. A Gmail account
     with an [app password](https://myaccount.google.com/apppasswords) works (host `smtp.gmail.com`, port `465`),
     or [Brevo](https://www.brevo.com), which lets you send from your own email address without owning a domain.
   - Then open the **Magic link** and **Confirm sign up** templates and paste in
     [docs/email-code-template.html](docs/email-code-template.html), with the subject
     `Your OpenQuote AU code: {{ .Token }}`.

   Until you do, Supabase's own emails contain a sign-in link instead of a code. That still works, as long as you
   open the link in the same browser you signed in from.

3. Sign in with your email and the code, create your business, then go to **Settings**:
   - **Business:** your name, logo, ABN and quote terms
   - **Rates and pricing:** your hourly rate, the materials you use often, and your markup
   - **AI:** your Anthropic key

Your copy is private: only the first business can be created. To let more people in (staff, or another
business), add `ALLOWED_EMAILS` in Vercel → Settings → Environment Variables, for example
`you@gmail.com, @yourbusiness.com.au`, then redeploy.

If you share your own AI key with other businesses (by setting `ANTHROPIC_API_KEY` in Vercel), each business can
make up to 100 estimates a day with it. Change that with `AI_DAILY_LIMIT` (`0` means no limit). Businesses that add
their own key in Settings → AI aren't limited.

### Put it on your phone

- **Quickest:** open your site in Safari (iPhone) or Chrome (Android), then tap **Share → Add to Home Screen**.
  It opens full screen with its own icon.
- **As an iPhone app** (needs a Mac with Xcode and a free Apple ID): see [ios/README.md](ios/README.md).

### Updates

Your copy is a repository on your GitHub. When OpenQuote AU gets new features, open it on GitHub and click
**Sync fork** (or copy the changes across). Vercel redeploys automatically and updates your database on the way.

## What it costs

| | |
|---|---|
| OpenQuote AU | Free (AGPL-3.0) |
| Supabase and Vercel | Free tiers are plenty for a trades business |
| AI | Pay-as-you-go with your own key, typically a few cents per estimate |

**Free Supabase projects go to sleep after a week without use.** If your site suddenly can't load anything,
open your project in Supabase and click **Restore project**. Using OpenQuote AU at least once a week keeps it awake.

**Prices are a starting point for Melbourne, Victoria (checked October 2026).** The built-in price book covers
fencing, decking and carpentry materials. Labour times haven't been checked by a tradie yet. Your own rates in
**Settings → Rates and pricing** always come first, so set those up, especially outside Victoria.

Quotes are shared as links from your own phone (text, WhatsApp, email), so there's no email service to pay for.
Sign-in sends a code by email through your own free email service (step 3). You stay signed in on each device,
so codes are rare.

## For developers

Prerequisites: Node 22+ and a Supabase project (see step 1).

```bash
cp .env.example .env.local     # paste the values from step 1, plus ENCRYPTION_KEY
npm install
npm run db:migrate             # tables, RLS policies, storage buckets
npm run dev                    # http://localhost:3000
```

Sign in at `/login`, then create your business at `/onboarding`. For demo data, run
`SEED_EMAIL=you@example.com npm run db:seed`. `npm run dev:lan` serves on your network so you can try it on a
phone.

| Script | What it does |
|---|---|
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | Route types and `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | New migration from `src/db/schema.ts` changes |
| `npm run db:migrate` | Apply migrations (production builds on Vercel do this automatically) |
| `npm run ai:try -- "job description"` | Run the AI estimate pipeline once with `ANTHROPIC_API_KEY` (no database) |
| `npm run bench` | Run the reference jobs and compare them with earlier results and market prices (spends AI credit) |

**Stack:** Next.js (App Router, TypeScript, Tailwind) · Supabase (Postgres, Auth, Storage) with Drizzle ORM ·
Vercel AI SDK with bring-your-own-key · Capacitor for the iPhone shell · Vitest. Product spec and data model:
[SPEC.md](SPEC.md). Design system: [DESIGN.md](DESIGN.md).

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
