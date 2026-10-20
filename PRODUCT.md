# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: owner-operator tradies in Australia (carpenters, builders, electricians, plumbers, tilers) who quote their
own jobs. They quote from a phone on site or in the ute between jobs, and finish admin at night on a laptop or at
the kitchen table. Their job: turn a site visit into a priced, professional quote fast, before the client goes
with someone else.

Secondary (from SPEC.md, not yet built): an office/estimator who edits on desktop; crew who receive job cards
without prices; homeowner clients who view and accept proposals on their phone.

## Product Purpose

OpenQuote (working name) turns a job description into a priced, editable, sendable quote, using the business's
own rates, markup and standing instructions, then tracks it through to acceptance and invoice. Success: a quote
the tradie would put their name to, in minutes instead of an evening, with numbers they trust.

## Positioning

Open source and bring-your-own-key: no AI credits, no lock-in; the business pays its AI provider directly and can
self-host. The model drafts, deterministic code prices: rate rules always win over the AI, every line records
where its price came from, and every change is a version that can be undone.

## Operating Context

- Site and ute: one hand, bright sun, dusty or gloved fingers, patchy mobile data. (Inferred from the audience.)
- Evenings: laptop, longer sessions reviewing and editing line items, then sending.
- Generation takes 15–60 seconds and streams in progressively; the wait is part of the experience.
- Money is integer cents ex-GST; GST (10% AU) applied once at the total; markup ≠ margin, both shown.
- Australian terms: GST, ABN, subbie, lm (lineal metres), m², "quote" and "estimate" used interchangeably by
  users; the app's object is an Estimate (EST-1001), sent to clients as a Proposal.

## Capabilities and Constraints

Built: email/Google sign-in, business onboarding, Settings → AI (BYOK, encrypted key, usage), Quick-mode AI
estimate generation streamed over SSE (`POST /api/estimates/generate`: `estimate` → `partial` → `done`/`error`),
deterministic pricing with rate rules, sanity warnings, version 1 snapshot.

Not yet built: estimate editing, chat refinement, Thorough mode, proposals, invoices, clients, rate-rule and
instruction settings screens.

Stack: Next.js 16 (App Router, Cache Components), Tailwind CSS 4, Supabase (Postgres/Auth/Storage), Drizzle.

## Brand Commitments

- "OpenQuote" is a placeholder name; nothing visual may depend on it.
- Original look: no competitor's name, copy, UI or trade dress (SPEC.md §10). Reference material in
  `design/references/` is reference only.

## Evidence on Hand

No real customers, testimonials, logos or photography. Demo data must be labelled synthetic. Real generated
estimates exist in the dev database (EST-1001 fence, EST-1002 shed).

## Product Principles

1. The number is the product: totals, prices and their sources are always legible and never ambiguous.
2. The AI proposes, the tradie decides: every AI output is editable, explained, and reversible.
3. Built for the site, finished at the desk: phone-first under harsh conditions, generous on a laptop.
4. Honest about cost and state: show what's generating, what failed, and what it cost.

## Accessibility & Inclusion

WCAG 2.2 AA as the floor. Outdoor readability (high contrast, large text and targets ≥ 44px) is a product
requirement, not a nicety. (Inferred from the operating context.)
