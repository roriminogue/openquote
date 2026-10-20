---
version: 1
slug: "src-app-estimates"
primary_target: "src/app/estimates"
related_targets: ["src/app/login","src/app/onboarding","src/app/settings"]
---

# Estimates (app shell, list, new, detail; restyles login/onboarding/settings)

Mode: Operate. Audience: owner-operator tradie, phone in full sun on site, laptop at night. Job: describe a job,
watch the AI build a priced estimate, check the numbers and where they came from, then refine/send (later).
Decision taken by the agent under the user's delegation ("use whatever you think, start now"); no decision page shown.

## Direction contract

THESIS: The estimate is read like a steel tape. One yellow graduated blade measures where the money goes, and the
total is the reading at its end. Refuses the category default: white SaaS cards, blue accent, stat-tile dashboard.

OWN-WORLD: Concrete-light ground (#F3F3F0) and white work surfaces, near-black ink (#161510), tape-blade yellow
(#F5C400) as the single committed accent (blade rail, primary action, new-line wash), stud-mark red (#C8281E) only
for warnings/errors. Barlow for text, Barlow Semi Condensed bold uppercase for labels and tabular numerals, like
blade printing. 1px hairlines with graduation ticks as dividers; 4px radius; no cards-in-cards; dark case-black
theme for night.

STORY: The tradie sees what they're quoting, how much, and why each number is what it is (your rate vs AI
estimate), and trusts it enough to send.

FIRST VIEWPORT: Estimate detail: title left, docket number right; the reading (total inc GST) at display size;
directly beneath, the full-width yellow blade, graduated, split into stage segments proportional to price with
labels. Primary action (New estimate / Send later) top right in blade yellow. New estimate: one big description
field and a yellow Generate bar; during generation the blade runs out of the case as stages arrive (on desktop it grows leftward from the case,
like a real tape; on phones the case sits above and the blade grows left→right) and the reading counts up live. Once
the reading scrolls away, a compact case window rides along the bottom.

FORM: Steel tape measure blade, #5 of my grounded list (1 docket book, 2 plan title block, 3 timber stamps,
4 safety signage, 5 tape blade, 6 trade-counter tickets, 7 Dymo labels). Seed key 06ba2b29.
Raises: from the acetate tab manual, stages as a stepped rail whose length is their share of the total; from the
timetable rack, a tight type scale where rank is weight and case, one reversed plate per screen (the reading);
from the gate board, AI-added lines hold a yellow wash until they've been seen; from the design annual, the whole
layout built from 1px hairlines and graduation ticks; from the type specimen, hierarchy by scale contrast between
the reading and tiny condensed labels. Challenger verdicts: all declined (none beat the blade on audience
identification and product clarity); gate board competitive on clarity only.

Signature interaction: the blade extending and the reading counting up while the estimate streams in.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
