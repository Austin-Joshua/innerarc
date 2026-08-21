# Apple Fitness — UX Pattern Analysis & Innerarc Adaptation

## Scope and a note on sourcing

This document analyzes **general, publicly observable UX patterns** from Apple
Fitness — the kind of structural and interaction decisions any competent
design teardown would note (screen architecture, information hierarchy,
navigation model). It does **not** attempt to reproduce Apple's exact visual
design (specific hex values, the Activity Rings trade dress, true-black OLED
treatment) — that's Apple's distinctive product identity, not a generic
pattern, and cloning it isn't something to build Innerarc on. Where source
material (the uploaded spec) stated precise values without a verifiable
source, those values are treated as approximate, not authoritative.

---

## 1. Structural patterns worth noting

**Three-tab architecture** — Summary / Fitness+ / Sharing. The core insight
isn't the specific tabs, it's that the *primary landing screen* is a single
dashboard combining today's status, recent history, and trends — not split
across separate screens the user has to navigate to piece together.

**Ring-based goal visualization (pattern, not the exact rings)** — a single
glanceable shape showing progress against a target, sized to dominate the
top of the dashboard. The pattern that matters: **one number, one visual,
immediately legible without reading labels.**

**Card-based history list** — recent activity as a vertical stack of
compact cards (icon, title, key stat, timestamp), not a dense table. Each
card is scannable in under a second.

**Trend indicators as a distinct section**, separated from "today" —
today's status and the longer-term trend are visually and spatially
different concerns, not merged into one view.

**Section headers with a "Show More" affordance** — dashboard sections stay
short by default; depth is opt-in, not dumped on the main screen.

---

## 2. Where Innerarc already has the equivalent pattern

| Apple Fitness pattern | Innerarc equivalent | Status |
|---|---|---|
| Ring-based goal visualization | Home's calorie donut (teal logged / grey remaining) | **Already built** — Module 12 Phase 2 |
| Trend section, separated from "today" | Progress Compare's ratio trend line chart | **Already built** — Module 12 Phase 2 |
| Card-based history list | Workout Library / Program cards | **Already built** — Batch C |
| Single dashboard combining status + entry points | Home screen (calories, macros, wearables, nav cards) | **Already built** |
| Section headers | `SectionHeader` shared component | **Already built** — Phase 1 |

Worth sitting with: most of what makes Apple Fitness's dashboard work is
already present in Innerarc's Home screen, just expressed in the calm/muted
palette instead of true-black/neon. The *pattern* transferred already; only
the *skin* differs, and the skin differing is deliberate.

---

## 3. One pattern genuinely worth considering — not currently in Innerarc

**A compact "recent activity" card stack on Home**, distinct from the
existing "Workouts / Progress / Coach" navigation cards. Apple Fitness's
History section shows the last few *completed* actions (a run, a swim), not
just entry points to *go do* something. Innerarc's Home currently has entry
points (Log meal, Workouts, Progress, Coach) but no glanceable "here's what
you actually did recently" strip.

This is a genuinely additive idea, not a reskin — if it's wanted, it should
go through the same review cadence as every other module (a scoped
proposal, a stop-and-review, not a silent addition).

---

## 4. What not to adopt, and why

| Apple Fitness choice | Conflicts with |
|---|---|
| True-black OLED background | UI/UX Brief: "calm, not clinical," off-white/soft-grey base |
| Neon pink/green/cyan rings | UI/UX Brief: muted semantic tones, explicitly not traffic-light |
| Heavy, athletic display numerals (SF Pro Rounded Heavy) | Existing type scale is intentionally calmer, not "athletic/competitive" in tone |
| Ring fill as the *only* signal of progress | Module 4's hard rule: visual metrics never shown without consistency data alongside them |

That last one matters most. Apple Fitness's rings are a pure visual-progress
signal with no equivalent to Innerarc's "workouts logged / days active"
requirement sitting next to every visual metric. Adopting the ring
aesthetic wholesale without that pairing would be a regression against a
constraint the whole Progress Intelligence module was built around.

---

## 5. If you want mockups

I can generate visual mockups of **Innerarc's own screens**, using its
existing token system, to explore the "recent activity" idea from Section 3
or any other layout question — that's a legitimate design exploration.
I won't generate pixel mockups that reproduce Apple's actual app UI, for
the reasons above.
