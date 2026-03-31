# Design System Strategy: The Animated Editorial

## 1. Overview & Creative North Star

**Creative North Star: "The Kinetic Curator"**
This design system is a sophisticated collision of two seemingly disparate eras: the rebellious, raw structuralism of Modern Neo-Brutalism and the fluid, whimsical motion of 1930s Rubber Hose animation. It rejects the "safe" corporate aesthetic in favor of a high-impact, editorial experience that feels both architecturally grounded and cinematically alive.

By utilizing "Bento Grid" layouts, we create a sense of organized chaos. The design breaks the standard template look through intentional asymmetry—overlapping rubber-hose character limbs across rigid container boundaries and utilizing massive high-contrast typography scales that demand attention. This is not just a UI; it is a living document.

---

## 2. Colors

The color strategy is divided into three distinct tonal modes, each serving a specific energy level while maintaining the "Kinetic Curator" spirit.

### The "No-Line" Rule
Traditional 1px grey borders are strictly prohibited for sectioning. Structural definition must be achieved through:
1.  **Background Shifts:** Transitioning from `surface` (#f6f6f6) to `surface-container-low` (#f0f1f1).
2.  **Bento Boxing:** Using thick, 2D black strokes (`on_primary_fixed`) only for high-energy themes, or purely tonal shifts for pastel themes.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack. Each inner element should use a tier shift to indicate depth:
*   **Base:** `surface`
*   **Section:** `surface-container-low`
*   **Interactive Cards:** `surface-container-highest` or `surface-container-lowest` for maximum contrast.

### Signature Palettes
*   **Theme 1 (The Classic):** `primary` (#af2700), `surface_container_lowest` (#ffffff), and `on_surface` (#2d2f2f). Use `primary_container` (#ff7856) for subtle 2D shading on buttons.
*   **Theme 2 (The Electric Clay):** `secondary` (#004be2) backgrounds with `tertiary_fixed` (#cafd00) accents. Incorporate clay-morphism by using internal inner-shadows on containers to mimic molded plastic.
*   **Theme 3 (The Soft Bento):** `secondary_container` (#c5d0ff), `tertiary_container` (#cafd00), and custom pastel mint/yellow shifts using the `surface_variant` tokens.

### The "Glass & Gradient" Rule
To add professional soul, use linear gradients transitioning from `primary` to `primary_dim` on hero CTAs. For floating navigation docks, use a backdrop-blur (20px-30px) over a semi-transparent `surface_bright` to ensure the layout feels integrated, not "pasted on."

---

## 3. Typography

Typography is the "voice" of this system. It must be loud, intentional, and editorial.

*   **Display & Headline (Space Grotesk):** Used for "shouting" messages. These should be oversized, often with tight letter-spacing (-0.02em). In the Rubber Hose context, utilize "Elegant Italics" for sub-headers to create a rhythmic, melodic contrast against the heavy sans-serif.
*   **Body & Labels (Manrope):** A high-legibility geometric sans-serif that balances the intensity of the headlines. 
*   **Hierarchy as Brand:** Use `display-lg` (3.5rem) for hero titles. If a title is important, let it bleed outside its bento box. This creates the "signature" custom look of a high-end magazine.

---

## 4. Elevation & Depth

We move away from Material-style "structural shadows" in favor of **Tonal Layering** and **Graphic Depth.**

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. The slight shift in luminosity creates a sophisticated "lift" without visual clutter.
*   **Ambient Shadows:** For floating elements (like the pill-shaped bottom dock), use extra-diffused shadows.
    *   *Spec:* `drop-shadow(0 20px 40px rgba(45, 47, 47, 0.08))`
    *   The shadow must be tinted with the `on-surface` color to feel natural.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline_variant` at 15% opacity. Never use 100% opaque grey lines.
*   **Neo-Brutalism Depth:** In Theme 1, depth is achieved through "Hard Shadows"—a solid black offset (e.g., 4px 4px) with no blur, reinforcing the 2D animation aesthetic.

---

## 5. Components

### Buttons
*   **Primary:** Pill-shaped (`rounded-full`), `primary` background, `on_primary` text. In Theme 1, add a 2px black border.
*   **Secondary:** `surface-container-high` with a subtle inner-glow to mimic "Clay-morphism."
*   **States:** On hover, shift the background to `primary_dim` and apply a slight scale-up (1.05x) to mimic the "squash and stretch" of animation.

### The Pill Dock (Bottom Navigation)
A floating, pill-shaped container using `surface_bright` with 80% opacity and a heavy backdrop blur. Icons should be "Rubber Hose" style—thick strokes and rounded ends.

### Bento Cards
Cards must use `rounded-xl` (1.5rem) or `rounded-lg` (1.0rem). 
*   **Forbid Dividers:** Use vertical white space (`spacing-6`) or a `surface_variant` background change to separate content within a card.
*   **Nesting:** Small "data chips" inside a card should use `surface-container-lowest` to pop against the card's `surface-container-low`.

### Input Fields
Minimalist frames with `headline-sm` labels. Use a thick 2px `on_surface` underline instead of a four-sided box to keep the "Neo-Brutal" editorial feel.

---

## 6. Do's and Don'ts

### Do:
*   **Do** overlap illustrations (arms, legs, characters) across bento grid borders to break the "grid" feel.
*   **Do** use extreme typographic contrast (e.g., `display-lg` next to `label-sm`).
*   **Do** use `rounded-full` for all action-oriented components (pills, docks, chips).

### Don't:
*   **Don't** use 1px solid grey dividers. Ever. Use space or color shifts.
*   **Don't** use standard "drop shadows" on every card. Reserve shadows only for the most elevated floating elements.
*   **Don't** align everything perfectly. Small, intentional offsets in text or image placement contribute to the "Rubber Hose" energy.
*   **Don't** use high-opacity borders in Theme 3; keep the Pastel Bento mode soft and tonal.