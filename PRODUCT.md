# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: owner-operator tradies in Australia (carpenters, builders, electricians, plumbers, tilers) who quote their
own jobs. They quote from a phone on site or in the ute between jobs, and finish admin at night on a laptop or at
the kitchen table. Their job: turn a site visit into a priced, professional quote fast, before the client goes
with someone else.

Secondary: the same tradie at a laptop in the evening (the web version works in any browser). Clients never use
the app: they get the quote as a PDF by text, WhatsApp or email.

## Product Purpose

OpenQuote AU turns a job description into a priced, editable, sendable quote, using the business's
own rates and markup, then tracks it through to accepted or declined. Success: a quote
the tradie would put their name to, in minutes instead of an evening, with numbers they trust.

## Positioning

Open source (AGPL-3.0) and bring-your-own-key: no account, no server, no AI credits, no lock-in. Everything is
saved on the phone and the business pays its AI provider directly, usually a few cents a quote. The model drafts, deterministic code prices: rate rules always win over the AI, every line records
where its price came from, and every change is a version that can be undone.

## Operating Context

- Site and ute: one hand, bright sun, dusty or gloved fingers, patchy mobile data. (Inferred from the audience.)
  The app works offline; only pricing a job needs a connection, to reach the AI provider.
- Evenings: laptop, longer sessions reviewing and editing line items, then sending.
- Pricing a job takes 15–60 seconds and the stages stream in as they're written; the wait is part of the experience.
- Money is integer cents ex-GST; GST (10% AU) applied once at the total; markup ≠ margin, both shown.
- Australian terms: GST, ABN, subbie, lm (lineal metres), m², "quote" and "estimate" used interchangeably by
  users; the app's object is an Estimate (EST-1001), sent to clients as a Quote (PDF).

## Capabilities and Constraints

Built: business setup, a sample business to try first, Talk (speech to text), AI estimates streamed from the phone
straight to the provider (Anthropic, OpenAI, Google, OpenRouter, Ollama), deterministic pricing from the tradie's
rates, a checked price book and fence/deck calculators, "Check price" flags on AI guesses, a full estimate editor
with versions, projects and clients, the client quote as a PDF through the Share sheet, accepted/declined status,
Settings (business, rates and pricing, AI, your data), and backup/restore to a single file.

Not yet built: invoices, chat refinement of an estimate, sync between devices, trades beyond fencing, decking and
carpentry in the price book. Labour times haven't been checked by a tradie yet.

Constraints: no server. Distribution is a Home Screen web app (Cloudflare Pages, offline via a service worker,
data in the browser's storage on the phone) and a native Capacitor app, which a free Apple ID can only install for
7 days at a time.

Stack: React 19, TypeScript, Vite, React Router, Astryx with Tailwind CSS 4, SQLite in the app (sql.js) with
Drizzle, the Vercel AI SDK, Capacitor for iOS, Vitest.

## Brand Commitments

- The name is "OpenQuote AU" (plain "OpenQuote" is taken by another product). Write it in full; the wordmark sets
  "AU" in medium secondary text after a semibold "OpenQuote". Code identifiers, the repo and URLs stay `openquote`.
- Original look: no competitor's name, copy, UI or trade dress (SPEC.md §10). Reference material in
  `design/references/` is reference only.

## Evidence on Hand

No real customers, testimonials, logos or photography. Demo data must be labelled synthetic (the sample business
says so on screen). Real AI estimates exist on the owner's phone (EST-1010 fence among them).

## Product Principles

1. The number is the product: totals, prices and their sources are always legible and never ambiguous.
2. The AI proposes, the tradie decides: every AI output is editable, explained, and reversible.
3. Built for the site, finished at the desk: phone-first under harsh conditions, generous on a laptop.
4. Honest about cost and state: show what's generating, what failed, and what it cost.

## Accessibility & Inclusion

WCAG 2.2 AA as the floor. Outdoor readability (high contrast, large text and targets ≥ 44px) is a product
requirement, not a nicety. (Inferred from the operating context.)
