# OpenQuote

Open-source, AI-powered quoting and job management for trades businesses. Describe a job by voice, text, photos
or plans, and get a priced, editable quote built from your own rates. Then send it, track it and invoice it.

> Working name. Product spec, data model and roadmap: [SPEC.md](SPEC.md).

## Stack

Next.js (App Router, TypeScript, Tailwind) · Supabase (Postgres + Auth + Storage) with Drizzle ORM · Mailpit
(dev email) · Vitest · bring-your-own-key AI, Claude by default (coming next).

## Getting started

Prerequisites: Node 22+, a free [Supabase](https://supabase.com) project, and Docker if you want Mailpit.

1. In Supabase → your project → **Connect**, copy the API URL, the publishable key, and the
   **Transaction pooler** connection string (fill in your database password).
2. Set up env and the database:

```bash
cp .env.example .env.local     # paste the values from step 1
openssl rand -base64 32        # paste as ENCRYPTION_KEY
npm install
npm run db:migrate             # tables, RLS policies, storage buckets
npm run dev                    # http://localhost:3000
```

3. Sign in at `/login` with an email link, then create your business at `/onboarding`.
   For demo data: `SEED_EMAIL=you@example.com npm run db:seed`.

Optional: `npm run mail:up` starts Mailpit (http://localhost:8025) to catch outgoing proposal emails.
To use Google sign-in, enable the Google provider in Supabase → Authentication.

AI features use your own provider key, set either in Settings → AI or as `ANTHROPIC_API_KEY` for the whole
install. See [SPEC.md §7a](SPEC.md).

## Scripts

| Script | What it does |
|---|---|
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | New migration from `src/db/schema.ts` changes |
| `npm run db:migrate` | Apply migrations |
| `npm run ai:try -- "job description"` | Run the AI estimate pipeline once with `ANTHROPIC_API_KEY` (no database) |

## Layout

```
src/
  app/            Next.js routes
  db/schema.ts    MVP data model (SPEC.md §4)
  db/seed.ts      Synthetic demo data
  lib/pricing.ts  Deterministic pricing: markup resolution, GST, margin
drizzle/          Generated SQL migrations
```

## Design principles

- **Money is integer cents, ex-GST.** GST is applied once, on the document total.
- **The LLM proposes, code prices.** The model outputs structured line items; all arithmetic lives in
  `lib/pricing.ts`.
- **Every change is a version.** AI and user edits write an `estimate_versions` snapshot, so they can be undone
  and you can see what each client saw.

## Disclaimer

An independent project inspired by commercial trades-quoting tools. It contains no code, prompts or assets from
any of them.
