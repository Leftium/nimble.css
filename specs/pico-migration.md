# Migrating from PicoCSS to nimble.css

> A guide for migrating projects from PicoCSS v2 to nimble.css, plus a tracker for nimble.css issues discovered during migration.

**Status:** Living document
**Last updated:** 2026-03-28

---

## Table of Contents

1. [Quick Migration Steps](#1-quick-migration-steps)
2. [Feature Comparison Matrix](#2-feature-comparison-matrix)
3. [Key Differences](#3-key-differences)
4. [Framework-Specific Notes](#4-framework-specific-notes)
5. [Known Issues / Gaps in nimble.css](#5-known-issues--gaps-in-nimblecss)
6. [Migration Log](#6-migration-log)

---

## 1. Quick Migration Steps

For most projects, migration is mechanical. Both libraries are classless-first, so semantic HTML transfers directly.

### 1.1 Swap the dependency

```bash
# npm
npm uninstall @picocss/pico && npm install @leftium/nimble.css

# pnpm
pnpm remove @picocss/pico && pnpm add @leftium/nimble.css
```

### 1.2 Swap the import

```diff
- import '@picocss/pico';
+ import '@leftium/nimble.css';
```

Or in CSS:

```diff
- @import '@picocss/pico';
+ @import '@leftium/nimble.css';
```

For SCSS projects, use the `scss` export path (not the `src/` directory directly):

```diff
- @use '@picocss/pico/scss/pico';
+ @use '@leftium/nimble.css/scss';
```

### 1.3 Fix navigation

Pico styles `<nav>` with horizontal flexbox layout automatically. nimble.css intentionally omits nav styling (see [Non-Goals in the nimble spec](nimble-css.md#2-non-goals)). Add your own:

```css
nav ul {
  display: flex;
  list-style: none;
  gap: 1rem;
  justify-content: center;
  padding: 0;
}
```

### 1.4 Remove Pico-specific container width overrides

Pico's `.container` defaults to ~1200px (varies by breakpoint). nimble's centered body grid defaults to `60ch` (`--nc-content-width`), which aligns with OpenProps `--size-content-3` (~480–600px depending on font). If you need a wider layout, set:

```css
:root { --nc-content-width: 80ch; }
```

### 1.5 Check for Pico-specific classes

Replace or remove any Pico-specific classes. See the [Feature Comparison Matrix](#2-feature-comparison-matrix) for mappings.

### 1.6 Verify visually

Run the dev server and check each page. The main areas to inspect:
- Navigation layout (see step 1.3)
- Article/card appearance
- Form elements and buttons
- Dark mode (if used)

### 1.7 Restore responsive font-size scaling (if used)

Pico's `$breakpoints` SCSS config applied responsive `root-font-size` at each breakpoint (e.g., 106.25% at 576px, 112.5% at 768px). This made `1rem` = 17–19px, scaling all rem-based dimensions. nimble has no breakpoint system and does not adjust font-size.

If your project relied on Pico's responsive font scaling (or customized it via `$breakpoints`), add equivalent CSS:

```css
@media (min-width: 576px)  { html { font-size: 106.25%; } }
@media (min-width: 768px)  { html { font-size: 112.5%; } }
@media (min-width: 1024px) { html { font-size: 118.75%; } }
```

This is the **single largest source of layout dimension mismatches** — without it, all spacing, logo sizes, and content widths will be ~10–20% smaller.

### 1.8 Full-bleed header backgrounds

Pico's `<header>` is a normal block element spanning the viewport. nimble's body grid constrains all children to the content column. If your header has a background color that should span full width:

```css
header { grid-column: 1 / -1; }
```

### 1.9 Override surface colors (if needed)

nimble's surface scale has larger lightness steps than Pico's. If exact Pico background shades are important, override surface variables with Pico's values:

```css
:root {
  --nc-surface-1: light-dark(#fff, #13161e);
  --nc-surface-2: light-dark(#fbfbfc, #1a1e28);
  --nc-surface-3: light-dark(#e7eaef, #202632);
}
```

---

## 2. Feature Comparison Matrix

### 2.1 Classes

| Pico CSS class/pattern | nimble.css equivalent | Notes |
|---|---|---|
| `.container` | `.container` | Different implementation: Pico uses `max-width` + breakpoint steps; nimble uses CSS Grid centering on `body` (no `.container` needed for basic centering). nimble's `.container` is for re-centering inside `.fluid` layouts. |
| `.grid` | _(none)_ | Use native CSS Grid or Flexbox directly. |
| `.overflow-auto` | `.overflow-auto` | Same purpose. |
| `.secondary` | `.secondary` | Same purpose (secondary button color). |
| `.outline` | `.outline` | Same purpose (outline button style). |
| `.contrast` | _(none)_ | No contrast variant in nimble. Use `.secondary` or custom CSS. |
| `data-tooltip` | _(none)_ | No built-in tooltip. Use tippy.js or CSS-only tooltips. See §6.7. |
| `[role="group"]` (button groups) | `[role="group"]` | Same pattern, same styling. |
| `[role="search"]` (pill search) | `[role="search"]` | Same pattern. nimble applies pill-shaped ends to search groups. |
| `data-theme="dark"` / `data-theme="light"` | `data-theme="dark"` / `data-theme="light"` | Same attribute, same behavior. nimble uses `color-scheme` under the hood. |
| `.close` | _(none)_ | No built-in close button class. |

### 2.2 Semantic / Classless Elements

These work identically in both libraries (write semantic HTML, get styled output):

| Element | Pico | nimble | Differences |
|---|---|---|---|
| `<h1>`–`<h6>` | Styled | Styled | Different scale. nimble: `2rem`–`1rem`. Pico: larger scale with 6 breakpoint adjustments. nimble applies `text-wrap: balance`. |
| `<p>`, `<ul>`, `<ol>`, `<dl>` | Styled | Styled | Equivalent. |
| `<a>` | Styled | Styled | Both use primary color. nimble adds semi-transparent underline via `color-mix()` and visited purple blend. |
| `<button>` | Styled | Styled | nimble buttons are more compact (`0.5em/1em` vs Pico's larger padding). |
| `<input>`, `<select>`, `<textarea>` | Styled | Styled | Both full-width with focus rings. nimble uses `surface-3` derived bg, Pico uses explicit background. |
| `<label>` | Styled | Styled | Both block-level. nimble adds `font-weight: 600` when preceding an input. |
| `<form>` | Styled | Styled | Equivalent. |
| `<fieldset>`, `<legend>` | Styled | Styled | Equivalent. |
| `<input type="submit">` | Styled as primary button | Styled as primary button | Equivalent. |
| `<input type="reset">` | Styled | Styled as secondary | nimble auto-applies secondary style to reset buttons. |
| `<table>` | Styled | Styled | Equivalent (full-width, collapse, header styling). nimble adds `text-wrap: balance` on thead. |
| `<article>` | Card with bg, shadow | Card with border, radius | Different visual treatment: Pico uses background + box-shadow; nimble uses border + subtle bg. Both support `<header>`/`<footer>` inside article. |
| `<article> <header>` | Distinct bg | Bleed header with subtle bg tint | nimble uses negative margins to bleed to card edges. |
| `<details>` / `<summary>` | Styled | Styled (with animation) | nimble adds open/close animation via `::details-content`. |
| `<dialog>` | Styled | Styled | Both style backdrop. nimble adds blur + fade animation. |
| `<blockquote>` | Styled | Styled | Both use left border. nimble adds italic. |
| `<code>`, `<kbd>`, `<pre>` | Styled | Styled | Equivalent. |
| `<hr>` | Styled | Styled | Equivalent. |
| `<mark>` | Styled | Styled | Both use amber/yellow highlight. |
| `<small>` | Styled | Styled | Equivalent. |
| `<footer>` | Styled | Minimal | Pico styles footer with muted text. nimble applies no special footer styling. |
| `<img>`, `<video>`, `<svg>` | Responsive | Responsive | Equivalent (`max-width: 100%`). |
| `<progress>` | Styled | Add-on (`@import '@leftium/nimble.css/progress'`) | Not included in core; opt-in sub-bundle. |
| `<meter>` | Styled | Add-on (`@import '@leftium/nimble.css/meter'`) | Not included in core; opt-in sub-bundle. |
| `<select>` (custom) | Native | Add-on (`@import '@leftium/nimble.css/select'`) | nimble's custom select uses `appearance: base-select`; opt-in sub-bundle. |
| `<nav>` | **Styled (horizontal flexbox)** | **Not styled** | **Key difference.** nimble intentionally omits nav styling. Must add your own. See [Section 3.1](#31-navigation). |

### 2.3 ARIA / Attribute Patterns

| Pattern | Pico | nimble | Notes |
|---|---|---|---|
| `aria-invalid="true"/"false"` | Validation colors | Validation colors | Equivalent. |
| `aria-busy="true"` | Loading spinner | Not supported | See [Known Issues #1](#5-known-issues--gaps-in-nimblecss). |
| `[type="checkbox"][role="switch"]` | Switch toggle | Switch toggle | Equivalent (feature-flagged in nimble via `$enable-switch`). |
| `[role="button"]` on `<a>` | Styled as button | Styled as button | Equivalent. |

### 2.4 Layout

| Feature | Pico | nimble | Notes |
|---|---|---|---|
| Centered content | `.container` class (max-width + breakpoints) | Body CSS Grid (automatic) | nimble centers by default; no class needed. |
| Content width | ~1200px (varies by breakpoint) | `60ch` (`--nc-content-width`, aligns with OpenProps `--size-content-3`) | Overridable via CSS custom property. |
| Full-width layout | No built-in fluid mode | `.fluid` class on body | |
| Full-bleed breakout | Not supported | `.full-bleed` class | |
| Wide breakout | Not supported | `.wide` class | |

### 2.5 Theming / Customization

| Feature | Pico | nimble |
|---|---|---|
| CSS custom properties | 100+ on `:root` | ~20 on `:root` |
| Dark mode (auto) | `prefers-color-scheme` | `prefers-color-scheme` via `light-dark()` |
| Dark mode (manual) | `data-theme` attr | `data-theme` attr |
| Color space | HSL | OKLCH |
| SCSS customization | Yes | Yes (`@use ... with (...)`) |
| Cascade layers | No | Yes (`@layer`) |
| Surface color system | No | Yes (4 levels) |

---

## 3. Key Differences

### 3.1 Navigation

**Pico** automatically styles `<nav>` with horizontal flexbox layout, removing list bullets and spacing items. **nimble.css** does not style `<nav>` at all — this is a deliberate non-goal because nav patterns vary too much between projects.

**Migration fix:** Add a scoped style block or global CSS for your nav pattern:

```css
nav ul {
  display: flex;
  list-style: none;
  gap: 1rem;
  padding: 0;
}
```

### 3.2 Layout Model

**Pico** uses `max-width` on `.container` with 5 breakpoint steps (576–1536px). Padding is achieved via the width difference, which means content can touch viewport edges at exact breakpoints ([PicoCSS issue #669](https://github.com/picocss/pico/issues/669)).

**nimble.css** uses a 3-column CSS Grid on `<body>`:

```css
body {
  display: grid;
  grid-template-columns: 1fr min(var(--nc-content-width), calc(100% - 2 * var(--nc-spacing))) 1fr;
}
body > * { grid-column: 2; }
```

Content is always centered with real padding. No breakpoints needed. This means:
- You don't need `class="container"` on a wrapper element for basic centering.
- The `.container` class exists but serves a different purpose (re-centering inside `.fluid` layouts).
- Full-bleed content is possible with `grid-column: 1 / -1`.

**Migration note:** If your Pico project wraps everything in `<main class="container">`, you can keep it (nimble's `.container` applies `max-width` + `margin-inline: auto`), but you may not need it. The body grid already centers direct children at `--nc-content-width` (720px).

### 3.3 Container Width

| | Pico | nimble |
|---|---|---|
| Default | ~1200px (breakpoint-dependent) | `60ch` (≈ OpenProps `--size-content-3`) |
| Override | CSS: set `max-width` on `.container` | CSS: `--nc-content-width: 80ch` on `:root` |

### 3.4 Button Sizing

Pico buttons have generous padding (~1em vertical), which is [frequently criticized](https://github.com/picocss/pico/issues/482). nimble.css uses more compact `0.5em 1em` padding. No migration action needed, but layouts that depended on large button size may look different.

### 3.5 Article/Card Visual Style

Both style `<article>` as a card. Differences:
- **Pico:** Background color + box-shadow, rounded corners.
- **nimble:** Border + border-radius, subtle background. Header/footer use negative margins to bleed to card edges with a tinted background.

The HTML structure is the same (`<article>` with optional `<header>`/`<footer>`), so no markup changes needed.

### 3.6 Dark Mode

Both support automatic (`prefers-color-scheme`) and manual (`data-theme` attribute) dark mode.

- **Pico** uses duplicate `@media` and `[data-theme]` blocks.
- **nimble** uses the `light-dark()` CSS function — single declarations, no duplication.

No migration action needed; the same `data-theme` attribute works in both.

### 3.7 Cascade Layers

nimble.css wraps all styles in `@layer nimble.reset, nimble.base, nimble.utilities`. This means **any unlayered CSS you write automatically wins** over nimble's styles, regardless of specificity. This is a significant improvement over Pico, where specificity battles are common.

**Practical impact:** If you had `!important` hacks or overly specific selectors to override Pico, you can simplify them. Plain selectors will work.

### 3.8 Nested Constrained Elements

nimble's body-grid centers direct children of `<body>`. If a page component renders its own `<main>` or wrapper with a custom `max-width`, it will be left-aligned inside the outer centered element — the body-grid does not cascade inward.

**Fix:** Add `margin-inline: auto` to any inner element with a constrained width:

```css
main {
  max-width: 40ch;
  margin-inline: auto;
}
```

### 3.9 Full-Bleed Elements Inside a Padded Wrapper

If your outer wrapper has `padding-inline` (for content breathing room) but you need a child element (e.g., a hero image or nav banner) to span the full width, use negative `margin-inline` to escape the padding:

```css
.wrapper {
  padding-inline: var(--nc-spacing);
}

.hero-nav {
  margin-inline: calc(var(--nc-spacing) * -1);
}
```

### 3.10 CSS Custom Properties

Pico defines 100+ `--pico-*` properties on `:root`. nimble defines ~20 `--nc-*` properties. If your project overrides `--pico-*` variables, map them to `--nc-*` equivalents:

| Pico variable | nimble equivalent |
|---|---|
| `--pico-primary` | `--nc-primary` |
| `--pico-primary-hover` | `--nc-primary-hover` (auto-derived; usually no need to set) |
| `--pico-secondary` | `--nc-secondary` |
| `--pico-border-radius` | `--nc-radius` |
| `--pico-spacing` | `--nc-spacing` |
| `--pico-font-family` | `--nc-font-sans` |
| `--pico-font-family-monospace` | `--nc-font-mono` |
| `--pico-background-color` | `--nc-surface-1` |
| `--pico-font-size` | `font-size` on `html` directly |
| `--pico-color` | `--nc-text` |
| `--pico-muted-border-color` | `--nc-surface-3` (when used as background); `--nc-border` (when used as border) |
| `--pico-card-sectioning-background-color` | `--nc-surface-2` |
| `--pico-block-spacing-horizontal` | `--nc-spacing` |
| `--pico-block-spacing-vertical` | `--nc-spacing` |
| `--pico-primary-inverse` | `--nc-primary-contrast` or `--nc-surface-1` (no exact equivalent) |
| `--pico-form-element-spacing-horizontal` | `0.75em` (hardcode — no nimble equivalent) |
| `--pico-icon-search` | Hardcode SVG data URI (no nimble equivalent) |

Many Pico variables have no nimble equivalent because nimble derives them automatically (hover/focus states via relative color syntax) or uses `color-mix()` inline.

**Important:** nimble's surface color scale has larger lightness steps than Pico's. If your project depends on exact Pico background shades, override `--nc-surface-1/2/3` in `:root` with Pico's hex values using `light-dark()`. See [§6.6 leftium.com](#66-leftiumcom-2026-03-27) for an example.

Pico projects often override `--pico-font-size` at multiple breakpoints. If all overrides are the same value, collapse them to a single `html { font-size: ... }` rule:

```diff
- :root { --pico-font-size: 150%; }
- @media (min-width: 576px)  { :root { --pico-font-size: 150%; } }
- @media (min-width: 768px)  { :root { --pico-font-size: 150%; } }
- /* ... */
+ html { font-size: 150%; }
```

---

## 4. Framework-Specific Notes

### 4.1 SvelteKit

**Issue: Content stuck in first grid column.**

SvelteKit's `app.html` template inserts a wrapper between `<body>` and your content:

```html
<body>
  <div style="display: contents">%sveltekit.body%</div>
</body>
```

nimble.css targets `body > *` for `grid-column: 2`. The `<div style="display: contents">` is the direct child of `<body>`, so it receives `grid-column: 2`. However, `display: contents` removes the div from the box tree for *layout* but **not for CSS selector matching**. So:

1. The `<div>` matches `body > *` and gets `grid-column: 2`, but generates no box (display: contents).
2. Your `<main>` participates in the body grid (because its parent is invisible to layout), but does **not** match `body > *` (it's a child of the div, not of body).
3. Your `<main>` defaults to `grid-column: auto` → placed in column 1.

**Status:** Fixed in nimble.css. The rule `body > [style*='display: contents'] > *` is now included in `_document.scss`, so no per-project workaround is needed.

**Legacy workaround** (for nimble.css versions before the fix, in your layout component):

```css
:global(body > [style*='display: contents'] > *) {
  grid-column: 2;
  min-width: 0;
}
```

### 4.2 Astro

Astro does not insert a `display: contents` wrapper by default. The body grid should work without workarounds. If using a layout component that adds a wrapper element, the same fix in nimble.css handles it automatically.

### 4.3 Next.js / Nuxt / Other Frameworks

Any framework that injects a `<div style="display: contents">` between `<body>` and your content is handled automatically by nimble.css's `body > [style*='display: contents'] > *` rule.

---

## 5. Known Issues / Gaps in nimble.css

Issues discovered during Pico → nimble migration that should be fixed in nimble.css.

### Issue 1: No `aria-busy` loading spinner

**Severity:** Enhancement
**Status:** Open

Pico CSS styles `[aria-busy="true"]` elements with a loading spinner animation (rotating border). nimble.css does not support this.

**Workaround:** Add your own spinner CSS:

```css
[aria-busy="true"] {
  /* your spinner styles */
}
```

### Issue 2: SvelteKit `display: contents` grid-column

**Severity:** Breaking (content mispositioned)
**Status:** Fixed — added `body > [style*='display: contents'] > *` rule to `_document.scss`

nimble's `body > *` selector for grid-column placement fails when a framework inserts `<div style="display: contents">` between `<body>` and content. See [Section 4.1](#41-sveltekit) for full explanation.

**Fix applied to nimble.css** (`src/_document.scss`):

```css
body > [style*='display: contents'] > * {
  grid-column: 2;
  min-width: 0;
}
```

This targets the common pattern used by SvelteKit (and potentially other frameworks). The `[style*='display: contents']` attribute selector is specific enough to avoid false positives — it only matches elements with an inline `display: contents` style, which is the exact pattern these frameworks use.

**Open question:** Should nimble.css also handle non-inline `display: contents` (e.g., set via a class)? The attribute selector only catches inline styles.

### Issue 3: No nav styling

**Severity:** Cosmetic / Expected
**Status:** By design (non-goal)

This is intentional — nimble.css does not style `<nav>` because navigation patterns are too project-specific. However, this is the **most common migration friction point** from Pico. Consider documenting a recommended minimal nav pattern in nimble's README or providing a copy-paste snippet.

### Issue 4: No `<footer>` muted text

**Severity:** Cosmetic
**Status:** Open

Pico automatically styles `<footer>` with muted/smaller text. nimble.css applies no special footer styling. This may cause footers to appear more prominent than expected after migration.

**Workaround:**

```css
footer {
  color: color-mix(in oklch, var(--nc-text) 60%, transparent);
  font-size: 0.875rem;
}
```

---

## 6. Migration Log

Projects migrated from PicoCSS to nimble.css, with notes on issues encountered.

### 6.1 userfront-svelte (2026-03-27)

**Project:** SvelteKit 5 demo app for Userfront authentication
**Source:** `/Volumes/p/_archive/USERFRONT/userfront-svelte`
**Pico features used:** `.container`, `<nav>` horizontal layout, `<article>` card, forms, buttons, `<h1>`–`<h4>`, `<hr>`, `<footer>`, `<small>`, `<textarea>`
**Pico classes used:** `.container` (only explicit class)

**Files changed:**

| File | Change |
|---|---|
| `package.json` | `@picocss/pico` → `@leftium/nimble.css` |
| `src/routes/+layout.svelte` | Import swapped; removed `max-width: 600px` override (720px default OK); replaced Pico `nav { justify-content: center }` with explicit `nav ul` flexbox; added `display: contents` grid-column fix |
| `docs/index.md` | Updated all Pico references (name, link, install command, code blocks) |

**Issues encountered:**
1. **Nav layout broken** — Expected. Added 5-line flexbox rule. (Issue #3)
2. **Content in column 1** — SvelteKit `display: contents` wrapper. Added global selector workaround. (Issue #2)

**Issues NOT encountered:**
- Article/card styling transferred cleanly
- All form elements, buttons, inputs rendered correctly
- Dark mode worked automatically
- No Pico-specific classes to remove (project only used `.container`)

### 6.2 modu-blues.com (2026-03-27)

**Project:** SvelteKit 1 / Svelte 4 dance event site (Korean blues social)
**Source:** `/Volumes/p/DANCE-FORM-SHEETS/modu-blues.com`
**Pico version:** `2.0.0-alpha1`
**Pico features used:** `.container`, `<nav>` horizontal layout, forms, `--pico-font-size` breakpoint overrides, `--pico-background-color`

**Files changed:**

| File | Change |
|---|---|
| `package.json` | `@picocss/pico` → `@leftium/nimble.css` |
| `src/app.scss` | Swapped `@use '@picocss/pico/scss/pico'` → `@use '@leftium/nimble.css/scss'`; collapsed 6 breakpoint `--pico-font-size: 150%` overrides → `html { font-size: 150% }` |
| `src/routes/+layout.svelte` | Removed `class="container"` from `<main>`; replaced `--pico-background-color` → `--nc-surface-1`; removed invalid `:h1 { --pico-font-size }` rule; added nav flexbox + vertical centering; added `padding-inline` to `<main>` with negative `margin-inline` on nav for full-bleed hero |
| `src/routes/(no-nav)/pretty/+page.svelte` | Removed `class="container"` from `<main>` |
| `src/routes/(no-nav)/pretty/form/+page.svelte` | Removed `class="container"` from `<main>`; added `margin-inline: auto` to center narrow inner `<main>` |
| `src/routes/(no-nav)/pretty/sheet/+page.svelte` | Removed `class="container"` from `<main>` |

**Issues encountered:**
1. **SCSS import path wrong** — `@use '@leftium/nimble.css/src/nimble'` failed; correct path is `@use '@leftium/nimble.css/scss'`. (See §1.2)
2. **Nav layout broken** — Expected. Added flexbox + `align-items: center` on `nav` and `nav ul`. (Issue #3)
3. **Content left-aligned** — Inner `<main>` (page component) had `max-width: 40ch` but no `margin-inline: auto`. Added centering. (See §3.8)
4. **Nav hero not full-bleed** — Nav needed to escape `<main>`'s `padding-inline`. Fixed with negative `margin-inline`. (See §3.9)

**Issues NOT encountered:**
- Dark mode (`prefers-color-scheme` + `[data-theme='dark']`) worked automatically
- `role="button"` on `<summary>` styled correctly
- No SvelteKit `display: contents` issue (handled automatically by nimble 0.4.0)

### 6.3 photodrop (2026-03-27)

**Project:** SvelteKit 1 / Svelte 3 single-page app — QR codes + Dropbox photo sharing kiosk
**Source:** `/Volumes/p/_archive/photodrop`
**Pico version:** `github:picocss/pico#v2` (pre-release v2 branch)
**Pico features used:** `.container`, `role="button"` on `<a>` (primary buttons), `role="button" class="secondary"` on `<summary>`, `role="button" class="secondary outline"` on `<summary>`, `<details>` accordion, `<hr>`

**Files changed:**

| File | Change |
|---|---|
| `package.json` | `@picocss/pico` (GitHub) → `@leftium/nimble.css ^0.4.0` |
| `src/app.scss` | `@use '@picocss/pico/scss/pico'` → `@use '@leftium/nimble.css/scss'` |
| `src/routes/+page.svelte` | Removed `class="container"` from `<main>` (body grid + scoped `margin: auto` handles centering) |

**Issues encountered:** None.

**Issues NOT encountered:**
- `role="button"`, `.secondary`, `.outline` all transfer cleanly (same pattern, same styling)
- `<details>`/`<summary>` accordion styling preserved
- No nav elements — no nav migration needed
- No forms or inputs — zero form migration cost
- Scoped `main { max-width: 25em; margin: 4px auto }` already provided centering; no additional `margin-inline: auto` fix needed
- No SvelteKit `display: contents` issue (handled automatically by nimble 0.4.0)

### 6.4 youloop (2026-03-27)

**Project:** SvelteKit 2 / Svelte 5 YouTube A/B loop player with custom video controls
**Source:** `/Volumes/p/YOUTUBE/youloop`
**Pico version:** `2.0.6`
**Pico features used:** `.container`, `$theme-color: 'zinc'` SCSS customization, `--pico-primary` / `--pico-spacing` CSS variables, `@use '@picocss/pico/scss/colors' as *` SCSS palette import, `[role="group"]` button groups, range inputs (heavily customized multi-thumb slider), `.outline` button

**Files changed:**

| File | Change |
|---|---|
| `package.json` | `@picocss/pico ^2.0.6` → `@leftium/nimble.css ^0.5.0` |
| `src/app.scss` | `@use '@picocss/pico/scss/pico' with ($theme-color: 'zinc')` → `@use '@leftium/nimble.css/scss'` (zinc is nimble's default surface hue; no override needed) |
| `src/routes/+layout.svelte` | Moved `app.scss` import here (was in `+page.svelte`); removed `class="container"` from `<main>`; set `--nc-content-width: 1200px`; added `nav h1` sizing; hardcoded brand color to Pico's `$zinc-550`; added `class="secondary"` to About link |
| `src/routes/+page.svelte` | Removed `import '../app.scss'` (moved to layout); removed `class="container"`; added `class="secondary"` to `youtu.be` link |
| `src/lib/player/Player.svelte` | Replaced `@use '@picocss/pico/scss/colors' as *` with hardcoded hex values; `--pico-spacing` → `--nc-spacing`; added `appearance: none` + full track/thumb base styling for range inputs; reworked `[role="group"]` button overrides; added `.paste-button` neutral outline style |

**Issues encountered:**

1. **No SCSS color palette in nimble** — Pico exposes `@use '@picocss/pico/scss/colors' as *` giving access to `$zinc-450`, `$grey`, `$azure-250`, etc. nimble has no equivalent. **Fix:** hardcode hex values from Pico's `scss/colors/_index.scss`. Reference commit `v2.0.6` for exact values.

2. **Range inputs need full `appearance: none` + track/thumb styling** — Pico provides complete cross-browser range input styling (track height, thumb size, margin-top centering). nimble only sets `accent-color` and `width: 100%`, leaving the native appearance. For custom multi-thumb sliders, this means the component must supply the full `appearance: none`, `-webkit-slider-runnable-track`, `-webkit-slider-thumb`, and `-moz-range-*` rules that Pico provided implicitly. Key Pico dimensions: track `0.375rem` tall, thumb `1.25rem` diameter, thumb `margin-top: -(thumb/2) + (track/2)`.

3. **`[role="group"]` rounded corners with custom button backgrounds** — nimble's `[role="group"] > *` (real specificity, not `:where()`) sets `border-radius: 0` on all children, then `[role="group"] > :first-child` / `:last-child` restore rounding via logical border properties. When buttons have custom `background-color` overrides, the simplest approach is `border-radius: var(--nc-radius); overflow: hidden` on the group container itself, letting the container clip children to rounded corners. This avoids specificity battles entirely. nimble's built-in `::before` partial-height dividers between buttons work well with this approach.

4. **Primary color mismatch** — Pico's zinc theme primary is `$zinc-550: #646b79` (muted blue-grey). nimble's `--nc-primary` is a vivid purple-blue (oklch hue 250, chroma 0.2). The YouLoop brand text was using `var(--pico-primary)` and appeared dark grey; with nimble it appeared bright blue. **Fix:** hardcode the brand color to `#646b79` rather than using `--nc-primary`.

5. **Link color neutralization** — Pico's zinc theme had muted primary-colored links. nimble's links use the vivid `--nc-primary`. For neutral/secondary links, add `class="secondary"` which nimble supports on `<a>` elements (sets `color: var(--nc-secondary)`).

6. **Outline button color** — Pico's `.outline` button in the zinc theme appeared neutral (muted grey border/text). nimble's `.outline` uses `--nc-primary` (vivid blue). **Fix:** custom class (`.paste-button`) overriding `color` to `--nc-text` and `border-color` to `--nc-border`.

7. **Range thumb `:active` scale** — Pico applies `transform: scale(1.25)` on range thumb when dragged. nimble does not style range thumbs. Must be added manually if desired.

**Issues NOT encountered:**
- Nav: youloop's `<nav>` contains only an inline `<h1>` with links (no `<ul>`) — no flexbox migration needed
- No SvelteKit `display: contents` issue (handled automatically by nimble)
- Dark mode works automatically
- nimble's `[role="group"]` divider `::before` pseudo-elements provide a cleaner look than Pico's approach (partial-height translucent lines vs full-height margin gaps)

### 6.5 zbang (2026-03-27)

**Project:** SvelteKit 2 / Svelte 5 — whizBang search engine bang finder (fuzzy search UI)
**Source:** `/Volumes/p/BANGS/zbang/kit`
**Pico version:** `2.1.1`
**Pico features used:** `.container`, `$theme-color: 'zinc'` SCSS customization, `--pico-muted-border-color` / `--pico-code-background-color` / `--pico-muted-color` / `--pico-color` / `--pico-form-element-border-color` / `--pico-background-color` / `--pico-border-width` / `--pico-border-radius` CSS variables, `data-theme` dark/light toggle, `.outline` button, Open Props coexistence

**Files changed:**

| File | Change |
|---|---|
| `kit/package.json` | `@picocss/pico ^2.1.1` → `@leftium/nimble.css ^0.5.0` |
| `kit/src/app.scss` | `@use '@picocss/pico/scss/pico' with ($theme-color: 'zinc')` → `@use '@leftium/nimble.css/scss'`; `var(--pico-transition)` → `0.2s ease` |
| `kit/src/routes/+layout.svelte` | Removed `class="container"` from `<main>`; added `--nc-content-width: 960px` (narrower than Pico's ~1200px default but wider than nimble's 60ch) |
| `kit/src/routes/+page.svelte` | `--pico-muted-border-color` → `--nc-border` (3×); `--pico-code-background-color` → `--nc-surface-2`; `--pico-muted-color` → `--nc-secondary`; `--pico-color` → `--nc-text`; `--pico-form-element-border-color` → `--nc-border` |
| `kit/src/lib/components/AutogrowingTextarea.svelte` | `--pico-background-color` → `--nc-surface-1`; `--pico-border-width` → `1px`; `--pico-form-element-border-color` → `--nc-border`; `--pico-border-radius` → `--nc-radius` |
| `kit/vite.config.ts` | Removed `css.preprocessorOptions.scss.silenceDeprecations` (Pico's deprecated `@import` warnings no longer relevant) |

**Issues encountered:**

1. **Content width too narrow** — nimble's default `--nc-content-width: 60ch` (~480px) is much narrower than Pico's ~1200px breakpoint-based container. zbang's search results UI needs width. **Fix:** set `--nc-content-width: 960px` — a compromise narrower than Pico's default but wide enough for the search results grid.

2. **No `--pico-transition` equivalent** — Pico provides `--pico-transition` (a shorthand timing value). nimble has no equivalent. **Fix:** hardcode `0.2s ease` in `app.scss`.

**Issues NOT encountered:**
- Dark/light theme toggle (`data-theme` attribute) works identically — zero changes to theme logic or `app.html` inline script
- Open Props variables (`--size-*`, `--font-size-*`, `--font-weight-*`, `--gray-*`) are independent of both Pico and nimble — no conflicts
- `.outline` button class transfers cleanly (zbang's outline buttons are small UI controls, not brand-colored — no neutralization needed)
- Status-bar checkbox `all: revert` still works (nimble's `@layer` makes revert cleaner)
- No nav element — no nav migration needed
- No SvelteKit `display: contents` issue (handled automatically by nimble 0.5.0)
- No SCSS color palette imports — all colors were from Open Props or hardcoded
- Simplest migration so far — mechanical 1:1 variable mapping, no workarounds needed

### 6.6 leftium.com (2026-03-27)

**Project:** SvelteKit 2 / Svelte 5 — personal/consulting site with resume, portfolio, testimonials, contact pages
**Source:** `/Volumes/p/LEFTIUM/leftium.com`
**Pico version:** `2.1.1`
**Pico features used:** `.container`, `$theme-color: 'blue'` + custom `$breakpoints` SCSS config (responsive `root-font-size`), `<nav>` horizontal flexbox, `--pico-muted-border-color` / `--pico-block-spacing-horizontal` / `--pico-background-color` / `--pico-secondary` / `--pico-card-sectioning-background-color` / `--pico-blockquote-border-color` / `--pico-primary` / `--pico-primary-inverse` CSS variables, `.outline` + `role="button"` (via markdown-it-attrs), `[data-theme='dark']`, Open Props coexistence

**Files changed:**

| File | Change |
|---|---|
| `package.json` | `@picocss/pico ^2.1.1` → `@leftium/nimble.css ^0.5.0` |
| `src/app.scss` | `@use` swapped; added `:root` overrides for `--nc-surface-1/2/3` and `--nc-secondary` to match Pico blue theme colors; added `hr { margin }` fix; added responsive `html { font-size }` breakpoints to replace Pico's `$breakpoints` config; `--pico-card-sectioning-background-color` → `--nc-surface-2`; `--pico-blockquote-border-color` → `--nc-surface-3`; `--pico-secondary` → `--nc-secondary` (via `color-mix`) |
| `src/routes/(centered)/+layout.svelte` | Removed `.container` from `<nav>` and `<main>`; added `display: flex; align-items: center` on `nav`; added `ul { display: flex; align-items: center; list-style: none; gap: 1rem }` and `li { margin: 0 }`; added `justify-content: space-between` at 768px+; header: `grid-column: 1 / -1` for full-bleed bg; nav `margin-bottom: 0` (moved gap to `main { margin-top }`); main: added `padding-inline: var(--nc-spacing)`; logo wrapper: `:global([role='button']) { margin: 0 }` to fix glow alignment; all 5 `--pico-*` → `--nc-*` mappings |
| `src/routes/(centered)/resume/+page.svelte` | `--pico-muted-border-color` → `--nc-surface-3` (2×); `--pico-primary` → `--nc-primary` (2×); `--pico-primary-inverse` → `--nc-surface-1`; removed `.container` from `<main>`; switch: suppressed `[role="group"]` dividers and border-radius reset; switch sizing tweaked (180/140px); slider height `calc(100% - 8px)` |
| `vite.config.ts` | Removed `css.preprocessorOptions.scss.silenceDeprecations: ['if-function']` |

**Issues encountered:**

1. **Nav layout broken** — Expected (Issue #3). Pico auto-styles `<nav>` with `display: flex; justify-content: space-between` and strips list bullets/padding from `<nav> ul`. Required: `display: flex; align-items: center` on `nav`, `display: flex; align-items: center; list-style: none; gap: 1rem` on `nav ul`, `justify-content: space-between` at desktop breakpoint. Also `li { margin: 0 }` to counter nimble's `li { margin-bottom: 0.25em }` (Issue #7).

2. **Surface color mismatch** — nimble's surface scale has larger lightness steps than Pico's. Pico's `--pico-muted-border-color` (~oklch 0.93) falls between nimble's `--nc-surface-3` (0.925) and `--nc-surface-2` (0.955). Pico's `--pico-card-sectioning-background-color` (~oklch 0.985) is nearly invisible while nimble's `--nc-surface-2` (0.955) is noticeably tinted. **Fix:** override `--nc-surface-1/2/3` and `--nc-secondary` in `:root` with Pico's exact hex values using `light-dark()`.

3. **Responsive font-size lost** — Pico's `$breakpoints` SCSS config applied responsive `root-font-size` scaling (106.25% at 576px, 112.5% at 768px, 118.75% at 1024px). This made 1rem = 17–19px instead of 16px, scaling all rem-based dimensions (spacing, logo size, content width). nimble has no breakpoint system. **Fix:** add explicit `@media` rules in `app.scss` with `html { font-size }` at each breakpoint. This was the single largest source of layout dimension mismatches.

4. **Full-bleed header background** — Pico's `<header>` was a normal block element spanning the viewport. nimble's body grid constrains all children to the content column. **Fix:** `header { grid-column: 1 / -1 }` to break out of the grid. The nav inside still constrains to `max-width: var(--size-content-3)` with `margin: auto`.

5. **`[role="button"]` margin on logo** — nimble adds `margin: 0 0.25em 0.25em 0` to all `[role="button"]` elements (Issue #6). The LeftiumLogo component's interactive div uses `role="button"`, causing the blue square to shift 4.5px down-right relative to the glow overlay. **Fix:** `.logo-wrapper :global([role='button']) { margin: 0 }`.

6. **`[role="group"]` dividers on custom switch** — nimble's `[role="group"]` styling adds `::before` dividers between children and zeroes border-radius. The resume page's pill toggle uses `role="group"` but is a custom widget, not a button group. **Fix:** `:global(> * + *::before) { content: none !important }` and `:global(> *) { border-radius: inherit !important }`.

7. **No `--pico-primary-inverse`** — nimble has no primary-inverse variable. **Fix:** `var(--nc-surface-1)` — page background color provides correct contrast.

8. **`hsl(from ...)` incompatible with OKLCH** — nimble uses OKLCH for `--nc-secondary`. **Fix:** `color-mix(in srgb, var(--nc-secondary) 40%, transparent)`.

9. **Nav margin-bottom inside header bg** — Pico's nav `margin-bottom: 4.5px` appeared white (outside header bg). In nimble with `grid-column: 1 / -1`, the margin is inside the header's grey background. **Fix:** move the gap from `nav { margin-bottom }` to `main { margin-top: var(--size-1) }`.

10. **`<hr>` vertical margin** — nimble defaults to `margin: calc(var(--nc-spacing) * 2) 0` (2× spacing). Pico used 1× spacing. **Fix:** `hr { margin: var(--nc-spacing) 0 }`.

11. **`<main>` horizontal padding** — Pico's `.container` added `padding: 0 18px`. Without it, child elements (pill group) extend to full width. **Fix:** `main { padding-inline: var(--nc-spacing) }`.

**Issues NOT encountered:**
- `.outline` and `role="button"` (via markdown-it-attrs) transfer cleanly — no class changes needed
- `[data-theme='dark']` in `resume.scss` works identically — zero changes to theme logic
- Open Props variables (`--size-*`, `$font-size-*`, `$stone-*`) independent of both Pico and nimble — no conflicts
- No SvelteKit `display: contents` issue (handled automatically by nimble 0.5.0)
- Print styles in `app.scss` and `resume.scss` are framework-independent — zero changes needed

**New issues for nimble.css:**

### Issue 5: `li { margin-bottom: 0.25em }` not wrapped in `:where()`

**Severity:** Migration friction
**Status:** Open

nimble.css applies `li { margin-bottom: 0.25em }` (not `:where(li)`) in the base layer. This has real specificity `(0, 0, 1)`, making it harder to override in nav/flexbox contexts where list item margins are unwanted. Pico did not add margin to `<li>` elements. Projects with custom nav layouts (horizontal flex lists) need explicit `li { margin: 0 }` overrides.

**Recommendation:** Wrap in `:where()` or scope to prose contexts only (e.g., `:where(main, article, section) li`).

### Issue 6: `[role="button"]` gets `margin: 0 0.25em 0.25em 0`

**Severity:** Migration friction
**Status:** Open

nimble.css adds margin to all `[role="button"]` elements. This affects third-party components (like LeftiumLogo) that use `role="button"` on non-button elements for click interactivity. Pico did not add margin to `[role="button"]`. The margin shifts positioned elements (like the logo's glow overlay) relative to their siblings.

**Recommendation:** Consider wrapping in `:where()` or removing the default margin — buttons in flow content can use gap/margin via utility classes.

### Issue 7: `<hr>` vertical margin 2× spacing

**Severity:** Cosmetic
**Status:** Open

nimble.css applies `hr { margin: calc(var(--nc-spacing) * 2) 0 }` — twice the base spacing. Pico used `margin: var(--pico-spacing) 0` (1× spacing). This creates noticeably larger gaps around horizontal rules.

**Recommendation:** Reduce to `var(--nc-spacing) 0` to match common expectations.

### 6.7 multi-launch (2026-03-28)

**Project:** SvelteKit 2 / Svelte 5 — multi-engine search launcher with configurable TOML plans
**Source:** `/Volumes/p/multi-launch`
**Pico version:** `2.1.1`
**Pico features used:** `.container`, `$theme-color: 'blue'` SCSS config, `--pico-spacing` / `--pico-muted-border-color` / `--pico-card-sectioning-background-color` / `--pico-background-color` / `--pico-primary` / `--pico-form-element-spacing-horizontal` / `--pico-icon-search` CSS variables, `data-tooltip` (native tooltips on buttons), `class="contrast"` on `summary[role="button"]`, `[role="group"]` button groups, `<article>` with `<header>` inside `<details>`, inline button grid with responsive breakpoints

**Files changed:**

| File | Change |
|---|---|
| `package.json` | `@picocss/pico ^2.1.1` → `@leftium/nimble.css ^0.5.0`; added `tippy.js ^6.3.7` |
| `src/app.scss` | `@use '@picocss/pico/scss/pico' with ($theme-color: 'blue')` → `@use '@leftium/nimble.css/scss'`; added `--nc-content-width: 960px` on `:root` |
| `src/routes/+layout.svelte` | `--pico-primary` → `--nc-primary`; removed `padding-left: calc(100vw - 100%)` and `overflow-x: hidden` (incompatible with nimble's body grid — `100%` resolves to grid column width, not viewport) |
| `src/routes/+page.svelte` | All `--pico-*` → `--nc-*` mappings (15 refs); hardcoded Pico search icon SVG data URI; `class="contrast"` → `class="secondary"` on summary; replaced `data-tooltip` with tippy.js via Svelte 5 `{@attach}` pattern; removed Pico tooltip CSS; simplified 5-tier responsive breakpoints to 3-tier (phone/tablet/desktop); scoped button grid styles to `.search-group` (was `div button`); stripped `article` border and `article > header` background/padding/border from editor panel; added partial-height gradient dividers between same-type buttons |

**Issues encountered:**

1. **SCSS `@use ... with ($content-width)` fails** — nimble's entry point (`nimble.scss`) `@use`s `_config.scss` internally but does not `@forward` it. SCSS `@use ... with (...)` can only override variables that are `@forward`ed. **Fix:** use the runtime CSS custom property `--nc-content-width` on `:root` instead. (Issue #8)

2. **`padding-left: calc(100vw - 100%)` scrollbar hack breaks** — This Pico-era trick assumes `100%` = viewport minus scrollbar. In nimble's body grid, the layout `<div>` is a grid child in column 2 (960px), so `100%` = 960px, producing `calc(100vw - 960px) = 746px` of left padding at wide viewports. **Fix:** remove the hack entirely; nimble's grid handles centering. (See §3.2)

3. **No `data-tooltip` support** — Pico provides built-in CSS tooltips via `data-tooltip` attribute. nimble has no tooltip system. **Fix:** added tippy.js with a Svelte 5 attachment function. The `{@attach tooltip(...)}` pattern is clean and reactive. (Issue #9)

4. **No `.contrast` button variant** — Pico's `.contrast` gives a dark/inverted button appearance. nimble has no equivalent. **Fix:** replaced with `.secondary`. (Issue #10)

5. **`article > header` needs full reset for non-card usage** — nimble's `article > header` applies background, padding, negative margins, and border-bottom for card-header styling. When `<article>` is used as a structural container (not a visual card), all of these need explicit overrides. **Fix:** `border: none` on article, `margin: 0; padding: 0; padding-bottom: var(--nc-spacing); border-bottom: none; background: none` on header. (Issue #11)

6. **Button `border` creates double dividers in custom grids** — nimble buttons have `border: 1px solid` on all sides. In a custom inline button grid (not `[role="group"]`), adjacent buttons show 2px borders between them. Additionally, nimble's `[role="group"]` partial dividers (`::before`) doubled with the editor's own `border-left`. **Fix:** `border: none` on `.search-group button` (only `border-top` re-added for row separators); removed `border-left` from editor buttons; added gradient-based partial dividers scoped to `.search-group`. (Issue #12)

7. **Fullscreen icon positioning** — The `iconify-icon` web component needed `top: calc(1px + 0.5em + 0.75em); transform: translateY(-50%)` to align with the textarea's content box center (accounting for 1px border + 0.5em padding + half of 1.5em line-height). Also required `.wrap textarea { margin-bottom: 0 }` since nimble's textarea margin expanded the positioning container. The fullscreen-hide selector needed `:global(.fullscreen)` since the class is toggled via JS.

8. **Hidden placeholder `<blockquote>` takes space** — `visibility: hidden` reserves layout space. **Fix:** `blockquote[style*="hidden"] { display: none }` scoped to the editor header.

**Issues NOT encountered:**
- `[role="group"]` button groups transfer cleanly — nimble's partial-height dividers are an improvement over Pico's approach
- `<details>`/`<summary>` accordion works with nimble's open/close animation
- `summary[role="button"]` styled correctly with `.secondary`
- Dark mode works automatically (no theme toggle in this app)
- No nav layout issues (nav contains only `<h1>` with inline links)
- No SvelteKit `display: contents` issue (handled automatically by nimble 0.5.0)
- `iconify-icon` web component receives Svelte scoped class attributes correctly

### Issue 8: SCSS `$content-width` not `@forward`ed from entry point

**Severity:** Migration friction
**Status:** Open

nimble's `nimble.scss` entry point uses `@use 'config' as *` but does not `@forward 'config'`. This means SCSS consumers cannot use `@use '@leftium/nimble.css/scss' with ($content-width: 960px)` — it fails with "This variable was not declared with !default in the @used module."

The variable IS declared with `!default` in `_config.scss`, but SCSS's module system requires the entry point to `@forward` the config module for `with (...)` to work.

**Workaround:** Use the runtime CSS custom property instead:
```css
:root { --nc-content-width: 960px; }
```

**Recommendation:** Add `@forward 'config'` to `nimble.scss` so that all `!default` config variables are overridable via `@use ... with (...)`. This is the expected SCSS pattern and would allow compile-time customization (e.g., different prefix, custom colors, content width) without runtime overhead.

### Issue 9: No built-in tooltip support

**Severity:** Enhancement
**Status:** Open (by design)

Pico CSS provides built-in CSS-only tooltips via `[data-tooltip]` attribute with `::before`/`::after` pseudo-elements. nimble.css has no tooltip system.

**Workaround:** Use tippy.js (recommended) or add custom CSS tooltips. For Svelte 5 projects, the `{@attach}` pattern works well:

```ts
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'

function tooltip(content: string) {
  return (element: Element) => {
    const instance = tippy(element, { content, allowHTML: false })
    return instance.destroy
  }
}
```

**Recommendation:** Do not add to nimble.css core. Tooltips are interaction-heavy and vary significantly between projects (positioning, animation, HTML content, accessibility). A JS library like tippy.js is the right tool. Document the recommended approach in migration guide.

### Issue 10: No `.contrast` button variant

**Severity:** Cosmetic
**Status:** Open (by design)

Pico provides `.contrast` for dark/inverted buttons. nimble has `.secondary` and `.outline` but no contrast/inverted variant.

**Workaround:** Use `.secondary` (closest match) or add custom CSS.

**Recommendation:** Low priority. `.secondary` covers most use cases. A `.contrast` variant would require a full inverted color scale (dark bg + light text in light mode, vice versa in dark mode) which adds complexity for marginal benefit.

### Issue 11: `article > header` styling assumes card context

**Severity:** Migration friction
**Status:** Open

nimble's `article > header` applies: background tint, padding, negative margins (to bleed to card edges), and border-bottom. This is ideal for card-style articles but problematic when `<article>` is used as a generic sectioning container (e.g., wrapping form controls inside `<details>`).

Resetting requires 5 property overrides: `margin: 0; padding: 0; border-bottom: none; background: none; border-radius: 0`.

**Recommendation:** This is working as designed — `<article>` is styled as a card, which is the common pattern. Projects using `<article>` as a generic container should either switch to `<div>` or add the reset. No change needed in nimble.css, but document the reset pattern in the migration guide.

### Issue 12: Button borders create double dividers in inline grids

**Severity:** Cosmetic
**Status:** Open

nimble buttons have `border: 1px solid` on all four sides. When buttons are laid out in a custom inline grid (not `[role="group"]`), adjacent buttons show 2px borders between them. Projects must add `border: none` and re-add only the borders they need.

**Recommendation:** This is inherent to CSS box model — any element with borders on all sides will double up when adjacent. nimble's `[role="group"]` already handles this correctly for button groups. For custom grids, the fix is straightforward (`border: none` + selective re-add). No change needed in nimble.css.
