<div align="center"><img src="https://leftium.github.io/nimble.css/static/logo.svg" alt="nimble.css logo" width="200" />

  # Nimble.css
</div>

Minimal CSS library for great-looking default HTML styles; no classes required. ~3.8 KB brotli (core).



- **Classless** — every standard HTML element elegantly styled without classes
- **Dark mode** — included (automatic and manual)
- **Cascade layers** — plays nicely alongside your own styles
- **Tiny** — core is only ~3.8 KB brotli (19.6 KB minified)

## Demos

- [HTML5 Test Page](https://leftium.github.io/nimble.css/demo/) — every standard HTML element
- [Extended Demo](https://leftium.github.io/nimble.css/demo/extended.html) — layouts, utilities, button variants, forms, dark mode toggle
- [Pico CSS-style Demo](https://leftium.github.io/nimble.css/demo/pico.html) — Pico CSS-inspired page with forms, buttons, article, tables, and more
- [Bookmarklet](https://leftium.github.io/nimble.css/bookmarklet.html) — apply nimble.css to any website with one click

## Quick Start

```bash
npm install @leftium/nimble.css
```

Then import in your CSS, JS, or framework:

```css
/* CSS */
@import '@leftium/nimble.css';
```

```js
// JS / framework entry point
import '@leftium/nimble.css';
```

<details>
<summary>Or use CDN</summary>

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@leftium/nimble.css/dist/nimble.min.css">
```

</details>

<details>
<summary>For 3.8 KB core size</summary>

`nimble.min.css` (23.3 KB) includes everything.

To trim size, use `nimble-core.min.css` (19.6 KB) + only the add-ons you need:

| Add-on | Minified |
|---|---|
| `nimble-shadow.min.css` | 1.7 KB |
| `nimble-meter.min.css` | 1.0 KB |
| `nimble-select.min.css` | 1.1 KB |

Mix and match with CDN links (comment out what you don't need):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@leftium/nimble.css/dist/nimble-core.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@leftium/nimble.css/dist/nimble-shadow.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@leftium/nimble.css/dist/nimble-meter.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@leftium/nimble.css/dist/nimble-select.min.css">
```

Or with SCSS (comment out what you don't need):

```scss
@use '@leftium/nimble.css/scss/core';       // core
@use '@leftium/nimble.css/scss/shadow';     // add-ons
@use '@leftium/nimble.css/scss/meter';
@use '@leftium/nimble.css/scss/select';
```

<details>
<summary>Granular sub-bundles</summary>

For advanced use, `nimble-core` is composed of these non-overlapping layers:

| Sub-bundle | Minified | Contents |
|---|---|---|
| `nimble-reset.min.css` | 1.5 KB | Modern CSS reset |
| `nimble-base.min.css` | 4.0 KB | Colors + document + typography |
| `nimble-utilities.min.css` | 274 B | Utility classes |

</details>

</details>

That's it. Write semantic HTML and it just works.

## Utility Classes

Content is centered at `60ch` by default — no class needed. These opt-in utilities handle the rest. Disable all with `$enable-utilities: false`.

| Class | Description |
|---|---|
| `.fluid` | Full viewport width with padding (opt out of centering) |
| `.container` | Re-center content inside a `.fluid` layout |
| `.bleed-full` | Break out of centered layout to full viewport width |
| `.bleed-wide` | Break out to wide max-width (1200px) |
| `.bleed-edge` | Break out to shadow/paper edge (requires shadow add-on) |
| `.striped` | Striped table rows (apply to table wrapper) |
| `.visually-hidden` | Hidden visually, accessible to screen readers |
| `.overflow-auto` | Scrollable container |

## Third-Party Component Isolation

nimble.css styles can conflict with third-party components (datatables, rich text editors, etc.) that expect unstyled elements. Add `.no-nimble` to opt out of nimble's component styles inside a subtree:

```html
<main class="fluid bleed-full">
  <h1>Styled by nimble</h1>

  <!-- Third-party component: nimble styles don't apply inside -->
  <div class="no-nimble bleed-full">
    <ThirdPartyDataTable />
  </div>
</main>
```

**What's excluded:** Typography, links, buttons, forms, tables, code, media, article, details, dialog, and non-layout utilities.

**What still applies:** Reset, colors/custom properties, body grid, layout utilities (`.fluid`, `.bleed-full`, `.bleed-wide`, `.container`), content shadow (if enabled), and print styles. This means layout classes work on `.no-nimble` elements.

This works via CSS `@scope` (Chrome 118+, Safari 17.4+, Firefox 128+). To disable scoping entirely (smaller output, no opt-out):

```scss
@use '@leftium/nimble.css/scss' with (
  $exclude-selector: null
);
```

## Customization

### CSS Custom Properties

Override at runtime — no build step needed. Hover and focus states auto-derive from the base color via [relative color syntax](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors).

```css
:root {
  /* Surface hue (shared by backgrounds, text, border) */
  --nc-surface-hue: 250;

  /* Primary accent (links, buttons, focus rings) — hover/focus auto-derive */
  --nc-primary: light-dark(oklch(0.5 0.2 250), oklch(0.6 0.2 250));
  --nc-primary-contrast: light-dark(#fff, oklch(0.15 0.005 250));

  /* Secondary accent (reset buttons) — hover/focus auto-derive */
  --nc-secondary: light-dark(oklch(0.45 0.05 250), oklch(0.6 0.05 250));
  --nc-secondary-contrast: light-dark(#fff, oklch(0.15 0.005 250));

  /* Validation colors */
  --nc-valid: light-dark(oklch(0.52 0.17 145), oklch(0.65 0.2 145));
  --nc-invalid: light-dark(oklch(0.55 0.22 25), oklch(0.65 0.22 25));

  /* Font stacks */
  --nc-font-sans: system-ui, sans-serif;
  --nc-font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;

  /* Layout */
  --nc-spacing: 1rem;
  --nc-radius: 0.25rem;
  --nc-content-width: 60ch;
}
```

These properties are auto-derived and available for use in your own components (no need to set them):

`--nc-surface-1` .. `--nc-surface-4`, `--nc-text`, `--nc-border`, `--nc-primary-hover`, `--nc-primary-focus`, `--nc-secondary-hover`, `--nc-secondary-focus`

<details>
<summary>SCSS (advanced)</summary>

Build a CSS file with new defaults. SCSS-unique options listed first; the rest mirror CSS custom properties above.

```scss
@use 'nimble' with (
  // --- SCSS-only (no CSS custom property equivalent) ---

  $prefix: '--nc-',        // CSS custom property prefix
  $wide-width: 1200px,     // wide layout max-width (used in utilities)

  // Feature flags (tree-shake unused components)
  $enable-utilities: true,
  $enable-dialog: true,
  $enable-switch: true,
  $enable-details: true,

  // Scoping (set to null to disable @scope wrapping)
  $exclude-selector: '.no-nimble',

  // Surface fine-tuning
  $surface-chroma: 0.002,
  $surface-light-base: 0.985,     // light mode base lightness
  $surface-dark-base: 0.170,      // dark mode base lightness
  $surface-offsets: (2: 0.03, 3: 0.06, 4: 0.10),
  $surface-dark-chroma-boost: 0.003,
  $surface-dark-hue-shift: 10,

  // --- Same as CSS custom properties above ---

  $surface-hue: 250,

  // Primary accent (hue, chroma, lightness → --nc-primary)
  $primary-hue: 250,
  $primary-chroma: 0.2,
  $primary-lightness: 0.50,

  // Secondary accent (hue, chroma, lightness → --nc-secondary)
  $secondary-hue: 250,
  $secondary-chroma: 0.05,
  $secondary-lightness: 0.45,

  // Font stacks
  $font-sans: (system-ui, sans-serif),
  $font-mono: (ui-monospace, monospace),

  // Layout
  $spacing: 1rem,
  $radius: 0.25rem,
  $content-width: 60ch,
);
```

</details>

## Design Lineage

nimble.css combines [Open Props](https://open-props.style/)'s design token philosophy with [PicoCSS](https://picocss.com/)'s classless aesthetics. Key concepts borrowed from Open Props:

- **Surface hierarchy** (`surface-1` through `surface-4`) — layered backgrounds for page, card, input, and overlay contexts, all derived from a single `--nc-surface-hue`.
- **Text color** (`text`) — single text color variable; muted text derived inline via `color-mix()`.
- **OKLCH color space** — perceptually uniform color system. Change `--nc-primary` and hover/focus states regenerate automatically via [relative color syntax](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors).
- **Curated scale values** — `$spacing: 1rem` (~Open Props `size-3`) and `$radius: 0.25rem` (~Open Props `radius-2`) are sourced from Open Props' scales.
- **Minimal DevTools pollution** — ~20 semantic custom properties on `:root` plus scoped `--_` internals per component, rather than dumping hundreds of variables globally.

The key architectural difference: nimble.css is self-contained SCSS with no runtime dependency on Open Props. Color derivatives (hover, focus, surfaces) are expressed as native CSS relative colors and `calc()`, so runtime theming works without a build step.

## Building from Source

```bash
pnpm install
pnpm build
```

Output goes to `dist/`. Use `--prefix` to set a custom CSS property prefix:

```bash
pnpm build -- --prefix '--my-'
```

For local development with live reload:

```bash
pnpm dev
```

## License

MIT
