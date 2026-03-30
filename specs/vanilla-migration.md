# Migrating Vanilla CSS Projects to nimble.css

> A plan and tracker for adding nimble.css to projects that use no CSS framework — just hand-written CSS, sanitize.css, and/or Open Props design tokens.

**Status:** Living document
**Last updated:** 2026-03-30

---

## Table of Contents

1. [Overview](#1-overview)
2. [What nimble.css Replaces](#2-what-nimblecss-replaces)
3. [Project Analysis](#3-project-analysis)
4. [Migration Order](#4-migration-order)
5. [Common Migration Patterns](#5-common-migration-patterns)
6. [Migration Log](#6-migration-log)

---

## 1. Overview

These six projects share a common pattern: SvelteKit 5 apps with hand-written CSS, no heavyweight framework. Some use `sanitize.css` for a reset and `open-props` / `open-props-scss` for design tokens. All use Svelte's scoped `<style>` blocks for component styling.

Adding nimble.css to these projects provides:
- **CSS reset** (replaces `sanitize.css` where present)
- **Typography baseline** (heading scale, body text, list spacing, `text-wrap: balance`)
- **Form styling** (inputs, selects, textareas, buttons, checkboxes, switches)
- **Body grid layout** (centered content column, `.bleed-edge`/`.bleed-wide`/`.bleed-full` breakouts)
- **Light/dark mode** via `light-dark()` and `color-scheme`
- **Cascade layers** (`@layer nimble.reset, nimble.base, nimble.utilities`) — unlayered project CSS always wins

Unlike the Pico migrations (see [pico-migration.md](pico-migration.md)), these projects have no framework-specific classes or variables to remap. The main work is:
1. Replacing `sanitize.css` imports with nimble.css
2. Deciding which Open Props tokens to keep vs. replace with `--nc-*` equivalents
3. Identifying component styles that conflict with nimble's element-level defaults
4. Using `.no-nimble` to isolate components that manage their own styling

---

## 2. What nimble.css Replaces

### 2.1 sanitize.css

Three of the six projects import `sanitize.css` (a modern CSS normalizer). nimble.css includes its own reset layer (`@layer nimble.reset`) that covers the same ground — `box-sizing: border-box`, consistent line-height, responsive media, form inheritance, etc.

**Migration:** Remove `sanitize.css` imports. nimble's reset handles it.

```diff
- import 'sanitize.css'
- import 'sanitize.css/forms.css'
- import 'sanitize.css/typography.css'
+ import '@leftium/nimble.css'
```

### 2.2 Open Props / Open Props SCSS

Two projects use Open Props for design tokens:
- **hn** uses `open-props` (CSS custom properties: `--size-*`, `--font-size-*`, `--font-weight-*`, `--shadow-*`)
- **veneer** uses `open-props-scss` (SCSS variables: `$size-*`, `$font-size-*`, etc.)

nimble.css does **not** replace Open Props. They serve different purposes:
- **Open Props** = design tokens (a vocabulary of spacing/color/type values)
- **nimble.css** = element styling (how HTML elements look by default)

**Migration strategy:** Keep Open Props alongside nimble.css. They coexist without conflict (confirmed in zbang and leftium.com Pico migrations). Remove `sanitize.css` imports but retain Open Props imports.

```diff
- import 'sanitize.css'
- import 'sanitize.css/forms.css'
  import 'open-props/style'    // keep — design tokens
+ import '@leftium/nimble.css'  // add — reset + element styles
```

### 2.3 Hand-rolled resets

Projects without `sanitize.css` (rift-transcription, gg, leftium-logo) have minimal hand-rolled resets:
- `body { margin: 0; font-family: system-ui; line-height: 1.5; }`
- Sometimes `color: #1a1a1a` or `background-color: white`

nimble.css replaces all of these. After adding nimble, remove redundant body resets but keep any project-specific overrides (custom font-size, background color, etc.).

### 2.4 Custom form styling

Projects with form elements (rift-transcription, veneer, weather-sense) have hand-written input/button/select styles. nimble.css provides comprehensive form styling out of the box. After migration:
- Compare nimble's defaults with the project's custom styles
- Remove custom styles that nimble handles equivalently
- Keep custom styles that are intentionally different from defaults
- Use `.no-nimble` on form containers where nimble's styles conflict with custom UI

---

## 3. Project Analysis

### 3.1 rift-transcription

| Attribute | Value |
|---|---|
| **Location** | `/Volumes/p/RIFT/rift-transcription` |
| **Stack** | SvelteKit 5, TypeScript, Vite 7 |
| **CSS reset** | None |
| **CSS framework** | None |
| **CSS dependencies** | None |
| **Custom CSS** | ~787 lines across 5 components |
| **Routes** | 3 (`/`, `/local-setup`, `/sherpa`) |
| **SCSS** | No |

**Current CSS approach:** All styling in Svelte scoped `<style>` blocks. No global CSS file. No `app.css`. Each page independently sets `max-width: 640px; margin: 0 auto; padding: 24px 16px; font-family: system-ui`. Browser defaults relied upon for everything else.

**What nimble.css provides:**
- CSS reset (currently missing — browser defaults vary)
- Typography baseline (headings, paragraphs, lists, code blocks)
- Form styling (inputs, buttons, selects, textareas — all used heavily)
- Body grid with centered content (replaces duplicated `max-width: 640px; margin: 0 auto`)
- `<details>`/`<summary>` animation (used on setup pages)
- Data table styling (used on local-setup page)
- `<article>` card styling (used on AQI-style layout)
- Light/dark mode support (currently unsupported)

**Key concerns:**
- **TranscriptArea overlay technique** — A transparent `<textarea>` overlays a colored `<div>` with identical font metrics. nimble's textarea styling (padding, font, border) must not break the alignment. May need `.no-nimble` on the overlay container, or careful overrides.
- **Pulsing status dot** — Custom `@keyframes pulse` animation. No conflict expected.
- **Code blocks with copy buttons** — nimble's `<pre>`/`<code>` styling should enhance these. Relative/absolute positioning for copy buttons is project-specific, no conflict.

**Migration complexity: Low.** Biggest win of all six projects — goes from zero reset/framework to full nimble.css baseline. Most hand-written styles are either replaceable by nimble defaults or project-specific enough to coexist.

**Estimated changes:**
- Add `@leftium/nimble.css` to `package.json`
- Create or update `src/app.css` with nimble import
- Update `+layout.svelte` to import app.css
- Remove duplicated `max-width`/`margin`/`padding`/`font-family` from 3 pages
- Set `--nc-content-width: 640px` (narrower than nimble's `60ch` default)
- Possibly add `.no-nimble` on TranscriptArea container
- Remove or reduce custom form styles that nimble now provides

---

### 3.2 gg (@leftium/gg)

| Attribute | Value |
|---|---|
| **Location** | `/Volumes/p/gg` |
| **Stack** | SvelteKit 5, TypeScript, Vite 7 (published npm library) |
| **CSS reset** | Hand-rolled (16 lines in `+layout.svelte`) |
| **CSS framework** | None |
| **CSS dependencies** | None |
| **Custom CSS** | ~818 lines (766 in Eruda plugin template literal, 52 in Svelte components) |
| **Routes** | 1 (demo page) |
| **SCSS** | No |

**Current CSS approach:** The demo page (`/`) has minimal styles — heading margins, flexbox button row, blue pill buttons. The bulk of CSS (~766 lines) is in the Eruda plugin, injected at runtime as a `<style>` block inside the Eruda panel DOM. This CSS is entirely self-contained and must not be affected by nimble.

**What nimble.css provides:**
- CSS reset (replaces the 16-line hand-rolled reset)
- Typography and button styling for the demo page
- Body grid centered layout (replaces `.container` with `max-width: 960px`)

**Key concerns:**
- **Eruda plugin CSS is isolated by architecture** — It lives inside the Eruda panel DOM, which is a separate subtree. nimble's `@scope` should not reach into it. However, the Eruda plugin also uses `all: unset` on several elements as defense. Verify no conflicts.
- **Library consumers** — `@leftium/gg` is imported by other projects. The library itself exports zero CSS files. Only the demo site is affected by this migration.
- **GgConsole component** — Renders in the consuming app's DOM. Verify it doesn't inherit nimble styles unexpectedly. If it does, `.no-nimble` on its container.

**Migration complexity: Low.** Only the demo page is affected. The Eruda plugin CSS is architecturally isolated.

**Estimated changes:**
- Add `@leftium/nimble.css` to `devDependencies` (demo-only, not shipped with library)
- Create `src/app.css` with nimble import
- Update `+layout.svelte` to import app.css, remove hand-rolled body reset
- Remove `.container` class and custom max-width (body grid handles it)
- Verify Eruda panel renders correctly
- Verify GgConsole component in consumer projects

---

### 3.3 leftium-logo (@leftium/logo)

| Attribute | Value |
|---|---|
| **Location** | `/Volumes/p/LEFTIUM/leftium-logo` |
| **Stack** | SvelteKit 5, TypeScript, Vite 7 (published npm library) |
| **CSS reset** | Hand-rolled (body margin:0, overflow:hidden) |
| **CSS framework** | None |
| **CSS dependencies** | None |
| **Custom CSS** | ~1,438 lines across 10 components |
| **Routes** | 8 (1 home + 1 test index + 6 test pages) |
| **SCSS** | No |

**Current CSS approach:** All scoped `<style>` blocks. The `LeftiumLogo` component has PicoCSS defense `!important` overrides (`max-width`, `padding`, `border`, `border-radius`, `outline`, `box-shadow`) because it's designed to be embedded in projects that use PicoCSS. Test pages each have self-contained styles with responsive breakpoints.

**What nimble.css provides:**
- CSS reset (replaces hand-rolled `body { margin: 0 }`)
- Typography for test page headings, paragraphs, labels
- Button styling for test page controls
- Card styling for test index page (currently hand-written hover cards)
- Dark mode support (currently using `prefers-color-scheme` manually)
- Body grid layout

**Key concerns:**
- **LeftiumLogo PicoCSS defenses** — The component uses `!important` to prevent PicoCSS from breaking SVG positioning. With nimble.css, two options: (a) keep the `!important` defenses (they also protect against nimble), or (b) replace with `.no-nimble` on the logo container. Option (b) is cleaner.
- **`overflow: hidden` on body** — The layout sets `body { overflow: hidden }` to prevent scrolling on the home page (logo fills viewport). This must be preserved. nimble does not set `overflow`.
- **Custom elements** — `<logo-container>` and `<grid-logo>` are used as element names. nimble won't style these (they're not standard HTML elements).
- **Test pages override body overflow** — Several test pages use `:global(body) { overflow-y: auto !important }`. This will still work with nimble.
- **Library consumers** — Like gg, the `LeftiumLogo` component is imported by other projects. Only the demo/test site is affected by this migration.

**Migration complexity: Low.** Mostly benefits the test/demo pages. The library component either keeps its `!important` defenses or gets `.no-nimble`.

**Estimated changes:**
- Add `@leftium/nimble.css` to `devDependencies`
- Create `src/app.css` with nimble import
- Update `+layout.svelte` to import app.css, remove hand-rolled body reset
- Evaluate replacing `!important` defenses with `.no-nimble` in LeftiumLogo
- Simplify test page card styles (nimble's `<article>` may suffice)
- Keep `overflow: hidden` on body
- Keep all responsive breakpoints and test-specific styles

---

### 3.4 hn (HN Reader)

| Attribute | Value |
|---|---|
| **Location** | `/Volumes/p/hn` |
| **Stack** | SvelteKit 5, TypeScript, Vite 7 (SPA, `ssr: false`) |
| **CSS reset** | sanitize.css v13 |
| **CSS framework** | None (open-props for design tokens only) |
| **CSS dependencies** | sanitize.css, open-props |
| **Custom CSS** | ~613 lines across 4 files |
| **Routes** | 2 (`/[source]/[[date]]`, `/config`) |
| **SCSS** | No |

**Current CSS approach:** Minimalist "100 bytes of CSS" philosophy. Global `app.css` (20 lines) sets `color-scheme: light dark`, centers at `max-width: 42.875em`, `system-ui` font, and `light-dark()` link colors. Each page imports `open-props/style` independently for `--size-*`, `--font-size-*`, `--font-weight-*`, `--shadow-*` tokens. All component styles are scoped.

**What nimble.css provides:**
- CSS reset (replaces sanitize.css)
- Typography baseline (currently minimal — project relies on browser defaults + sanitize)
- Form styling for config page (radio buttons, checkboxes, inputs, selects, datetime inputs)
- Body grid centered layout (replaces `max-width: 42.875em; margin: 0 auto`)
- `light-dark()` integration (nimble uses `light-dark()` internally — aligns with project's approach)

**Key concerns:**
- **Custom elements everywhere** — `<d-item>`, `<d-title>`, `<d-metadata>`, `<s-points>`, `<s-comments>`, `<s-time>`, `<s-url>`, `<s-scroll>`, `<s-index>`, `<wrap-page>`, `<s-config>`, `<s-top-icon>`. nimble won't style any of these — no conflicts.
- **`wrap-page` element** — Has `box-shadow` and border styling at the `42.875em` breakpoint. nimble's body grid replaces the centering but `wrap-page` styling is project-specific.
- **Open Props tokens** — Used throughout (`--size-1` through `--size-6`, `--font-size-0` through `--font-size-2`, `--font-weight-2/4/6`, `--shadow-6`). These are independent of nimble and should remain.
- **Content width** — Currently `42.875em` (686px). nimble defaults to `60ch`. Either keep `42.875em` via `--nc-content-width` or adjust.
- **CSS `light-dark()` function** — Project uses this modern CSS feature for dark mode. nimble also uses `light-dark()`. Good alignment.
- **Config page form controls** — Radio button groups use CSS `columns: 150px` (multi-column layout). nimble's form styling may change radio/checkbox appearance. Verify.
- **Progressive enhancement** — `.js-only` / `.no-js-only` classes toggled on `<html>`. No conflict with nimble.

**Migration complexity: Medium.** sanitize.css removal is straightforward. Open Props coexistence is proven. Main work is verifying form styling on config page and ensuring `wrap-page` / custom element styles aren't affected.

**Estimated changes:**
- Replace `sanitize.css` with `@leftium/nimble.css` in `package.json`
- Update `+layout.svelte` imports
- Simplify `app.css` (nimble handles reset, centering, font, color-scheme)
- Set `--nc-content-width: 42.875em` to preserve current width
- Keep `open-props/style` imports
- Verify config page form controls render correctly
- Verify story list custom elements are unaffected
- Keep all scoped component styles

---

### 3.5 weather-sense

| Attribute | Value |
|---|---|
| **Location** | `/Volumes/p/weather-sense` |
| **Stack** | SvelteKit 5, TypeScript, Vite 7, SCSS (sass v1.98) |
| **CSS reset** | sanitize.css v13 (base + forms) |
| **CSS framework** | None |
| **CSS dependencies** | sanitize.css, maplibre-gl CSS, tippy.js CSS |
| **Custom CSS** | ~1,773 lines across 12 files |
| **Routes** | 5 (`/`, `/radar`, `/wmo-codes`, `/swatches`, `/aqi`) |
| **SCSS** | Yes — `app.scss` + `variables.scss` with custom tokens and mixins |

**Current CSS approach:** Global `app.scss` imports sanitize.css and defines `.container` (max-width 960px centered), body font, and background. Shared `variables.scss` provides 6 color variables, 2 breakpoints, and 2 mixins. Heavy use of CSS Grid (including subgrid for timeline alignment), flexbox, sticky positioning, animated gradients, custom checkboxes (`appearance: none`), and glassmorphism effects. Components use `<style lang="scss">` with `@use '../variables' as *`.

**What nimble.css provides:**
- CSS reset (replaces sanitize.css base + forms)
- Typography baseline
- Form styling (limited benefit — weather-sense has highly custom form controls)
- Body grid layout (replaces `.container` with max-width)
- `<article>` card styling (used on AQI page)
- `<details>`/`<summary>` animation (used on AQI page)
- `<table>` styling (used on radar page)

**Key concerns:**
- **Highly custom UI** — The main weather dashboard has animated sky gradients, custom checkboxes with temperature-gradient borders, glassmorphism buttons, and CSS subgrid timelines. These are all deeply project-specific. nimble's form/element defaults would conflict.
- **Custom checkbox styling** — Uses `appearance: none` with gradient borders, `::before` colored fill, and `color-mix()` for state variations. nimble's checkbox styling must not interfere. Likely needs `.no-nimble` on the measurements section.
- **MapLibre GL CSS** — Map component imports `maplibre-gl/dist/maplibre-gl.css`. nimble's styles should not affect the map (it renders in a canvas). Verify.
- **Tippy.js CSS** — Imported on radar page. Should coexist (tooltip library has high specificity).
- **SCSS variables** — `$color-ghost-white`, `$color-text-black`, `$breakpoint-mobile`, `$breakpoint-tablet`, `text-outline-white` mixin, `mobile-only` mixin. These are independent of nimble.
- **`user-select: none`** — Global on body. This is project-specific and must be preserved.
- **Custom range slider** — Cross-browser thumb/track styling. nimble only sets `accent-color` on range inputs, so no conflict unless nimble adds `appearance` overrides.

**Migration complexity: High.** The weather dashboard has too much custom CSS to benefit significantly from nimble's element defaults. The main wins are: replacing sanitize.css, getting the body grid for the container pattern, and styling the simpler reference pages (radar, wmo-codes, aqi). The main dashboard would need liberal use of `.no-nimble`.

**Estimated changes:**
- Replace `sanitize.css` with `@leftium/nimble.css` in `package.json`
- Update `app.scss` to import nimble instead of sanitize.css
- Remove `.container` definition from `app.scss` (nimble's body grid handles it)
- Keep `variables.scss` and all SCSS mixins
- Add `.no-nimble` to custom checkbox/form areas on main page
- Verify table styling on radar page
- Verify article/details styling on AQI page
- Keep all component-scoped styles
- Keep maplibre-gl and tippy.js CSS imports

---

### 3.6 veneer

| Attribute | Value |
|---|---|
| **Location** | `/Volumes/p/DANCE-FORM-SHEETS/veneer` |
| **Stack** | SvelteKit 5, TypeScript, Vite 7, SCSS (sass-embedded v1.97) |
| **CSS reset** | sanitize.css v13 (base + forms + typography) |
| **CSS framework** | None (open-props-scss for design tokens) |
| **CSS dependencies** | sanitize.css, open-props-scss, markdown-it-github-alerts CSS, sass-embedded |
| **Custom CSS** | ~1,800 lines across 23 files |
| **Routes** | 4 pages + 2 API endpoints |
| **SCSS** | Yes — deep integration with open-props-scss (`@use 'open-props-scss' as *` in nearly every `<style>` block) |

**Current CSS approach:** Global `app.scss` imports sanitize.css (3 modules), then Open Props SCSS, custom variables, and a 169-line custom forms stylesheet. Components use `<style lang="scss">` with `@use 'open-props-scss' as *` to access `$size-*`, `$font-size-*`, `$radius-*` etc. as SCSS variables. Heavy use of CSS Grid (including subgrid for sheet tables), flexbox, glassmorphism, custom HTML elements (`d-article`, `d-header`, `d-main`, `gh`, `gd`, `grid-table`), and Swiper web component with `::part()` styling.

**What nimble.css provides:**
- CSS reset (replaces sanitize.css 3 modules)
- Typography baseline
- Form styling (replaces 169-line custom `forms.scss`)
- Body grid layout
- `<article>` card styling (though veneer uses custom `<d-article>` elements)
- `<details>`/`<summary>` animation

**Key concerns:**
- **Open Props SCSS everywhere** — `@use 'open-props-scss' as *` is in nearly every component's `<style>` block. Tokens like `$size-1`, `$font-size-0`, `$radius-2` are used for spacing, type scale, and radii throughout. These cannot be removed without touching every component. They must coexist with nimble.
- **Custom HTML elements** — `d-article`, `d-header`, `d-main`, `d-footer`, `d-section`, `gh`, `gd`, `grid-table`, `grid-details`, `fi-spacer`, `nav-buttons`, `content`, `wrap-confetti`, `pl-*`. nimble won't style any of these — no conflicts. But nimble's `article > header` styles also won't apply since the project doesn't use standard `<article>`.
- **Custom forms.scss (169 lines)** — Comprehensive input/button/select/checkbox styling using `--app-*` custom properties. nimble's form layer covers the same elements. Need to compare and decide: keep custom forms or use nimble's + override differences. Could be a significant simplification.
- **`--app-*` CSS custom properties** — `--app-border-color`, `--app-primary`, `--app-border`, `--app-background-color`, `--app-spacing`, `--app-muted-color`, `--app-del-color`, `--app-ins-color`. These replaced former `--pico-*` variables. Could map to `--nc-*` equivalents or keep as-is.
- **Swiper web component** — Uses `::part(container)` for shadow DOM styling. nimble cannot reach into shadow DOM. No conflict.
- **Markdown-it-github-alerts CSS** — Imported in the veneer view layout. Independent of nimble.
- **`font-size: 115%` on html** — Project-specific. nimble does not set html font-size. Will coexist.
- **i18n (Paraglide JS)** — No CSS impact.

**Migration complexity: High.** The deepest Open Props SCSS integration of all six projects. Every component imports `open-props-scss`. The custom `forms.scss` + `variables.scss` are essentially a mini design system. nimble replaces the reset and could replace the form styles, but the Open Props SCSS tokens must remain. The custom HTML elements mean nimble's classless element styling has limited reach — most of the UI uses non-standard elements by design (to avoid iOS Safari Reader mode).

**Estimated changes:**
- Replace `sanitize.css` with `@leftium/nimble.css` in `package.json`
- Update `app.scss` to import nimble instead of sanitize.css
- Evaluate replacing `forms.scss` with nimble's form layer (would remove 169 lines)
- Map `--app-*` to `--nc-*` where equivalent, keep project-specific ones
- Keep `open-props-scss` imports in all components
- Keep `variables.scss`
- Keep all component-scoped styles
- Verify custom elements are unaffected
- Add `.no-nimble` where nimble's element styles conflict

---

## 4. Migration Order

Projects ordered by migration complexity (easiest first), with rationale.

### Phase 1: rift-transcription (Low complexity)

**Rationale:** Biggest bang for the buck. No existing reset or framework — adding nimble.css provides the most value. Simple 3-page app with clear patterns. The TranscriptArea overlay is the only tricky part.

**Key tasks:**
1. Add `@leftium/nimble.css` dependency
2. Create global CSS import in layout
3. Set `--nc-content-width: 640px`
4. Remove duplicated layout styles from 3 pages
5. Verify TranscriptArea overlay alignment (may need `.no-nimble`)
6. Verify form controls, code blocks, tables, details/summary

### Phase 2: gg (Low complexity)

**Rationale:** Library with 1 demo page. Minimal surface area. Good test of nimble + Eruda panel coexistence. The Eruda plugin CSS is architecturally isolated (separate DOM subtree).

**Key tasks:**
1. Add `@leftium/nimble.css` to devDependencies
2. Replace hand-rolled body reset
3. Verify Eruda panel renders correctly
4. Verify GgConsole component in consumer projects

### Phase 3: leftium-logo (Low complexity)

**Rationale:** Library with test pages. The main win is replacing PicoCSS `!important` defenses with `.no-nimble`, validating the opt-out pattern for published components.

**Key tasks:**
1. Add `@leftium/nimble.css` to devDependencies
2. Replace hand-rolled body reset
3. Evaluate `.no-nimble` on LeftiumLogo vs keeping `!important` defenses
4. Verify test page layouts, responsive breakpoints, custom range sliders

### Phase 4: hn (Medium complexity)

**Rationale:** Clean SPA with sanitize.css + open-props. The Open Props coexistence is proven from prior migrations (zbang, leftium.com). Main work is verifying form controls on config page and custom element rendering.

**Key tasks:**
1. Replace sanitize.css with nimble.css
2. Simplify `app.css` (nimble handles reset, centering, font)
3. Set `--nc-content-width: 42.875em`
4. Keep open-props imports
5. Verify config page forms (radio groups, checkboxes, date inputs)
6. Verify story list rendering with custom elements

### Phase 5: weather-sense (High complexity)

**Rationale:** Heavily custom UI with animated sky gradients, custom checkboxes, glassmorphism, and CSS subgrid timelines. nimble mainly provides the reset and container pattern. The domain-specific CSS stays.

**Key tasks:**
1. Replace sanitize.css with nimble.css
2. Remove `.container` definition from `app.scss`
3. Keep SCSS variables and mixins
4. Add `.no-nimble` to custom form/checkbox areas
5. Verify table styling on radar page
6. Verify article/details on AQI page
7. Verify MapLibre GL and tippy.js coexistence

### Phase 6: veneer (High complexity)

**Rationale:** Deepest Open Props SCSS integration. Custom HTML elements (to avoid Safari Reader mode) limit nimble's classless reach. Custom forms.scss is the biggest potential simplification, but requires careful comparison with nimble's form layer.

**Key tasks:**
1. Replace sanitize.css with nimble.css
2. Evaluate replacing 169-line `forms.scss` with nimble's form layer
3. Map `--app-*` → `--nc-*` where equivalent
4. Keep `open-props-scss` in all components
5. Keep custom HTML elements
6. Verify Swiper web component
7. Verify markdown-it-github-alerts CSS

---

## 5. Common Migration Patterns

### 5.1 Replacing sanitize.css

All three projects that use sanitize.css (hn, weather-sense, veneer) follow the same pattern:

```diff
  // +layout.svelte or app.scss
- import 'sanitize.css'
- import 'sanitize.css/forms.css'
- import 'sanitize.css/typography.css'  // veneer only
+ import '@leftium/nimble.css'
```

For SCSS projects (weather-sense, veneer):

```diff
  // app.scss
- @import 'sanitize.css';
- @import 'sanitize.css/forms.css';
+ @use '@leftium/nimble.css/scss';
```

### 5.2 Replacing hand-rolled body resets

Projects without sanitize.css have minimal resets in their layout component:

```diff
  // +layout.svelte <style>
- :global(body) {
-   margin: 0;
-   font-family: system-ui, -apple-system, sans-serif;
-   line-height: 1.5;
-   color: #1a1a1a;
- }
+ /* nimble.css handles body reset — remove this block */
```

Keep project-specific overrides that differ from nimble's defaults:
- `overflow: hidden` (leftium-logo)
- `user-select: none` (weather-sense)
- `font-size: 115%` (veneer)
- `background-color: #f8f8ff` (weather-sense — ghost white)

### 5.3 Replacing centered container patterns

Three patterns exist across these projects:

**Pattern A: `max-width` + `margin: 0 auto`** (rift-transcription, gg)
```diff
  main {
-   max-width: 640px;
-   margin: 0 auto;
-   padding: 24px 16px;
  }
+ :root { --nc-content-width: 640px; }
```

**Pattern B: `.container` class** (weather-sense)
```diff
  // app.scss
- .container {
-   max-width: 960px;
-   margin: 0 auto;
-   padding: 0 1rem;
- }
+ :root { --nc-content-width: 960px; }
```

**Pattern C: `app.css` max-width** (hn)
```diff
  body {
-   max-width: 42.875em;
-   margin: 0 auto;
  }
+ :root { --nc-content-width: 42.875em; }
```

In all cases, nimble's body grid handles centering. The `--nc-content-width` custom property controls the content column width.

### 5.4 Open Props coexistence

Open Props design tokens are independent of nimble.css. They define *values* (spacing, colors, type scale), not *element styles*. Keep them:

```js
// Keep these imports
import 'open-props/style'        // CSS custom properties (hn)
// or in SCSS:
@use 'open-props-scss' as *      // SCSS variables (veneer)
```

nimble.css and Open Props do not define conflicting custom properties:
- Open Props: `--size-*`, `--font-size-*`, `--font-weight-*`, `--gray-*`, `--shadow-*`
- nimble.css: `--nc-*` namespace

### 5.5 Using `.no-nimble` for isolated components

When nimble's element styles conflict with a component's own styling:

```svelte
<!-- Wrap the component in .no-nimble -->
<div class="no-nimble">
  <TranscriptArea />
</div>

<!-- Or on the component's root element if it accepts class -->
<TranscriptArea class="no-nimble" />
```

Layout utilities (`.fluid`, `.bleed-edge`, `.bleed-wide`, `.bleed-full`, `.container`) still work inside `.no-nimble`. Only nimble's component styles (typography, forms, tables) are excluded.

**Candidates for `.no-nimble` in these projects:**
- rift-transcription: TranscriptArea overlay container
- gg: GgConsole component (if it renders visible UI)
- leftium-logo: LeftiumLogo component (replaces `!important` defenses)
- weather-sense: custom checkbox/measurement grid, MapLibre map container
- veneer: Swiper container, grid-table elements (if nimble affects `<table>`)

---

## 6. Migration Log

*Entries added as each project is migrated.*

### 6.1 rift-transcription

**Status:** Complete
**Date:** 2026-03-28
**nimble.css version:** 0.7.0

**Changes made:**
1. Added `@leftium/nimble.css` as dependency
2. Created `src/app.css` with `@import '@leftium/nimble.css'`
3. Updated `+layout.svelte` to import `app.css`
4. Removed duplicated `main` layout from all 3 pages (`max-width: 640px; margin: 0 auto; font-family: system-ui, ...`) — nimble's body grid handles centering at default `60ch` width
5. Removed `code` element styles from all 3 pages — nimble provides themed equivalent
6. Removed scoped `button`, `button:hover`, `select` styles on main page — nimble handles form controls
7. Removed hardcoded link colors (`#4a90d9`) from all 3 pages — nimble provides link styling
8. Removed CopyButton's custom button styles — nimble handles it
9. Added `width: auto; margin-bottom: 0` override for select/input inside `.controls` flex rows — nimble's full-width form defaults don't suit inline controls
10. Replaced hardcoded `white`/`#eee` in `.sticky-header` with `var(--nc-surface-1)`/`var(--nc-border)` for dark mode support
11. Kept all table styles on local-setup page (project uses smaller font-size than nimble default)
12. Kept all `pre`/`pre code` styles on sherpa and local-setup (project adds border, specific font)
13. Kept `.copy-btn` overlay styles on sherpa/local-setup (positioned absolute, white background — intentionally different from standard buttons)

**Content width:** Using nimble default (`60ch`) instead of original `640px`. Wider but not dramatically different — can set `--nc-content-width: 640px` if needed.

**TranscriptArea:** `.no-nimble` turned out to be unnecessary — the component's scoped styles (`.input`, `.preview`) explicitly set every property that matters (padding, margin, font, border, background, width, position) and beat nimble's `:where()` selectors. The debug `<details>` inside the component gets nimble's details styling (border, animation) which is a visual improvement.

**Issues found and fixed:**
- Round 1: White gap under select/input from nimble's `margin-bottom` on form controls — fixed with `width: auto; margin-bottom: 0` on `.controls` children
- Round 1: Buttons had white text on gray background — nimble's `color: var(--nc-primary-contrast)` applied while scoped `background: #f5f5f5` overrode bg — fixed by removing custom button styles and using nimble defaults

### 6.2 gg

**Status:** Complete
**Date:** 2026-03-28
**nimble.css version:** 0.9.0

**Changes made:**
1. Added `@leftium/nimble.css` to `devDependencies`
2. Created `src/app.css` with `@import '@leftium/nimble.css'`
3. Updated `+layout.svelte` to import `app.css`
4. Removed hand-rolled `:global(body)` reset (margin, font-family, line-height, color)
5. Removed `.container` class with `max-width: 960px; margin: 0 auto; padding` — nimble's body grid handles centering
6. Removed custom `h1` margin, `h3` margin, and generic `div` flex styles — nimble provides heading margins
7. Removed custom button styles (padding, border, border-radius, background, color, hover, active states) — nimble provides button styling
8. Removed `small` color rule — nimble handles it
9. Added `.button-group` class for button rows (flex, wrap, gap) with `width: auto; margin-bottom: 0` on child buttons to override nimble's full-width form defaults

**Eruda panel:** No conflicts — the Eruda plugin CSS is architecturally isolated in a separate DOM subtree, as predicted.

**Content width:** Using nimble default (`60ch`) — wider than previous `960px` max-width but acceptable for the demo page.

### 6.3 leftium-logo

**Status:** Complete
**Date:** 2026-03-28
**nimble.css version:** 0.9.0

**Changes made:**
1. Added `@leftium/nimble.css` to `devDependencies`
2. Created `src/app.css` with `@import '@leftium/nimble.css'`
3. Updated `+layout.svelte` to import `app.css`
4. Removed hand-rolled `:global(body)` reset (margin, background-color, color) — kept `overflow: hidden` (project-specific, prevents scrolling on home page)
5. Removed `:global(a)` / `:global(a:hover)` / `:global(a:visited)` link color rules and dark mode media query — nimble provides themed link colors with `light-dark()`
6. Replaced PicoCSS `!important` defenses in `LeftiumLogo.svelte` with normal rules — nimble's `:where()` selectors have lower specificity than scoped styles, so `!important` is no longer needed:
   - `max-width: unset !important` → `max-width: unset`
   - `padding: 0 !important` → `padding: 0`
   - `border: none !important` → `border: none`
   - `border-radius: 0 !important` → `border-radius: 0`
   - `outline: none !important` → removed (kept plain `outline: none` in `:focus`)
   - `box-shadow: none !important` → `box-shadow: none`
7. Set `--nc-content-width: 100vw` on home page to allow full-viewport logo display
8. Simplified test index page (`/test`):
   - Removed `main` max-width/margin/padding/font-family — nimble's body grid handles it (kept `max-width: 800px; margin-inline: auto` on `main` for narrower test layout)
   - Removed `h1` color/text-align, `p` color/margin — nimble provides defaults
   - Replaced hardcoded colors (`#e0e0e0`, `#fafafa`, `#007acc`, `#f0f8ff`, `#333`, `#666`) with nimble CSS variables (`--nc-border`, `--nc-surface-2`, `--nc-primary`, `--nc-radius`)
   - Removed `a[href='/']` link styles — nimble handles links
   - Added `:global(body) { overflow-y: auto !important }` on test page (overrides home page's `overflow: hidden`)
9. Adjusted label alignment: `align-items: baseline` → `align-items: first baseline`, radio inputs use `align-self: center`, added `margin-bottom: 0` on labels

**`.no-nimble` on LeftiumLogo:** Not needed — replacing `!important` with normal declarations was sufficient since nimble's `:where()` selectors never win against scoped component styles.

**Custom elements:** `<logo-container>` and `<grid-logo>` unaffected by nimble, as predicted.

### 6.4 hn

**Status:** Complete
**Date:** 2026-03-28
**nimble.css version:** 0.11.0 (migrated at 0.9.0, bumped through 0.10 → 0.11 same day)

**Changes made (across 5 commits):**

*Initial migration (v0.9.0):*
1. Replaced `sanitize.css` with `@leftium/nimble.css` in `devDependencies`
2. Rewrote `app.css`: replaced 20-line hand-written reset (color-scheme, max-width, margin, background, font-family, link colors) with nimble import + `--nc-content-width: min(42.875em, 100%)`
3. Removed `sanitize.css` import from `+layout.svelte`
4. Removed `<wrap-page>` wrapper element and its `box-shadow`/border styles — nimble's body grid handles centering
5. Kept `open-props` imports and all `--size-*`, `--font-size-*`, `--font-weight-*`, `--shadow-*` tokens
6. Config page: removed `max-width: 800px; margin: 0 auto` from `main` — nimble body grid handles it
7. Config page: adjusted radio button alignment (`align-items: baseline` → `flex-start`, added `margin-top: 0.25em` on radio inputs)
8. Config page: changed `input[type='radio']` from `margin-right` to `vertical-align: -0.2em`
9. Config page: added explicit `color` rules on buttons/hover to override nimble's primary-contrast button color
10. Story page: added `border-radius: 0`, `border: none`, `color: inherit`, and `transition: none` on scroll buttons to reset nimble's button styling
11. Config page: added `align-self: center; margin: 0` on `.custom-time-label input[type='radio']` and `margin: 0` on datetime-local inputs

*v0.10 content shadow:*
12. Adopted nimble.css v0.10's content shadow feature — replaced `<wrap-page>` box-shadow with nimble's built-in `--nc-content-shadow-gap: 0px` for flush edge-to-edge layout

*v0.11 bump:*
13. Bumped to nimble.css v0.11, removed redundant max-width from settings page

**Open Props coexistence:** Confirmed — no conflicts between `open-props` tokens (`--size-*`, `--font-size-*`, `--font-weight-*`, `--shadow-*`) and nimble's `--nc-*` namespace, as predicted from prior zbang/leftium.com migrations.

**Custom elements:** `<d-item>`, `<d-title>`, `<d-metadata>`, `<s-points>`, `<s-comments>`, `<s-time>`, `<s-url>`, `<s-scroll>`, `<s-index>`, `<wrap-page>`, `<s-config>`, `<s-top-icon>` — all unaffected by nimble, as predicted.

**Content width:** Preserved at `min(42.875em, 100%)` via `--nc-content-width`.

**Issues found and fixed:**
- Scroll buttons (previous/next day) inherited nimble's button border-radius and transition — fixed by resetting `border-radius: 0; border: none; transition: none`
- Radio buttons in config page had alignment issues with nimble's form styling — fixed with `margin-top`, `vertical-align`, and `align-self` adjustments
- Buttons had nimble's primary-contrast color instead of subtle gray — fixed by adding explicit `color` on button and button:hover
- `<wrap-page>` box-shadow was replaced by nimble's content shadow feature (v0.10), with `--nc-content-shadow-gap: 0px` for flush layout

### 6.5 weather-sense

**Status:** Not started

### 6.6 veneer

**Status:** Not started
