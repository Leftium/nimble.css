# nimble.css

Minimal CSS library that makes semantic HTML look nice; no classes required. ~3.4 KB brotli (core).

- **Classless** — every standard HTML element elegantly styled without classes
- **Dark mode** — included (automatic and manual)
- **Cascade layers** — plays nicely alongside your own styles
- **Tiny** — core is only ~3.4 KB brotli (15.9 KB minified)

## Demos

- [HTML5 Test Page](https://leftium.github.io/nimble.css/demo/) — every standard HTML element
- [Extended Demo](https://leftium.github.io/nimble.css/demo/extended.html) — layouts, utilities, button variants, forms, dark mode toggle

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

Via jsDelivr (npm):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@leftium/nimble.css/dist/nimble.min.css">
```

</details>

<details>
<summary>For 3.4 KB core size</summary>

`nimble.min.css` (19.4 KB) includes everything.

To trim size, use `nimble-core.min.css` (15.9 KB) + only the add-ons you need:

| Add-on | Minified |
|---|---|
| `nimble-progress.min.css` | 1.6 KB |
| `nimble-meter.min.css` | 1.0 KB |
| `nimble-select.min.css` | 1.0 KB |

Mix and match with CDN links (comment out what you don't need):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@leftium/nimble.css/dist/nimble-core.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@leftium/nimble.css/dist/nimble-progress.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@leftium/nimble.css/dist/nimble-meter.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@leftium/nimble.css/dist/nimble-select.min.css">
```

Or with SCSS (comment out what you don't need):

```scss
@use '@leftium/nimble.css/scss/core';       // core
@use '@leftium/nimble.css/scss/progress';   // add-ons
@use '@leftium/nimble.css/scss/meter';
@use '@leftium/nimble.css/scss/select';
```

<details>
<summary>Granular sub-bundles</summary>

For advanced use, `nimble-core` is composed of these non-overlapping layers:

| Sub-bundle | Minified | Contents |
|---|---|---|
| `nimble-reset.min.css` | 1.8 KB | Modern CSS reset |
| `nimble-base.min.css` | 3.8 KB | Colors + document + typography |
| `nimble-utilities.min.css` | 572 B | Utility classes |

</details>

</details>

That's it. Write semantic HTML and it just works.

## Utility Classes

Content is centered at `720px` by default — no class needed. These opt-in utilities handle the rest. Disable all with `$enable-utilities: false`.

| Class | Description |
|---|---|
| `.fluid` | Full viewport width with padding (opt out of centering) |
| `.container` | Re-center content inside a `.fluid` layout |
| `.full-bleed` | Break out of centered layout to full width |
| `.wide` | Break out to wide max-width (1200px) |
| `.striped` | Striped table rows (apply to table wrapper) |
| `.visually-hidden` | Hidden visually, accessible to screen readers |
| `.overflow-auto` | Scrollable container |

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
  --nc-content-width: 720px;
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
  $content-width: 720px,
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
node build.js
```

Output goes to `dist/`. Use `--prefix` to set a custom CSS property prefix:

```bash
node build.js --prefix '--my-'
```

## License

MIT
