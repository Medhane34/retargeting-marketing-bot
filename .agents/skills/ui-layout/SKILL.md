---
title: Layout Primitves 
description: enforces consistent layout spacing 
---



### 📝 What are Layout Primitives?

Layout primitives are **single-purpose, highly reusable components** that handle the geometry of a page. Unlike "Organisms" (which contain business logic and styles), Primitives care only about **spacing, alignment, and distribution**.

### Purpose 
This skill ensures that all organism & components built using HeroUI v3 follow correct layout primtives to maintain consistency, and align with best practices for accessibility, structure, and styling.

### 💡 The "Why" (The Philosophy)

- **Decoupling:** Separation of *layout* (where things go) from *content* (what things are).
- **Consistency:** Eliminates "magic numbers" (e.g., `margin-top: 17px`) by forcing the use of a predefined spacing scale.
- **Velocity:** Building a new section becomes a matter of nesting primitives rather than writing new CSS.

### when to apply 

- when creating molecules and organisms 

## 🛠️ The Core Primitives Library

### 1. 📏 `PageContainer`

> **The Wrapper.** Centers content and prevents it from bleeding to the edges of the screen.

* **The How:** Uses `max-width: 1280px` (variable) and `margin: 0 auto`.
* **Best Practice:** Never nest a `PageContainer` inside another `PageContainer`. It should always be the outermost structural layer of a section.
* **Common Mistake:** Applying background colors to this component. Backgrounds should go on the `SectionContainer` so they span the full viewport width.

### 2. 🥞 `ContentStack`

> **The Vertical Rhythm.** Manages the white space between stacked elements.

* **The How:** Uses `display: flex` with `flex-direction: column` and the `gap` property.
* **Best Practice:** Use this for text-heavy areas (Heading + Paragraph + Button) to ensure the "breathability" of the editorial content.
* **Common Mistake:** Adding `margin-bottom` to the children inside the stack. Let the Stack handle all spacing via the `gap` prop.

### 3. 👥 `InlineCluster`

> **The Horizontal Flow.** For elements that sit side-by-side and need to wrap gracefully.

* **The How:** Uses `flex-direction: row` with `flex-wrap: wrap`.
* **Example:** A list of tags under an article title or a row of social media icons.
* **Tip:** Great for "Meta lines." If a date and a category name are too long for mobile, they will automatically stack safely.

### 4. 🌓 `TwoColumnSplit`

> **The Editorial Balance.** The classic "Hero" layout.

* **The How:** Grid or Flexbox. Usually switches from `1fr 1fr` to `1fr` on mobile.
* **Best Practice:** Always include a `reverseOnMobile` prop. Often, you want the image on the right on desktop, but you want it *above* the text on mobile.

### 5. 🏗️ `SectionContainer`

> **The Canvas.** Defines the vertical padding and background of a major site block.

* **The How:** High `padding-top` and `padding-bottom`.
* **Why:** Ensures that as a user scrolls, every "topic" or "block" on the homepage has consistent breathing room.

---

## 📋 Summary: Which one do I use?
Find the already created primites layout at @components/layouts. Note:- You can also create new ones or enhanced if needed. 

## 🚫 Common Layout Mistakes to Avoid

1. **The "Margin Leak":** Avoid putting margins on your UI components (Cards, Buttons, Inputs). Instead, let the **Primitive** (Stack or Grid) define the space *between* them.
2. **Hardcoded Heights:** Never set `height: 500px` on primitives. Layouts should be fluid and grow with their content.
3. **Over-Nesting:** If you find yourself nesting 5 primitives just to move a button 10px, consider if you need a specific "Utility" class instead.

## 🔗 References & Inspiration

* [Every Layout](https://every-layout.dev/) by Heydon Pickering (The "Bible" of Layout Primitives).
* [Braid Design System](https://seek-oss.github.io/braid-design-system/components/Stack) by Seek.
* [Chakra UI Layout Components](https://www.google.com/search?q=https://chakra-ui.com/docs/components/layout/stack).

---

### 💡  Tip

- Type `> [!TIP]` followed by your text to make it pop visually in your notes!
- When building your **Organisms**, start by writing the layout in "Pseudo-code" using these names.
- *Example:* `SectionContainer > PageContainer > TwoColumnSplit`. If you can't describe the layout using these primitives, you might need a new primitive!

How does this structure look for your Obsidian vault? Would you like me to expand on the **Grid** or **Masonry** specifics?