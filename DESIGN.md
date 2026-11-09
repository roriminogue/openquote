---
name: OpenQuote AU
description: Open-source AI quoting for trades, in a calm neutral workspace where the number and the next action speak.
colors:
  bg: "#fcfcfc"
  surface: "#ffffff"
  sidebar: "#fcfcfc"
  subtle: "#f4f4f5"
  hover: "#f4f4f5"
  border: "#ebebf1"
  border-strong: "#e2e2e8"
  ink: "#18191b"
  ink-2: "#3f3f46"
  ink-3: "#6b6b74"
  ink-4: "#a1a1aa"
  label: "#5a5b5e"
  primary: "#262626"
  primary-top: "#404040"
  primary-hover: "#333333"
  on-primary: "#ffffff"
  accent: "#f26b1d"
  accent-hover: "#e05d12"
  on-accent: "#18181b"
  accent-soft: "#fff2ea"
  accent-ink: "#c2410c"
  danger: "#c81e1e"
  danger-soft: "#fef1f1"
  ok: "#15803d"
  ok-soft: "#effbf3"
  focus: "#18191b"
  bg-dark: "#0f0f10"
  surface-dark: "#161618"
  sidebar-dark: "#0f0f10"
  subtle-dark: "#1a1a1d"
  hover-dark: "#1f1f23"
  border-dark: "#232328"
  border-strong-dark: "#2e2e34"
  ink-dark: "#f4f4f5"
  ink-2-dark: "#d4d4d8"
  ink-3-dark: "#a1a1aa"
  ink-4-dark: "#52525b"
  label-dark: "#a1a1aa"
  primary-dark: "#e4e4e7"
  primary-top-dark: "#fafafa"
  primary-hover-dark: "#ffffff"
  on-primary-dark: "#18181b"
  accent-hover-dark: "#ff7a2e"
  accent-soft-dark: "#2a170b"
  accent-ink-dark: "#ff9a5c"
  danger-dark: "#f87171"
  danger-soft-dark: "#2a1213"
  ok-dark: "#4ade80"
  ok-soft-dark: "#0f2416"
  focus-dark: "#f4f4f5"
typography:
  figure:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\", \"lnum\", \"ss01\", \"cv11\""
  stat:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\", \"lnum\", \"ss01\", \"cv11\""
  title:
    fontFamily: "Figtree, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: "2rem"
    letterSpacing: "-0.01em"
  headline-sm:
    fontFamily: "Figtree, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: "1.75rem"
  sheet-title:
    fontFamily: "Figtree, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "\"ss01\", \"cv11\""
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  micro:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.25
rounded:
  segment: "7px"
  sm: "6px"
  control: "8px"
  panel: "10px"
  card: "14px"
  wrapper: "16px"
  pill: "9999px"
spacing:
  hairline-gap: "2px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  button-secondary-hover:
    backgroundColor: "{colors.hover}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  button-accent-hover:
    backgroundColor: "{colors.accent-hover}"
  button-danger:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.danger}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
  button-sm:
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "28px"
  button-lg:
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  panel:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.panel}"
  row:
    typography: "{typography.label}"
    padding: "20px 20px"
  key-value:
    typography: "{typography.body}"
    padding: "10px 0"
    height: "44px"
  composer-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  composer-wrapper:
    backgroundColor: "{colors.subtle}"
    rounded: "{rounded.wrapper}"
  badge:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "20px"
  source-badge:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "20px"
  source-badge-ai:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "20px"
  nav-item:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "28px"
  nav-item-active:
    backgroundColor: "{colors.hover}"
  nav-group-label:
    textColor: "{colors.label}"
    typography: "{typography.caption}"
  example-chip:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "28px"
---

# Design System: OpenQuote AU

## Overview

**Creative North Star: "The Quiet Workbench"**

OpenQuote AU is a calm, neutral workspace: an off-white page, zinc greys, hairlines and dashed row rules, cards outlined by a 1px ring with a barely-there layered shadow, and near-black actions. Nothing decorates. The total, the price of each line, where each price came from, and the next action are the only things allowed to speak. One hi-vis orange accent, the colour of site safety gear, appears only when a job is being priced, is still in flight, or needs checking; everything else stays grey so that orange always means "this is live, look here".

Density is a compact desktop workspace from 640px (28 to 36px controls, 12 to 14px labels, 28px nav items, open tables) and stacked and thumb-sized on a phone (44px targets, bottom tab bar, full-screen sheets). Two faces split the work: Figtree at medium weight for headings (page titles, greeting lines, sheet titles), Geist for everything a user operates or reads in a row, with tabular figures wherever money or quantity appears. A dark zinc theme follows the system setting for evening admin. The system refuses both a costume (no trade metaphors drawn into the UI) and the generic SaaS starter (no heavy display type, no icon tiles, no colour on every status).

**Key Characteristics:**
- Neutral zinc ramp on an off-white page carries all structure; primary buttons are a short near-black gradient with a top highlight.
- One orange accent, reserved: "Price this job", live progress, in-flight status dots, warnings.
- Green and red only for confirmation and error.
- 8px controls, 10px cards, 14px raised cards, 16px wrappers; 1px rings and hairlines; dashed rules between rows.
- Figtree 500 for headings, Geist 400/500 for UI, 600 for totals; tabular figures, cents set back in grey.
- Status is a grey pill with a word; only in-flight and failed work add a dot.
- Open tables: a grey 40px header over a hairline, no frame.
- Dotted grid for empty states and the sign-in field.

## Colors

A zinc neutral ramp on an off-white page with a single hi-vis orange; semantic green and red stay out of the way until something succeeds or fails. Base keys are the light theme; `-dark` keys are the same roles under `prefers-color-scheme: dark`. The accent and its ink text partner are identical in both themes.

### Primary
- **Workbench Black** (primary, primary-top): the default action fill (sheet submit, save, the bottom-bar New tile), set as a short vertical gradient from primary-top to primary with a 1px inset white highlight at 16%. Inverts to near-white in dark mode so the primary stays the highest-contrast object on screen.
- **Hi-Vis Orange** (accent, accent-hover): the pricing moment. "Price this job", the pulsing live dot while a quote streams, the status dot for in-flight work, and the last line of the Mark. Accent buttons run accent to accent-hover with a 22% inset highlight. Text on it is ink (on-accent), never white.
- **Orange Wash / Orange Ink** (accent-soft, accent-ink): warnings ("Check before sending", "No key yet" in Settings), the fresh-line wash in the live preview, and text selection.

### Neutral
- **Paper** (bg): the page, the sidebar (sidebar is the same value), cards and sheets; cards separate from the page by their ring, not by tint.
- **Surface** (surface): pure white raised inputs: the composer card, the auth card, the empty-estimates card.
- **Subtle / Hover** (subtle, hover): one grey for badges, source stamps, example chips, the composer wrapper, the "What you'll get" panel, the dotted empty field, nav hover and active, ghost hover, the segmented track.
- **Hairline / Hairline Strong** (border, border-strong): border draws dividers, dashed row rules, input edges and the sidebar edge; border-strong draws card rings, secondary and danger button edges, and input hover.
- **Ink ramp** (ink, ink-2, ink-3): primary text, secondary text, labels/meta/placeholders/table headers. **label** is the small sidebar group label. **ink-4** is decoration only: stage numbers, bullets, filter counts, the dotted grid, focused input edges.

### Semantic
- **Danger** (danger on danger-soft): errors, invalid fields, the danger button, the failed status dot.
- **OK** (ok on ok-soft): confirmations (the "Copied" check, success notices).

### Named Rules
**The One Orange Rule.** Orange marks only the pricing moment, live or in-flight state, and warnings. Orange anywhere else is wrong. At most one accent button per screen.

**The Grey Status Rule.** Status is a grey pill holding a word. Only in-flight work (orange dot) and failed work (red dot) add a dot. Never a rainbow of statuses.

**The Decoration-Only Rule.** ink-4 never carries text a user must read; it numbers, bullets and counts beside text that already reads.

## Typography

**Display Font:** Figtree (next/font, `--font-figtree`, weights 500 and 600 loaded; fallback Geist, ui-sans-serif, system-ui) via `font-display`
**Body Font:** Geist (next/font, `--font-geist`; fallback ui-sans-serif, system-ui)
**Label/Mono Font:** none. Document numbers are Geist with tabular figures.

**Character:** A rounded, friendly geometric for headings over a neutral grotesque for the interface; hierarchy comes from size, face and grey, not from bold. Stylistic sets `ss01` and `cv11` are on globally.

### Hierarchy
- **Figure** (Geist 600, 2rem, line-height 1, -0.01em): the estimate total inc GST, once per page.
- **Stat** (Geist 600, 1.5rem, line-height 1): the secondary stat columns (Your cost, Margin, usage figures; 1.25rem on phones in Settings) and the live preview's running total.
- **Title** (Figtree 500, 1.5rem / 2rem, -0.01em): page titles, the estimate, project and client titles, auth cards. The ramp's `title-lg` step equals `title` and is not used separately.
- **Headline small** (Figtree 500, 1.25rem / 1.75rem): the greeting subline on New estimate, the live-preview title, the empty-estimates card title.
- **Sheet title** (Figtree 500, 1rem): sheet headers.
- **Body** (Geist 400, 0.875rem): default UI text, list rows, schedule lines, descriptions, the summary (max 68ch, relaxed leading). Phones step schedule lines to the same 14px and inputs to 16px.
- **Label** (Geist 500, 0.875rem): field and row labels, nav items, table headers (in ink-3), group titles (in ink-3), key-value values.
- **Caption** (Geist 400/500, 0.75rem): hints, stat labels and sublines, meta, badges and stamps (500), desktop button labels at sm and md.
- **Micro** (Geist 500, 0.6875rem): bottom-bar tab labels and the kbd hint only.

### Named Rules
**The Two Faces Rule.** Figtree speaks only in headings: page titles, the greeting, sheet titles, card titles and the wordmark. Everything a user operates or reads in a row is Geist.

**The Medium Ceiling Rule.** Headings stop at weight 500. 600 is for figures that total something (the Figure, stat values, stage headers and their subtotals, the Total row) and the wordmark.

**The Tabular Money Rule.** Every money value, quantity, percentage and document number uses tabular lining figures. Money reads dollars first with the cents at 0.85em in ink-3; turn the grey cents off where the whole figure is already grey, so contrast holds.

**The Sentence Case Rule.** Labels, buttons, headers and badges are sentence case. No uppercase labels, no letter-spaced kickers. Headings balance; paragraphs and list items wrap pretty.

## Layout

- **Shell.** From 768px: a 256px left sidebar on the page colour behind a right hairline, sticky full height, padded 12px. The wordmark sits in a 56px row; "New estimate" is the first nav item; a small "Work" label (12px medium, label colour, 24px above) heads Estimates, Projects and Clients; Settings sits at the foot above a hairline; the account row (20px initials tile, email, a kebab) opens a small menu with sign out. Content sits in a centred column, max 60rem, padded 64px at the sides and 56px at the top. Below 768px: a 56px sticky top bar (wordmark, a 44px account button) and a fixed bottom tab bar of five 64px columns with a central 48px New tile, clear of the home indicator; content gets bottom padding to clear it, sides 16px (24px from 640px), top 24px.
- **Breakpoints.** 640px (controls drop from 44px to 28/32/36px, inputs to 36px and 14px text, sheets become right-hand panels, the schedule becomes columns), 768px (sidebar shell, list table headers).
- **Rhythm.** A 4px base: 6px label to control, 8px between buttons, 12px from a group title to its card, 16-20px inside rows, 40px between page sections.
- **Group then card.** A section is a GroupTitle (14px medium ink-3, optional action right, 28px min height) over a card. Cards hold Rows (label and hint left, control right, dashed rules between) or KeyValue lines (112px ink-3 label, medium ink value, 44px min height, dashed rules).
- **Estimate page.** Title and one meta line (status badge, EST number, client, project, address, date, joined by middots) with actions top right; three stat columns split by hairlines (Total inc GST as the Figure, Your cost, Margin; each with a 12px label and subline); warnings; "Where the money goes" card; the summary paragraph; Schedule; a right-aligned totals block (max 20rem); scope, assumptions and exclusions in three columns; options in two cards.
- **Schedule.** An open table: a 40px header (14px medium ink-3) over a hairline, then Description | Qty (6.5rem) | Rate (7rem) | Source (5.5rem) | Amount (7rem), grouped under numbered stage headers with a dashed rule below and dashed rules between lines. On phones each line folds into the description, a "qty unit × rate · source" line, and the amount on the right.
- **Record lists.** Page title with action, filter tabs, a search box, then an open table: 40px grey 14px header over a hairline, rows split by hairlines with a faint hover fill, no outer frame.
- **Composer.** New estimate opens with a greeting-style heading (Title in ink-3, Headline small subline in ink), then the composer (max 50rem): a white raised card inside a 16px grey wrapper whose attached strip below holds the site address. The card holds the borderless description, example chips, and a footer row with the project chip, the provider/model hint and the accent "Price this job". First use shows a grey "What you'll get" panel below; the live preview replaces it while pricing.

## Elevation & Depth

Depth is ring-first. The page is off-white; cards sit on it outlined by a 1px border-strong ring with a layered shadow so faint it reads as weight rather than lift. Raised surfaces (the white composer, the auth card, menus) add a little more. Only the sheet overlay gets a real shadow. Dark mode keeps the rings and drops the faint layers.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 0 0 1px var(--border-strong), 0 1px 1px -0.5px rgb(0 0 0 / 0.02), 0 3px 3px -1.5px rgb(0 0 0 / 0.015), 0 6px 6px -3px rgb(0 0 0 / 0.015)`): Panels and the live preview card.
- **Raised** (`box-shadow: 0 0 0 1px var(--border-strong), 0 1px 1px -0.5px rgb(0 0 0 / 0.03), 0 3px 3px -1.5px rgb(0 0 0 / 0.03), 0 6px 6px -3px rgb(0 0 0 / 0.02), 0 12px 12px -6px rgb(0 0 0 / 0.02)`): the composer card, auth card, empty-estimates card, account menu.
- **Sheet** (`box-shadow: 0 12px 32px -12px rgb(24 24 27 / 0.22), 0 2px 6px rgb(24 24 27 / 0.06)`): the right-hand sheet from 640px, over a 20% ink backdrop.
- **Button highlight** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.16)`, 0.22 on accent): the top edge of gradient buttons and the New tile.
- **Focus edge** (border to ink-4, no halo): inputs on focus; the composer card darkens its ring to ink-4 on focus-within (`--shadow-raised-focus`).

### Named Rules
**The Hairline First Rule.** Separate with a 1px line (a ring, a hairline or a dashed row rule) before reaching for shadow or tint. Anything heavier than Raised belongs only to an overlay.

## Shapes

One soft-rectangle family: 6px for small buttons, menu items and legend rows; 8px for controls (md and lg buttons, inputs, selects, nav items, notices, list rows); 10px for cards (Panels, the account menu, warnings, the segmented track); 14px for raised cards (composer, auth, empty states, live preview, the bottom-bar New tile); 16px for the grey wrappers that hold them (composer wrapper, the empty-estimates dotted field). Radii nest concentrically: the segmented control is a 10px track with 3px padding around 7px segments; the 14px composer sits in a 16px wrapper. Fully round for badges, source stamps, example chips, dots and the breakdown bar. Lines are always 1px. Dashed rules divide rows inside a card or table; a dashed outline on a stamp means "check this" (AI price).

## Components

### Buttons
Dense on a desk, thumb-sized on site.
- **Shape:** 8px (6px at sm), medium weight, 6px icon gap; pressing dims brightness to 95% over 150ms.
- **Sizes from 640px:** sm 28px (12px label), md 32px (12px label, the default), lg 36px (14px label). On phones: sm 36px at 14px, md and lg 44px at 15px; sheet submits go full width at 48px and 16px.
- **Primary:** primary-top to primary gradient, 1px primary edge, white text, inset top highlight; hover lifts the top stop to primary-hover.
- **Secondary:** page colour with a border-strong edge; Hover fill on hover. Copy as text, Print or PDF, Stop.
- **Ghost:** ink-2 text, Hover fill on hover. Cancel and Back in sheet footers; icon buttons.
- **Accent:** accent to accent-hover gradient, accent-hover edge, ink text, inset highlight, optional ⌘↵ kbd hint from 640px. Only for starting a price.
- **Danger:** page colour, border-strong edge, red text; pale red fill and a red-tinted edge on hover.
- **Disabled:** 50% opacity, no pointer events.

### Inputs / Fields
- **Style:** page colour, 1px border hairline (border-strong on hover), 8px radius, 12px inset, 36px tall with 14px text from 640px; 44px with 16px text on phones (no iOS zoom); placeholders in ink-3.
- **Focus:** border to ink-4, no halo. The global `:focus-visible` is a 2px focus-colour outline offset 2px, shown for the keyboard only: after a click or tap (`html[data-pointer]`, set by PointerFocus) no outline is drawn until the next Tab.
- **Select:** native, with a 14px ink-3 up-down chevron and 36px right padding.
- **Textarea:** no resize grip, relaxed leading.
- **Field:** label in Label type; "Optional" in regular ink-3 beside it (never an asterisk); hint in 12px ink-3 below.
- **Error / Disabled:** `aria-invalid` turns the border and halo red and the message is a Notice; disabled controls drop to 60% opacity.
- **Search:** an input with a 16px ink-3 search icon inset left; the query lives in the URL.

### Notices and Warnings
Inline, never modal. A Notice is an 8px-radius line on a tinted wash with a faint matching border: error (red, `role="alert"`), ok (green), info (Subtle, ink-2). Estimate warnings are 10px-radius orange-wash rows with orange-ink text and a triangle icon, no border.

### Cards, Rows and Key-Values
- **Panel:** page colour, 10px corners, the Card ring shadow; no border, no padding of its own.
- **GroupTitle:** 14px medium ink-3 above the card, 12px gap, an optional action at the right.
- **Rows:** 16px (20px from 640px) side inset, dashed rules between; each Row is 16-20px tall padding with a 14px medium ink label and a 14px ink-3 hint on the left and the control on the right (14-22rem wide), stacking under the label on phones or for long inputs. Used for Settings ("Current setup", "Provider and key").
- **KeyValue:** a 112px ink-3 label and a medium ink value on one line, 44px minimum, dashed rules between. Used for the project and client Details cards.

### Badges and Source Stamps
- **Badge:** a 20px grey pill (Subtle fill), 12px medium ink word (ink-3 when muted); a 6px dot appears only for accent (in flight) and danger (failed).
- **Source stamp:** a 20px pill at 12px medium. The tradie's own figures (Your rate, Kit, Supplier, Manual) are quiet: Subtle fill, ink-3. **AI price** is the one to check: dashed ink-3 edge, no fill, ink text.

### Navigation
- **Sidebar:** 28px items, 8px radius, 8px inset, 14px medium ink text with 16px icons at 1.75 stroke; the active item gets the Hover fill, hover a 70% Hover fill. "New estimate" leads, then the "Work" group, then Settings at the foot.
- **Account menu:** a 36px row (20px rounded initials tile, email, kebab) opening a 10px Raised menu above it: the email in caption ink-3 and a 32px "Sign out" item.
- **Bottom bar:** four 64px tabs with 22px icons over Micro labels (active: ink, medium, heavier stroke) around the central 48px gradient New tile.
- **Filter tabs:** text tabs on a hairline, 20px apart, 36px tall (44px on phones); the current tab is ink, medium, with a 2px ink underline; counts sit beside each in ink-4 tabular figures. Scrolls sideways on phones.
- **Segmented control:** a radiogroup on a Hover track; the chosen segment is page colour with a hairline ring and medium text; arrow keys move and select.

### Sheet
A native dialog. Full screen on phones (rises 1.5rem); a 28rem right-hand panel from 640px (slides in 2rem) with a left hairline and the Sheet shadow. A 56px header carries Back (in nested steps), the Figtree sheet title and Close; Escape steps back one level rather than discarding the flow; clicking the backdrop closes. The primary action sits in a sticky bottom footer over a hairline (full-width 48px on phones; ghost Cancel or Back beside it from 640px). ⌘/Ctrl+Enter submits from anywhere in the sheet.

### Stat Columns and Breakdown (signature)
Stat columns sit straight on the page, split by vertical hairlines with 24px either side: a 12px medium ink-3 label, the value (Figure for the lead total, Stat for the rest), and a 12px ink-3 subline. The same pattern carries Settings usage. "Where the money goes" is a card holding a 6px pill bar that splits the price by stage in a neutral ramp (ink mixed into the ground, darkest first, at least a 10-point step) with 2px gaps, over a legend of 40px rows split by dashed rules: an 8px dot, stage, percent and amount. Pointing at or focusing a row dims the other segments to 25% and links to that stage.

### Schedule Line
Description in ink, the line type in caption ink-3 below, notes in caption ink-3. Quantities read as a tradie writes them: abbreviated and pluralised (3 hrs, 1 hr, 36 bags, 12 lm, 4.5 m², 1 lot). The rate shows a markup suffix (+30%) only when the line's markup differs from the default. Stage headers carry an ink-4 number and a semibold subtotal over a dashed rule; the schedule closes with price ex GST, GST, and a Total row (16px semibold) over a hairline.

### Composer and Live Preview (signature)
The white composer card sits in a grey wrapper with an attached address strip (12px text, map pin); on focus its ring darkens to ink-4. No example chips. The footer row carries the Talk chip (same ghost shape as the project chip; while listening, four 2px orange bars move, the label becomes Stop with a running time in ink-3), the project chip, the provider and model in caption ink-3, and the accent "Price this job". While a quote streams, the preview card (14px, Card ring) shows a pulsing orange dot beside the status line, the Figtree title, a running total in Stat type with a line count, the breakdown bar, and stages entering with a 4px rise; each newly arrived line flashes the orange wash and fades back over 500ms.

### Empty States
A dotted grid (ink-4 at 45% dots on a 16px grid) on a 60% Subtle panel, 14px corners, at least 15rem tall, centred title (14px medium), one sentence of purpose in ink-3 and the one action. The first-run estimates list holds a white 14px Raised card with a Figtree title inside a 16px dotted wrapper. Sign-in and onboarding put a 26rem white 14px Raised card on the dotted page, the wordmark above and one line of what the app does below.

### Brand Mark
A near-black rounded square (6.5/24 radius) holding two ground-coloured lines and a short orange last line, the total. The wordmark sets "OpenQuote AU" in Figtree semibold at 17px, -0.01em, beside a 22px mark.

### Motion, Print and Reduced Motion
- **Motion:** state changes at 150ms ease-out; entrances on `cubic-bezier(0.16, 1, 0.3, 1)`: rise 220ms (4px), sheet 280ms, backdrop fade 200ms. Nothing loops except the live dot and the voice bars while listening.
- **Print:** `.no-print` drops the shell, nav and actions; pages print black on white with 16mm by 14mm margins, and the schedule keeps its columns on paper.
- **Reduced motion:** every animation and transition collapses to 0.01ms; the live ping is hidden.

## Do's and Don'ts

### Do:
- **Do** use the near-black gradient primary for the default action and at most one accent button per screen, only to start a price.
- **Do** outline cards with the Card ring and divide rows inside them with dashed rules; keep the Sheet shadow for overlays.
- **Do** head a card with a GroupTitle, and build settings and details from Rows and KeyValue lines.
- **Do** set every number in tabular figures, money with the cents in ink-3 at 0.85em.
- **Do** show status as a grey pill with a word, adding an orange dot only for in flight and a red dot only for failed.
- **Do** mark AI-sourced prices with the dashed stamp and keep the tradie's own sources quiet.
- **Do** keep targets at least 44px on phones (controls go compact only from 640px) and keep a sheet's primary action at the bottom.
- **Do** write labels, buttons and headings in sentence case, with "Optional" beside optional fields.
- **Do** pluralise and abbreviate units the way the trade writes them, and show a line's markup only when it differs from the default.

### Don't:
- **Don't** use orange for navigation, decoration, selected states or ordinary buttons.
- **Don't** use green or red for anything but confirmation and error.
- **Don't** set headings above weight 500, set Figtree on controls or rows, or use uppercase or letter-spaced labels and kickers.
- **Don't** add icon tiles or per-stage hues (stages are one neutral ramp), and keep gradients to the primary and accent button fills.
- **Don't** put text a user must read in ink-4.
- **Don't** show errors in modals; use an inline Notice.
- **Don't** wrap list tables in a frame; they are open, a grey header over a hairline.
- **Don't** introduce radii outside 6 / 7 / 8 / 10 / 14 / 16px and round, or in-page shadows heavier than Raised.
