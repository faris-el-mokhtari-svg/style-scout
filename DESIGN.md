---
name: StyleMatch
description: Adaptive fashion discovery app — the visual shell morphs to reflect the user's detected aesthetic
register: product
adaptive: true
aesthetics: [old-money, y2k, casual, streetwear]
default: deine-leinwand
---

# Design System: StyleMatch

## Overview

StyleMatch has no fixed brand aesthetic. The design system is a set of four complete visual identities plus a neutral default. The active identity is determined by the algorithm's confidence about the user's aesthetic. Every layer of the system — color, typography, spacing, shape, motion, iconography — participates in the shift.

The default state is called **"Deine Leinwand"** (Your Canvas). It is intentionally characterless: a warm neutral shell that communicates nothing about style until the user fills it. The emptiness is the point.

---

## Default State: Deine Leinwand

**Character:** Warm neutral, unhurried, invisible. A blank canvas that communicates craft without having an aesthetic opinion.

### Colors

| Role | Value | Notes |
|---|---|---|
| Background | `oklch(98% 0.008 60)` | Warm off-white, barely tinted toward amber |
| Surface | `oklch(96% 0.007 60)` | Cards, input backgrounds |
| Border | `oklch(88% 0.006 60)` | Hairline dividers |
| Ink primary | `oklch(14% 0.008 50)` | Near-black, warm tint |
| Ink secondary | `oklch(45% 0.008 50)` | Muted body text |
| Ink tertiary | `oklch(65% 0.006 50)` | Labels, captions |
| Accent | `oklch(72% 0.04 60)` | Warm stone — used sparingly for one interactive element per screen |
| Like | `oklch(65% 0.18 145)` | Green — fixed across all aesthetics |
| Dislike | `oklch(58% 0.20 25)` | Red — fixed across all aesthetics |
| Save | `oklch(78% 0.18 80)` | Gold — fixed across all aesthetics |

Like/Dislike/Save colors are action primitives — they never adapt. They need to be learned once and stay consistent.

### Typography

**Font:** Inter (Google Fonts) — neutral, legible, invisible at this stage.

| Scale | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| Display | `clamp(2.5rem, 8vw, 4rem)` | 700 | 1.0 | Onboarding headlines only |
| Heading | `clamp(1.5rem, 4vw, 2rem)` | 600 | 1.1 | Section titles, card headings |
| Body | `1rem` | 400 | 1.5 | Primary reading text |
| Label | `0.75rem` | 500 | 1.2 | Captions, metadata, tags |
| Micro | `0.6875rem` | 400 | 1.3 | Prices, timestamps |

### Shape

| Token | Value |
|---|---|
| `--radius-sm` | `8px` |
| `--radius-md` | `14px` |
| `--radius-lg` | `20px` |
| `--radius-xl` | `28px` |
| `--radius-pill` | `9999px` |
| `--radius-card` | `20px` |

### Spacing

Base unit: `4px`. All spacing values are multiples.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Icon gaps, tight pairs |
| `--space-2` | `8px` | Input padding, badge internals |
| `--space-3` | `12px` | List item gaps |
| `--space-4` | `16px` | Card internals, form fields |
| `--space-5` | `24px` | Section sub-gaps |
| `--space-6` | `32px` | Section gaps |
| `--space-7` | `48px` | Major section breaks |
| `--space-8` | `64px` | Screen-level vertical rhythm |

### Motion (Default)

- **Duration:** 240ms standard, 160ms micro-interactions
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quint)
- **Swipe exits:** 320ms, slight rotation (max 15deg), `cubic-bezier(0.4, 0, 1, 1)`
- **prefers-reduced-motion:** All transitions collapse to `opacity` only, 120ms

---

## Aesthetic 1: Old Money

**Character:** Quiet authority. Grounded, assured, never loud. Design serves restraint.

### Colors

| Role | Value |
|---|---|
| Background | `oklch(97% 0.012 85)` | Warm cream |
| Surface | `oklch(94% 0.014 80)` | Parchment card |
| Border | `oklch(82% 0.020 75)` | Camel-tinted hairline |
| Ink primary | `oklch(16% 0.012 45)` | Deep warm near-black |
| Ink secondary | `oklch(42% 0.015 50)` | Muted ink |
| Accent primary | `oklch(35% 0.08 240)` | Navy — primary CTA, active states |
| Accent secondary | `oklch(52% 0.10 30)` | Camel — secondary surfaces |
| Accent deep | `oklch(28% 0.09 10)` | Burgundy — destructive actions, emphasis |

### Typography

**Display + Heading:** Cormorant Garamond (Google Fonts) — italic where editorial, upright where structural
**Body + Label:** Inter — the serif earns hierarchy, Inter handles utility

| Scale | Font | Size | Weight | Style |
|---|---|---|---|---|
| Display | Cormorant Garamond | `clamp(3rem, 10vw, 5rem)` | 600 | Italic |
| Heading | Cormorant Garamond | `clamp(1.75rem, 5vw, 2.5rem)` | 500 | Upright |
| Body | Inter | `1rem` | 400 | — |
| Label | Inter | `0.75rem` | 500 | Tracked `0.08em` |

### Shape Overrides

| Token | Value | Change from default |
|---|---|---|
| `--radius-card` | `12px` | Tighter — more architectural |
| `--radius-lg` | `16px` | Slightly reduced |
| `--radius-pill` | `9999px` | Unchanged |

### Density (default — used when Old Money is dominant)

Standard spacing. No overrides to the spacing scale.

### Motion Overrides

- Duration: 320ms standard (slower, more deliberate)
- Easing: `cubic-bezier(0.25, 0.1, 0.25, 1)` (ease — more even, less snappy)
- Page transitions: fade only, 280ms

---

## Aesthetic 2: Y2K

**Character:** Loud, unapologetic, digital-nostalgic. Energy before restraint.

### Colors

| Role | Value |
|---|---|
| Background | `oklch(96% 0.018 300)` | Faint lavender tint |
| Surface | `oklch(98% 0.010 280)` | Near-white with purple cast |
| Border | `oklch(80% 0.060 310)` | Visible lavender border |
| Ink primary | `oklch(18% 0.025 290)` | Deep purple-black |
| Ink secondary | `oklch(48% 0.035 300)` | Muted violet |
| Accent primary | `oklch(62% 0.22 340)` | Hot pink — primary actions |
| Accent secondary | `oklch(72% 0.14 280)` | Lavender — secondary surfaces |
| Accent pop | `oklch(78% 0.12 200)` | Baby blue — highlights |
| Metallic shimmer | `oklch(85% 0.04 220)` | Silver — decorative only |

### Typography

**Display:** VT323 (Google Fonts) — pixel-era nostalgia, used at large sizes only
**Heading + Body + Label:** Space Grotesk (Google Fonts) — geometric, slightly retro-digital

| Scale | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Display | VT323 | `clamp(4rem, 14vw, 8rem)` | 400 | VT323 has no weight variation — size does the work |
| Heading | Space Grotesk | `clamp(1.5rem, 5vw, 2.25rem)` | 700 | |
| Body | Space Grotesk | `1rem` | 400 | |
| Label | Space Grotesk | `0.75rem` | 500 | |

VT323 is display-only — never used below 2rem. Body copy in VT323 is illegible and prohibited.

### Shape Overrides

| Token | Value |
|---|---|
| `--radius-card` | `24px` — rounder, friendlier |
| `--radius-lg` | `20px` |
| Bottom nav items | pill-shaped active indicator |

### Density

More generous internal padding — playful breathing room. When Y2K is the secondary aesthetic contributing density:
- Card padding: `--space-5` (24px) instead of default `--space-4`
- List items: `--space-4` (16px) vertical gap instead of `--space-3`

### Motion Overrides

- Duration: 200ms (snappier, more energetic)
- Easing: `cubic-bezier(0.34, 1.2, 0.64, 1)` — slight overshoot on entrance only
- Swipe cards: faster exit (240ms), more exaggerated rotation (max 20deg)
- Reduced motion: strictly `opacity` only — the overshoot easing is the first to go

---

## Aesthetic 3: Casual

**Character:** Effortless. Nothing is trying too hard. Comfort at every interaction.

### Colors

| Role | Value |
|---|---|
| Background | `oklch(98% 0.004 80)` | Near-white, barely warm |
| Surface | `oklch(95% 0.005 75)` | Light grey-white |
| Border | `oklch(86% 0.006 70)` | Soft grey |
| Ink primary | `oklch(15% 0.005 60)` | Soft near-black |
| Ink secondary | `oklch(50% 0.006 60)` | Mid grey |
| Accent primary | `oklch(42% 0.06 160)` | Olive green — primary actions |
| Accent secondary | `oklch(75% 0.04 80)` | Warm beige — secondary surfaces |
| Accent denim | `oklch(55% 0.08 240)` | Light blue — tertiary emphasis |

### Typography

**All scales:** DM Sans (Google Fonts) — humanist, warm, reads without effort

| Scale | Size | Weight | Line height |
|---|---|---|---|
| Display | `clamp(2.5rem, 8vw, 4rem)` | 700 | 1.05 |
| Heading | `clamp(1.4rem, 4vw, 2rem)` | 600 | 1.15 |
| Body | `1rem` | 400 | 1.6 |
| Label | `0.75rem` | 500 | 1.3 |

Line-height is intentionally more generous than other aesthetics — contributes to the effortless feel.

### Shape Overrides

Standard default radii — no change. Casual is the closest aesthetic to the default shell.

### Density (default for Casual — contributed when Casual is secondary)

Relaxed. When Casual is the secondary aesthetic:
- Screen-level vertical padding increases by `--space-2` on each side
- Card internals: `--space-5` (24px)
- List rows: `--space-4` (16px) vertical padding

### Motion Overrides

- Duration: 280ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` — same as default, slightly more ease
- No bounce, no overshoot. Everything settles naturally.

---

## Aesthetic 4: Streetwear

**Character:** Intentional, urban, direct. Every element earns its place.

### Colors

| Role | Value |
|---|---|
| Background | `oklch(12% 0.008 50)` | Deep warm near-black |
| Surface | `oklch(18% 0.010 50)` | Dark card surface |
| Border | `oklch(28% 0.012 50)` | Subtle dark border |
| Ink primary | `oklch(96% 0.006 80)` | Off-white text |
| Ink secondary | `oklch(65% 0.008 70)` | Muted grey |
| Accent primary | `oklch(62% 0.22 45)` | Orange — primary actions, hero emphasis |
| Accent secondary | `oklch(95% 0.004 80)` | White — secondary elements |
| Accent red | `oklch(52% 0.20 25)` | Red — used sparingly, never near Dislike red |

Streetwear is the only dark-background aesthetic. All contrast ratios rechecked for WCAG AA against the dark surface.

### Typography

**Display:** Bebas Neue (Google Fonts) — condensed, poster energy, all-caps
**Body + Label:** Inter — contrast partner to Bebas Neue, not competing

| Scale | Font | Size | Weight | Transform |
|---|---|---|---|---|
| Display | Bebas Neue | `clamp(4rem, 14vw, 9rem)` | 400 | `uppercase` |
| Heading | Bebas Neue | `clamp(2rem, 6vw, 3.5rem)` | 400 | `uppercase` |
| Body | Inter | `1rem` | 400 | — |
| Label | Inter | `0.75rem` | 600 | `uppercase`, tracked `0.1em` |

Bebas Neue is display and heading only — never body, never label. The contrast between Bebas Neue and Inter is the typographic system.

### Shape Overrides

| Token | Value |
|---|---|
| `--radius-card` | `8px` — sharper, more structured |
| `--radius-md` | `6px` |
| `--radius-lg` | `10px` |
| `--radius-pill` | `9999px` — pill CTAs are unchanged |

### Density (contributed when Streetwear is secondary)

Tight. When Streetwear is the secondary aesthetic:
- Card padding: `--space-3` (12px)
- List rows: `--space-2` (8px) vertical padding
- Section gaps reduced by one spacing step

### Motion Overrides

- Duration: 180ms (fastest — decisive, no hesitation)
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` — hard ease-out
- Swipe card exit: 200ms, max 12deg rotation (controlled, not dramatic)
- Page transitions: instant or near-instant (120ms fade)

---

## Cross-Aesthetic Rules

### The Blending Rule

When a user's profile is a hybrid (dominant + secondary), one rule applies:

> The dominant aesthetic controls color, typography, shape, and motion.
> The secondary aesthetic contributes **only** spacing and density.

No other blending. This produces tension without incoherence.

### Fixed Primitives (Never Adapt)

These three values are learned once and stay constant across all aesthetics:

| Primitive | Value |
|---|---|
| Like (green) | `oklch(65% 0.18 145)` |
| Dislike (red) | `oklch(58% 0.20 25)` |
| Save (gold) | `oklch(78% 0.18 80)` |

Swipe gesture threshold, card physics, and action button positions never change.

### iOS Constraints (Non-negotiable)

- Safe area insets respected on all screens (`env(safe-area-inset-*)`)
- Minimum tap target: 44×44pt
- Bottom navigation clear of home indicator
- No custom gesture conflicts with iOS swipe-back or system swipes
- All adaptive transitions respect `prefers-reduced-motion` — collapse to opacity-only, 120ms

### Transition Notification

When the shell shifts: a subtle toast appears at the top of the screen.

```
"Dein Style hat sich weiterentwickelt"   [Rückgängig]
```

- Duration before auto-dismiss: 5 seconds
- Undo: rolls back to the previous aesthetic state (not to Deine Leinwand)
- Toast styling: always uses Deine Leinwand colors, regardless of active aesthetic — so it reads as system, not content

---

## Component Notes

### Swipe Card

The swipe card is the product's primary surface. It adapts aesthetically but its interaction mechanics are fixed.

- Stack depth: 3 visible cards, each offset `4px` down and `2px` narrower
- Active card drag: rotation proportional to horizontal drag offset (max ±15deg default, ±20deg Y2K, ±12deg Streetwear)
- Action labels: LIKE / NOPE / SAVE rotate in from 0 opacity as the card tilts — they use the fixed primitive colors
- Exit velocity threshold: `800px/s` or drag distance `>40%` of screen width

### Bottom Navigation

Four tabs: Wardrobe / Discover / Likes / Profile. Fixed to bottom, above home indicator safe area.

- Active indicator: changes shape and color per aesthetic (pill in Y2K/Casual, sharper fill in Streetwear, underline in Old Money)
- Labels always visible — no icon-only nav. Minimum contrast ratio 4.5:1 in all states.

### Style DNA Profile

Displayed as attribute rows — no archetype name, no percentage bars.

- Color swatches: 5×5 grid of detected dominant colors, no labels
- Silhouette: single selected chip from [oversized, fitted, structured, relaxed]
- Occasion: multi-select chips [everyday, going out, work, weekend, wedding, formal dinner, ...]
- Era: single selected chip from [classic, contemporary, retro, forward]
- Formality: horizontal slider, two labeled endpoints only ("Entspannt" / "Formell")

Read-only by default. Edit mode: long-press any attribute row to unlock adjustment. Changes feed back into recommendations; they do not override shell adaptation.
