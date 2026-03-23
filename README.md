# nimble.css

A minimal class/classless CSS library. Drop it in and your semantic HTML looks good — no classes required. ~3 KB gzipped.

- **Classless by default** — style every standard HTML element with zero markup changes
- **Automatic dark mode** — via `prefers-color-scheme` and `light-dark()`
- **OKLCH color system** — perceptually uniform, fully customizable via SCSS config
- **Cascade layers** — plays nicely alongside your own styles
- **Tiny** — 11.9 KB minified, ~3.1 KB gzipped

## Demos

- [HTML5 Test Page](https://leftium.github.io/nimble.css/demo/) — every standard HTML element
- [Extended Demo](https://leftium.github.io/nimble.css/demo/extended.html) — layouts, utilities, button variants, forms, dark mode toggle

## Quick Start

### CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Leftium/nimble.css@main/dist/nimble.min.css">
```

That's it. Write semantic HTML and it just works.

### Download

Grab [`nimble.min.css`](dist/nimble.min.css) from this repo and include it locally:

```html
<link rel="stylesheet" href="nimble.min.css">
```

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

nimble.css is built with SCSS. Override any config variable:

```scss
@use 'nimble' with (
  $primary-hue: 150,
  $primary-chroma: 0.15,
  $radius: 0.5rem,
  $content-width: 960px,
  $enable-dialog: false,
);
```

### Config Variables

| Variable | Default | Description |
|---|---|---|
| `$prefix` | `'--nc-'` | CSS custom property prefix |
| `$primary-hue` | `250` | Primary accent hue (OKLCH) |
| `$primary-chroma` | `0.2` | Primary accent chroma |
| `$primary-lightness` | `0.50` | Primary accent lightness |
| `$secondary-hue` | `250` | Secondary accent hue |
| `$secondary-chroma` | `0.05` | Secondary accent chroma |
| `$secondary-lightness` | `0.45` | Secondary accent lightness |
| `$surface-hue` | `250` | Background surface hue |
| `$font-sans` | `system-ui, sans-serif` | Body font stack |
| `$font-mono` | `ui-monospace, ...` | Code font stack |
| `$spacing` | `1rem` | Base spacing unit |
| `$radius` | `0.25rem` | Border radius |
| `$content-width` | `720px` | Max content width |
| `$wide-width` | `1200px` | Wide layout max-width |
| `$enable-utilities` | `true` | Include utility classes |
| `$enable-dialog` | `true` | Include dialog styles |
| `$enable-switch` | `true` | Include switch toggle |
| `$enable-details` | `true` | Include details/summary |

## Design Lineage

nimble.css combines [Open Props](https://open-props.style/)'s design token philosophy with [PicoCSS](https://picocss.com/)'s classless aesthetics. Key concepts borrowed from Open Props:

- **Surface hierarchy** (`surface-1` through `surface-4`) — layered backgrounds for page, card, input, and overlay contexts. Defined in `_colors.scss` from OKLCH parameters rather than imported at runtime.
- **Text hierarchy** (`text-1`, `text-2`) — primary and muted text colors, same naming convention as Open Props.
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
