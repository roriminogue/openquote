---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# OpenQuote app (all signed-in screens, sheets, sign-in, onboarding)

Mode: Operate. Audience: owner-operator tradies (phone on site, laptop at night). Redesign requested 2026-10-21: the
owner found the tape-measure world "vibe coded"; critique scored 23/40. Owner pinned the reference: a calm, neutral,
modern workspace app (neutral greys, quiet type, generous space), plus one small
OpenQuote accent. The pinned direction beats the roll (seed a99e62f2, recorded as canon).

## Direction contract

THESIS: A calm, neutral workspace where the numbers and the next action are the only things that speak. Refuses
both the old tape costume and the generic SaaS starter (heavy bold type, icon tiles, yellow everywhere).

OWN-WORLD: White ground, zinc greys, near-black primary buttons, 8px controls / 12px panels, hairline borders with a
whisper of shadow. Geist Sans throughout at regular/medium weights (light headings), Geist Mono only for document
numbers. One accent, hi-vis orange (#f26b1d family), reserved for the price-this-job moment, live progress and
"new" dots; red only for warnings/errors. Dotted-grid panels for empty states. Dark zinc theme for night.

STORY: The tradie sees the job, the total and where every price came from, and knows the next step (print/copy now,
send later) without hunting.

FIRST VIEWPORT: Estimate page: back link, title in medium 28–32px, one meta line (EST number · client · project ·
date) with a status badge, actions top right (Copy, Print / PDF). A summary panel: total inc GST large, ex-GST, GST,
margin, and a thin stage breakdown bar with a legend. Then the schedule: desktop table Description | Qty | Rate |
Source | Amount grouped by stage; phones stacked rows. New estimate: one centred composer card (project row,
description, examples, accent "Price this job").

FORM: Owner-pinned reference (neutral workspace language). Raises from the critique: schedule grid and
source stamps, units pluralised, markup only when it differs, actions on the estimate, no doubled primaries, 44px
targets on phones, custom select chevrons, no textarea grip, sentence-case labels, text-wrap pretty, sidebar nav on
desktop and a bottom bar with a central New on phones.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
