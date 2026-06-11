---
title: Framer Motion Guide 
description: guides agent to provide skills on effective usage of framer motion with heroui V3
---

## The Goal

Add smooth, purposeful animations and transitions to **HeroUI v3 + shadcn/ui** components without tanking performance or UX.

Animations should:
- Support clarity and feedback (hover, tap, transitions, page changes).
- Feel subtle and premium, not Las Vegas.
- Never block content or make the site feel slower.

---

## Guiding Principles

- **Follow HeroUI v3’s official guidance** on animation setup.  
  Reference: [HeroUI v3 – Animation Guide](https://v3.heroui.com/docs/react/getting-started/animation)

- **Animation is a UX tool, not decoration.**  
  Only animate when it:
  - Improves feedback (hover, tap, focus).
  - Guides attention (hero sections, key CTAs).
  - Smooths layout changes (cards, modals, toasts).

- **Prefer consistency over creativity.**  
  Use shared variants/utilities from `lib/motion` instead of inventing new timing/curves per component.

- **Performance first, then flair.**  
  If an animation hurts Lighthouse / INP / LCP scores, simplify or remove it.

---

## Implementation Rules

### 1. Use `LazyMotion` + `domAnimation` by default

Framer Motion must be used through `LazyMotion` to keep the bundle lean and script evaluation low.

- Use **`LazyMotion` with `features={domAnimation}`** for all “normal” animations:
  - Opacity fades
  - Translate (x / y)
  - Scale
  - Simple variants

- Only switch to `domMax` in rare cases where you truly need advanced gestures (drag, complex whileHover, scroll-based effects), and isolate those in their own wrapper.

Example wrapper (client-only):

```tsx
// components/MotionProvider.tsx
'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import React from 'react';

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
```

Usage in pages/layouts (wrap only animated sections):

```tsx
// app/(main)/page.tsx
import { MotionProvider } from '@/components/MotionProvider';
import { HeroSection } from '@/components/sections/HeroSection';

export default function HomePage() {
  return (
    <MotionProvider>
      <HeroSection />
      {/* other animated sections */}
    </MotionProvider>
  );
}
```

### 2. Use `m` from Framer Motion inside wrapped components

- Inside components that live under `MotionProvider`, import `m` (alias) instead of `motion`:

```tsx
'use client';

import { m } from 'framer-motion';
import { buttonVariants } from '@/lib/motion/buttonVariants';

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <m.button
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      className="inline-flex items-center rounded-md px-4 py-2 font-medium"
      {...props}
    />
  );
}
```

- All shared variants (buttons, cards, sections) should live in `lib/motion/*` and be reused.

---

## Performance Best Practices (Mandatory)

These rules exist to avoid bloated JS and slow hydration.

### 1. Use `domAnimation` everywhere you can

- Default is: `features={domAnimation}`.
- Do **not** pull in more Framer Motion features than the UI needs.
- Only upgrade a **new, isolated wrapper** to `domMax` if you:
  - Need drag, or
  - Heavy gesture/scroll logic that absolutely requires it.

### 2. Wrap only what really needs animation

- Don’t wrap the whole app in `LazyMotion` “just in case”.
- Wrap:
  - Hero sections
  - Card grids
  - Key CTA areas
  - Modals / drawers / toasts
- Leave static content (plain text sections, footers, legal pages) out of motion wrappers.

### 3. Prefer transforms + opacity

Allowed:
- `opacity`
- `x`, `y`
- `scale`, `scaleX`, `scaleY`
- `rotate`

Avoid:
- Animating `width`, `height`, `top`, `left`, or other layout-affecting properties.
- This keeps layout + style recalculations low and animation smooth.

### 4. Use `viewport={{ once: true }}` for scroll-in views

For sections that animate when scrolled into view:

- Use Framer Motion’s `whileInView` with `viewport={{ once: true }}` to prevent repeated animation + re-evaluation.

Example:

```tsx
<m.section
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.3 }}
  variants={sectionVariants}
>
  {children}
</m.section>
```

### 5. Use staggered variants for lists

- For grids/lists (cards, testimonials), animate the container and stagger children:
  - Container: handles `staggerChildren`
  - Child: handles fade/slide in

This looks smooth while avoiding per-item custom logic.

```tsx
const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
```

### 6. Don’t over-animate

- Avoid adding motion to:
  - Every single icon
  - Every small label
  - Large amounts of text at once
- Limit motion to:
  - Interactable elements (buttons, cards)
  - High-impact sections (hero, key CTAs)
  - Major layout transitions.

If a page has “too much going on”, reduce the number of motion components.

---

## HeroUI v3 + shadcn Integration Rules

- Use HeroUI’s recommended animation patterns where available.
- Wrap HeroUI components (buttons, cards, modals) with Framer Motion **outside**, not by hacking internal DOM.
- For shadcn/ui components:
  - Wrap the root of the component in `m.div` / `m.button` / `m.section`.
  - Keep the component’s API untouched; animation is an enhancement, not a breaking change.

---

## File & Structure Guidelines

- All shared variants live in: `lib/motion/`
  - `lib/motion/buttonVariants.ts`
  - `lib/motion/cardVariants.ts`
  - `lib/motion/sectionVariants.ts`
- All motion wrappers/providers live in: `components/motion/`
  - `components/motion/MotionProvider.tsx`
  - `components/motion/AnimatedSection.tsx` (if needed)

Front-end AI agent should:
- Prefer reusing existing variants before adding new ones.
- Keep new variants small, simple, and transforms-only.
- Never import `motion`/`m` or use Framer Motion outside of `LazyMotion` wrappers.

---

## Summary

Use Framer Motion to make the UI feel smooth, guided, and responsive — **not** heavy.  
- `LazyMotion + domAnimation` by default  
- Transforms + opacity only  
- Viewport + once for scroll-in  
- Stagger for lists  
- Minimal wrappers and no “animation for the sake of animation”

If following these rules, animations should “feel expensive” while still performing well on real-world devices and networks.