# nimble.css

Minimal CSS library that makes semantic HTML look nice; no classes required. ~3.3 KB brotli (core).

- **Classless** — every standard HTML element elegantly styled without classes
- **Dark mode** — included (automatic and manual)
- **Cascade layers** — plays nicely alongside your own styles
- **Tiny** — core is only ~3.3 KB brotli (15.4 KB minified)

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

Or via GitHub (latest on `main`):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Leftium/nimble.css@main/dist/nimble.min.css">
```

</details>

<details>
<summary>For 3.3 KB core size</summary>

`nimble.min.css` (18.9 KB) includes everything.

To trim size, use `nimble-core.min.css` (15.4 KB) + only the add-ons you need:

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
| `nimble-base.min.css` | 3.4 KB | Colors + document + typography |
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

Override any property at runtime — no build step needed:

```css
:root {
  /* Background hierarchy: page, card, input, overlay */
  --nc-surface-1: light-dark(oklch(0.985 0.002 250), oklch(0.17 0.005 260));
  --nc-surface-2: light-dark(oklch(0.955 0.002 250), oklch(0.2 0.005 260));
  --nc-surface-3: light-dark(oklch(0.925 0.002 250), oklch(0.23 0.005 260));
  --nc-surface-4: light-dark(oklch(0.885 0.002 250), oklch(0.27 0.005 260));

  /* Text color (adapts to light/dark mode) */
  --nc-text: light-dark(oklch(0.28 0.005 250), oklch(0.86 0.005 250));
  --nc-border: light-dark(oklch(0.83 0.005 250), oklch(0.28 0.005 260));

  /* Primary accent (links, buttons, focus rings) */
  --nc-primary: light-dark(oklch(0.5 0.2 250), oklch(0.6 0.2 250));
  --nc-primary-hover: light-dark(oklch(0.4 0.2 250), oklch(0.7 0.2 250));
  --nc-primary-focus: oklch(0.5 0.2 250 / 0.4);
  --nc-primary-contrast: light-dark(#fff, oklch(0.15 0.005 250));

  /* Secondary accent (reset buttons) */
  --nc-secondary: light-dark(oklch(0.45 0.05 250), oklch(0.6 0.05 250));
  --nc-secondary-hover: light-dark(oklch(0.35 0.05 250), oklch(0.7 0.05 250));
  --nc-secondary-focus: oklch(0.45 0.05 250 / 0.3);
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

### SCSS

For build-time customization, override config variables:

```scss
@use 'nimble' with (
  /* CSS custom property prefix */
  $prefix: '--nc-',

  /* Primary accent hue, chroma, lightness (OKLCH) */
  $primary-hue: 250,
  $primary-chroma: 0.2,
  $primary-lightness: 0.50,

  /* Secondary accent (OKLCH) */
  $secondary-hue: 250,
  $secondary-chroma: 0.05,
  $secondary-lightness: 0.45,

  /* Background surface hue */
  $surface-hue: 250,

  /* Font stacks */
  $font-sans: system-ui, sans-serif,
  $font-mono: ui-monospace, monospace,

  /* Layout */
  $spacing: 1rem,
  $radius: 0.25rem,
  $content-width: 720px,
  $wide-width: 1200px,

  /* Feature flags */
  $enable-utilities: true,
  $enable-dialog: true,
  $enable-switch: true,
  $enable-details: true,
);
```

## Design Lineage

nimble.css combines [Open Props](https://open-props.style/)'s design token philosophy with [PicoCSS](https://picocss.com/)'s classless aesthetics. Key concepts borrowed from Open Props:

- **Surface hierarchy** (`surface-1` through `surface-4`) — layered backgrounds for page, card, input, and overlay contexts. Defined in `_colors.scss` from OKLCH parameters rather than imported at runtime.
- **Text color** (`text`) — single text color variable; muted text derived inline via `color-mix()`.
- **OKLCH color space** — perceptually uniform color system. Change `$primary-hue` and the entire palette regenerates consistently.
- **Curated scale values** — `$spacing: 1rem` (~Open Props `size-3`) and `$radius: 0.25rem` (~Open Props `radius-2`) are sourced from Open Props' scales.
- **Minimal DevTools pollution** — ~20 semantic custom properties on `:root` plus scoped `--_` internals per component, rather than dumping hundreds of variables globally.

The key architectural difference: nimble.css is self-contained SCSS with no runtime dependency on Open Props. Token values are baked in at compile time, and the SCSS parametric layer (change one hue, regenerate everything) goes beyond what pure CSS custom properties can offer.

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
