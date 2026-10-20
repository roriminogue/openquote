# OpenQuote — Product Spec (working name)

An open-source, AI-powered quoting and job-management app for trades businesses.
Inspired by commercial tools in the space (Sammy AI, Tradify, Buildxact, ServiceM8). Clean-room: this spec is
written from publicly available marketing pages and help-centre docs only. No code, prompts, copy or branding
from any of those products is used.

> Name is a placeholder. Pick something original before publishing.

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

**Chat refinement** is a tool-using agent with tools such as `add_line`, `update_line`, `remove_line`,
`apply_kit`, `find_supplier_item` and `set_markup`. Each turn creates a new `EstimateVersion` so it can be undone.

**Learning from past quotes** (v1): extract line items from uploaded PDFs/XLSX, then propose rate rules, kits and
AI instructions for the user to confirm. Everything is stored as explicit, editable data, with no fine-tuning.

**Evals** (big résumé win): a fixture set of ~30 job briefs with reference quotes. Score line coverage, total
within ±X%, and structure. Run it in CI on prompt changes.

## 6. Key screens

1. Onboarding: business details → trades/postcode/markup → (optional) upload old quotes
2. Home / pipeline: board or table of estimates and invoices with column totals
3. New estimate: description box, mic, attach files, mode picker, Generate
4. Estimate detail: line editor (left) + Sammy-style chat panel (right); tabs: Estimate · Takeoff · Plan · Messages
5. Send proposal dialog: recipient, message, display options, follow-ups toggle, pre-send checklist
6. Public proposal page (`/p/:token`): branded, mobile-first, Accept / Decline / Request changes, PDF
7. Clients: list + detail with contacts and activity timeline
8. Settings: business, AI (trade, rate rules, instructions, kits, suppliers), terms, integrations

## 7. Proposed stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | One repo for app and public proposal pages; PWA for mobile |
| DB | Postgres + Drizzle ORM, `pgvector` for rate/supplier matching | Relational data with embeddings in one place |
| Auth | Better-Auth or Auth.js (email OTP + Google) | |
| AI | Claude (Sonnet for generation/chat, Haiku for classify/extract) via the Anthropic SDK with tool use + structured output | |
| Speech | Whisper (OpenAI API or local whisper.cpp) | |
| Files | S3-compatible storage (MinIO locally) | |
| Jobs | Postgres-backed queue (pg-boss) for follow-ups, reminders, ingestion | No extra infra |
| Email | Resend / SMTP; inbound webhook for reply detection | |
| PDF | React-PDF or Playwright print-to-PDF | |
| Dev | Docker Compose (postgres, minio, mailpit), Vitest, Playwright E2E | Easy `docker compose up` for reviewers |

## 8. MVP definition of done

A tradie can sign up, set their trade, markup and a few rate rules, dictate "build a 4×3 merbau deck…", get a
grouped and priced estimate in under a minute, tweak it in chat, send a branded proposal link, see when it's
viewed, have the client accept with their name, and convert it to an invoice PDF. All of this runs locally with
`docker compose up` and has an eval suite and E2E tests.

## 9. Open questions (worth answering with REA observation of the live app, if ToS allow)

- Does generation stream line items progressively, or return them all at once? (Affects UX design.)
- How is the chat refinement surfaced: whole-estimate diffs or per-line operations?
- What does the proposal page's event tracking look like (pixel, polling, explicit API events)?
- Client tech stack (framework, state management, realtime transport). Useful for comparison only.

## 10. Legal / ethics guardrails for the repo

- Original name, logo, copy, UI and prompts. Don't reference competitor trademarks beyond a neutral
  "inspired by" note.
- Don't publish anything captured from a competitor's app (bundles, API dumps, screenshots).
- Seed data and fixtures are synthetic.
