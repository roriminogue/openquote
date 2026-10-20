---
name: OpenQuote
description: Open-source AI quoting for trades, read like a steel tape.
colors:
  ground: "#f3f3f0"
  surface: "#ffffff"
  surface-2: "#ebebe6"
  ink: "#161510"
  ink-2: "#47463f"
  ink-3: "#66645c"
  hairline: "#d8d7d0"
  hairline-strong: "#b4b3ab"
  blade: "#f5c400"
  blade-press: "#dcb000"
  blade-wash: "#fff3bf"
  on-blade: "#161510"
  case: "#161510"
  on-case: "#f7f6ef"
  mark: "#c8281e"
  mark-wash: "#fbe8e5"
  ok: "#1c6a43"
  focus: "#161510"
  ground-dark: "#11110f"
  surface-dark: "#1a1a17"
  surface-2-dark: "#23231f"
  ink-dark: "#f2f1ea"
  ink-2-dark: "#c4c2b8"
  ink-3-dark: "#96948a"
  hairline-dark: "#313029"
  hairline-strong-dark: "#4a4942"
  blade-press-dark: "#ffd633"
  blade-wash-dark: "#3a320f"
  case-dark: "#2a2925"
  mark-dark: "#ff7468"
  mark-wash-dark: "#3b1b17"
  ok-dark: "#5fc48c"
  focus-dark: "#f5c400"
typography:
  reading:
    fontFamily: "Barlow Semi Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  headline:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline-detail:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.375
  body-lg:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.375
  body:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Barlow Semi Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  figures:
    fontFamily: "Barlow Semi Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  label:
    fontFamily: "Barlow Semi Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  blade-sm: "2px"
  tape: "4px"
spacing:
  line: "8px"
  row: "12px"
  field: "20px"
  stage: "24px"
  section: "32px"
  section-lg: "40px"
  gutter: "16px"
components:
  button-primary:
    backgroundColor: "{colors.blade}"
    textColor: "{colors.on-blade}"
    rounded: "{rounded.tape}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.blade-press}"
  button-primary-lg:
    backgroundColor: "{colors.blade}"
    textColor: "{colors.on-blade}"
    rounded: "{rounded.tape}"
    padding: "0 24px"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tape}"
    padding: "0 16px"
    height: "44px"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.tape}"
    padding: "0 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  button-danger:
    textColor: "{colors.mark}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tape}"
    padding: "0 14px"
    height: "48px"
  case-window:
    backgroundColor: "{colors.case}"
    textColor: "{colors.on-case}"
    rounded: "{rounded.tape}"
    padding: "12px 16px"
    width: "240px"
  blade:
    backgroundColor: "{colors.blade}"
    textColor: "{colors.on-blade}"
    rounded: "{rounded.tape}"
    height: "64px"
  mini-blade:
    backgroundColor: "{colors.blade}"
    rounded: "{rounded.blade-sm}"
    height: "6px"
  sticky-case-strip:
    backgroundColor: "{colors.case}"
    textColor: "{colors.on-case}"
    padding: "8px 16px"
  header:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    height: "56px"
  notice-error:
    backgroundColor: "{colors.mark-wash}"
    textColor: "{colors.mark}"
    rounded: "{rounded.tape}"
    padding: "12px 14px"
  notice-info:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.tape}"
    padding: "12px 14px"
  wash-line:
    backgroundColor: "{colors.blade-wash}"
    rounded: "{rounded.blade-sm}"
    padding: "8px 6px"
---

# Design System: OpenQuote

## Overview

**Creative North Star: "The Steel Tape"**

An estimate is read the way a tradie reads a tape measure: one yellow graduated blade runs out of a black case, and the number at the case window is the reading. Every screen in this world is built from that single instrument. The blade is a proportional chart of where the money goes (each stage segment as long as its share of the price, numbered 1, 2, 3 in order of the work); the case is the one reversed plate that holds the total; everything else is near-black ink on concrete-light ground, organised by 1px hairlines that start with graduation ticks.

The world is dense and practical, built for a phone in full sun on site and a laptop at night. Hierarchy comes from scale contrast and weight, not from boxes: a 52px condensed reading against 11–13px condensed upper-case blade printing, with plain Barlow text between. There are no cards-in-cards, no tinted panels per section, and no blue. Colour is spent once (blade yellow) and stud-mark red is held back for things that are actually wrong.

Dark mode is the tape case at night: warm near-black ground, the case plate lifted to a slightly lighter charcoal so it still reads as an object, and the blade yellow unchanged because a tape blade is the same yellow in any light.

**Key Characteristics:**
- One committed accent: tape-blade yellow, on the blade, the primary action, the active nav tick, the cents of the reading, selection and new-line wash.
- One reversed plate per screen: the case window (or its sticky strip), never both at once.
- Stage numbering in condensed tabular figures ties the blade segments to the stage headings below.
- Hairlines with graduation ticks replace boxes as section dividers.
- 4px "tape" radius on every control and plate; nothing rounder.
- Money set as figures: dollars full size, cents set back.

## Colors

A warm-neutral concrete-and-ink palette with exactly one saturated accent, plus a red reserved for faults.

### Primary
- **Tape-Blade Yellow** (`blade`): the graduated blade and its stage segments, the primary button, the 3px active-nav underline, the cents digits in the case window, text selection, the brand mark's blade, and the auth-frame blade strip along the top edge. Unchanged in dark mode.
- **Pressed Blade** (`blade-press`): primary-button hover only. Darker in light mode, brighter in dark mode, so the hover always reads as "pushed further".
- **Blade Wash** (`blade-wash`): the fresh-ink state of a line the AI has just written. It holds until the line has been on screen for 1.5s at 90% visibility, then fades over 700ms to transparent. In dark mode it is a deep olive (`blade-wash-dark`).
- **On-Blade** (`on-blade`): everything printed on yellow: graduation ticks, segment dividers (2px), stage numbers, segment labels, primary-button text.

### Secondary
- **Stud-Mark Red** (`mark`): warnings and errors only: sanity warnings above the stage list, error notices, `aria-invalid` field borders, "No key" status, and destructive text links. Brightened to a coral (`mark-dark`) for contrast on dark ground.
- **Stud-Mark Wash** (`mark-wash`): the background of warning rows and error notices, always paired with `mark` text.

### Tertiary
- **Level Green** (`ok`): success notice text only, on `surface-2`. Never a fill.

### Neutral
- **Concrete Ground** (`ground`): the page.
- **Work Surface** (`surface`): inputs, secondary buttons, list-row hover, example-job tiles, the login confirmation panel.
- **Second Layer** (`surface-2`): the sticky header (at 85–95% with backdrop blur), info/ok notices, ghost-button hover, skeletons.
- **Ink** (`ink`): headings, body, money. **Ink 2** (`ink-2`): summaries, secondary values, row labels in totals. **Ink 3** (`ink-3`): metadata lines, docket numbers, stage numbers in headings, hints, placeholders.
- **Hairline** (`hairline`): every 1px divider and row separator. **Hairline Strong** (`hairline-strong`): control borders, the graduation ticks on section rules, scrollbar thumb.
- **Case Black** (`case`) with **On-Case** (`on-case`): the case window and sticky case strip. Case labels use `on-case` at 70% opacity. In dark mode the case lifts to `case-dark` so it separates from the ground.
- **Focus** (`focus`): ink in light mode, blade yellow in dark mode.

### Named Rules
**The One Blade Rule.** Yellow is the instrument, not decoration. It appears only as the blade (full, mini, or auth strip), the primary action, the active-nav tick, the reading's cents, selection, and the unseen-line wash. No yellow headings, icons, borders or backgrounds anywhere else.

**The Stud-Mark Rule.** Red means something needs checking. It never marks a category, a brand moment, or a negative number that is correct.

**The One Plate Rule.** A screen shows one reversed case plate at a time. The sticky strip appears only when the case window has scrolled away and leaves when the Totals block arrives.

## Typography

**Display / Figures Font:** Barlow Semi Condensed (500, 600, 700), falling back to Barlow, then ui-sans-serif
**Body Font:** Barlow (400, 500, 600, 700), falling back to ui-sans-serif, system-ui

**Character:** Barlow's flat, highway-signage geometry for reading; its semi-condensed cut for everything that is printed on the tool: numbers, docket numbers, quantities, and tiny upper-case captions. Rank is carried by weight and case, not by colour.

### Hierarchy
- **Reading** (700, 2.5rem mobile / 3.25rem desktop, line-height 1, -0.01em, tabular lining figures): the total in the case window only. Cents at 0.5em in blade yellow.
- **Headline** (700, 1.75rem, tight, -0.01em): page titles (Estimates, AI settings, New estimate). Estimate titles step to 2.125rem on desktop; auth pages use 2rem.
- **Title** (700, 1.25rem, snug): stage headings with their ink-3 stage number, "Totals", "Options to offer", and stage prices. Live-preview title is 1.375rem.
- **Body large** (400, 1.0625rem, snug): line-item descriptions, summaries and intros (max 68ch, relaxed leading), list-row titles at 600.
- **Body** (400, 1rem, 1.5): default text, field labels at 600.
- **Meta** (condensed figures, 0.9375rem, ink-3): the line build-up "12 lm × $16.00 · Materials · AI price · +20%", docket and date lines. "Your rate" is set at 600 in ink-2 to stand out from "AI price".
- **Figures** (condensed, tabular, 600–700): every money value. Cents shrink to 0.82em via the Money component; sizes 0.9375rem (live lines), 1.0625rem (line prices), 1.25rem (stage and list totals), 1.5rem (Totals total).
- **Label** (600, 0.8125rem, 0.06em tracking, upper-case, condensed): blade printing: the case caption ("TOTAL INC GST", "RUNNING TOTAL"), blade segment names (0.6875rem), the "or" in the auth divider.

### Named Rules
**The Blade Printing Rule.** Upper-case condensed labels are for text printed on the instrument (case caption, segment names, inline dividers). They are never placed above a heading as a kicker or eyebrow.

**The Figures Rule.** Any number a tradie compares (money, quantities, docket numbers, percentages) is set in condensed tabular lining figures so columns align.

## Layout

A single centred column, `max-width` 64rem with 16px side gutters, under a 56px sticky header. Main content starts 24px below the header on mobile and 40px on desktop, with 96px of bottom padding. Auth pages use a narrower 28rem column with the yellow graduated blade strip (12px) across the very top.

Spacing runs on a 4px base. Line rows are 8px vertical; totals and settings rows 10–12px; form fields stack at 20px; stages stack at 24px; major sections (totals, scope, options) separate at 32–40px, each opened by a graduated rule. Summary and note text is capped at 68ch. Totals sit right-aligned in a 28rem column.

Responsive behaviour (Tailwind `sm` 640px, `lg` 1024px):
- **Blade:** on desktop the case window sits at the right end (min 15rem) and the blade runs leftward out of it, squared off where they meet. On phones the case sits above and the blade grows left to right beneath it, 64px tall.
- **New estimate:** one column on phones; at `lg` a 26rem form column beside the preview, with a hairline-ruled "What you'll get" note filling the preview slot until generation starts.
- **List rows:** title + total on line one, docket/date/line count on line two, mini blade under; on desktop a 5.5rem docket column leads.
- **Scope / Options:** stack on phones, 3 and 2 columns from `sm`.

### Named Rules
**The No-Boxes Rule.** Sections are separated by space and graduated hairlines, not containers. Rows are divided by 1px hairlines. No cards-in-cards.

## Elevation & Depth

Flat. No box shadows anywhere in the system. Depth is tonal and positional: the case plate is a reversed slab of ink, the sticky header is `surface-2` with an 85–95% backdrop blur and a hairline bottom border, and the sticky case strip rides directly beneath the header (top 56px) at z-10. State is shown with fills (blade wash, mark wash, surface hover), never lift.

### Named Rules
**The Flat Tool Rule.** If something needs to stand out, give it the case plate or the blade, not a shadow.

## Shapes

One radius: the 4px "tape" corner on buttons, inputs, notices, warning rows, example tiles, the blade and the case window. Where blade meets case on desktop the shared edges go square so they read as one object. The 6px mini blade and the wash-line rows use a 2px corner because 4px would round them to pills. Dividers are 1px; the blade's stage dividers are 2px on-blade lines; the active nav marker is a 3px blade bar on the header's bottom edge.

The graduated rule is the signature divider: a 1px hairline whose left end carries six hairline-strong ticks (10, 5, 5, 5, 5, 10px tall, 5px apart). The blade itself carries printed graduations: minor ticks every 4px at 22% height, major every 20px at 45%, in on-blade ink.

## Components

### Buttons
Solid, square-shouldered, and big enough for gloves.
- **Shape:** tape corner (4px). Heights 44px (md) and 56px (lg); header action 40px.
- **Primary:** blade yellow with on-blade text, 600 weight, 0.9375rem (md) / 1.0625rem (lg), 16 / 24px side padding; trailing arrow or leading plus icon at 16–20px.
- **Hover / Active / Focus:** hover to `blade-press`; active nudges down 1px; 150ms ease-out colour transitions; 2px focus outline offset 2px. Disabled at 55% opacity with no nudge.
- **Secondary:** surface fill, hairline-strong border, ink text; hover darkens the border to ink. Used for Stop during generation and Google sign-in.
- **Ghost:** ink-2 text, hover to surface-2 fill and ink text.
- **Danger:** a red underlined text link (1px, 4px offset) that drops its underline on hover. Destructive actions confirm inline, never in a modal.

### Inputs / Fields
- **Style:** surface fill, 1px hairline-strong border, tape corner, 48px tall (textarea relaxed leading, 12px vertical padding), 16px text, ink-3 placeholder.
- **States:** hover border to ink-3; focus border to ink plus a 2px focus outline flush to the edge; `aria-invalid` border in stud-mark red; disabled at 60%.
- **Field:** 600-weight label above, 6px gap, ink-3 hint in 0.875rem below.

### Notices
Inline status lines, never modals: tape corner, 12px × 14px padding, 0.9375rem. Error is mark on mark-wash (role alert); ok is green on surface-2; info is ink-2 on surface-2. Estimate warnings use the same red row with a 18px warning-triangle icon.

### Navigation
Sticky 56px header on `surface-2` with a hairline bottom. Brand mark (a case with the blade run out) plus "OpenQuote" in condensed 700 (wordmark hidden on phones). Links are 0.9375rem 600: ink-3 at rest, ink on hover, ink with a 3px blade underline when current. "New estimate" primary button at the right (shortens to "New" on phones), then an icon-only sign-out.

### The Blade and Case (signature)
The estimate's first viewport: a graduated yellow blade split into stage segments whose widths are proportional to stage price (min 1.5% so tiny stages remain visible, min 28px wide). Each segment prints its stage number in bold condensed figures at bottom-left and its name as a label when the segment is at least 7.5rem wide. The case window holds the caption label and the reading. While generating, the blade's extent grows with each arriving stage (700ms, `cubic-bezier(0.16, 1, 0.3, 1)`), a pulsing on-blade bar marks the growing end, and the reading updates live (`aria-live="polite"`).

### Stage Numbering
Stages are numbered 1…n in work order. The same number appears on the blade segment and, in ink-3 condensed figures, before the stage heading, so the eye can travel from blade to list.

### Line Items
Two-column grid: description (1.0625rem) with a condensed meta line beneath (qty × unit cost · type · source · markup), price figures right-aligned. Rows divided by hairlines. Notes in ink-3 under the meta line.

### Wash Line (unseen state)
In the live preview, each line the AI writes sits on blade wash until it has been at least 90% visible for 1.5s, then fades to transparent over 700ms. It is state, not a timer, so it still shows under reduced motion.

### Sticky Case Strip
A full-bleed case-black strip pinned under the header: estimate title (600, truncated) left, "TOTAL INC GST" label (desktop only) and the total in 1.25rem bold figures right. Fades in over 150ms once the case window scrolls past, out once Totals is reached.

### Estimate List Rows
Hairline-ruled rows (top and bottom border on the list). Title 1.0625rem 600 with underline on hover, docket number in ink-3 figures, total at 1.25rem bold, and a 6px mini blade whose length is the estimate's share of the largest total on screen, segmented by stage. Row hover is a surface fill.

### Totals
Right-aligned 28rem definition list: Cost, Markup (%), Price ex GST, GST, then Total at 1.5rem bold, then Margin in ink-3. Markup and margin are both shown.

## Do's and Don'ts

### Do:
- **Do** open every estimate view with the blade and case: title and docket line above, reading in the case, stages numbered on the blade.
- **Do** size blade segments by money, and keep stage numbers identical on the blade and the stage headings.
- **Do** separate sections with the graduated rule (1px hairline, six ticks at the left) and rows with plain 1px hairlines.
- **Do** use the 4px tape corner on every control and plate; 2px only for 6px-high bars and wash rows.
- **Do** set every money value with the Money treatment: condensed tabular figures, cents at 0.82em (0.5em and blade yellow in the case window).
- **Do** keep primary actions blade yellow with on-blade text at 44px or 56px height.
- **Do** mark freshly AI-written lines with blade wash until seen.
- **Do** keep the dark theme by token swap: blade stays #f5c400, case lifts to charcoal, focus turns yellow.

### Don't:
- **Don't** put cards inside cards or wrap sections in bordered panels; use space and hairlines.
- **Don't** use yellow for anything that isn't the blade, the primary action, the active-nav tick, the reading's cents, selection, or the unseen wash.
- **Don't** use stud-mark red for anything except warnings, errors, invalid fields and destructive links.
- **Don't** show two reversed case plates on screen at once.
- **Don't** add box shadows; depth is tonal.
- **Don't** put upper-case condensed labels above headings as kickers or eyebrows; labels are blade printing.
- **Don't** introduce blue accents, stat-tile dashboards, or white SaaS cards on grey.
- **Don't** use modals for errors or destructive confirmation; confirm inline.
