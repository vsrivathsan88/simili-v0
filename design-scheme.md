## Simili Visual Design Scheme (Accessibility-First)

Version: 1.0  
Audience: Elementary students and teachers  
Aligned to: `requirements.md` (hand‑drawn aesthetic via rough.js, warm tone, Gemini Live tutoring, reasoning map, manipulatives, session replay)

---

### 1. Design Principles
- **Warm, calm, and low‑anxiety**: prioritize soft neutrals and breathable spacing; avoid alarming red except for critical system errors.
- **Accessible by default**: meet or exceed WCAG 2.2 AA for text (≥4.5:1) and interactive elements; honor OS Reduced Motion and High Contrast.
- **Kid-appropriate clarity**: large tap targets, plain language, icon + label, minimal simultaneous stimuli.
- **Hand‑drawn without chaos**: rough.js gives texture, but geometry and color remain restrained; use texture/hatching to encode meaning beyond color.
- **Socratic encouragement**: visuals celebrate exploration and mistakes (per `requirements.md`) with soft animations and affirming language.

---

### 2. Foundations (Tokens)
These tokens guide Tailwind theme, rough.js, and component styles. All colors listed meet AA with the specified pairings.

#### 2.1 Color Tokens
- Neutrals
  - `paper` #FFFDF6 (background)
  - `ink` #1F2937 (primary text) — AA on paper
  - `line` #CBD5E1 (borders, dividers)
- Brand / Action
  - `primary` #4F46E5 (indigo) — AA on paper and on `#FFFFFF` as text
  - `secondary` #6366F1 (supporting)
  - `accent` #93C5FD (subtle highlight)
- Feedback (non‑threatening hues)
  - `success` #16A34A  
  - `warning` #F59E0B  
  - `info` #2563EB
  - `error` #DC2626 (use sparingly; pair with icon/text)
- Pastel fills (backgrounds; never as sole contrast)
  - `fill/correct` #E8F5E9  
  - `fill/partial` #FFF8E1  
  - `fill/incorrect` #FFEDD5  
  - `fill/exploring` #F3E8FF

Color‑blind safety: icons + labels + patterns accompany color. Provide patterns for fills: `correct=diagonal-45`, `partial=dots`, `incorrect=crosshatch`, `exploring=diagonal-135`.

Contrast targets:
- Body text vs background ≥ 7:1 when feasible, minimum AA 4.5:1
- Icons only if ≥ 3:1 and paired with text; otherwise use filled shapes
- Disabled states must remain legible (≥ 3:1) and include additional affordances (dashed border)

#### 2.2 Typography
- Family: Inter (system‑friendly, highly legible). Keep handwritten accents for illustrations only.
- Sizes (rem): `xs 0.75`, `sm 0.875`, `base 1`, `lg 1.125`, `xl 1.25`, `2xl 1.5`, `3xl 1.875`
- Line-height: 1.5–1.7 body; 1.2 headings
- Case: Sentence case for all UI; no ALL CAPS

#### 2.3 Spacing & Layout
- 8‑pt grid: `4, 8, 12, 16, 24, 32, 40, 48, 64`
- Minimum hit area: 44×44 px (Apple HIG) or 48×48 dp (Material)
- Container max width: notebook 980–1120 px; side panels ≥ 280 px
- Focus ring: 3 px outside outline, `#4338CA` (indigo 700), offset 2 px; alternate high‑contrast ring `#000`

#### 2.4 Motion
- Default durations: `micro 120ms`, `short 200ms`, `medium 300ms`
- Easing: `easeOut` for entrances, `easeInOut` for state change
- Reduced motion: honor `prefers-reduced-motion` → disable parallax, large bounces; swap for opacity/scale ≤ 1.03

#### 2.5 rough.js Defaults
- `roughness: 1.2`, `bowing: 0.6`, `strokeWidth: 2`
- `fillStyle: 'hachure'`, `hachureAngle: -41`, `hachureGap: 8`
- Use texture only as an accent; avoid over‑sketching large areas

---

### 3. Component Accessibility Patterns

#### 3.1 Buttons
- 44×44 minimum, visible focus, icon + label
- States: default, hover, active, disabled; color + outline + cursor changes

```tsx
<button
  type="button"
  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-primary text-white hover:bg-indigo-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
  aria-disabled={isDisabled}
>
  <svg aria-hidden width="16" height="16" ... />
  <span>Start session</span>
</button>
```

#### 3.2 Toolbar (Dock)
- `role="toolbar"`, group buttons with `aria-label`
- Toggle buttons use `aria-pressed`

```tsx
<div role="toolbar" aria-label="Drawing tools" className="flex gap-2">
  <button aria-pressed={isPen} aria-label="Pen" ...>Pen</button>
  <button aria-pressed={isEraser} aria-label="Eraser" ...>Eraser</button>
</div>
```

#### 3.3 Panels
- Landmark roles: left photo `region` (aria-label "Photo"), center notebook `main`, right rail `complementary` (aria-label "Reasoning and feedback")
- Headings follow h1 > h2 > h3 order

#### 3.4 Dialogs / Popovers
- Focus trap, `aria-modal="true"`, labelled by heading id

#### 3.5 Notifications
- Use `role="status"` for non‑urgent, `role="alert"` for urgent; never rely on color alone

---

### 4. Canvas & Reasoning Map Accessibility
Per `requirements.md`, the canvas, manipulatives, and reasoning map are core. Provide multi‑modal access and narration.

- Structure
  - Visual canvas (SVG) + offscreen narrations
  - Live region `role="status" aria-live="polite"` describing important changes (e.g., “Reasoning step added: ‘I partitioned the pizza into 8 equal parts.’”).
  - Keyboard navigation layer: arrow keys move selection; `Enter` toggles edit; `Esc` clears; `Tab` cycles focus to manipulatives list
- Focus & Selection
  - Each manipulative is a focusable element with `role="img"`, `aria-label` (e.g., “Fraction bar: 3 of 8 filled”) and `aria-describedby` pointing to instructions
- Drag & Drop
  - Mouse: drag; Keyboard: `Space` to pick up, arrows to move, `Space` to drop; announce via live region
- Non‑color Encodings
  - Step classification adds an icon + pattern: correct=check+diagonal-45, partial=dot, incorrect=crosshatch, exploring=diamond hatch
- Replay
  - Provide transcript with timecodes; allow keyboard scrubbing; captions for audio; highlight corresponding map node with focus ring

---

### 5. Gemini Live Integration (Voice + Tools)
- Voice UI
  - Provide **visual captions** for AI speech; users can replay and slow.
  - Microphone toggle is a button with `aria-pressed` and level meter with `aria-valuenow`.
- Tool Calls → UI
  - `mark_reasoning_step`: announce in live region and visibly add node with focus; color/pattern per classification
  - `flag_misconception`: phrase as encouragement; avoid alarming red
  - `suggest_hint`: if visual, ensure hint is keyboard‑focusable and dismissible with `Esc`
  - `celebrate_exploration`: subtle confetti with reduced‑motion alternative (static sparkle)

---

### 6. Tailwind & Theming Mapping
Add these to `tailwind.config.ts`:

```ts
extend: {
  colors: {
    paper: '#FFFDF6',
    ink: '#1F2937',
    primary: '#4F46E5',
    secondary: '#6366F1',
    accent: '#93C5FD',
    line: '#CBD5E1',
  }
}
```

Utility classes to standardize:
- Text: `text-ink`, `text-ink/70`, `text-white` on brand buttons
- Border: `border-line` for subtle dividers
- Focus ring: `focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300`

---

### 7. Component Guidelines (Key Screens)

- Header
  - Brand at left, session controls at right; high contrast; sticky; `role="banner"`
- Main Layout
  - Grid: `photo (3) • notebook (7) • rail (2)` on desktop; stacked on mobile
  - Bottom dock with high contrast labels; `role="contentinfo"` if global actions, `role="toolbar"` if per-canvas
- Photo Panel
  - Upload button labelled; accept camera input on mobile; provide `alt` for preview filename
- Notebook
  - Clear title; single primary action; quiet background; no heavy textures
- Right Rail
  - Reasoning log is an ordered list; each entry is an interactive card with `aria-expanded` for details

---

### 8. Content Guidelines (Kids)
- Language: short sentences, concrete verbs; reading level ≈ Grade 3–4
- Labels over icons alone; keep emoji optional, never essential
- Praise frames: “Interesting idea!” “Let’s try another way.” Avoid “wrong/incorrect” in UI copy.

---

### 9. Testing & QA Checklist
- Automated
  - Lighthouse Accessibility ≥ 95, Best Practices ≥ 90
  - `axe-core` integration in dev; no critical violations
- Manual
  - Full keyboard navigation without a mouse
  - Screen readers (VoiceOver, NVDA) announce: buttons, tool states, canvas manipulative labels, reasoning steps
  - Color‑blindness checks (protanopia/deuteranopia/tritanopia) — patterns still convey meaning
  - Reduced Motion: no large motion; confetti replaced with static celebration
  - Hit area verification: all interactive ≥ 44×44
  - Contrast spot checks for text on all backgrounds

---

### 10. Implementation Notes
- Keep rough.js to 1–2 passes, avoid noisy double strokes for large surfaces
- Prefer SVG over canvas where semantics are helpful (titles, roles)
- Maintain a single focus outline style across the app
- Persist user preferences: color theme, reduced motion, text size

---

### 11. Roadmap Alignment (from requirements.md)
- v0 (current): Canvas + manipulatives with accessible toolbar and fraction bar semantics
- v1: Reasoning map with patterned nodes; branching visualization with keyboard/reader support
- v2: Teacher dashboard with aggregated patterns, printable high‑contrast maps

This scheme keeps Simili warm and playful while meeting rigorous accessibility standards for young learners and teachers.
