---
name: OpenQuote AU
description: Open-source AI quoting for Australian tradies, used on a phone on site. Built on the Astryx design system with one hi-vis orange.
system: Astryx (@astryxdesign/core 0.7, theme "openquote" extending theme-neutral)
colors:
  # Each value is [light, dark]. Everything not listed comes from Astryx Neutral.
  accent: ["#f26b1d", "#f26b1d"]
  on-accent: ["#18181b", "#18181b"]
  accent-muted: ["#ffe6d6", "#3a1f0e"]
  text-accent: ["#b93c0a", "#ff9a5c"]
  icon-accent: ["#c2410c", "#ff9a5c"]
  # From Astryx Neutral, for reference:
  background-surface: ["#ffffff", "#262626"]
  background-card: ["#ffffff", "#1b1b1b"]
  background-muted: ["#f1f1f1", "#1b1b1b"]
  text-primary: ["#000000", "#ffffff"]
  text-secondary: ["#474747", "#9e9e9e"]
  border: ["#00000014", "#ffffff1a"]
  border-emphasized: ["#d4d4d4", "#525252"]
  success: ["#198100", "#64af4c"]
  error: ["#c9303a", "#ff705d"]
typography:
  family: "Figtree (next/font) for headings and body"
  numbers: "tabular figures for all money, quantities, percentages and document numbers"
  phone: "16px body text and 44px controls under 768px or on any touch screen"
rounded:
  inner: "0.375rem"
  element: "0.625rem"
  container: "0.75rem"
  page: "1.75rem"
---

# Design System: OpenQuote AU

## Overview

OpenQuote AU is used on a phone, in one hand, on a job site; a desktop browser is a nice-to-have. The interface is
Meta's **Astryx** design system with its Neutral look (warm greys, Figtree, Astryx spacing and radii), one
hi-vis orange accent, and our wordmark. Nothing decorates. The total, the price of each line, where each price
came from, and the next action are what speak.

Where things live:

- **Theme:** `src/themes/openquote/openquoteTheme.ts` (source) and the built `openquote.css` / `openquote.js`.
  Rebuild after changing it or upgrading Astryx: `npx astryx theme build src/themes/openquote/openquoteTheme.ts`.
- **Stylesheet:** `src/app/globals.css` declares the cascade layers (`reset, theme, base, astryx-base, astryx-theme,
  components, utilities`), imports Tailwind, Astryx and the theme, and holds a few page-wide rules (page base,
  keyboard-only focus, voice bars, print, reduced motion). Nothing else.
- **Providers:** `src/app/providers.tsx` wraps the app in `<Theme>` (mode from the Light/Dark/System switch),
  Australian dates, and Next's `<Link>` behind every Astryx link.
- **Component docs:** `npx astryx component <Name>`; source in `node_modules/@astryxdesign/core/src/`. The
  component index is in `AGENTS.md`.

## Colour

Astryx Neutral supplies the greys, surfaces, borders and status colours, in light and dark. The theme adds only
the orange and the colours that go with it.

**The One Orange Rule.** Orange (`--color-accent`, the primary button) means "price it, send it, or look here":
the main action on a screen, live and in-flight states (the Talk bars, the pulsing dot while a quote streams, the
"Sent" and "Quoting" badges), and pricing warnings. Never decoration, navigation or a selected state. One primary
(orange) button per screen.

- **Text on orange is dark ink** (`--color-on-accent`), never white: white fails contrast on this orange.
- **Orange as text** uses `--color-text-accent` (darker on white, lighter on black) so it stays readable.
- **Green and red** only for success and error (Astryx `success`, `error`). Accepted-quote panels are green.
- **Light / Dark / System** is chosen in Settings → Account and saved on the device (`oq-theme`). A script in
  `<head>` sets `data-theme` on `<html>` before first paint; Astryx's reset turns that into `color-scheme`.
- **Client quotes (`/p/…`) are always light**, whatever the client's device is set to.

## Type

Figtree throughout, at Astryx's sizes. Under 768px (and on any touch screen) the theme raises body text to 16px,
which also stops iOS zooming into fields.

- Use `Heading` for headings (`level` sets the tag; `accessibilityLevel` when the look and the outline differ)
  and `Text` with a `type` (`body`, `large`, `label`, `supporting`, `display-3`) for everything else. `Text`
  is inline by default: give a paragraph `display="block"`, or wrap it, when two sit together.
- Section headings over a card are small grey headings (`SectionTitle`, `Heading level={4} color="secondary"`).
- **Tabular money.** Every amount uses `<Money>`: tabular figures, dollars first, cents at 0.85em in the
  secondary colour. Numbers keep their units on one line (`keepUnits`: "600 mm", "4 × 3 m").
- **Sentence case** for labels, buttons and headings. No uppercase kickers.

## Layout (phone first)

Design and check at 375px first, then desktop, in light and dark.

- **Shell** (`AppShell`): on a phone, a slim top bar (wordmark, account menu) and a bottom tab bar with New in the
  middle; content clears the tab bar. From 768px a side nav replaces the tab bar. Content is a centred column up
  to 60rem.
- **Targets** are at least 44px on phones (the theme sizes Astryx controls to 44px there).
- **Actions** on a phone: the main action full width, the rest sharing the row under it; from 640px they sit in
  one line. Long labels get a short phone version ("Copy" / "Copy as text").
- **Lists** (estimates, projects, clients, rates) are Astryx `List` rows, not tables: the name on up to two lines,
  details in grey under it, the amount and status on the right. One layout at every width.
- **Forms** stack: each field under the last, its label and help above it, Save at the foot of the card
  (full width on a phone). Read-only facts are `MetadataList` rows in a `Card`.
- **Sheets** (`components/sheet.tsx`) come up from the bottom on a phone (`BottomSheet`) and slide in from the
  right from 640px (`Drawer`). Back steps go back one level; a sheet's form never submits a form behind it.

## Components

Astryx first: `Button`, `IconButton`, `Card`, `List`/`ListItem`, `MetadataList`, `TextInput`, `TextArea`,
`Selector`, `SegmentedControl`, `Switch`, `CheckboxInput`, `InputGroup`, `Banner`, `Badge`, `EmptyState`,
`TabList`, `DropdownMenu`, `Tooltip`, `Skeleton`, `Drawer`, `BottomSheet`, `AppShell`, `Avatar`.

Ours, because Astryx has no equivalent or the app needs a specific behaviour:

- **Wordmark and Mark** (`app-shell.tsx`): "OpenQuote" semibold, "AU" in secondary text, beside the mark.
- **Money** (`money.tsx`) and **Breakdown** (`breakdown.tsx`): the money bar splits the price by stage in one
  neutral ramp (no per-stage hues); pointing at a legend row lifts its segment.
- **Schedule** (in `estimate-view.tsx`): columns from 640px; on a phone each line folds into the description, a
  "qty unit × rate" line and the amount.
- **SourceBadge**: where a price came from. The tradie's own figures are a quiet grey chip; an AI guess is the
  one with a dashed edge ("Check price"). Tapping a chip explains it.
- **Sheet**, **BackLink**, **PageTitle**, **SectionTitle**, **FilterTabs** (link tabs on Astryx `TabList`),
  **SearchBox** (GET form, query in the URL), **DeleteRecord** (asks in place, no pop-up), and the Settings
  parts (`app/settings/parts.tsx`, `form-footer.tsx`).
- **Status badges**: Astryx `Badge`. Orange only for in-flight states (Sent, Quoting); everything else neutral.

## Behaviour that must not regress

- Keyboard focus rings show for the keyboard only (`PointerFocus` sets `html[data-pointer]` after a click or tap).
- Talk: hidden where the browser has no speech recognition; orange bars and Stop with a timer while listening;
  still bars with reduced motion; text appends after what was typed.
- The editor asks "Leave without saving?" on any in-app link while there are changes, and on closing the tab.
- Money is integer cents ex GST; the Rate column is the client rate, so qty × rate = amount; GST once at the total.
- Dates are in Australian eastern time; clock times in the viewer's own zone (`LocalTime`).
- Print and Save as PDF hide the app chrome and anything marked `no-print`.
- An accepted quote is locked: its main action is Duplicate as new estimate.

## Do and don't

- **Do** reach for an Astryx component and its props before writing markup; style the rest with token-backed
  Tailwind (`text-(--color-text-secondary)`, `bg-(--color-background-muted)`, `border-(--color-border)`).
- **Do** keep text a user must read in `primary` or `secondary`; never in a disabled or decorative colour.
- **Do** pass lucide icons to Astryx as a component (`<Icon icon={Plus} />`) in client components. In a server
  component, draw the lucide SVG directly: a component can't be handed to a client component from the server.
- **Don't** use orange outside the One Orange Rule, or green/red for anything but success and error.
- **Don't** add colours, radii or shadows outside the theme; change the theme instead.
- **Don't** show errors in a modal; use an inline `Banner`.
- **Don't** let a button label clip on a phone: shorten it there, or drop its icon.

## Checking a screen

`/setup/design-fixtures?view=…` (local only, not committed) renders every screen with made-up data: `detail`,
`sent`, `sent-edited`, `accepted`, `list`, `edit`, `new`, `live`, `projects`, `project`, `clients`, `client`,
`rates`, `business`, `settings`, `account`, `menu`, `onboarding`, `quote`, `quote-full`, `quote-accepted`.
README screenshots in `docs/screenshots/` are taken from it at 390 × 844 in light mode.
