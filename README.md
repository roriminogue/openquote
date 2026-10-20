# OpenQuote

Open-source, AI-powered quoting and job management for trades businesses. Describe a job by voice, text, photos
or plans, and get a priced, editable quote built from your own rates. Then send it, track it and invoice it.

> Working name. Product spec, data model and roadmap: [SPEC.md](SPEC.md).

## Stack

Next.js (App Router, TypeScript, Tailwind) · Postgres + Drizzle ORM (pgvector image) · MinIO (S3) · Mailpit
(dev email) · Vitest · Claude for estimating (coming next).

## Getting started

Prerequisites: Node 22+, Docker Desktop running.

```bash
cp .env.example .env.local   # already matches docker-compose defaults
npm install
npm run db:up                # postgres, minio, mailpit
npm run db:migrate           # apply drizzle/ migrations
npm run db:seed              # synthetic demo org, rates and an estimate
npm run dev                  # http://localhost:3000
```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| Mail inbox (sent proposals) | http://localhost:8025 |
| MinIO console | http://localhost:9001 (openquote / openquote-dev) |
| DB browser | `npm run db:studio` |

## Scripts

| Script | What it does |
|---|---|
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | New migration from `src/db/schema.ts` changes |
| `npm run db:migrate` | Apply migrations |

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
