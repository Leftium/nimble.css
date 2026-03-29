# Safari CSS Bugs Affecting nimble.css

> Documents Safari-specific rendering bugs encountered during nimble.css development, the investigation process, fix options considered, and resolutions applied.

**Date:** 2026-03-29
**Safari versions tested:** Desktop Safari 18.x (macOS 15.7.4 Sequoia), Mobile Safari (iOS 18.7.2)

---

## Table of Contents

1. [`@scope` + `@layer` Style Application Bug (Desktop Safari)](#1-scope--layer-style-application-bug-desktop-safari)
2. [`<progress>` Custom Styling Bug (iOS Safari)](#2-progress-custom-styling-bug-ios-safari)
3. [Pattern: Safari and `appearance` Interactions](#3-pattern-safari-and-appearance-interactions)

---

## 1. `@scope` + `@layer` Style Application Bug (Desktop Safari)

### 1.1 Summary

Desktop Safari 18.x parses `@scope` blocks containing `@layer` rules correctly (the CSSOM contains all rules with correct selectors and properties), and elements match the selectors (verified via `element.matches()`), but Safari **does not apply** the styles to certain elements. The same styles work correctly on Mobile Safari, Chrome, and Firefox.

### 1.2 Symptoms

nimble.css wraps component-level styles in `@scope (:root) to (.no-nimble)` containing nested `@layer nimble.base` blocks. On desktop Safari 18.x:

- **Form inputs and textarea**: no author styles applied (no border, padding, background, width). Computed styles showed UA defaults (`width: 203px`, `border: 2px inset`, `appearance: auto`).
- **Search input**: not pill-shaped (missing `border-radius: 5rem`).
- **Details/summary**: missing outline/border.
- **HTML5 inputs** (date, time, color, range): no author styles applied.

Elements that **did** work from the same `@scope > @layer` block: `fieldset`, `label`, `legend`.

### 1.3 Environment

| | Status |
|---|---|
| Desktop Safari 18.x (macOS 15.7.4 Sequoia) | **Broken** |
| Mobile Safari (iOS 18.7.2) | Works correctly |
| Chrome (all platforms) | Works correctly |
| Firefox (all platforms) | Works correctly |

### 1.4 Investigation

#### What was confirmed

1. **Safari parses the CSS correctly.** The CSSOM contains all rules with correct selectors and properties:
   ```js
   scope.cssRules[4].cssRules[0].selectorText // correct selector
   scope.cssRules[4].cssRules[0].style.cssText // all properties present
   ```

2. **Safari matches the selectors correctly.** `element.matches()` returns `true` for the input selectors.

3. **Safari does NOT apply the matched styles.** DevTools Styles panel shows zero `@layer nimble.base` rules for `input` and `details` elements. Only UA styles and `@layer nimble.reset` (which is outside `@scope`) appear.

4. **Injecting the same styles without `@scope` works:**
   ```js
   const s = new CSSStyleSheet();
   s.insertRule('input[type=text] { border: 3px solid red !important; width: 100% !important; }');
   document.adoptedStyleSheets.push(s);
   // Red border appears, input becomes full-width
   ```

5. **Inconsistent behavior within the same block.** `fieldset`, `label`, and `legend` styles DO apply from the exact same `@layer nimble.base` block that contains the non-working `input`, `select`, `textarea`, and `details` styles.

6. **Computed style verification:**
   ```js
   // INPUT (broken): UA defaults, nimble styles not applied
   'width=203.3125px border=2px inset rgb(128, 128, 128) appearance=auto'

   // FIELDSET (working): nimble styles applied
   'width=447px border=1px solid oklch(0.83 0.005 250) borderRadius=4px'
   ```

#### What was ruled out

| Hypothesis | Why eliminated |
|---|---|
| Selector parsing issue | CSSOM has correct selectors |
| `color-mix()` support | Unrelated to form elements; colors work elsewhere |
| `:not()` multi-argument | `element.matches()` returns true |
| `:nth-last-child(of S)` | Supported since Safari 9 |
| `appearance: auto` override | `details` element has no appearance and also fails |
| Scope root matching | `fieldset`/`label` have same relationship to `:root` as `input` |

### 1.5 CSS Architecture Context

```scss
// src/nimble.scss — the @scope wrapper
@if $exclude-selector {
  @scope (:root) to (#{$exclude-selector}) {
    @include scopeable.load-with-extras;
  }
} @else {
  @include scopeable.load-with-extras;
}
```

The compiled CSS had one `@scope (:root) to (.no-nimble)` block (lines 266-1047, ~780 lines) containing 15+ `@layer nimble.base` blocks from different SCSS modules. Global styles (reset, colors, document, grid, layout-utilities, print) were outside `@scope` and worked correctly.

### 1.6 Fix Options Considered

#### Option A: Disable `@scope` by default (CHOSEN)

Change `$exclude-selector` default from `'.no-nimble'` to `null`. Users can opt in to `@scope` via SCSS configuration.

| | |
|---|---|
| **Pros** | Simplest fix. Zero CSS bloat. Zero risk of new bugs. `.no-nimble` still available as opt-in for users on browsers where `@scope` works. |
| **Cons** | Loses the `.no-nimble` opt-out feature by default. |

#### Option B: Move component styles outside `@scope`

Keep `@scope` available but move all component modules outside it, making `@scope` wrapping opt-in only.

| | |
|---|---|
| **Pros** | Works everywhere. Feature preserved as opt-in. |
| **Cons** | Changes default behavior from previous versions. |

#### Option C: Duplicate fallback rules

Keep `@scope`-wrapped rules for browsers that support it, but add duplicate non-scoped rules as a fallback.

| | |
|---|---|
| **Pros** | Preserves `@scope` for browsers where it works. Graceful degradation. |
| **Cons** | Roughly doubles CSS size for affected rules. Maintenance burden of keeping two copies in sync. |

#### Option D: Replace `@scope` with `:not()` ancestor selectors

Use a different scoping mechanism, e.g., `:not(.no-nimble) input { ... }` or nesting under `:where(:not(.no-nimble))`.

| | |
|---|---|
| **Pros** | Cross-browser compatible. No new CSS features required. |
| **Cons** | More complex selectors. Different specificity behavior. Cannot truly prevent style inheritance into `.no-nimble` subtrees (only prevents direct matching). |

#### Option E: `@supports` workaround

Detect the broken Safari behavior via `@supports` and conditionally exclude `@scope`.

| | |
|---|---|
| **Pros** | Surgical fix. Preserves `@scope` in working browsers. |
| **Cons** | No known `@supports` query can detect this specific bug (Safari claims to support `@scope` and does parse it correctly; the bug is in style application, not parsing). |

### 1.7 Resolution

**Option A was chosen as the CSS-layer fix**, combined with **Option F (JS progressive enhancement)** for users who need `.no-nimble` support.

#### Step 1: CSS — Disable `@scope` by default

The `$exclude-selector` default was changed from `'.no-nimble'` to `null` in `src/_config.scss`. The prebuilt CSS output contains no `@scope` wrapper and works on all browsers.

```scss
// src/_config.scss (before)
$exclude-selector: '.no-nimble' !default;

// src/_config.scss (after)
$exclude-selector: null !default;
```

#### Step 2: JS — Optional `no-nimble.js` for `.no-nimble` support

An optional `no-nimble.js` script provides `.no-nimble` component isolation as a progressive enhancement. It:

1. Locates the nimble.css stylesheet via sentinel CSS custom properties (`--nimble-scope-start`) embedded in the compiled CSS
2. Splits each `@layer` block at the sentinel boundary — rules before are global (reset, colors, document, grid, layout utilities, print), rules after are scopeable (typography, forms, tables, buttons, component utilities)
3. Wraps the scopeable portion in `@scope (:root) to (.no-nimble)` using `adoptedStyleSheets`
4. Detects the desktop Safari `@scope` + `@layer` bug (via a real element probe test) and skips wrapping on broken browsers
5. Guards against double-scoping — if the stylesheet already contains a `CSSScopeRule` (from the SCSS `$exclude-selector` flag), it no-ops

```html
<!-- Base CSS — works everywhere, no JS required -->
<link rel="stylesheet" href="nimble.css">

<!-- Optional: enables .no-nimble, auto-skips broken browsers -->
<script src="no-nimble.js"></script>
```

There is **no FOUC risk** because the base styles always apply. The JS only adds the scoping boundary — it doesn't change how anything looks. Elements inside `.no-nimble` lose their nimble styles slightly after page load, which is acceptable (third-party components typically render after the initial paint).

**Sentinel markers:** The compiled CSS contains two sentinel rules — `@layer nimble.base { :root { --nimble-scope-start: 1 } }` and `@layer nimble.utilities { :root { --nimble-scope-start: 1 } }` — placed between global and scopeable modules in the SCSS source. Lightning CSS merges `@layer` blocks during minification, so the sentinels end up inside the merged blocks. The JS splits within each layer block at the sentinel, not just at the top level. CSS comments cannot be used as markers because Lightning CSS strips them.

#### Why this two-tier approach

- **CSS works standalone.** nimble.css is a CSS library; it must not require JS for basic functionality.
- **`.no-nimble` is opt-in via JS.** Users who need component isolation add one `<script>` tag. No SCSS build step required.
- **Desktop Safari is handled automatically.** The JS detects the bug and gracefully degrades — `.no-nimble` simply has no effect on desktop Safari. This is acceptable because desktop Safari is ~3-4% of global traffic, and `.no-nimble` is itself a niche feature.
- **SCSS opt-in still available.** Power users can still set `$exclude-selector: '.no-nimble'` at build time for a pure-CSS solution (with the caveat that desktop Safari will be broken). This path is documented with a warning.

Users who need `.no-nimble` and also need desktop Safari support can re-enable it via SCSS, but must accept the desktop Safari limitation:

```scss
// ⚠️ WARNING: Broken on desktop Safari 18.x — see specs/safari-bugs.md §1
@use 'nimble' with (
  $exclude-selector: '.no-nimble'
);
```

**Rationale:**
- `@scope` is too new and buggy across engines for production use as a default in a classless CSS library that must work everywhere.
- The `.no-nimble` feature is a nice-to-have, not a core requirement.
- CSS cascade layers already provide the primary cascade management strategy. Most third-party component conflicts are resolved by layers alone.
- The fix reduced `nimble.min.css` from ~23.3 KB to ~23.1 KB (the `@scope` wrapper itself added ~200 bytes of overhead).

### 1.8 Related WebKit Bugs

There are **10 open `@scope` bugs** in WebKit Bugzilla as of 2026-03-29. The most relevant:

| Bug | Summary | Status | Filed |
|---|---|---|---|
| [#307982](https://bugs.webkit.org/show_bug.cgi?id=307982) | REGRESSION (17.4-26): `@scope` with custom-element scope root stops applying to `:scope` and descendants | P2, unassigned | 2026-02-16 |
| [#285130](https://bugs.webkit.org/show_bug.cgi?id=285130) | insertRule does not work for inserting `@scope` styles | P2, unassigned | 2024-12-24 |
| [#297043](https://bugs.webkit.org/show_bug.cgi?id=297043) | Fix `@scope` invalidation when scope-end mutates | P2, assigned (m_dubet) | 2025-07-23 |

**ETA for fix: Unknown, likely 6-12 months.** Most bugs are P2 and unassigned. Safari ships major updates tied to macOS releases (~every 6 months). Even if fixed in WebKit trunk immediately, stable desktop Safari users won't see the fix until the next macOS point release.

**Community workarounds: None found.** `@scope` is new enough that most projects aren't using it in production. The few relevant discussions recommend avoiding `@scope` until browser support matures.

Our bug (styles parsed but not applied to certain element types within `@scope` + `@layer`) is not yet filed. Bug #307982 is the closest match (regression in style application with `@scope`), but involves custom elements and Shadow DOM rather than plain HTML elements.

### 1.10 WebKit Bug Characteristics

This bug has the following unusual characteristics that may help identify it if filing a WebKit bug:

1. **Parse-but-don't-apply**: Safari's CSSOM correctly contains all rules. `element.matches()` returns true. But computed styles show UA defaults.
2. **Element-selective**: Within the same `@scope > @layer` block, some element types (fieldset, label, legend) get styles applied while others (input, select, textarea, details) do not.
3. **Desktop-only**: Mobile Safari (iOS 18.7.2) renders the identical CSS correctly.
4. **`@scope` + `@layer` interaction**: The bug requires both `@scope` and `@layer` nesting. `@scope` without `@layer`, or `@layer` without `@scope`, both work correctly.

---

## 2. `<progress>` Custom Styling Bug (iOS Safari)

### 2.1 Summary

iOS Safari partially honors `appearance: none` on `<progress>`, stripping the native pill shape but **not enabling** custom pseudo-element rendering. This creates a broken hybrid that cannot be fixed with CSS alone. Desktop Safari ignores `appearance: none` on `<progress>` entirely.

### 2.2 Symptoms

When `appearance: none` is applied to `<progress>`:

| Browser | Behavior |
|---|---|
| iOS Safari | Strips native pill shape but does NOT enable `::-webkit-progress-bar` / `::-webkit-progress-value` pseudo-element rendering. Creates a broken hybrid. |
| Desktop Safari | Ignores `appearance: none` entirely. Native rendering preserved. |
| Chrome/Chromium | Honors `appearance: none` and enables pseudo-element rendering correctly. |
| Firefox | Uses `::-moz-progress-bar` correctly. |

There is **no CSS-only way** to distinguish iOS Safari from Chromium because both parse `::-webkit-*` pseudo-elements.

### 2.3 Additional Trigger: `background-repeat: no-repeat`

nimble.css's reset layer (derived from sanitize.css) included a universal rule:

```css
:where(*) {
  box-sizing: border-box;
  background-repeat: no-repeat;
}
```

The `background-repeat: no-repeat` rule breaks WebKit's native `<progress>` rendering. iOS Safari shows a flat gray bar instead of the normal system progress bar.

### 2.4 Evolution of Fixes

The progress styling went through six iterations:

1. **Initial**: Custom styling via `appearance: none` + `::-webkit-progress-bar` / `::-webkit-progress-value` pseudo-elements (adapted from missing.css). Included indeterminate animation.

2. **Chrome fix**: Added `position: relative` and Chromium-specific `::after` indeterminate animation via `@supports selector(progress::after)`.

3. **Extract to sub-bundle**: Moved to standalone `_progress.scss` as an optional add-on.

4. **Reset fix**: Changed reset from `:where(*)` to `:where(*:not(progress))` to exclude `<progress>` from `background-repeat: no-repeat`. This fixed the root cause of the flat gray bar.

5. **Firefox-only custom styling**: Scoped all custom visual styling to Firefox via `@supports (-moz-orient: inline)`, leaving Safari + Chromium on native rendering.

6. **Final simplification**: Dropped even Firefox-only custom styling due to insufficient coverage and a Firefox mobile animation bug. The entire `_progress.scss` now contains only `width: 100%`.

### 2.5 Resolution

Progress bar styling is listed as a **non-goal** in the nimble.css spec. The final `_progress.scss` contains:

```scss
@layer nimble.base {
  :where(progress) {
    width: 100%;
  }
}
```

Native system progress bars look acceptable on all platforms. Custom styling is not attempted.

The reset exclusion remains:

```scss
// src/_reset.scss
:where(*:not(progress)),
:where(*::before),
:where(*::after) {
  box-sizing: border-box;
  background-repeat: no-repeat;
}
```

### 2.6 Note on `<meter>`

The `<meter>` element uses the same `appearance: none` + pseudo-element rebuild technique and does **not** suffer from the same Safari breakage. `<meter>` custom styling works correctly on all browsers including iOS Safari.

---

## 3. Pattern: Safari and `appearance` Interactions

Both bugs share a common theme: **Safari's inconsistent handling of author styles on form-related elements in combination with modern CSS features.**

| Bug | Modern CSS Feature | Safari Behavior |
|---|---|---|
| `@scope` + `@layer` | `@scope` | Parses correctly but silently drops style application for certain element types |
| `<progress>` | `appearance: none` | Partially strips native chrome without enabling author pseudo-element rendering (iOS) or ignores entirely (desktop) |

### 3.1 Defensive Guidelines for nimble.css

Based on these encounters:

1. **Avoid relying on `@scope` for critical styles.** Use it as progressive enhancement only, with a fallback path that works without it.
2. **Do not use `appearance: none` on `<progress>`.** Use native rendering and `accent-color` for theming.
3. **Test on both desktop and mobile Safari independently.** They have different bugs -- desktop Safari 18.x has the `@scope` bug while mobile Safari does not; iOS Safari has the `<progress>` bug while desktop Safari ignores `appearance: none` entirely.
4. **Universal reset rules (`*`) can break native form elements.** Exclude `<progress>` (and potentially other native widgets) from aggressive universal selectors like `background-repeat: no-repeat`.
5. **Safari's CSSOM is not a reliable indicator of rendering.** Rules can exist in the CSSOM, selectors can match via `.matches()`, and computed styles can still show UA defaults. DevTools "Styles" panel is the only reliable indicator.
