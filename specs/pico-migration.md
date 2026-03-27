# Migrating from PicoCSS to nimble.css

> A guide for migrating projects from PicoCSS v2 to nimble.css, plus a tracker for nimble.css issues discovered during migration.

**Status:** Living document
**Last updated:** 2026-03-27

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
| `.contrast` | _(none)_ | No contrast variant in nimble. Use custom CSS if needed. |
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
| `--pico-muted-border-color` | `--nc-border` |

Many Pico variables have no nimble equivalent because nimble derives them automatically (hover/focus states via relative color syntax) or uses `color-mix()` inline.

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
