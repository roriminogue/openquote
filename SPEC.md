# OpenQuote — Product Spec

An open-source, AI-powered quoting and job-management app for trades businesses.
Clean-room: this spec was written from publicly available information about how trades businesses quote. No
code, prompts, copy or branding from any commercial product is used.

---

## 1. The problem

Small trades businesses (electricians, builders, plumbers, tilers…) lose 10+ hours a week to admin: turning site
notes into priced quotes, chasing clients, invoicing. Quotes go out slowly, so jobs are lost. Existing job
management software digitises the forms but still makes the tradie do the pricing by hand.

**Core promise:** describe a job however you like (voice, text, photos, plans) → get a priced, editable, branded
quote in minutes, priced with *your* rates and *your* supplier costs → send it, track it, win it, run it, invoice it.

## 2. Users

| Persona | Needs |
|---|---|
| **Owner-operator** (primary) | Fast quotes from a phone, accurate pricing, less admin at night |
| **Office / estimator** | Desktop editing, pipeline view, integrations with accounting |
| **Crew / subbie** | Where to go, what to do, what to pick up — without seeing prices or logging in |
| **Client (homeowner)** | View a clear proposal on their phone, ask for changes, accept/sign, pay |

## 3. Feature inventory (observed in the market) and our phasing

| # | Feature | Phase |
|---|---|---|
| F1 | Business profile: name, logo, ABN, contact, terms & conditions, GST registered/exempt | **MVP** |
| F2 | Trade settings: trades (multi), finish level (basic/standard/premium), postcode, default markup, optional per-type markups (materials/labour/subbie/other) | **MVP** |
| F3 | Rate rules: title, rate, unit, type (labour/material); CSV/XLSX import | **MVP** |
| F4 | Standing AI instructions ("always add 10% timber waste") | **MVP** |
| F5 | AI estimate from text description + photos/PDFs | **MVP** |
| F6 | Voice note → transcription → description | **MVP** |
| F7 | Estimate editor: groups → line items, inline edit, totals, markup, GST | **MVP** |
| F8 | Chat-based refinement of an estimate ("add 2 downlights", "swap to Colorbond") | **MVP** |
| F9 | Clients CRM (client + contacts + activity timeline) | **MVP** |
| F10 | Public proposal link: view, accept (named), decline (reason), request changes; PDF | **MVP** |
| F11 | Proposal display options (total only / group totals / full detail, show qty/rates, inc-GST) | **MVP** |
| F12 | Proposal tracking: sent / viewed / downloaded / accepted events; versioned sends | **MVP** |
| F13 | Estimate → invoice; invoice send + mark paid | **MVP** |
| F14 | Generation modes: Quick (single pass) vs Thorough (clarify → plan → phase-by-phase), Auto classifier | v1 |
| F15 | Clarifying questions before generating (travel time? who supplies materials?) | v1 |
| F16 | "Train on past quotes": upload old quotes, extract line items/rates/wording | v1 |
| F17 | "Same as EST-1042": reuse structure of a past quote | v1 |
| F18 | Suppliers + price-list import (CSV/XLSX/PDF), column mapping, ex-GST normalisation | v1 |
| F19 | Supplier matching of material lines (review-first / auto / off) with safety checks | v1 |
| F20 | Kits (assemblies), nestable, 3 pricing modes (sum / markup on cost / fixed) | v1 |
| F21 | Subbie line type with its own markup | v1 |
| F22 | Takeoff report (materials by category) + project plan (Gantt) | v1 |
| F23 | Automatic proposal follow-ups (day 2/5/10, stop on any client response) | v1 |
| F24 | Payment reminders on invoices (−3d, due, +7d, +14d; stop on payment) | v1 |
| F25 | Digital signature on acceptance + signed PDF + certificate | v1 |
| F26 | Board (kanban) view of estimates/invoices with column totals | v1 |
| F27 | Jobs: accepted estimate → job (JN-xxxx), budget vs actual back-costing, receipt OCR | v2 |
| F28 | Variations (priced change orders the client accepts) | v2 |
| F29 | Payment schedules / progress claims (deposit, stages, balance) | v2 |
| F30 | Job cards: shareable no-login crew link, prices hidden, pick-up list by supplier | v2 |
| F31 | Do-and-charge: crew logs hours/parts/photos → priced lines → approve → invoice | v2 |
| F32 | Global assistant (⌘J): natural-language actions across the app | v2 |
| F33 | Contracts signed by client(s) + counter-signed | v2 |
| F34 | Integrations: Xero (invoice push, payment pull, contact import); ServiceM8/Simpro import | v2 (Xero first) |
| F35 | Mobile apps (iOS/Android) | later — ship a good PWA first |

## 4. Domain model

Money is stored as integer cents. All costs/prices stored **ex-GST**; GST applied once at the document total
(10% AU; configurable per org for NZ 15%).

```
Organisation
  id, name, abn, logo_url, email, phone, address, gst_registered, gst_rate,
  trades[], finish_level, postcode, default_markup_pct,
  markup_materials_pct?, markup_labour_pct?, markup_subbie_pct?, markup_other_pct?,
  terms_md, next_estimate_no, next_invoice_no, default_due_days
User           id, org_id, name, email, role(owner|admin|member)
RateRule       id, org_id, title, rate_cents, unit, type(labour|material)
AiInstruction  id, org_id, text, supplier_id?
Client         id, org_id, name, email, phone, address, notes
ClientContact  id, client_id, name, email, phone, role

Estimate
  id, org_id, client_id, number (EST-1001), title, site_address,
  status(draft|sent|accepted|declined|invoiced|archived),
  description, generation_mode(auto|quick|thorough), markup_pct,
  gst_exempt, current_version, display_options(json), created_at
EstimateVersion  id, estimate_id, version, snapshot(json), created_by(user|ai), reason
LineGroup      id, estimate_id, name, sort
LineItem
  id, group_id, description, type(material|labour|subbie|other),
  qty, unit, unit_cost_cents, markup_pct, sort, notes,
  source(ai|rate_rule|kit|supplier|manual), source_ref?
Attachment     id, org_id, owner_type, owner_id, kind(image|video|pdf|sheet|audio), url, extracted_text?

ProposalSend   id, estimate_id, version, to_email, cc[], token, message, follow_ups_enabled, sent_at
ProposalEvent  id, send_id, type(viewed|downloaded|accepted|declined|changes_requested|bounced|replied),
               actor_name?, actor_email?, actor_position?, signature_svg?, reason?, at
ScheduledEmail id, kind(follow_up|payment_reminder), ref_id, send_at, status(pending|sent|cancelled)

Invoice        id, org_id, client_id, estimate_id?, job_id?, number (INV-0001), status(draft|sent|paid|void),
               due_date, lines(json snapshot), total_cents, paid_at, external_ref?
-- v1/v2 --
Supplier       id, org_id, name, contact fields
SupplierItem   id, supplier_id, name, sku, price_cents (ex-GST), unit, imported_at
Kit            id, org_id, name, category, pricing_mode(sum|markup|fixed), markup_pct?, fixed_cents?, when_to_use
KitComponent   id, kit_id, type(material|labour|other|subkit), description?, qty, unit?, rate_cents?,
               supplier_item_id?, child_kit_id?
Job            id, estimate_id, number (JN-0001), status, budget_by_group(json)
JobCost        id, job_id, group_id?, description, amount_cents, receipt_attachment_id?
Variation      id, job_id, estimate_like fields..., status
PaymentStage   id, estimate_id, label, pct, status(pending|claimed|paid), invoice_id?
```

### State machines

**Estimate:** `draft → sent → (accepted | declined)`; `accepted → invoiced`; any → `archived`.
Accepted/invoiced estimates are locked. To edit, revert to draft explicitly (creates a new version).

**Scheduled emails:** cancelled when the client accepts, declines, requests changes, downloads the PDF, replies,
unsubscribes, or the email bounces, or when the owner recalls, archives or invoices the estimate. *Viewing alone
does not cancel.*

### Pricing rules

- `line_price = qty × unit_cost × (1 + markup)`. The markup comes from the line, else the per-type org markup,
  else the default.
- Markup ≠ margin. Show both in the UI (25% markup → 20% margin).
- Kit pricing: **sum** (each component priced normally), **markup** (one % over component cost), **fixed**
  (single line at a lump sum, components kept for reference).
- Supplier match only ever sets `unit_cost`. Qty, unit and markup are unchanged. Labour lines are never matched.
  Lines priced by a rate rule or kit are not overwritten.
- Safety checks on supplier matches: reject when the supplier price is ≥100× the line (likely a bad import).
  Don't auto-apply when it's under ⅓ of the line. Flag spec mismatches (material, gauge, pack size).

## 5. The AI estimating pipeline (our design)

This is the heart of the project and the best résumé material. It's built as explicit, testable stages using
structured (JSON-schema) LLM output, not one giant prompt.

```
inputs ──► 1. Ingest ──► 2. Classify ──► 3. Clarify ──► 4. Plan ──► 5. Generate ──► 6. Price ──► 7. Validate
```

1. **Ingest.** Voice → transcription (Whisper or similar). PDFs/plans → text plus page images. Photos → vision
   captions. Spreadsheets → rows. Output: a normalised `JobContext`.
2. **Classify.** Trade(s), job type, scale, and whether it's Quick or Thorough. Big multi-trade jobs (additions,
   new builds, full renos, commercial fit-outs) go Thorough.
3. **Clarify** (Thorough, or when confidence is low). Up to ~5 targeted questions (materials supplied by whom?
   travel? finish level? access?). The user answers in chat.
4. **Plan** (Thorough). Phases, assumptions, exclusions, risks and key quantities. The user approves or edits.
5. **Generate.** Per phase: groups → line items `{description, type, qty, unit, est_unit_cost, rationale}`.
   Context includes the org trade settings, AI instructions, the relevant rate rules, matching kits, and an
   optional "follow structure of EST-xxxx".
6. **Price** (deterministic code, not the LLM). Apply rate rules (fuzzy/embedding match), kits, supplier
   catalogue (embedding search + attribute check), markups and GST. Every line records its `source`.
7. **Validate.** Sanity checks (zero/negative qty, labour hours vs scope, missing waterproofing for wet areas,
   etc.). Produces warnings, not silent fixes.

**Delivery.**
- **Streamed.** Generate streams one structured JSON document over SSE. The client parses the partial JSON
  so groups and lines appear as they arrive, with a status line per step ("Pricing subframe…").
- **Saved on the server.** The route handler validates the final document, runs Price, writes groups and
  lines with Drizzle and creates version 1, all in one transaction. The browser never writes estimate rows.
- **Alternatives.** Generate also returns 2–3 upgrade and 2–3 cost-saving alternatives (short + long
  description) that the user can apply in one click.
- **Thorough runs in the background.** Clarify → Plan → per-phase Generate runs as a pg-boss job. The job
  publishes progress (`phases[{name, status, itemCount}]`, current phase) and the UI subscribes to it. Phases
  run in order so later phases can see earlier ones. Clarifying questions are multiple choice with a
  recommended default and an "Other" free-text option, at most 2 rounds, and always state "if you skip, we
  assume…".
- **Plan card.** Shows phases with assumptions and exclusions, plus job-type risks the user can toggle
  (e.g. AS 3740 waterproofing certificate, pre-1990 asbestos, subfloor rot, long-lead items). Deterministic
  guards check the LLM's classification (e.g. ignore a size it invented).

**Chat refinement** is a tool-using agent over small, typed operations: `add_line`, `update_line`,
`remove_line`, `move_line`, `add_group`, `rename_group`, `set_markup`, `lock_lines`, `apply_kit`,
`find_supplier_item`, `update_scope`, `get_totals`.
- Tool arguments are validated with zod. A failed call returns the error to the model so it can retry.
- IDs are minted in code and returned to the model, never invented by it.
- Totals come from `lib/pricing.ts` through `get_totals`, never from the model's arithmetic.
- Locked lines can't be changed.
- Each turn first snapshots an `EstimateVersion`, so it can be undone and diffed ("See changes").
- Two chat modes: **Adjust** (may edit) and **Ask** (read-only Q&A).

**Learning from past quotes** (v1): extract line items from uploaded PDFs/XLSX, then propose rate rules, kits and
AI instructions for the user to confirm. Everything is stored as explicit, editable data, with no fine-tuning.

**Evals** (big résumé win): a fixture set of ~30 job briefs with reference quotes. Score line coverage, total
within ±X%, and structure. Run it in CI on prompt changes.

## 6. Key screens

1. Onboarding: business details → trades/postcode/markup → (optional) upload old quotes
2. Home / pipeline: board or table of estimates and invoices with column totals
3. New estimate: description box, mic, attach files, mode picker, Generate
4. Estimate detail: line editor (left) + chat panel (right); tabs: Estimate · Takeoff · Plan · Messages
5. Send proposal dialog: recipient, message, display options, follow-ups toggle, pre-send checklist
6. Public proposal page (`/p/:token`): branded, mobile-first, Accept / Decline / Request changes, PDF
7. Clients: list + detail with contacts and activity timeline
8. Settings: business, AI (trade, rate rules, instructions, kits, suppliers), terms, integrations

## 7. Proposed stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | One repo for app and public proposal pages; PWA for mobile |
| DB | Supabase Postgres + Drizzle ORM, `pgvector` for rate/supplier matching; RLS isolates each organisation | Relational data with embeddings in one place; RLS protects any direct client access |
| Auth | Supabase Auth (email magic link/OTP + Google) | Built in, no auth code to maintain |
| AI | Bring your own key, multi-provider via the Vercel AI SDK (streaming, tool calls, structured output). Default Anthropic: Claude Sonnet for generation/chat, Claude Haiku for classify/extract. See §7a | Open source: each business pays its own provider |
| Speech | Optional: OpenAI Whisper (own key), local whisper.cpp, or off | |
| Files | Supabase Storage (`logos` public; `attachments`, `documents` private; paths prefixed by org id) | |
| Jobs | Postgres-backed queue (pg-boss) for follow-ups, reminders, ingestion | No extra infra |
| Email | Resend / SMTP; inbound webhook for reply detection | |
| PDF | React-PDF or Playwright print-to-PDF | |
| Dev | A Supabase project (or `supabase start` locally), Mailpit via Docker Compose, Vitest, Playwright E2E | |

## 7a. AI configuration (bring your own key)

OpenQuote ships no AI credits. Each install or business brings its own provider key.

**Where the key comes from** (first match wins)
1. **Business key:** pasted in Settings → AI. Stored per organisation in `ai_settings`.
2. **Instance key:** `ANTHROPIC_API_KEY` (or another provider's env var) set by whoever self-hosts.
3. **None:** AI actions are disabled, with a link to Settings → AI. Everything else keeps working.

**Security**
- Every LLM call runs on the server (route handlers / jobs). Keys never reach the browser.
- Keys are encrypted at rest with AES-256-GCM using `ENCRYPTION_KEY` from env
  (`api_key_ciphertext` = base64 of iv | tag | ciphertext).
- `ai_settings` has RLS on and no policies, so it is only readable server-side.
- The UI only ever shows the last 4 characters, with Replace / Remove actions.
- Saving a key makes a cheap test call and reports a clear error (invalid key, no credit, model unavailable).
- Keys and prompts are never logged or sent to error reporting.

**Providers**
- All providers go through one interface (Vercel AI SDK).
- Supported at launch: Anthropic (default), OpenAI, Google.
- Advanced: OpenRouter and Ollama (custom `base_url`), with a warning that quality depends on the model's
  tool-use support.
- Each business picks a **smart** model (generate, refine, plan) and a **fast** model (classify, extract,
  summarise). Defaults are set per provider.
- Required capabilities: streaming, tool calling and JSON-schema output. A model without them is rejected
  when it is saved.

**Usage**
- Every call writes an `ai_usage` row: org, estimate, operation, provider, model, input/output tokens, and
  estimated cost when the model's price is known.
- Settings → AI shows spend by month and per estimate. Members can read their own organisation's usage.

**Transcription** is a separate setting: off (default), OpenAI Whisper (uses the OpenAI key), or local
whisper.cpp for self-hosters.

**Evals per provider.** The eval suite (§5) runs against each supported provider/model, and the README
publishes a small quality-and-cost table to help users choose.

## 8. MVP definition of done

A tradie can sign up, set their trade, markup and a few rate rules, dictate "build a 4×3 merbau deck…", get a
grouped and priced estimate in under a minute, tweak it in chat, send a branded proposal link, see when it's
viewed, have the client accept with their name, and convert it to an invoice PDF, using their own AI key. Anyone
can run it against a free Supabase project with documented setup, and it has an eval suite and E2E tests.

## 9. Open questions

Resolved 2026-10-20 by observing market behaviour (notes kept outside this repo). The decisions are folded into §5:
- Generation streams progressively → stream structured JSON and render partial results.
- Refinement uses per-line operations, not whole-estimate diffs → typed tool ops, one version per turn.
- Proposal tracking uses explicit API events → the public page calls `trackView` on load, and
  accept / decline / request changes are separate actions. Signed copies are generated asynchronously and
  the page polls until ready.
- Long multi-phase generation runs as a durable background job with progress the UI subscribes to.

## 10. Legal / ethics guardrails for the repo

- Original name, logo, copy, UI and prompts. Don't reference competitor trademarks beyond a neutral
  "inspired by" note.
- Don't publish anything captured from a competitor's app (bundles, API dumps, screenshots).
- Seed data and fixtures are synthetic.
