# nimble.css Specification

> A minimal class/classless CSS library combining the best of Open Props and PicoCSS.

**Version:** 0.1.0-draft
**Status:** Draft
**Date:** 2026-03-24

---

## Table of Contents

1. [Goals](#1-goals)
2. [Non-Goals](#2-non-goals)
3. [Architecture](#3-architecture)
4. [CSS Custom Properties](#4-css-custom-properties)
5. [Color System](#5-color-system)
6. [Dark Mode](#6-dark-mode)
7. [Layout](#7-layout)
8. [Typography](#8-typography)
9. [Elements](#9-elements)
10. [Utility Classes](#10-utility-classes)
11. [Breakpoints](#11-breakpoints)
12. [File Structure & Build](#12-file-structure--build)
13. [Distribution](#13-distribution)
14. [Demo & Test Pages](#14-demo--test-pages)
15. [Design Decisions](#15-design-decisions)
16. [Open Questions](#16-open-questions)
- [Appendix: Implementation Plan](#appendix-implementation-plan)
- [Appendix: Size Budget](#appendix-size-budget)
- [Appendix: Comparison Matrix](#appendix-comparison-matrix)

---

## 1. Goals

- **Beautiful defaults with minimal effort.** Drop nimble.css into any HTML document and get a polished, readable page. Bare semantic elements should look good without adding classes, attributes, or inline styles.
- **Small file size.** Target under 8 KB minified+gzipped for the full build (compare: PicoCSS ~13 KB min+gz, simple.css ~4 KB, new.css ~4.5 KB). The core classless layer should be under 5 KB min+gz.
- **Two tiers of customization.** For most users: override ~20 CSS custom properties at runtime. For power users: `@use 'nimble' with (...)` in SCSS to configure prefix, toggle features, and set palette parameters at build time. The prebuilt CSS works without SCSS.
- **Installable via npm.** `npm install nimble.css` should provide ready-to-use prebuilt CSS files and SCSS source files for build integration.
- **PicoCSS aesthetics, Open Props philosophy.** Adopt PicoCSS's refined visual style (form elements, buttons, type scale, spacing) but follow Open Props' principle of minimal DevTools pollution.
- **Support light and dark mode** via `prefers-color-scheme` (automatic) and an opt-in `data-theme` attribute (manual), implemented with the CSS `light-dark()` function.
- **Two layout modes:** centered content container (CSS Grid) and fluid full-width.
- **Framework-agnostic.** Works with any HTML page, SvelteKit, Astro, or any other framework.

## 2. Non-Goals

Nimble.css deliberately excludes or defers:

- **RTL support** (can be added later; not in v1).
- **Full grid system** (nimble provides a single `.grid` utility for responsive equal-column layouts; complex grid patterns should use native CSS Grid/Flexbox directly).
- **Responsive font sizes per breakpoint** (PicoCSS has 6 breakpoints just for font-size; we use 1-2 at most).
- **Tooltips** (use a dedicated library).
- **Progress bar styling** (use native `<progress>` with accent-color; see `specs/safari-bugs.md` §2 for why custom styling was abandoned).
- **Nav styling** (use project-specific CSS for navigation patterns).
- **Complex dialog patterns** (nimble.css provides minimal native `<dialog>` styling; advanced modals with nested forms, multi-step flows, or custom animations should use project-specific CSS or a dedicated library).
- **Built CSS files in the git repo** (only source; CSS is built on publish/install).

## 3. Architecture

### 3.1 Layers

nimble.css uses CSS cascade layers (`@layer`) to ensure its styles never fight with user code. Any CSS written outside these layers automatically takes priority.

```css
/* nimble.css entry point */
@layer nimble.reset, nimble.base, nimble.utilities;

@layer nimble.reset {
  /* Trimmed sanitize.css base */
}

@layer nimble.base {
  /* Classless element styles */
}

@layer nimble.utilities {
  /* .secondary, .outline, .container, etc. */
}
```

**Dot-namespaced layers** (`nimble.reset` vs just `reset`) prevent collision if another library also defines a `reset` layer.

The three layers are also importable independently:

```css
/* Full bundle (recommended) */
@import 'nimble.css';

/* Just the classless base (includes reset) */
@import 'nimble.css/base';

/* Just the reset */
@import 'nimble.css/reset';

/* Just utilities (requires base) */
@import 'nimble.css/utilities';
```

### 3.2 Specificity Strategy

`@layer` is the primary cascade management strategy. Styles inside a lower layer lose to styles in a higher layer, regardless of specificity. This means nimble.css can use normal selectors internally (easier to read and debug) while remaining trivially overridable by any user CSS outside the layers.

Additionally, the **reset layer** uses `:where()` to maintain zero specificity as a double guarantee -- even a bare `h1 { }` in user code overrides it. The base and utility layers rely on `@layer` alone.

### 3.3 Interaction with Tailwind v4

Tailwind v4 defines its own layers (`base`, `components`, `utilities`). When used together:

```css
@layer nimble.reset, nimble.base, nimble.utilities;

/* Tailwind's layers are separate and ordered by Tailwind */
@import 'tailwindcss';
```

Because nimble's layers are declared before Tailwind's, Tailwind's styles take precedence. This is exactly what you want: nimble provides defaults, Tailwind overrides as needed.

### 3.4 SCSS Source, CSS Output

nimble.css is authored in **SCSS** and compiled to pure CSS for distribution. The SCSS source is the single source of truth; the prebuilt CSS files in `dist/` are generated artifacts.

**Why SCSS matters for architecture:**

- The `$prefix` variable threads through all files, making the `--nc-` prefix configurable at build time without string-replacement hacks.
- Feature flags (`$enable-dialog`, `$enable-switch`, etc.) compile out unused element styles, reducing output size.
- Surface color math (oklch lightness shifts) is computed at build time with Sass arithmetic, avoiding reliance on browser support for nested `oklch(from ...)` inside `light-dark()`.
- Heading scales, spacing scales, and repetitive selector patterns use loops and maps instead of hand-written repetition.

**Users never need to touch SCSS** unless they want build-time customization. The prebuilt `dist/nimble.css` is plain CSS that works everywhere.

### 3.5 Scoping Architecture: Global vs Scopeable

nimble.css splits its styles into two categories:

**Global styles** — always apply regardless of scoping:
- Reset (`_reset.scss`)
- Colors/custom properties (`_colors.scss`)
- Document/body grid (`_document.scss`)
- Grid column assignment (`_grid-columns.scss`)
- Layout utilities (`_layout-utilities.scss`) — `.fluid`, `.full-bleed`, `.grid`, `.wide`, `.container`
- Print styles (`_print.scss`)

**Scopeable styles** — emitted globally by default, optionally wrappable in `@scope`:
- Typography, links, buttons, forms, tables, code, media, article, details, dialog
- Non-layout utilities (`.striped`, `.visually-hidden`, `.overflow-auto`)

The `_scopeable.scss` module uses `meta.load-css()` to load all scopeable partials, allowing the entry point (`nimble.scss`) to conditionally wrap them in `@scope`:

```scss
@if $exclude-selector {
  @scope (:root) to (#{$exclude-selector}) {
    @include scopeable.load;
  }
} @else {
  @include scopeable.load;   // default — no @scope wrapper
}
```

By default, `$exclude-selector` is `null` and no `@scope` wrapper is emitted. This ensures compatibility with all browsers, including desktop Safari 18.x which has a bug preventing `@scope` + `@layer` styles from applying to certain elements (see `specs/safari-bugs.md` for details).

For users who need component isolation (`.no-nimble` opt-out), two paths are available:

1. **JS progressive enhancement (recommended):** Include `nimble-scope.js` alongside the CSS. The script wraps rules in `@scope` at runtime and auto-detects broken browsers.
2. **SCSS build-time opt-in:** Set `$exclude-selector: '.no-nimble'` for a pure-CSS solution (with the caveat that desktop Safari will be affected).

Layout utilities are intentionally global because they interact with the body grid (e.g., `.full-bleed` sets `grid-column: 1 / -1`). An element with `class="no-nimble full-bleed"` should still participate in the body grid layout even though nimble's component styles (typography, forms, etc.) don't apply inside it.

See [Section 15.2](#152-third-party-component-isolation-no-nimble-opt-out) for usage details and design rationale.

### 3.6 Base Reset

nimble.css embeds a trimmed version of **sanitize.css** as its reset foundation because:

- It's opinionated in useful ways (border-box, background-repeat: no-repeat).
- It's well-maintained and well-documented.
- It already handles many cross-browser normalizations PicoCSS reimplements.
- It's small (~0.6 KB min+gz).

We embed it directly (not as a dependency) to control size and avoid breaking changes.

**postcss-normalize** is rejected because its browser-target-based subsetting adds build complexity without meaningful size savings at sanitize.css's small size.

## 4. CSS Custom Properties

### 4.1 Prefix: `--nc-`

All public properties use the `--nc-` prefix ("nimble css"). This balances brevity with collision avoidance:

- Short enough for daily use: `var(--nc-primary)` vs `var(--nimble-primary)`.
- Collision with new.css's `--nc-` is unlikely -- new.css is unmaintained (last update 2021) and shares no property names.
- Configurable via the SCSS `$prefix` variable for users who need a different prefix (see Section 12.2).

In the SCSS source, all property names and references are generated from `$prefix`. The value must include the leading `--` and trailing `-` (e.g., `'--nc-'`, `'--my-'`):

```scss
// src/_config.scss
$prefix: '--nc-' !default;

// Usage throughout source files
:root {
  #{$prefix}primary: #{$primary-color};
}
button {
  background: var(#{$prefix}primary);
}
```

**Internal/private properties** use the `--_` convention (not prefixed, not configurable):

```css
:where(button) {
  --_btn-bg: var(--nc-primary);
  --_btn-color: var(--nc-primary-contrast);
  background: var(--_btn-bg);
  color: var(--_btn-color);
}
```

### 4.2 Design Principle: Minimal Pollution

PicoCSS defines 100+ `--pico-*` properties on `:root`, visible in DevTools for every element. Open Props avoids this by having properties only where used.

nimble.css takes a **middle path**: ~20 semantic custom properties on `:root`, plus component-scoped `--_` internals on their elements. This is meaningfully more than simple.css's 15 (needed for surface hierarchy and form styling) but an order of magnitude less than PicoCSS's 100+.

### 4.3 Public Custom Properties

```css
:root {
  color-scheme: light dark;

  /* --- Surfaces --- */
  --nc-surface-hue:        /* shared hue for surfaces, text, border (250 = blue-gray) */
  --nc-surface-1:          /* page background (derived from surface-hue) */
  --nc-surface-2:          /* raised: cards, code blocks, table headers */
  --nc-surface-3:          /* inset: form inputs, aside */
  --nc-surface-4:          /* overlay: dialogs, dropdowns */

  /* --- Text --- */
  --nc-text:               /* body text color (derived from surface-hue) */

  /* --- Borders --- */
  --nc-border:             /* default border color (derived from surface-hue) */

  /* --- Primary (main accent) --- */
  --nc-primary:            /* links, primary buttons, focus rings, checkboxes */
  --nc-primary-hover:      /* auto-derived from --nc-primary via relative color syntax */
  --nc-primary-focus:      /* auto-derived (semi-transparent) */
  --nc-primary-contrast:   /* text on primary background (usually #fff) */

  /* --- Secondary (neutral accent) --- */
  --nc-secondary:          /* secondary buttons, reset buttons */
  --nc-secondary-hover:    /* auto-derived from --nc-secondary */
  --nc-secondary-focus:    /* auto-derived (semi-transparent) */
  --nc-secondary-contrast: /* text on secondary background */

  /* --- Feedback --- */
  --nc-valid:              /* valid/success (green) */
  --nc-invalid:            /* invalid/error (red) */

  /* --- Typography --- */
  --nc-font-sans:          /* sans-serif font stack */
  --nc-font-mono:          /* monospace font stack */

  /* --- Spacing & Layout --- */
  --nc-radius:             /* default border radius */
  --nc-spacing:            /* base spacing unit */
  --nc-content-width:      /* max-width for centered container (~720px) */
}
```

**Total: ~20 public properties** (19 original + `--nc-surface-hue`).

Compared to the original draft's ~25, we cut:
- `border-muted` -- derived from `--nc-border` at lower opacity where needed
- `mark` -- hardcoded yellow, not worth a variable
- `transition` -- hardcoded `0.2s ease-in-out`
- `text-1` / `text-2` -- replaced by single `--nc-text`; muted text uses `color-mix()` inline
- `text-heading` -- headings differentiate via size, not color
- `wide-width` -- hardcoded in `.wide` utility
- `line-height`, `font-size` -- hardcoded sensible defaults (1.5, 100%)

### 4.4 Why These Specific Properties

| Property | Rationale |
|---|---|
| `surface-1..4` | The key Open Props influence. Without surface hierarchy, cards/inputs/code all blend into the page background. Solarized proved symmetric lightness pairs enable clean dark mode inversion. |
| `primary` + `secondary` | Two interactive color roles cover all element states (primary buttons, secondary buttons, links, focus rings). "Primary" is the standard term across CSS libraries (PicoCSS, Skeleton, Bootstrap). We skip `tertiary` and `contrast` -- users building complex UIs will layer their own design system on top. |
| `valid` / `invalid` | Enable proper form validation UX without requiring users to define feedback colors. |
| `text` | Single text color variable (replaces `text-1`/`text-2`). Muted text is derived inline via `color-mix()`. Headings differentiate via size, not color. |

### 4.5 Variable Count Comparison

| | new.css | simple.css | nimble.css | PicoCSS |
|---|---|---|---|---|
| Variables | 12 | 15 | ~20 | 100+ |
| Form styling quality | Basic | Basic | Full (PicoCSS-quality) | Full |
| Surface hierarchy | No | No | Yes (4 levels) | No |
| Button variants | No | No | Yes (primary + secondary + outline) | Yes |
| DevTools clutter | Low | Low | Low | High |

The variable count is justified by the features. Anyone who wants fewer variables and simpler styling should use simple.css or new.css. nimble.css occupies the niche between those ultra-minimal libs and PicoCSS's kitchen-sink approach.

## 5. Color System

### 5.1 Philosophy

Inspired by Solarized's symmetric lightness relationships and Open Props' surface color system:

- **Surface colors** form a coherent background hierarchy (page -> card -> input -> overlay).
- **In dark mode, surfaces invert** but maintain the same perceptual contrast ratios between layers (Solarized's key insight).
- **The primary color** is the single user-configurable accent color. All interactive elements (links, buttons, focus rings, checkboxes) derive from it.
- **Feedback colors** (valid/invalid) are independent of the primary color.

### 5.2 oklch Foundation

All colors are defined in the oklch color space, using the `light-dark()` function for automatic theme switching. Surface colors are parametrically derived from a shared hue and chroma with only lightness varying, ensuring the entire palette can be regenerated from a few inputs.

```css
:root {
  color-scheme: light dark;

  /* Surface hue shared by surfaces, text, border */
  --nc-surface-hue: 250;

  /* Surfaces: derived from surface-hue via var() + calc() */
  --nc-surface-1: light-dark(oklch(0.985 0.002 var(--nc-surface-hue)), oklch(0.17 0.005 calc(var(--nc-surface-hue) + 10)));
  --nc-surface-2: light-dark(oklch(0.955 0.002 var(--nc-surface-hue)), oklch(0.2 0.005 calc(var(--nc-surface-hue) + 10)));
  --nc-surface-3: light-dark(oklch(0.925 0.002 var(--nc-surface-hue)), oklch(0.23 0.005 calc(var(--nc-surface-hue) + 10)));
  --nc-surface-4: light-dark(oklch(0.885 0.002 var(--nc-surface-hue)), oklch(0.27 0.005 calc(var(--nc-surface-hue) + 10)));

  --nc-text:      light-dark(oklch(0.28 0.005 var(--nc-surface-hue)), oklch(0.86 0.005 var(--nc-surface-hue)));
  --nc-border:    light-dark(oklch(0.83 0.005 var(--nc-surface-hue)), oklch(0.28 0.005 calc(var(--nc-surface-hue) + 10)));

  /* Primary: hover/focus auto-derived via relative color syntax */
  --nc-primary:          light-dark(oklch(0.5 0.2 250), oklch(0.6 0.2 250));
  --nc-primary-hover:    light-dark(oklch(from var(--nc-primary) calc(l - 0.1) c h), oklch(from var(--nc-primary) calc(l + 0.1) c h));
  --nc-primary-focus:    oklch(from var(--nc-primary) l c h / 0.4);
  --nc-primary-contrast: light-dark(#fff, oklch(0.15 0.005 250));
}
```

### 5.3 Autocomputed Surface Colors

The surface hierarchy follows a simple pattern: all values share the same hue and chroma, differing only in lightness. In light mode, deeper surfaces are darker (subtract L); in dark mode, deeper surfaces are lighter (add L). This mirrors Solarized's symmetric base pairs:

```
Light mode:  surface-1 (L=0.985) > surface-2 (0.955) > surface-3 (0.925)
Dark mode:   surface-1 (L=0.170) < surface-2 (0.200) < surface-3 (0.220)
```

The hue is exposed as the runtime CSS custom property `--nc-surface-hue`. All four surfaces, text, and border derive from it via `var()` + `calc()`, so overriding one value shifts the entire neutral palette at runtime:

```css
:root { --nc-surface-hue: 80; }  /* warm sand neutrals */
```

In SCSS, the lightness/chroma parameters that aren't exposed at runtime can also be overridden:

```scss
// src/_config.scss
$surface-hue: 250 !default;       // blue-gray (also sets --nc-surface-hue default)
$surface-chroma: 0.002 !default;  // near-neutral
$surface-light-base: 0.985 !default;
$surface-dark-base: 0.170 !default;

// Lightness offsets for each surface level
$surface-offsets: (2: 0.03, 3: 0.06, 4: 0.10);
```

```scss
// src/_colors.scss — surfaces derive from --nc-surface-hue at runtime
#{$prefix}surface-hue: #{$surface-hue};

@each $level, $offset in $surface-offsets {
  #{$prefix}surface-#{$level}: light-dark(
    oklch(#{$surface-light-base - $offset} #{$surface-chroma} var(#{$prefix}surface-hue)),
    oklch(#{$surface-dark-base + $offset} #{$surface-chroma + 0.003} calc(var(#{$prefix}surface-hue) + 10))
  );
}
```

### 5.4 Customizing the Primary Color

**Runtime (CSS custom properties):** Override the primary color — hover and focus auto-derive via [relative color syntax](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors):

```css
:root {
  --nc-primary: light-dark(oklch(0.6 0.25 25), oklch(0.7 0.25 25));  /* red-orange */
  /* --nc-primary-hover and --nc-primary-focus update automatically */
}
```

**Build-time (SCSS):** Set just the hue/chroma/lightness:

```scss
@use 'nimble' with (
  $primary-hue: 25,
  $primary-chroma: 0.25,
  $primary-lightness: 0.6,
);
```

Both paths now produce the same result: hover, focus, and contrast values are derived from the base color automatically. The CSS path uses `oklch(from var(--nc-primary) ...)` relative color syntax; the SCSS path bakes the same expressions at compile time.

### 5.5 Open Props Integration (Values, Not Dependency)

nimble.css hardcodes values sourced from Open Props' curated scales (grays, sizes, radii) to ensure aesthetic harmony when both are used together. However, there is **no runtime dependency** on Open Props -- all values are written as final oklch/rem values in the source, with comments noting their Open Props origin.

```css
--nc-spacing: 1rem;     /* ~Open Props size-3 */
--nc-radius: 0.25rem;   /* ~Open Props radius-2 */
```

An optional SCSS bridge module or CSS bridge file mapping `--nc-*` to Open Props variables (e.g., `--nc-primary: var(--blue-7)`) is a v2 feature for users who want dynamic Open Props theme integration.

## 6. Dark Mode

### 6.1 Implementation: `light-dark()`

All color properties use the CSS `light-dark()` function (Chrome 123+, Firefox 120+, Safari 17.5+, all mid-2024). This eliminates duplicate `@media (prefers-color-scheme: dark)` blocks and `[data-theme="dark"]` blocks:

```css
:root {
  color-scheme: light dark;
  --nc-surface-1: light-dark(oklch(0.985 0.002 250), oklch(0.170 0.005 260));
  --nc-text:      light-dark(oklch(0.280 0.005 250), oklch(0.860 0.005 250));
}
```

A single variable declaration handles both modes. The browser resolves the appropriate value based on `color-scheme`.

### 6.2 Automatic (Default)

By default, nimble.css respects `prefers-color-scheme` via the `color-scheme: light dark` declaration on `:root`. No user action required.

### 6.3 Manual Override

```html
<html data-theme="dark">  <!-- force dark -->
<html data-theme="light"> <!-- force light -->
```

```css
[data-theme="dark"] {
  color-scheme: dark;
}
[data-theme="light"] {
  color-scheme: light;
}
```

Setting `color-scheme` on the element causes `light-dark()` to resolve to the forced mode. No need to redeclare any color variables.

## 7. Layout

### 7.1 Two Layout Modes

**Centered container** (default):

```html
<body>
  <header>...</header>
  <main>...</main>
  <footer>...</footer>
</body>
```

`<body>` uses CSS Grid to center content:

```css
body {
  display: grid;
  grid-template-columns: 1fr min(var(--nc-content-width), calc(100% - 2 * var(--nc-spacing))) 1fr;
}
body > * {
  grid-column: 2;
  min-width: 0; /* allow grid children to shrink below intrinsic content width */
}
```

This approach (from simple.css) is superior to PicoCSS's max-width + breakpoint approach because:
- Content is centered with real padding (not zero-padding with width tricks).
- No breakpoints needed for basic centering.
- Full-bleed elements can use `grid-column: 1 / -1`.

**Content width defaults:**
- `--nc-content-width: 720px` (approximately 65ch at 16px base, good for readability)
- Overridable per-element or globally

**Breaking out of the container:**

```css
.full-bleed {
  grid-column: 1 / -1;
}

.wide {
  grid-column: 1 / -1;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--nc-spacing);
}
```

**Responsive equal-column grid:**

```css
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--nc-spacing);
  margin-bottom: var(--nc-spacing);
}
@media (min-width: 720px) {
  .grid {
    grid-template-columns: repeat(auto-fit, minmax(0%, 1fr));
  }
}
```

Drop-in responsive layout: children stack in a single column on mobile and share equal columns on desktop. The number of columns is determined by the number of direct children. Uses the phone breakpoint (`$breakpoint-phone: 720px`) as the collapse point — similar to Pico's `.grid` but using the project's breakpoint and spacing variables. `margin-bottom` matches the vertical rhythm of block elements (`p`, `ul`, etc.).

**Fluid layout** (opt-in):

```html
<body class="fluid">
  ...
</body>
```

In fluid mode, `body` takes full viewport width with consistent padding:

```css
body.fluid {
  display: block;
  max-width: none;
  padding-inline: var(--nc-spacing);
}
```

### 7.2 Padding Approach

PicoCSS has a known issue (#669) where container "padding" is actually achieved via max-width breakpoints, with actual padding often being 0. This causes content to touch edges at exact breakpoints.

nimble.css always uses **real padding** via the grid approach. Content never touches viewport edges.

## 8. Typography

### 8.1 Font Stack

```css
--nc-font-sans: system-ui, sans-serif;
--nc-font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro',
                 Menlo, Consolas, 'DejaVu Sans Mono', monospace;
```

Use `system-ui` as primary (respects OS/user preferences) rather than PicoCSS's long explicit font list. This is the modern best practice.

### 8.2 Base Size & Scale

```css
font-size: 100%;     /* = 16px in most browsers */
line-height: 1.5;
```

PicoCSS scales font-size from 100% to 131.25% across 6 breakpoints. nimble.css uses a simpler approach:

- Base size stays at `100%` for all viewports.
- On the phone breakpoint, headings scale down slightly.
- Users who want larger text on large screens can set `font-size: 112.5%` on `:root`.

### 8.3 Heading Scale

```
h1: 2rem      (32px)   line-height: 1.1
h2: 1.75rem   (28px)   line-height: 1.15
h3: 1.5rem    (24px)   line-height: 1.2
h4: 1.25rem   (20px)   line-height: 1.3
h5: 1.125rem  (18px)   line-height: 1.4
h6: 1rem      (16px)   line-height: 1.5
```

On the phone breakpoint (`max-width: 720px`):

```
h1: 1.75rem   h2: 1.5rem   h3: 1.3rem
```

### 8.4 Vertical Rhythm

Block-level elements (`p`, `ul`, `ol`, `dl`, `blockquote`, `pre`, `table`, `figure`, `form`, `fieldset`) have:

```css
margin-top: 0;
margin-bottom: var(--nc-spacing);
```

Headings that follow block content get extra top margin for visual separation:

```css
:where(p, ul, ol, dl, blockquote, pre, table, figure, form) + :is(h1, h2, h3, h4, h5, h6) {
  margin-top: calc(var(--nc-spacing) * 2);
}
```

## 9. Elements

### 9.1 Links

```css
:where(a:not([role="button"])) {
  color: var(--nc-primary);
  text-decoration: underline;
  text-underline-offset: 0.15em;
  text-decoration-color: color-mix(in oklch, var(--nc-primary), transparent 50%);
  transition: color 0.2s, text-decoration-color 0.2s;
}
:where(a:not([role="button"])):hover {
  color: var(--nc-primary-hover);
  text-decoration-color: var(--nc-primary-hover);
}
```

Links are always underlined (accessibility best practice, per W3C WCAG F73). The underline color is semi-transparent for aesthetics.

### 9.2 Buttons

PicoCSS buttons are criticized for being too large (issue #482). nimble.css uses more compact padding:

```css
:where(button, [type="submit"], [type="reset"], [type="button"], [role="button"]) {
  --_btn-padding-v: 0.5em;
  --_btn-padding-h: 1em;

  padding: var(--_btn-padding-v) var(--_btn-padding-h);
  background-color: var(--nc-primary);
  color: var(--nc-primary-contrast);
  border: 1px solid var(--nc-primary);
  border-radius: var(--nc-radius);
  font: inherit;
  font-size: 1rem;
  line-height: 1.5;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: background-color 0.2s, border-color 0.2s;
}
```

**Button variants** (minimal classes):

```css
.secondary { /* uses --nc-secondary colors instead of primary */ }
.outline   { /* transparent background, primary border */ }
```

**Button groups** (adopted from PicoCSS):

```css
[role="group"] {
  display: inline-flex;
}
[role="group"] > * {
  border-radius: 0;
}
[role="group"] > :first-child {
  border-start-start-radius: var(--nc-radius);
  border-end-start-radius: var(--nc-radius);
}
[role="group"] > :last-child {
  border-start-end-radius: var(--nc-radius);
  border-end-end-radius: var(--nc-radius);
}
```

### 9.3 Forms

Form elements are one of PicoCSS's strengths and Open Props normalize's weaknesses. nimble.css adopts PicoCSS's form aesthetic with refinements:

```css
:where(input:not([type="checkbox"], [type="radio"], [type="range"], [type="file"]),
       select, textarea) {
  padding: 0.5em 0.75em;
  background-color: var(--nc-surface-3);
  border: 1px solid var(--nc-border);
  border-radius: var(--nc-radius);
  color: var(--nc-text);
  font: inherit;
  font-size: 1rem; /* >=16px prevents iOS Safari auto-zoom on focus */
  transition: border-color 0.2s, box-shadow 0.2s;
}

:where(input, select, textarea):focus-visible {
  border-color: var(--nc-primary);
  box-shadow: 0 0 0 2px var(--nc-primary-focus);
  outline: none;
}
```

**Validation states** use `aria-invalid`:

```css
:where(input, select, textarea)[aria-invalid="false"] {
  border-color: var(--nc-valid);
}
:where(input, select, textarea)[aria-invalid="true"] {
  border-color: var(--nc-invalid);
}
```

**Switch** (checkbox with `role="switch"`):

```css
:where([type="checkbox"][role="switch"]) {
  /* Toggle switch styling inherited from PicoCSS */
}
```

**Labels and layout:**

```css
:where(label) {
  display: block;
  margin-bottom: 0.25em;
}
:where(label:has(+ input, + select, + textarea)) {
  font-weight: 600;
}
:where(fieldset) {
  border: 1px solid var(--nc-border);
  border-radius: var(--nc-radius);
  padding: var(--nc-spacing);
}
```

### 9.4 Tables

```css
:where(table) {
  width: 100%;
  border-collapse: collapse;
}
:where(th, td) {
  padding: 0.5em 0.75em;
  border-bottom: 1px solid color-mix(in oklch, var(--nc-border), transparent 40%);
  text-align: start;
}
:where(thead th, thead td) {
  font-weight: 600;
  border-bottom-width: 2px;
  background-color: var(--nc-surface-2);
}
```

Tables are wrapped in `overflow-x: auto` by default when inside a `figure`:

```css
:where(figure:has(table)) {
  overflow-x: auto;
}
```

### 9.5 Code

```css
:where(code, kbd, samp) {
  font-family: var(--nc-font-mono);
  font-size: 0.875em;
  background-color: var(--nc-surface-2);
  border-radius: var(--nc-radius);
  padding: 0.15em 0.35em;
}
:where(pre) {
  background-color: var(--nc-surface-2);
  border-radius: var(--nc-radius);
  padding: var(--nc-spacing);
  overflow-x: auto;
}
:where(pre code) {
  background: none;
  padding: 0;
  font-size: inherit;
}
:where(kbd) {
  border: 1px solid var(--nc-border);
  border-bottom-width: 2px;
}
```

### 9.6 Blockquote

```css
:where(blockquote) {
  margin-block: var(--nc-spacing);
  margin-inline: 0;
  padding: var(--nc-spacing);
  border-inline-start: 0.25rem solid var(--nc-border);
  font-style: italic;
}
:where(blockquote footer, blockquote cite) {
  font-style: normal;
  font-size: 0.9em;
  color: color-mix(in oklch, currentColor 60%, transparent);
}
```

### 9.7 Details/Summary

```css
:where(details) {
  border: 1px solid var(--nc-border);
  border-radius: var(--nc-radius);
  padding: 0.75em 1em;
}
:where(summary) {
  cursor: pointer;
  font-weight: 600;
}
:where(details[open] > summary) {
  margin-bottom: 0.5em;
}
```

### 9.8 Media

```css
:where(img, video, canvas, svg) {
  max-width: 100%;
  height: auto;
}
:where(figure) {
  margin: 0;
}
:where(figcaption) {
  font-size: 0.9em;
  color: color-mix(in oklch, currentColor 60%, transparent);
  margin-top: 0.5em;
}
```

nimble.css does **not** reduce image opacity in dark mode (simple.css does this at 0.6 and it ruins images).

### 9.9 Horizontal Rule

```css
:where(hr) {
  border: none;
  height: 1px;
  background-color: color-mix(in oklch, var(--nc-border), transparent 40%);
  margin: calc(var(--nc-spacing) * 2) 0;
}
```

### 9.10 Mark

```css
:where(mark) {
  padding: 0.1em 0.25em;
  background-color: light-dark(#fde68a, oklch(0.55 0.12 85));  /* amber highlight */
  color: light-dark(inherit, oklch(0.95 0.01 85));
  border-radius: 2px;
}
```

### 9.11 Dialog (Minimal)

```css
:where(dialog) {
  background-color: var(--nc-surface-4);
  border: 1px solid var(--nc-border);
  border-radius: var(--nc-radius);
  max-width: min(90vw, 40rem);
  padding: var(--nc-spacing);
}
dialog::backdrop {
  background: rgb(0 0 0 / 0.5);
  backdrop-filter: blur(4px);
  animation: nc-backdrop-in 0.2s ease;
}
@keyframes nc-backdrop-in {
  from { opacity: 0; }
}
```

### 9.12 Print Styles

```css
@media print {
  body {
    background: #fff;
    color: #000;
  }
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.85em;
    color: #555;
  }
  a[href^="#"]::after,
  a[href^="javascript:"]::after {
    content: none;
  }
  pre, blockquote {
    page-break-inside: avoid;
  }
  h2, h3, h4 {
    page-break-after: avoid;
  }
  img {
    max-width: 100% !important;
  }
  @page {
    margin: 2cm;
  }
}
```

Basic print rules: force black-on-white, show link URLs, prevent orphaned headings and split code blocks, and set sensible page margins. Kept minimal — projects with serious print needs should add their own `@media print` rules.

## 10. Utility Classes

nimble.css includes a **minimal** set of utility classes. These are the only classes nimble.css provides.

Utilities are split into **global** (always apply, including on `.no-nimble` elements) and **scoped** (excluded inside `.no-nimble` subtrees). See [Section 3.5](#35-scoping-architecture-global-vs-scopeable) for the architectural rationale.

### 10.1 Layout (Global)

These interact with the body grid and must work everywhere, including on `.no-nimble` elements:

```css
.container       /* centered content width (useful inside fluid layout) */
.fluid           /* full viewport width with padding */
.full-bleed      /* break out of centered container to full width */
.grid            /* responsive equal-column grid (1fr mobile, auto-fit desktop) */
.wide            /* break out to 1200px max-width */
```

### 10.2 Buttons (Scoped)

```css
.secondary       /* secondary button style (uses --nc-secondary) */
.outline         /* outline button style */
```

### 10.3 Tables (Scoped)

```css
.striped         /* striped table rows */
.overflow-auto   /* scrollable container */
```

### 10.4 Visibility (Scoped)

```css
.visually-hidden /* accessible hidden (screen readers only) */
```

### 10.5 Component Isolation (Opt-In)

```css
.no-nimble       /* opt out of nimble's component styles (see §15.2) */
```

The `.no-nimble` class requires opt-in activation — either via `nimble-scope.js` (recommended) or the `$exclude-selector` SCSS flag. Without activation, the class has no effect. See [Section 15.2](#152-third-party-component-isolation-no-nimble-opt-out) for details.

**Total class count: ~10** (~9 utilities + `.no-nimble` opt-out).

## 11. Breakpoints

### 11.1 One Breakpoint, Maybe Two

PicoCSS uses 5 breakpoints (576, 768, 1024, 1280, 1536px) primarily for font-size scaling and container width. This is excessive.

nimble.css uses:

| Name | Value | Purpose |
|---|---|---|
| `phone` | `max-width: 720px` | Scale down headings, make form inputs full-width |
| `tablet` (optional) | `max-width: 1024px` | May be used for wide-content breakout adjustments |

That's it. The grid-based centered layout is inherently responsive without breakpoints.

### 11.2 What Changes at the Phone Breakpoint

- Headings h1-h3 scale down (see Section 8.3).
- Form inputs, select, and textarea go full-width.

## 12. File Structure & Build

### 12.1 Source Structure

```
nimble.css/
  src/
    _config.scss             # All configurable variables with !default (incl. $exclude-selector)
    _layers.scss             # @layer order declaration (must precede all other output)
    _reset.scss              # Trimmed sanitize.css
    _colors.scss             # Color properties (oklch generation + light-dark())
    _document.scss           # html, body, *, ::selection
    _grid-columns.scss       # Global: body grid column assignment (body > *)
    _layout-utilities.scss   # Global: .fluid, .full-bleed, .grid, .wide, .container
    _scopeable.scss          # Mixin loading scopeable modules via meta.load-css()
    _typography.scss         # Scopeable: headings, p, lists, blockquote, hr, mark
    _links.scss              # Scopeable: a
    _buttons.scss            # Scopeable: button, [role="button"], button groups
    _forms.scss              # Scopeable: input, select, textarea, label, fieldset, switch
    _tables.scss             # Scopeable: table, th, td
    _code.scss               # Scopeable: pre, code, kbd, samp
    _media.scss              # Scopeable: img, video, figure, figcaption, iframe
    _article.scss            # Scopeable: article card styling
    _details.scss            # Scopeable: details, summary
    _dialog.scss             # Scopeable: dialog
    _print.scss              # Global: @media print rules
    _utilities.scss          # Scopeable: non-layout utilities (.striped, .visually-hidden, etc.)
    nimble.scss              # Entry point: global + conditional @scope wrapper
    nimble-core.scss         # Core entry point (without progress/meter/select)
  dist/
    nimble.css               # full build (generated, not committed)
    nimble.min.css           # minified (generated, not committed)
    nimble-base.css          # reset + base (no utilities)
    nimble-reset.css         # just the reset
  demo/
    index.html               # html5-test-page based demo (vanilla HTML)
    extended.html            # extended demo with form patterns, card layouts, etc.
  specs/
    nimble-css.md            # this spec
    pico-migration.md        # Pico CSS → nimble.css migration guide
  build.js                   # Build script (Sass compile + Lightning CSS minify)
  package.json
  LICENSE
  README.md
```

### 12.2 Build Pipeline

Two stages:

1. **Sass** compiles `src/nimble.scss` to CSS (resolves `$prefix`, feature flags, color math, loops).
2. **Lightning CSS** minifies and autoprefixes the compiled CSS (targeting last 2 versions of modern browsers).

```bash
# Default build
node build.js

# Custom prefix
node build.js --prefix --my-
```

The `--prefix` flag sets the Sass `$prefix` variable, so it flows through all property names and `var()` references. Internal `--_` properties are not affected.

### 12.3 SCSS Configuration

All configurable values live in `src/_config.scss` with `!default` flags, overridable via `@use ... with (...)`:

```scss
// src/_config.scss

// --- Prefix ---
$prefix: '--nc-' !default;

// --- Feature flags ---
$enable-utilities: true !default;
$enable-dialog: true !default;
$enable-switch: true !default;
$enable-details: true !default;

// --- Scoping ---
// Set to a selector (e.g. '.no-nimble') to wrap component styles in
// @scope (:root) to ($exclude-selector). Default: null (no @scope).
// ⚠️ @scope is broken on desktop Safari 18.x — see specs/safari-bugs.md
$exclude-selector: null !default;

// --- Colors (oklch parameters) ---
$primary-hue: 250 !default;
$primary-chroma: 0.2 !default;
$primary-lightness: 0.55 !default;

$secondary-hue: 250 !default;
$secondary-chroma: 0.05 !default;
$secondary-lightness: 0.45 !default;

$surface-hue: 250 !default;
$surface-chroma: 0.002 !default;
$surface-light-base: 0.985 !default;
$surface-dark-base: 0.170 !default;

// --- Typography ---
$font-sans: system-ui, sans-serif !default;
$font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro',
            Menlo, Consolas, 'DejaVu Sans Mono', monospace !default;

// --- Spacing & Layout ---
$spacing: 1rem !default;
$radius: 0.25rem !default;
$content-width: 720px !default;
$wide-width: 1200px !default;

// --- Breakpoints ---
$breakpoint-phone: 720px !default;
```

**SCSS customization example:**

```scss
// User's project stylesheet
@use 'nimble' with (
  $prefix: '--my-',
  $primary-hue: 25,            // orange
  $surface-hue: 30,            // warm sand neutrals
  $enable-dialog: false,       // exclude dialog styles
  $exclude-selector: '.no-nimble',  // enable @scope wrapping (⚠️ broken on desktop Safari 18.x)
  $content-width: 800px,
);
```

### 12.4 No Built CSS in Git

PicoCSS commits built CSS files to the repo, cluttering git history. nimble.css builds CSS only during `npm publish` (via `prepublishOnly` script) and in CI for the demo page. The `dist/` directory is in `.gitignore` but included in the npm package via `"files"` in package.json.

## 13. Distribution

### 13.1 npm Package

```json
{
  "name": "nimble.css",
  "main": "dist/nimble.min.css",
  "exports": {
    ".": "./dist/nimble.min.css",
    "./base": "./dist/nimble-base.min.css",
    "./reset": "./dist/nimble-reset.min.css",
    "./utilities": "./dist/nimble-utilities.min.css",
    "./scss": "./src/nimble.scss"
  },
  "files": ["dist/", "src/"]
}
```

The package ships both prebuilt CSS (for most users) and SCSS source (for build-time customization).

### 13.2 CDN

Available via unpkg/jsdelivr automatically via npm:

```html
<link rel="stylesheet" href="https://unpkg.com/nimble.css">
```

Always use a versioned URL for production.

### 13.3 Usage

**Prebuilt CSS (no SCSS needed):**

```html
<!-- Vanilla HTML -->
<link rel="stylesheet" href="path/to/nimble.min.css">
```

```js
// Any bundler (Vite, webpack, etc.)
import 'nimble.css';
```

**SCSS source (build-time customization):**

```scss
// User's main stylesheet
@use 'nimble.css/scss' with (
  $primary-hue: 160,
  $enable-dialog: false,
);
```

## 14. Demo & Test Pages

### 14.1 Primary Test Page

Based on [html5-test-page](https://github.com/cbracco/html5-test-page). This covers all standard HTML elements and serves as the visual regression test. Published as a GitHub Pages site.

**Sections from html5-test-page:**
- Text: headings, paragraphs, lists, blockquotes, details/summary, address, hr, tables, code, inline elements
- Embedded content: images, audio, video, canvas, meter, progress, SVG, iframe
- Form elements: input fields, selects, checkboxes, radios, textareas, HTML5 inputs, action buttons

### 14.2 Extended Demo Page

An additional static HTML page showcasing:
- Both layout modes (centered and fluid)
- Button variants and groups
- Form patterns (login, registration, search)
- Card-like patterns using semantic HTML (`article`, `section`)
- Light/dark mode toggling (minimal inline JS for the `data-theme` toggle)
- Full-bleed and wide breakout content
- The surface color hierarchy visually demonstrated

### 14.3 Tooling & Hosting

Both demo pages are **vanilla HTML** -- no framework, no build step beyond Lightning CSS for the stylesheet itself. This keeps the demo dependency-free and ensures it accurately represents the classless experience.

Published via GitHub Pages, built by CI. No built CSS in the repo.

## 15. Design Decisions

### 15.1 Why Not Pure Classless?

Lessons from MVP.css, new.css, and HN discussions:

- **MVP.css** abuses semantic HTML (using `aside` for cards, `a strong` for buttons) to avoid classes. This harms accessibility and confuses developers.
- **Pure classless is insufficient** for real-world use. You need at least: a way to distinguish primary/secondary buttons, striped tables, layout modes, and full-bleed content.
- **Minimum viable classes**: nimble.css uses ~9 classes total. Every class has a clear, non-overlapping purpose.

### 15.2 Third-Party Component Isolation (`.no-nimble` Opt-Out)

CSS cascade layers solve most specificity conflicts with third-party components (Svelte scoped styles, web components, etc.) because unlayered styles always beat layered styles. However, nimble.css's element styles can still "fill in" CSS properties that a component never explicitly sets, subtly changing its appearance.

nimble.css provides an opt-in mechanism for complete component isolation using CSS `@scope`. When enabled, component-level styles (typography, links, buttons, forms, tables, code, media, article, details, dialog, and non-layout utilities) are wrapped in:

```css
@scope (:root) to (.no-nimble) {
  /* component styles */
}
```

This means nimble's component styles apply everywhere **except** inside elements with `class="no-nimble"`. Document-level styles (reset, colors, body grid, layout utilities, print) remain global — they always apply.

**Usage:**

```html
<!-- nimble styles apply here -->
<main class="fluid full-bleed">
  <h1>Styled by nimble</h1>

  <!-- nimble component styles do NOT apply inside this element -->
  <div class="no-nimble full-bleed">
    <ThirdPartyDataTable />
  </div>
</main>
```

Note that layout utilities (`.fluid`, `.full-bleed`, `.wide`, `.container`) are global, so they work on `.no-nimble` elements — you can still control layout while opting out of nimble's component styling.

**Enabling `.no-nimble` — two paths:**

By default, `.no-nimble` is **not active** in the prebuilt CSS. The `@scope` wrapper is omitted because desktop Safari 18.x has a bug that prevents `@scope` + `@layer` styles from applying to certain elements (see `specs/safari-bugs.md`).

*Path 1: JS progressive enhancement (recommended):*

```html
<link rel="stylesheet" href="nimble.css">
<script src="nimble-scope.js"></script>
```

The `nimble-scope.js` script (~20 lines) wraps nimble's component rules in `@scope` at runtime using `adoptedStyleSheets`. It auto-detects the desktop Safari bug and gracefully degrades (`.no-nimble` has no effect on broken browsers). No FOUC — base styles always apply; the JS only adds the scoping boundary.

*Path 2: SCSS build-time opt-in:*

```scss
// ⚠️ WARNING: Broken on desktop Safari 18.x — see specs/safari-bugs.md §1
@use '@leftium/nimble.css/scss' with (
  $exclude-selector: '.no-nimble'
);
```

This emits the `@scope` wrapper directly in the CSS output. Pure CSS, no JS dependency. However, desktop Safari users will see broken form/details styling.

**Why `.no-nimble` is opt-in (not default):**

`@scope` is too new for production defaults. Desktop Safari 18.x has a confirmed bug where styles inside `@scope` + `@layer` silently fail to apply to certain element types (`input`, `select`, `textarea`, `details`). There are 10 open `@scope` bugs in WebKit Bugzilla, most unassigned. An ETA for fixes is unknown (likely 6-12 months). Since nimble.css must work everywhere out of the box, `@scope` is disabled by default. See `specs/safari-bugs.md` for the full investigation.

**Size overhead:** When enabled, the `@scope` wrapper adds ~200 bytes to the minified output. Negligible after compression.

**Browser support for `@scope`:** Chrome 118+, Safari 17.4+ (with bugs, see above), Firefox 128+.

**Why not `revert-layer`?** Early prototyping used `all: revert-layer` on wrapper elements, but this approach was either too aggressive (broke third-party component layout by reverting grid/flex properties) or lost specificity battles with scoped component styles. `@scope` cleanly prevents nimble's styles from entering the subtree at all.

**Why not opt-in (Pico's `$parent-selector` approach)?** Pico CSS supports `$parent-selector: '.pico'` so styles only apply inside a class. nimble.css's body grid requires rules on `body` itself, which can't be nested inside a class. Opt-out (default-on with `.no-nimble` escape hatch) avoids this architectural conflict.

### 15.3 Why SCSS?

nimble.css is authored in SCSS despite the spec's emphasis on modern CSS features. The key insight is that SCSS only affects the **authoring and power-user customization** path -- the prebuilt CSS output is identical to what a pure CSS source would produce.

**What SCSS provides:**
- `$prefix` threads through all files, making `--nc-` configurable without post-build string hacks.
- Feature flags (`$enable-dialog: false`) compile out unused element styles at build time.
- Surface color math uses Sass arithmetic instead of relying on browser support for nested `oklch(from ...)` inside `light-dark()`.
- Heading scales, spacing, and repetitive selectors use loops/maps instead of hand-written repetition.

**What SCSS does not change:**
- The prebuilt `dist/nimble.css` is plain CSS. No SCSS knowledge required to use it.
- Runtime customization via CSS custom properties works exactly the same.
- The output uses modern CSS features (cascade layers, `light-dark()`, oklch) natively -- SCSS does not polyfill or transpile these.

**Maintenance cost** is low: the library is ~15 source files totaling ~5 KB of output. Sass deprecation churn (e.g., the `/` division change) affects large codebases more than small ones.

### 15.4 Why Not PicoCSS As-Is?

| Issue | nimble.css Solution |
|---|---|
| 100+ CSS variables in DevTools | ~20 semantic variables |
| 5+ breakpoints | 1 (phone), maybe 2 |
| ~13 KB min+gz | Target <8 KB |
| Zero-padding container hack | Real padding via CSS Grid |
| Oversized buttons | Compact `0.5em / 1em` padding |
| No surface color concept | 4-level surface system |
| Built CSS in repo | Build on publish only |
| Duplicate @media blocks for dark mode | Single `light-dark()` declarations |

### 15.5 Why Not Open Props Normalize?

Open Props normalize looks plain, especially form elements. It's designed as a thin layer over Open Props' prop system, not as a standalone stylesheet. nimble.css borrows the surface color concept and on-demand property philosophy but provides its own (PicoCSS-inspired) visual aesthetic. Open Props values are sourced at design time for harmony, with no runtime dependency.

### 15.6 Key Lessons from Classless CSS HN Discussions

- **Links must be underlined** (accessibility). Many classless libs get this wrong.
- **Tables cause horizontal overflow** on mobile. Always provide a scrollable wrapper strategy.
- **Don't reduce image opacity in dark mode** unless the user opts in. It ruins photos.
- **System font stacks** are preferred. Don't import fonts by default.
- **"Classless" != "framework."** Be honest about what this is: a base stylesheet with a handful of utility classes.
- **Print styles matter.** Include basic `@media print` rules.
- **Don't set `html { cursor: default }`** for the entire page if links and buttons have proper cursors anyway (sanitize.css does this; evaluate whether to keep it).

### 15.7 Sass and Modern CSS Passthrough

Dart Sass 1.78+ natively parses `oklch()` as a color function, which breaks parametric color generation (e.g., `oklch(#{$lightness} #{$chroma} #{$hue})` triggers "Expected lightness channel to be a number"). Similarly, Sass simplifies `calc()` expressions containing `var()` and can strip the `calc()` wrapper.

**Solution:** Use `sass:string.unquote()` to emit these values as opaque CSS strings that Sass passes through without interpretation:

```scss
@use 'sass:string';

@function _oklch($l, $c, $h, $alpha: null) {
  @if $alpha {
    @return string.unquote('oklch(#{$l} #{$c} #{$h} / #{$alpha})');
  }
  @return string.unquote('oklch(#{$l} #{$c} #{$h})');
}
```

This affects `_colors.scss` (all oklch/light-dark values), `_document.scss` (grid calc), and `_typography.scss` (mark element colors). The pattern is invisible in the CSS output — it only matters for the SCSS authoring layer.

The `@layer` order declaration also required extraction into a separate `_layers.scss` partial because Sass enforces that all `@use` rules precede any other rules, and `@layer nimble.reset, ...` counts as a CSS rule.

### 15.8 Visited Link Color

Visited links use `color-mix()` to blend 40% primary with purple (`oklch(0.5 0.2 310)`), giving a recognizable but on-brand visited state. The underline color matches via the same blend. This avoids hardcoding a separate visited color variable.

### 15.9 Button Variants in Utilities Layer

`.secondary` and `.outline` are class-based variants, so they belong in `@layer nimble.utilities`, not `nimble.base`. The base button style (primary bg, white text) is classless and lives in `nimble.base`. This keeps the layer semantics clean: base = classless defaults, utilities = opt-in classes.

### 15.10 `text-wrap: balance` on Headings and Table Headers

Applied to h1-h6 and `thead` cells. Prevents awkward single-word runts on the last line. Well-supported: Chrome 114+, Firefox 121+, Safari 17.5+. Progressive enhancement — ignored by older browsers.

### 15.11 Button Group Dividers

Same-type button groups (e.g. three primary buttons) have no visible boundary between siblings because the border color matches the background. A `box-shadow: -1px 0 0 rgb(255 255 255 / 0.3)` on `* + *` children provides a subtle white divider that works on both primary and secondary backgrounds. Box-shadow was chosen over `border-inline-start` because variant classes (`.secondary`) set `border-color` via a higher cascade layer, which would override a border-based divider.

### 15.12 Pill-Shaped Search Groups

`[role="search"] [role="group"]` children get `5rem` border-radius on the outer corners, producing pill ends. Extra `padding-inline` on the first/last children prevents text from crowding the curve. This matches PicoCSS's search aesthetic without requiring a dedicated class.

### 15.13 WCAG AA Contrast Tuning

The initial primary lightness (0.55) failed AA for links on `surface-2` in light mode (4.16:1, needed 4.5:1). In dark mode, white text on the lighter primary (L=0.65) only reached 3.23:1.

**Fixes applied:**
- `$primary-lightness` lowered from 0.55 to 0.50. Light-mode primary on surface-2 now 5.11:1.
- `primary-contrast` and `secondary-contrast` changed from `#fff` to `light-dark(#fff, oklch(0.15 0.005 250))`. In dark mode, buttons use near-black text on lighter accent backgrounds. All dark-mode button pairings pass AA (5.01:1 to 8.33:1).

This uses a different contrast color per mode -- white in light, near-black in dark -- which is the same approach major design systems use (Material, Carbon).

### 15.12 Solarized's Influence on the Surface Model

Solarized uses 8 monotone values in symmetric lightness pairs:

```
Dark mode:   base03 (bg) -> base02 (highlight bg) -> base01 (comments) -> base00 (emphasis)
Light mode:  base3  (bg) -> base2  (highlight bg) -> base1  (comments) -> base0  (emphasis)
```

The key insight: **swapping background and content uses of these pairs** inverts the theme while maintaining identical contrast ratios. nimble.css applies this principle with `surface-1` through `surface-4`: in dark mode, the values invert but the relationships hold. The oklch color space makes this explicit -- only the lightness component changes.

## 16. Open Questions

### 16.1 Final Color Values

The oklch values in Section 5.2 are illustrative. Final tuning needed:
- Validate surface contrast ratios meet WCAG AA for text on each surface level.
- Ensure the primary blue matches PicoCSS's aesthetic feel.
- Test the full palette on real content in both light and dark modes.

### 16.2 Input Background — Resolved

Form inputs previously used `var(--nc-surface-3)` as background. In light mode this produced a visible gray tint that looked odd for text inputs (users expect near-white). But `pre` blocks and `thead` rows also use surface-2/3 and need that contrast to stand out from the page.

**Solution:** Derive the input background via `color-mix()` from existing surface tokens — `color-mix(in oklch, var(--nc-surface-1), var(--nc-surface-2) 20%)`. This gives a barely-there tint in light mode (close to page white) and a slight lift in dark mode, without adding any public custom property. Implemented as a private `--_input-bg` variable scoped to form elements.

**Alternatives rejected:**
- A new `--nc-input-bg` public token — adds to the variable count for a narrow use case.
- Making `surface-3` lighter globally — collapses visual hierarchy between surface-2 and surface-3.
- Using `surface-1` directly — border-only distinction is too subtle for some contexts.

### 16.3 Future Considerations

- **Container queries** for component-level responsiveness.
- **View transitions** integration for theme switching animations.
- **Logical properties** throughout (already partially adopted).
- **Theme generator** -- web UI wrapping the SCSS `$primary-hue` / `$surface-hue` parameters, previewing the compiled output in real time.
- **Open Props bridge** -- optional SCSS module or CSS file mapping `--nc-*` to `var(--open-props-*)` for dynamic theme integration.

---

## Appendix: Implementation Plan

### Phase 1: Scaffold

Set up the project infrastructure and a test page for visual verification throughout development.

- [x] `package.json` (name, exports, scripts, devDependencies: `sass`, `lightningcss-cli`)
- [x] `build.js` — Sass compile + Lightning CSS minify pipeline, `--prefix` flag support
- [x] `src/_config.scss` — all `!default` variables (prefix, feature flags, color parameters, typography, spacing, breakpoints)
- [x] `demo/index.html` — html5-test-page based, all standard elements, links to `dist/nimble.css` (used as visual regression test throughout all phases)
- [x] `.gitignore` (`dist/`, `node_modules/`)
- [x] Verify: `npm run build` produces an empty but valid `dist/nimble.css`; `demo/index.html` renders with browser defaults

### Phase 2: Core

The foundational layers that everything else builds on.

- [x] `src/_layers.scss` — `@layer` order declaration (extracted; Sass requires `@use` before any rules)
- [x] `src/_reset.scss` — trimmed sanitize.css wrapped in `@layer nimble.reset`
- [x] `src/_colors.scss` — oklch surface generation, primary/secondary/feedback colors, all via `light-dark()`
- [x] `src/_document.scss` — `html`, `body` (grid centering), `*`, `::selection`
- [x] `src/_typography.scss` — headings, `p`, lists, `blockquote`, `hr`, `mark`, vertical rhythm
- [x] `src/nimble.scss` — entry point, `@use` all partials (layer order via `_layers.scss`)
- [x] Verify: readable text on correct surface background in both light and dark mode
- Output: `nimble.css` 6,792 B / `nimble.min.css` 5,044 B

### Phase 3: Elements

One partial per element group. Each can be implemented and visually tested independently.

- [x] `src/_links.scss` — `a` styling, underline via `color-mix()`, visited purple shift, hover
- [x] `src/_buttons.scss` — button base, `.secondary`/`.outline` variants (in `nimble.utilities` layer), button groups, disabled state
- [x] `src/_forms.scss` — text inputs, select, textarea, labels, fieldset, validation (`aria-invalid`), `accent-color` for checkbox/radio/range, switch toggle (behind `$enable-switch`)
- [x] `src/_tables.scss` — table base, thead with `text-wrap: balance`, `figure:has(table)` overflow
- [x] `src/_code.scss` — inline `code`/`kbd`/`samp`, `pre` blocks, `pre code` reset, `kbd` raised border
- [x] `src/_media.scss` — responsive `img`/`video`/`canvas`/`svg`, `figure`/`figcaption`
- [x] `src/_details.scss` — `details`/`summary` (behind `$enable-details` flag)
- [x] `src/_dialog.scss` — `dialog`/`::backdrop` (behind `$enable-dialog` flag)
- [x] `src/_print.scss` — unlayered `@media print` rules
- [x] Verify: all element styles render correctly against html5-test-page structure
- Output: `nimble.css` 14,128 B / `nimble.min.css` 10,919 B / gzipped ~2.9 KB

### Phase 4: Polish

Utilities, extended demo, and final validation.

- [x] `src/_utilities.scss` — `.container`, `.fluid`, `.full-bleed`, `.wide`, `.striped`, `.visually-hidden`, `.overflow-auto` (in `@layer nimble.utilities`, behind `$enable-utilities`)
- [x] Wire `_utilities.scss` in `nimble.scss`
- [x] Fix input backgrounds — replaced `surface-3` with `color-mix(in oklch, surface-1, surface-2 20%)` via private `--_input-bg` variable
- [x] `demo/extended.html` — layout modes, button variants + groups (including same-type groups), form patterns (login/registration/search with pill-shaped search bar), surface hierarchy swatches, dark mode toggle, striped table, dialog demo
- [x] WCAG AA color audit — lowered `$primary-lightness` from 0.55 to 0.50; switched `primary-contrast` and `secondary-contrast` to `light-dark(#fff, oklch(0.15 0.005 250))` for dark-mode button readability. All pairings pass AA.
- [x] Light-mode `text-2` lightened from L=0.450 to L=0.580 for visible distinction from `text-1` (L=0.280)
- [x] Button group fixes — stripped margin on children, box-shadow dividers between same-type siblings, pill-shaped search groups via `[role="search"] [role="group"]`
- [x] Outline button hover keeps outline style (subtle `primary-focus` tint instead of solid fill)
- [x] `.wide` utility: added `width: 100%` so it stretches within `grid-column: 1 / -1`
- [x] Measure `dist/nimble.min.css` against size budget — 11,924 B min / **3,131 B gzipped** (budget: <8 KB min+gz)
- [x] Verify: all four feature flags (`$enable-dialog`, `$enable-switch`, `$enable-details`, `$enable-utilities`) correctly exclude output when disabled
- Output: `nimble.css` 15,467 B / `nimble.min.css` 11,924 B / gzipped ~3.1 KB
- Post-phase additions (details animation, dialog, form restyling, button groups, meter/progress, landing page): `nimble.css` 25,279 B / `nimble.min.css` 19,454 B / gzipped ~4.4 KB / brotli ~3.9 KB
- Refactor (date/time dedup, extract progress/meter/select to add-on sub-bundles): `nimble.css` 24,963 B / `nimble.min.css` 19,355 B / gzipped ~4.4 KB / brotli ~3.9 KB
- Flip model (nimble = core without extras, nimble-full = everything): `nimble.min.css` 15,796 B / gzipped ~3.8 KB / brotli ~3.3 KB
- Fix progress by excluding from reset `background-repeat` rule; progress add-on fully opt-in: `nimble.min.css` 15,809 B / gzipped ~3.8 KB / brotli ~3.3 KB
  - Add `@scope`-based `.no-nimble` opt-out: split SCSS into global vs scopeable modules; component styles wrapped in `@scope (:root) to (.no-nimble)`; layout utilities kept global: `nimble.min.css` 22,655 B / `nimble-core.min.css` 18,978 B
  - Disable `@scope` by default due to desktop Safari 18.x bug (styles parsed but not applied to input/select/textarea/details inside `@scope` + `@layer`). `.no-nimble` becomes opt-in via `nimble-scope.js` (JS progressive enhancement) or `$exclude-selector` SCSS flag. See `specs/safari-bugs.md`.

---

## Appendix: Size Budget

| Metric | Estimated | Actual |
|---|---|---|
| Full build (brotli) | ~5.0 KB | **3.3 KB** |
| Full build (gzip) | — | 3.8 KB |
| Full build (min) | — | 15.4 KB |
| Full build (unmin) | — | 19.9 KB |
| Full build + extras (min) | — | 18.9 KB |
| With all flags off (unmin) | — | ~13.0 KB |
| Budget ceiling | 8 KB min+gz | 3.3 KB brotli / 3.8 KB gzip (48% of budget) |

The final output is well under all budget targets. The `light-dark()` function and CSS cascade layers compress extremely well because they reuse the same variable names repeatedly.

## Appendix: Comparison Matrix

| Feature | nimble.css | PicoCSS | Open Props Normalize | simple.css | new.css | MVP.css |
|---|---|---|---|---|---|---|
| Min+gz size | **~3.3 KB** | ~13 KB | ~3 KB* | ~4 KB | ~4.5 KB | ~8.5 KB |
| CSS vars on :root | ~20 | 100+ | ~0 (on-demand) | ~15 | ~12 | ~15 |
| Breakpoints | 1 | 5 | 0 | 1 | 0 | 1 |
| Surface colors | Yes (4) | No | Yes | No | No | No |
| Dark mode | light-dark() + manual | Auto + manual | Auto | Auto | Auto | Opt-in attr |
| Form styling | Full | Full | Minimal | Basic | Basic | Basic |
| Button groups | Yes | Yes | No | No | No | No |
| Classes needed | ~8 | ~12 | 0 | ~3 | 0 | 0 |
| npm installable | Yes | Yes | Yes | Yes | Yes | Yes |
| Built CSS in repo | No | Yes | Yes | No | Yes | Yes |
| Cascade layers | Yes | No | No | No | No | No |
| Build-time config (SCSS) | Yes | Yes | No | No | No | No |

\* Open Props Normalize requires Open Props itself for the full experience.
