# PR Plan

Issue: #19

## Goal

Normalize the used height of native date/time inputs with Nimble's standard single-line form controls so side-by-side controls align without consumer height patches, while preserving native picker behavior and the existing iOS Safari sizing workaround.

## Scope

- Add a focused browser demo/measurement matrix covering text, email, url, tel, password, number, search, select, `input[list]`, date, month, week, time, datetime-local, and color controls. Keep checkbox, radio, range, and file controls visibly separate because they are intentionally outside the shared-height contract.
- Refactor `src/_forms.scss` around one canonical single-line control block-size calculation derived from the existing `--nc-control-padding-block` density contract, rather than adding a date-only magic number.
- Apply an explicit used block size where native/replaced controls need it, without forcing multiline `textarea` into the single-line height contract.
- Preserve natural-width behavior for date/time and datalist-connected inputs, existing full-width behavior for ordinary text-like controls/select/textarea, search pill geometry, color control sizing intent, native picker operation, and the out-of-layer `appearance: none` iOS workaround.
- Avoid a new public custom property unless implementation evidence shows the existing shared density variable cannot express the contract cleanly.

## Checkpoints

1. Characterize current geometry in the focused demo and record which standard-height controls diverge across available desktop browser engines.
2. Implement the shared height calculation and date/time normalization; update the demo so it has no consumer-side height workaround.
3. Verify the full matrix, density behavior, picker usability, and special-control exclusions; update durable docs/spec text only if the public sizing contract materially changes.

## Verify

- `pnpm test`
- `pnpm build`
- `git diff --check`
- In available supported desktop browsers, measure the standard-height matrix and confirm rendered heights differ by no more than about 1px.
- Verify native date/time picker interaction and icons where the browser exposes them.
- Verify the existing iOS Safari `appearance: none` sizing workaround remains present and does not regress.
- Verify changing `--nc-control-padding-block` still changes standard control density coherently.
- Confirm checkbox, radio, range, file, and multiline textarea behavior is not accidentally forced into the single-line height contract.
