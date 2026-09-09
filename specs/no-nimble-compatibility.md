# CSS-only component exclusion and browser compatibility

**Date:** 2026-09-10
**Status:** Draft for implementation
**Source baseline:** nimble.css 0.21.0, commit `214b5a8`
**Assessment updated:** 2026-09-10, through commit `84fb4d0`

Make `.no-nimble` exclude direct component styling through zero-specificity selector guards in every CSS and SCSS bundle, without runtime stylesheet rewriting.

Today, prebuilt CSS ignores `.no-nimble` unless an optional script wraps rules in `@scope`. The target is default-on exclusion in ordinary CSS, preserving global reset, theme, layout, shadow, and print behavior. Completion requires permanent selector-level checks, replacement acceptance fixtures, and an explicit record of any remaining Safari 18 validation gap. Color fallbacks are a separate follow-on phase; they are not a prerequisite for shipping exclusion.

This document contains the September reassessment and active implementation plan. The [original March assessment](safari-bugs.md#1-scope--layer-style-application-bug-desktop-safari) remains historical evidence. Update the current architecture sections in [nimble-css.md](nimble-css.md) when implementation lands, without rewriting old migration outcomes as if they used the new mechanism.

## Evidence and motivation

- [src/_config.scss](../src/_config.scss) defaults `$exclude-selector` to `null`. [nimble.scss](../src/nimble.scss) and [nimble-core.scss](../src/nimble-core.scss) optionally emit `@scope` and contain runtime sentinel properties.
- [site/no-nimble.js](../site/no-nimble.js) probes a custom property on a `div`, then rewrites the first readable stylesheet containing the sentinel. The documented Safari failures concern inputs, textarea, select, and details. The probe does not establish that those elements render correctly.
- The script skips unreadable cross-origin sheets, changes stylesheet position through `adoptedStyleSheets`, and can remove component styles after paint. Neither reliable Safari detection nor the documented absence of a flash has been established.
- Commit `ff00397` introduced native scoping on March 28. Commit `f47ed85` disabled it on March 29 after Safari failures; `19f7643` added the JS enhancement. The script subsequently moved directories without a behavioral revision.
- WebKit's [Safari 26.4 announcement](https://webkit.org/blog/17862/webkit-features-for-safari-26-4/) documents a fix for scoped input and textarea styles. This is closely related evidence, not proof that every original Nimble symptom was the same issue or that Safari 18 received a backport.
- The historical selector proposal, `:not(.no-nimble) input`, is insufficient: an excluded input can still match through another ancestor. A guard on the styled element excludes the boundary and its descendants.
- `@scope` does not stop inheritance. Neither mechanism provides complete component isolation. See [CSS Cascade Level 6](https://drafts.csswg.org/css-cascade-6/#scoped-styles).

### Browser evidence ledger

Reduced isolation fixtures and the original full Nimble failure answer different questions. The reduced fixtures compare native `@scope` and static selector exclusion in a controlled stylesheet. They do not reproduce the complete historical stylesheet structure recorded in [safari-bugs.md](safari-bugs.md).

| Environment | Evidence | Interpretation |
| --- | --- | --- |
| Desktop Safari 26.6.1 | Exported probe JSON; 29 of 29 assertions passed | Reduced native `@scope` and static-selector fixtures work. |
| iPhone Safari 18.7.8 | 29 of 29 assertions observed passing | Reduced mobile Safari fixture works. |
| Browserling desktop Safari 18 | 29 of 29 assertions observed passing | Useful informal observation; exact user agent and export were not captured reliably. |
| Uploaded Browserling-attributed JSON | Identifies Chrome 152 | Invalid as Safari evidence; retain only as evidence of the collection failure. |
| Historical desktop Safari 18.x with full Nimble | Recorded in [safari-bugs.md](safari-bugs.md) | The original failure has not been independently reproduced with the current reduced probe. |

A reduced probe passing on desktop Safari 18 does not invalidate the historical report. The reduced fixture may omit the full-stylesheet interaction that triggered the failure. Do not claim a first fixed Safari version from this evidence.

### Reduced probe inventory and disposition

The [historical Safari probe](../tests/fixtures/no-nimble/safari-probe.html) used for the ledger is a 100-line, self-contained offline page with an embedded copy of the original runtime script. Its 29 observations cover:

- `@scope` outside `@layer`, `@layer` outside `@scope`, and the static subject guard;
- an ordinary target, a target below `.no-nimble`, and a target carrying `.no-nimble` itself;
- originating pseudo-elements, class removal, a newly inserted descendant, and a global layout rule;
- ten computed control subjects: text, search, date, color, checkbox, select, textarea, details, fieldset, and label;
- the historical ancestor-selector leak, zero-specificity behavior, and inheritance across the boundary;
- the original runtime's basic exclusion plus its cascade-order, separate-add-on, and concatenated-host-CSS failures.

Most control assertions compare only `padding-top`; the other observations use pseudo-element `content`, `display`, `color`, or `margin-left`. The page correctly labels itself as reduced and distinguishes reproduced known limitations, but its UI does not visibly display browser identity and its export filename is always `nimble-browser-probe.json`.

Keep this exploratory artifact separate from the positive replacement acceptance suite because its `PASS` semantics intentionally include reproduced defects. The repository file's SHA-1 is `43266e4f76fadf5a0fbf723a962347ae4a1ce312`; the embedded runtime's Git blob ID, exported as `sourceBlob`, is `072ef16f31477dbf2f336522c626d68ff43ef8aa`. Port useful cases into permanent parsed-selector and rendering tests rather than making the exploratory page itself the release gate. Do not place it in the distributed `src/` or package exports.

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

The public meaning is: Nimble component declarations do not directly style the excluded element or its descendants. It does not promise complete isolation or restoration to browser defaults.

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

Known migration hotspots include form selector lists and unlayered date/time rules, nested button group selectors, details content pseudo-elements, dialog backdrop rules, descendant utility selectors, and the select add-on's `@supports`, nested option selectors, picker pseudo-elements, and `@starting-style`. Standalone progress, meter, select, utilities, and base entry points must receive the same ownership treatment as their rules receive in full and core bundles. This list directs review; the permanent completeness test remains the authority as selectors evolve.

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
- [ ] Add a permanent selector-completeness regression test to the normal verification path.
- [ ] Once the guarded path passes focused verification, switch the default, remove native scope wrappers and sentinels, and replace the JS implementation with the compatibility no-op. Do not ship the intermediate double-scoped state.

The permanent test must establish that every emitted selector classified as a Nimble component selector contains the exclusion guard on its declaration subject, while every intentionally global selector remains unguarded. Use a real selector parser and specificity-aware inspection where needed; textual guard counts are insufficient. Cover selector lists, descendant selectors, nested Sass expansion, pseudo-elements, `@media`, `@supports`, `@starting-style`, unlayered component exceptions, standalone component bundles, and minified output after Lightning CSS regrouping. This test protects future selectors as well as the initial migration.

Test Sass compilation for default, null, custom selector-list, ID-containing selector, invalid configuration, and prefixed custom-property configurations. During migration, create a selector-only fixture build with the old `@scope` wrapper disabled and the guard enabled independently. A double-scoped build cannot prove that guards alone exclude content or avoid the Safari failure. This is a temporary verification path, not a new public configuration mode.

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
| Nimble CSS followed by an unlayered application override | The application override wins with the same cascade order as before exclusion support. No stylesheet moves or is replaced. |
| Full Nimble plus a separately loaded component add-on | Component selectors from every applicable bundle obey `.no-nimble`. |
| Application CSS concatenated after generated Nimble CSS | Application selectors remain active inside `.no-nimble`; only Nimble-owned component selectors receive guards. |

Compare excluded content with a reference that preserves the same ancestor styles and inheritance, while applying only intended global rules and third-party CSS directly within the reference subtree. Removing component rules from the entire reference document would also remove inherited ancestor styling and produce a misleading comparison. Use non-inherited properties such as border, padding, and width to verify form styling. A custom property on a `div` is not sufficient evidence.

Replacement acceptance tests use ordinary semantics: `PASS` means the desired behavior is correct. Keep any historical probes where `PASS` means a runtime defect was reproduced in a separate exploratory suite with explicit labels. Do not mix their results into replacement acceptance totals.

Strengthen the Safari regression fixture with actual compiled Nimble component CSS and the historically affected elements: input, textarea, select, search input, date/time controls, range and color where appropriate, details/summary, plus fieldset and label as historically working contrasts. Compare ordinary content, excluded content, and an equivalent reference subtree containing only intended global styles. Assert several non-inherited computed properties appropriate to each control, including border width/style, padding, width, border radius, appearance, background, and outline. If feasible, retain a native-`@scope` fixture matching the old compiled layer structure closely enough to test the March failure.

Run the fixture in current stable Chrome, Firefox, and Safari, plus an actual Safari 18 build on macOS and iOS Safari 18 where available. Record exact browser and OS versions. A bundled Playwright WebKit result is useful but must not be labeled Safari 18 validation. If full Safari 18 reproduction access is unavailable, record that gap without blocking implementation indefinitely. Native-only enhancements such as the customizable select picker retain their existing fallback and are not required to look identical across engines.

For remote multi-browser collection, start BrowserSync with interaction mirroring disabled:

```sh
browser-sync start --server --no-ghost-mode
```

Show browser name, OS/platform, full user agent, timestamp, fixture version, and source commit at the top of the fixture and in exported JSON. Include browser identity in export filenames where feasible, such as `nimble-probe-safari-18-macos.json`. Keep the identity visible so a screenshot is secondary evidence when remote download is unavailable. Treat exports whose user agent contradicts their label as invalid for that browser; the Chrome 152 export demonstrates why this check is required.

Repository instructions require prior approval for expensive builds/tests and for commits or publishing. Present concrete commands and expected scope before those actions. The present spec-writing task does not authorize implementation or release.

### Exclusion size and performance evidence

Record before/after artifact sizes for the full bundle, core bundle, and each affected standalone component bundle. Measure raw CSS, minified CSS, gzip, and Brotli from reproducible files and tool versions. Also report the JavaScript asset separately: existing consumers may stop shipping it, while the compatibility export remains as a small no-op. Do not set a byte budget before measuring.

Add a modest large-DOM fixture modeled on the motivating datatable/list use case. Measure class toggling and style/layout completion with many descendants. A native `@scope` variant can provide context where the same browser implements it reliably. Treat this as a regression sanity check, not a general benchmark or a claim that repeated guards are inherently expensive. Record DOM size, browser, hardware, sample method, and enough repeated observations to spot an obvious regression without presenting noisy timings as precise results.

### Phase 2: Documentation and compatibility claims

- [ ] Update README, current main-spec architecture/configuration sections, demo copy, and active migration instructions together.
- [ ] Describe component exclusion and inherited/global styling precisely. Remove claims of browser-default appearance, complete isolation, required JS, and guaranteed absence of a flash in the old implementation.
- [ ] Mark the Safari investigation's workaround and fix ETA as historical. Add the newer WebKit evidence without asserting an unverified backport or full resolution.
- [ ] Correct historical Firefox `@scope` support from 128 to 146, citing [Can I Use](https://caniuse.com/css-cascade-scope). Scope support is no longer a requirement of default Nimble CSS.
- [ ] Correct the build-target comment: [build.js](../build.js) contains fixed version targets, not a rolling last-two-version policy. Separate minifier targets from the browser support contract.
- [ ] Record a reproducible compatibility estimate with dataset date, features included, partial-support treatment, and optional enhancements excluded. Use the same usage dataset for Nimble and Pico; do not present feature intersections as rendering pass rates.

The September review estimated approximately 88.6% for Nimble's main feature set and 94-95% for Pico 2.1.1 using a dataset updated August 24, 2026. These are contextual estimates of feature prerequisites, not statements that Nimble or Pico renders correctly for that percentage of browsers. Recompute when documenting the implemented release. Pin the dataset date, exact browser/version sets, feature list, treatment of partial support, and optional enhancements excluded from the baseline. Use the same usage dataset for both frameworks and present separate tiers where appropriate:

| Compatibility tier | Coverage |
| --- | ---: |
| Core palette/layout prerequisites | Recompute after implementation |
| Full relative-color behavior | Recompute after implementation |
| Optional enhancements | Report separately |

The proposed selector guard does not define Nimble's main compatibility floor. Remaining `light-dark()`, relative `oklch()`, `color-mix()`, and related color requirements can reduce the stricter estimate after exclusion is fixed.

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

## Implementation sequence

1. Inventory emitted selectors by owner and bundle. Mark global and component rules explicitly, with special attention to the known migration hotspots and standalone entry points.
2. Build the source-level Sass helper and its configuration validation. Add guards to component sources while retaining the old path only as a temporary branch-local comparison.
3. Add the permanent parsed-selector regression test. Prove default, disabled, and custom-selector builds before removing the old mechanism.
4. Add the full Nimble rendering fixture and positive acceptance cases for cascade order, separate add-ons, concatenated application CSS, inheritance, pseudo-elements, and dynamic class toggling.
5. Run focused browser verification, including the available Safari environments, and record reduced-fixture evidence separately from full Nimble reproduction evidence.
6. Measure exclusion size and the large-DOM sanity fixture. Use the results to decide whether optimization is needed; do not redesign from assumption.
7. Switch the default, remove scope wrappers and sentinels, replace the JS with the compatibility no-op, and verify the final built artifacts. Do not ship an intermediate double-scoped form.
8. Update current documentation and release notes. Keep historical migration outcomes and the March Safari investigation labeled as history.
9. Handle color fallbacks as a separate change with its own browser matrix, size evidence, and compatibility calculation.

## Decisions and deferred work

| Decision | Basis | Rationale |
| --- | --- | --- |
| Source-level zero-specificity guards | Design | One mechanism serves prebuilt CSS and direct Sass consumers. |
| Enable exclusion by default | Design | Makes documented markup effective without runtime activation. |
| Keep global styling and inheritance | Existing contract | Exclusion is an escape from component declarations, not a document reset. |
| Keep JS export temporarily as a no-op | Compatibility choice | Avoid broken imports while removing dangerous rewriting; revisit at an announced breaking release. |
| Preserve configurable roots and null | Compatibility choice | Existing SCSS consumers retain useful configuration; no extra mode selector. |
| Ship color work separately | Scope choice | Broader theme behavior and verification should not delay the exclusion fix. |
| Keep selector completeness as a permanent test | Regression evidence | Source ownership is explicit, but future selectors can omit guards without an automated invariant. |

Deferred: a general `@scope` polyfill, Shadow DOM isolation, re-entry inside exclusions, broad legacy-browser support, external consumer migrations, and a new browser-testing service. None is necessary to implement this contract.

The remaining Safari evidence gap is reproduction of the historical full Nimble failure in a reliably identified Safari 18 environment. Reduced Safari 18 fixtures have passed, but they do not close that gap. Implementation may proceed without indefinite delay; the final report must distinguish reduced-fixture results, full Nimble results, and historical observations.
