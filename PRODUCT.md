# Product

## Register

product

## Users

Primary: German-speaking women aged 16–28, browsing on their phones — commuting, between classes, late at night. They have an intuition for style but can't always name it. They discover by feeling, not by category. Secondary: men, same age range, same four aesthetics — no parallel gender system.

## Product Purpose

StyleMatch is a fashion discovery and wardrobe management app — "Shazam für Mode." Users upload outfit photos; AI extracts style DNA (colors, silhouettes, occasion lean, era pull, formality). The app surfaces swipeable product cards from partner shops matched to the user's evolving taste.

The defining feature: the visual shell of the app itself morphs to reflect the user's aesthetic. The UI is not a brand — it is a mirror. It starts as "Deine Leinwand" (a warm neutral blank canvas) and evolves silently as the algorithm builds confidence. The app has no aesthetic of its own until the user gives it one.

## Brand Personality

Adaptive, intimate, unhurried. Three words: **reflective, precise, alive.**

## The Adaptive System

Four aesthetic buckets — each a complete visual identity:

- **Old Money** — Camel, Navy, Cream, Dark Green, Burgundy. Font: Cormorant Garamond. Quiet authority, editorial restraint, grounded confidence.
- **Y2K** — Silver, Baby Blue, Pink, Purple, Neon accents. Fonts: Space Grotesk + VT323. Energetic, playful, unapologetically loud.
- **Casual** — White, Grey, Beige, Light Blue, Black, Olive. Font: DM Sans. Effortless, uncomplicated, always comfortable.
- **Streetwear** — Black, White, Orange, Red, Camo, block colors. Fonts: Bebas Neue (display) + Inter (body). Urban, confident, culturally aware.

**Default state ("Deine Leinwand"):** Warm off-white base, dark ink, muted warm accent. Font: Inter. No aesthetic opinion.

**Trigger:** Confidence threshold — the algorithm reaches sufficient certainty about an aesthetic, the shell shifts silently.

**Hybrid blending rule:** Dominant aesthetic controls color, typography, shape, and motion. The secondary aesthetic always contributes spacing and density. No other blending rules — this is the only exception.

**Notification:** Subtle toast — "Dein Style hat sich weiterentwickelt" — 5-second undo. Undo rolls back to the previous aesthetic state, not the default.

**User control:** Can undo any shift. Can disable the mechanism entirely in settings. No preview of upcoming shifts.

## Anti-references

- Generic fast-fashion apps (H&M, Zara) — transactional, discount-first, no personality
- Pinterest — passive consumption, no intelligence, no feedback loop
- Dating app aesthetics — swipe mechanic is borrowed, the emotional register is not
- Clinical recommendation engines (Amazon, price-comparison tools) — algorithmic but cold

## Design Principles

1. **The app has no ego.** Before the user gives it character, it gives nothing back. "Deine Leinwand" is a deliberate void — an invitation, not a brand statement.
2. **Unnoticed evolution.** No announcements, no onboarding slides explaining the system. The shift is felt before it is understood. If the user consciously notices the mechanism triggering, the timing was wrong.
3. **The mirror test.** Every design decision: does this surface reflect the user's aesthetic, or the product's? The product has no aesthetic of its own.
4. **Mobile as the only canvas.** Every layout decision is made for a phone held in one hand. iOS safe areas, 44pt minimum tap targets, no gesture conflicts with iOS system gestures.
5. **Density follows the secondary.** Dominant controls everything visual. Secondary controls only spacing and density. Tension without chaos.

## Style DNA (Profile)

Users see their style fingerprint as attributes — no archetype names shown:

- Dominant colors (swatches, no labels)
- Silhouette tendency (oversized / fitted / structured / relaxed)
- Occasion lean (everyday / going out / work / weekend + specific: wedding, formal dinner, etc.)
- Era pull (classic / contemporary / retro / forward)
- Formality axis (slider position: casual to formal)

Read-only by default (generated from behavior). Users can manually adjust any attribute — this feeds back into recommendations but does not override the visual shell adaptation.

## Accessibility & Inclusion

- iOS-first, App Store compliant. Safe areas, 44pt minimum tap targets, no conflicts with iOS system gestures.
- Same four aesthetics for all genders — no parallel male/female system.
- `prefers-reduced-motion` must be respected on all adaptive shell transitions.
- Users aged 16+ — no adult content, no dark patterns around purchases or data consent. GDPR-compliant (German market primary).
- WCAG AA as the baseline across all default and aesthetic states.
