# CSS-only component exclusion and browser compatibility

**Date:** 2026-09-10
**Status:** Draft for implementation
**Baseline:** nimble.css 0.21.0, commit `214b5a8`

Make `.no-nimble` exclude direct component styling through zero-specificity selector guards in every CSS and SCSS bundle, without runtime stylesheet rewriting.

Today, prebuilt CSS ignores `.no-nimble` unless an optional script wraps rules in `@scope`. The target is default-on exclusion in ordinary CSS, preserving global reset, theme, layout, shadow, and print behavior. Completion requires selector-level checks and a small rendering fixture, including Safari 18. Color fallbacks are a separate follow-on phase; they are not a prerequisite for shipping exclusion.

This document is the active implementation plan. The March investigation in [safari-bugs.md](safari-bugs.md) remains historical evidence. Update the current architecture sections in [nimble-css.md](nimble-css.md) when implementation lands, without rewriting old migration outcomes as if they used the new mechanism.

## Evidence and motivation

- [src/_config.scss](../src/_config.scss) defaults `$exclude-selector` to `null`. [nimble.scss](../src/nimble.scss) and [nimble-core.scss](../src/nimble-core.scss) optionally emit `@scope` and contain runtime sentinel properties.
- [site/no-nimble.js](../site/no-nimble.js) probes a custom property on a `div`, then rewrites the first readable stylesheet containing the sentinel. The documented Safari failures concern inputs, textarea, select, and details. The probe does not establish that those elements render correctly.
- The script skips unreadable cross-origin sheets, changes stylesheet position through `adoptedStyleSheets`, and can remove component styles after paint. Neither reliable Safari detection nor the documented absence of a flash has been established.
- Commit `ff00397` introduced native scoping on March 28. Commit `f47ed85` disabled it on March 29 after Safari failures; `19f7643` added the JS enhancement. The script subsequently moved directories without a behavioral revision.
- WebKit's [Safari 26.4 announcement](https://webkit.org/blog/17862/webkit-features-for-safari-26-4/) documents a fix for scoped input and textarea styles. This is closely related evidence, not proof that every original Nimble symptom is fixed or that Safari 18 received a backport. No Safari 18 reproduction was performed during this review.
- The historical selector proposal, `:not(.no-nimble) input`, is insufficient: an excluded input can still match through another ancestor. A guard on the styled element excludes the boundary and its descendants.
- `@scope` does not stop inheritance. Neither mechanism provides complete component isolation. See [CSS Cascade Level 6](https://drafts.csswg.org/css-cascade-6/#scoped-styles).

Existing consumers make the intended behavior concrete:

| Location | Existing use | Migration |
| --- | --- | --- |
| [README](../README.md), third-party component example | `.no-nimble.bleed-full` wrapping a datatable | Keep markup; correct activation and inheritance claims. |
| [Extended demo](../site/demo/extended.html), component isolation section | `.no-nimble` wrapping headings, forms, and tables | Keep markup; remove script requirement and misleading browser-default claims. |
| [Pico migration](pico-migration.md), datatable migration record | Records exclusion for `@vincjo/datatables` | Preserve historical record; update current migration instructions. |

External consumer repositories are not part of this implementation. Search the current repository for all script imports, exclusion settings, sentinel references, and instructions before migration; examples above are not an exhaustive list.

## Behavior contract

1. Prebuilt CSS enables `.no-nimble` without a script, including when CSS is loaded from a CDN and JavaScript is disabled.
2. Exclusion applies to an element carrying the class and all its descendants, including pseudo-elements originating from those elements. Nested exclusions remain excluded; there is no re-entry class.
3. Only component rules are guarded: typography, links, buttons, forms, tables, code, media, article, details, dialog, non-layout utilities, progress, meter, and select enhancements.
4. Reset, colors and custom properties, document styles, body grid assignment, layout utilities, content shadow, and print styles stay global. The exclusion boundary may still inherit fonts, colors, and custom properties from an ancestor.
5. Existing component selector specificity, cascade layers, declaration order, and relative source order stay unchanged. The guard contributes zero specificity.
6. The same behavior applies to full, core, base, utilities, and component add-on bundles. A partial classified as component styling is guarded even when imported alone. Global-only bundles do not acquire guards.
7. `$exclude-selector: null` disables exclusion. A custom exclusion selector replaces `.no-nimble`; it does not implicitly add the default class.
8. Adding or removing an exclusion class updates styling through normal CSS matching. No observer or initialization call is required.
9. Guards constrain the element receiving declarations. They do not hide excluded descendants from an outside element's `:has()` or structural selectors. An outside label/group can still react to its descendants. This is an explicit contract, not a complete emulation of `@scope` semantics.
10. On `html` or `body`, exclusion suppresses applicable component rules throughout the subtree while global rules continue to apply.

## Source architecture

Implement one internal Sass helper, proposed name `src/_exclusion.scss`, which reads configuration and returns a selector suffix. Attach that suffix explicitly to each component selector's subject in the SCSS source. The helper must emit no CSS by itself.

```text
config ($exclude-selector)
  -> Sass exclusion helper
  -> guarded component selectors in source partials
  -> Sass compilation
  -> ordinary CSS / Lightning CSS minification
```

Choose source-level guards so direct Sass consumers do not need Nimble's build script or a downstream plugin. This replaces the earlier suggestion of a build-only selector transformation. Do not introduce a regex rewrite of generated CSS or a second activation path for SCSS consumers.

Conceptual helper output for exclusion selector `E`:

```css
:where(:not(:is(E), :is(E) *))
```

For the default class, either the general form or this equivalent form is acceptable:

```css
:where(:not(.no-nimble, .no-nimble *))
```

The outer `:where()` makes the entire guard zero-specificity, including custom selectors containing IDs. The `:is(E)` form supports a selector list without incorrect comma expansion. Parse and validate configuration with Sass selector utilities. Reject invalid selectors, pseudo-element exclusion roots, empty lists, and relative selectors that cannot stand alone. Do not silently accept an invalid configured selector and turn exclusion off. Browser support for unusual custom selectors remains the consumer's responsibility.

The precise helper API is internal. For example:

```scss
@use 'exclusion';

// guard() returns an empty string when exclusion is disabled.
:where(input, select, textarea)#{exclusion.guard()} {
  // Existing declarations unchanged.
}

:where(input)#{exclusion.guard()}::placeholder {
  // Guard the originating input, before the pseudo-element.
}
```

Placement rules:

- Guard every branch of a selector list, not just the last branch.
- Attach the guard to the rightmost compound receiving declarations, before its first pseudo-element. For `.striped :where(tbody tr:nth-child(even))`, append to the final `:where(...)` compound.
- For selectors inside `@media`, `@supports`, layers, and `@starting-style`, apply the same rule. Do not alter keyframe selectors, at-rule conditions, or declaration values containing selector-like text.
- Review nested Sass selectors after expansion. Guarding only an ancestor rule does not protect a nested descendant rule. Avoid duplicate guards where nested `&` already carries one.
- Preserve vendor pseudo-element branches separately where necessary; do not combine incompatible selector branches as incidental cleanup.
- Do not wrap an entire selector in a new `:where()`: that would remove its original specificity.

Expected transformations:

```css
/* Selector list */
input:where(:not(.no-nimble, .no-nimble *)),
textarea:where(:not(.no-nimble, .no-nimble *)) { /* ... */ }

/* Descendant subject */
.striped :where(tbody tr:nth-child(even)):where(
  :not(.no-nimble, .no-nimble *)
) { /* ... */ }

/* Pseudo-element subject */
:where(dialog):where(:not(.no-nimble, .no-nimble *))::backdrop {
  /* ... */
}
```

## Configuration and migration

Change the default to `$exclude-selector: '.no-nimble' !default`. Keep the variable name and `null` escape hatch. Configuring a selector now chooses selector exclusion rather than emitting `@scope`. Do not add a public scoping-mode option; retaining two mechanisms would preserve the compatibility problem and double the behavior surface.

```scss
// Default: exclusion enabled.
@use '@leftium/nimble.css/scss';

// Separate consumer configuration: exclusion disabled.
@use '@leftium/nimble.css/scss' with ($exclude-selector: null);

// Separate consumer configuration: custom roots, unchanged specificity.
@use '@leftium/nimble.css/scss' with (
  $exclude-selector: '.third-party, [data-unstyled]'
);
```

These are alternative entry files, not multiple loads in the same Sass compilation.

After verification, remove runtime sentinels and the entry-point `@scope` branches. Keep `_scopeable.scss` if it remains useful as the module catalog; its role becomes component composition rather than runtime scoping.

Keep the exported `./no-nimble` path and `site/no-nimble.js` as a deprecated, side-effect-free no-op for the first release of this change. It must not probe, access stylesheets, log warnings, or mutate the document. This temporary compatibility file prevents existing imports from failing or rewriting already-guarded CSS. Document that it is unnecessary with the new CSS and does not activate exclusion in older CSS releases. Consumers must update matching assets together. Remove the export only in a separately announced breaking release.

Default-on exclusion is an observable behavior change for pages that already contain `.no-nimble` without activating it. Release notes must call this out and name `$exclude-selector: null` as the SCSS escape hatch. Do not add a second prebuilt unguarded bundle solely for this migration.

## Implementation order and proof

### Phase 1: Selector helper and migration

- [ ] Capture a small fixture before changing selectors: ordinary content, datatable-like custom content, form controls, details, and a nested excluded subtree.
- [ ] Add the helper and configuration validation, initially retaining the existing public activation path while migrating source selectors in the working branch.
- [ ] Apply guards to every component partial, including standalone entry points, unlayered exceptions, pseudo-elements, and conditional enhancements.
- [ ] Compare compiled selectors against the prior output: specificity and declarations must be unchanged except for exclusion, and global rules must remain unguarded.
- [ ] Once the guarded path passes focused verification, switch the default, remove native scope wrappers and sentinels, and replace the JS implementation with the compatibility no-op. Do not ship the intermediate double-scoped state.

Use a focused selector test harness with a real selector parser where needed for specificity analysis. Do not infer completeness from textual guard counts alone. Test Sass compilation for default, null, custom selector-list, ID-containing selector, invalid configuration, and prefixed custom-property configurations. Check both ordinary and minified CSS, since minification can regroup selectors. During migration, create a selector-only fixture build with the old `@scope` wrapper disabled and the guard enabled independently. A double-scoped build cannot prove that guards alone exclude content or avoid the Safari failure. This is a temporary verification path, not a new public configuration mode.

The rendering fixture must establish:

| Case | Expected observation |
| --- | --- |
| Input, textarea, select, button, details outside exclusion | Existing author styles still apply. |
| The same elements carrying the class themselves | Component declarations stop applying. |
| Controls nested inside an excluded wrapper | Same exclusion, including nested wrappers. |
| Placeholder, checkbox pseudo-elements, dialog backdrop | Originating element's exclusion is respected where the pseudo-element exists. |
| `.no-nimble.bleed-full`, global theme and reset | Global styles continue to apply. |
| Explicit third-party border/padding/font overrides | Remain effective; exclusion does not reset them. |
| Ancestor font/color and outside `:has()` | Retain the documented inheritance and matching behavior. |
| Toggle class, no JS, CDN CSS, multiple Nimble bundles | No initialization dependency or stylesheet rewrite. |
| Current CSS plus deprecated script | Same computed styles and stylesheet state as without the script. |

Compare excluded content with a reference that preserves the same ancestor styles and inheritance, while applying only intended global rules and third-party CSS directly within the reference subtree. Removing component rules from the entire reference document would also remove inherited ancestor styling and produce a misleading comparison. Use non-inherited properties such as border, padding, and width to verify form styling. A custom property on a `div` is not sufficient evidence.

Run the fixture in current stable Chrome, Firefox, and Safari, plus an actual Safari 18 build on macOS and iOS Safari 18 where available. Record exact browser and OS versions. A bundled Playwright WebKit result is useful but must not be labeled Safari 18 validation. If access is unavailable, record that gap and do not claim the Safari 18 acceptance criterion passed. Native-only enhancements such as the customizable select picker retain their existing fallback and are not required to look identical across engines.

Repository instructions require prior approval for expensive builds/tests and for commits or publishing. Present concrete commands and expected scope before those actions. The present spec-writing task does not authorize implementation or release.

### Phase 2: Documentation and compatibility claims

- [ ] Update README, current main-spec architecture/configuration sections, demo copy, and active migration instructions together.
- [ ] Describe component exclusion and inherited/global styling precisely. Remove claims of browser-default appearance, complete isolation, required JS, and guaranteed absence of a flash in the old implementation.
- [ ] Mark the Safari investigation's workaround and fix ETA as historical. Add the newer WebKit evidence without asserting an unverified backport or full resolution.
- [ ] Correct historical Firefox `@scope` support from 128 to 146, citing [Can I Use](https://caniuse.com/css-cascade-scope). Scope support is no longer a requirement of default Nimble CSS.
- [ ] Correct the build-target comment: [build.js](../build.js) contains fixed version targets, not a rolling last-two-version policy. Separate minifier targets from the browser support contract.
- [ ] Record a reproducible compatibility estimate with dataset date, features included, partial-support treatment, and optional enhancements excluded. Use the same usage dataset for Nimble and Pico; do not present feature intersections as rendering pass rates.

The September review estimated approximately 88.6% for Nimble's main feature set and 94-95% for Pico 2.1.1 using a dataset updated August 24, 2026. These are contextual estimates, not acceptance thresholds. Recompute when documenting the implemented release. Remaining relative-color requirements can reduce the stricter estimate, even after exclusion is fixed.

## Follow-on phase: color fallbacks

This is a separate implementation phase and can ship separately. Its thesis is to preserve readable, themed core styling on browsers that support Nimble's layers and selectors but lack its newer color functions. Do not lower the layout/selector baseline or promise exact visual parity with current browsers.

Current [src/_colors.scss](../src/_colors.scss) emits `light-dark()` throughout the palette and retains relative `oklch(from ...)` hover/focus tokens. [build.js](../build.js) deliberately preserves modern colors. Unsupported color values stored in custom properties can invalidate consuming declarations at computed-value time; merely placing an older custom-property declaration before an unsupported one does not create a reliable fallback.

Design requirements:

1. Generate fallback sRGB light and dark palettes from the configured Sass values. Keep public token names and `$prefix` behavior. Include hover, focus, selection, border, surface, feedback, and shadow colors needed for readable controls and visible focus.
2. Use explicit theme token assignments for the fallback path. Preserve system preference, explicit `data-theme="light"` and `data-theme="dark"`, and nested theme overrides. Add fixtures for nested opposite themes; do not assume a media query plus a root override reproduces the current behavior.
3. Put modern token declarations inside appropriate `@supports` blocks using actual color expressions. Gate relative colors separately from `light-dark()`. Restore modern tokens at every selector where fallback tokens are assigned, including nested theme boundaries: a modern token declared only on `:root` cannot override a fallback token declared directly on a descendant. Add fallback declarations for component-level `color-mix()` and shadows too; a root palette alone does not cover all color consumers.
4. Preserve modern-browser rendering and runtime token overrides. Document that fallback palettes are computed at build time and cannot necessarily reproduce runtime hue derivation in browsers lacking color math. Avoid changing public token meanings to disguise that limitation.
5. Audit invalid color expressions encountered in this work. For example, `light-dark(inherit, ...)` in typography needs correction because `inherit` is not a color argument. Preserve intended inherited light-mode text and dark-mode contrast with valid declarations.
6. Keep native progress and unsupported select-enhancement behavior unchanged. This phase concerns color compatibility, not widget redesign.

Begin with an inventory of final emitted color expressions across all bundles and a theme matrix before selecting helper structure. Retain a single Sass palette definition so fallback and modern paths do not drift. Report the minified and compressed size cost; there is no arbitrary byte target.

Acceptance requires rendering in at least one real browser version lacking `light-dark()`, plus current browsers, across light/dark/system/nested themes and focus states. Exercise the separate relative-color fallback in a browser that lacks the required relative-color expressions, even if it supports `light-dark()`; record exact versions and tested expressions. Verify all documented custom-property overrides in the modern path, including beneath nested theme boundaries. Record unsupported runtime fallback customization explicitly. Only then update coverage estimates; do not advertise Pico-level coverage based solely on adding RGB tokens.

## Decisions and deferred work

| Decision | Basis | Rationale |
| --- | --- | --- |
| Source-level zero-specificity guards | Design | One mechanism serves prebuilt CSS and direct Sass consumers. |
| Enable exclusion by default | Design | Makes documented markup effective without runtime activation. |
| Keep global styling and inheritance | Existing contract | Exclusion is an escape from component declarations, not a document reset. |
| Keep JS export temporarily as a no-op | Compatibility choice | Avoid broken imports while removing dangerous rewriting; revisit at an announced breaking release. |
| Preserve configurable roots and null | Compatibility choice | Existing SCSS consumers retain useful configuration; no extra mode selector. |
| Ship color work separately | Scope choice | Broader theme behavior and verification should not delay the exclusion fix. |

Deferred: a general `@scope` polyfill, Shadow DOM isolation, re-entry inside exclusions, broad legacy-browser support, external consumer migrations, and a new browser-testing service. None is necessary to implement this contract.

The remaining evidence dependency is access to Safari 18 for validation. Implementation may proceed without it, but the final report must distinguish verified selector support from verified Nimble rendering.
