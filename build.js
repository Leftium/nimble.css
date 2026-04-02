#!/usr/bin/env node

// ==========================================================================
// nimble.css — Build Script
// Sass compile + Lightning CSS minify
// ==========================================================================

import * as sass from 'sass';
import { transform, Features } from 'lightningcss';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const { values: flags } = parseArgs({
  options: {
    prefix: { type: 'string', default: '' },
  },
  strict: false,
});

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ROOT = new URL('.', import.meta.url).pathname;
const DIST = resolve(ROOT, 'dist');
const SITE_DIST = resolve(ROOT, 'site/dist');

// Entry points → output filenames
const entries = [
  { input: 'src/nimble.scss',           outName: 'nimble' },
  { input: 'src/nimble-core.scss',     outName: 'nimble-core' },
  { input: 'src/nimble-base.scss',      outName: 'nimble-base' },
  { input: 'src/nimble-reset.scss',     outName: 'nimble-reset' },
  { input: 'src/nimble-utilities.scss', outName: 'nimble-utilities' },
  { input: 'src/nimble-shadow.scss',     outName: 'nimble-shadow' },
  { input: 'src/nimble-progress.scss',  outName: 'nimble-progress' },
  { input: 'src/nimble-meter.scss',     outName: 'nimble-meter' },
  { input: 'src/nimble-select.scss',    outName: 'nimble-select' },
];

// Browser targets for Lightning CSS (last 2 versions of modern browsers)
const targets = {
  chrome: (120 << 16),   // Chrome 120+
  firefox: (120 << 16),  // Firefox 120+
  safari: (17 << 16) | (5 << 8),  // Safari 17.5+
};

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
mkdirSync(DIST, { recursive: true });
mkdirSync(SITE_DIST, { recursive: true });

for (const entry of entries) {
  const inputPath = resolve(ROOT, entry.input);

  // --- Sass ---
  const sassOptions = {
    loadPaths: [resolve(ROOT, 'src')],
  };

  // Inject $prefix override if provided via CLI
  if (flags.prefix) {
    const prefixValue = flags.prefix;
    // Create a virtual wrapper that @use's config with the prefix override,
    // then @forward's the real entry point. The wrapper URL must differ from
    // the entry to avoid a circular-import error.
    const wrapper =
      `@use 'config' with ($prefix: '${prefixValue}');\n` +
      `@use '${entry.input.replace(/^src\//, '').replace(/\.scss$/, '')}';\n`;
    const compiled = sass.compileString(wrapper, {
      ...sassOptions,
      // Use a distinct virtual URL so Sass doesn't detect a self-import
      url: new URL('file://' + resolve(ROOT, 'src', '_wrapper.scss')),
    });
    processOutput(compiled.css, entry.outName);
    continue;
  }

  const compiled = sass.compile(inputPath, sassOptions);
  processOutput(compiled.css, entry.outName);
}

function processOutput(css, outName) {
  const cssBuffer = Buffer.from(css);

  // Write unminified
  writeFileSync(resolve(DIST, `${outName}.css`), css);
  writeFileSync(resolve(SITE_DIST, `${outName}.css`), css);

  // --- Lightning CSS minify ---
  const minified = transform({
    filename: `${outName}.css`,
    code: cssBuffer,
    minify: true,
    targets,
    // Don't transform modern features we intentionally use
    exclude:
      Features.Colors         // keep oklch, light-dark() as-is
      | Features.ColorFunction,
  });

  writeFileSync(resolve(DIST, `${outName}.min.css`), minified.code);
  writeFileSync(resolve(SITE_DIST, `${outName}.min.css`), minified.code);

  // Report sizes
  const fullSize = cssBuffer.length;
  const minSize = minified.code.length;
  console.log(`  ${outName}.css      ${fullSize} B`);
  console.log(`  ${outName}.min.css  ${minSize} B`);
}

console.log('\nBuild complete → dist/ + site/dist/');
