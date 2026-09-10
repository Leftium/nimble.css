import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import * as csstree from 'css-tree';
import { Features, transform } from 'lightningcss';
import * as sass from 'sass';

const root = resolve(import.meta.dirname, '..');
const source = (path) => resolve(root, 'src', path);
const guardClass = 'no-nimble';
const sassOptions = { loadPaths: [resolve(root, 'src')] };
const minifyTargets = {
  chrome: 120 << 16,
  firefox: 120 << 16,
  safari: (17 << 16) | (5 << 8),
};

const componentPartials = [
  '_typography.scss', '_links.scss', '_buttons.scss', '_forms.scss',
  '_tables.scss', '_code.scss', '_media.scss', '_article.scss',
  '_details.scss', '_dialog.scss', '_utilities.scss', '_progress.scss',
  '_meter.scss', '_select.scss',
];

const globalPartials = [
  '_reset.scss', '_colors.scss', '_document.scss', '_grid-columns.scss',
  '_shadow.scss', '_layout-utilities.scss', '_print.scss',
];

function compile(path) {
  return sass.compile(path, sassOptions).css;
}

function compileConfigured(configuration) {
  return sass.compileString(
    `@use 'nimble' with ($exclude-selector: ${configuration});`,
    sassOptions,
  ).css;
}

function minify(css) {
  return transform({
    filename: 'nimble.css',
    code: Buffer.from(css),
    minify: true,
    targets: minifyTargets,
    exclude: Features.Colors | Features.ColorFunction,
  }).code.toString();
}

function selectorRules(css) {
  const ast = csstree.parse(css, { context: 'stylesheet' });
  const rules = [];
  let keyframesDepth = 0;

  csstree.walk(ast, {
    enter(node) {
      if (node.type === 'Atrule' && /keyframes$/i.test(node.name)) keyframesDepth++;
      if (node.type === 'Rule' && node.prelude.type === 'SelectorList' && !keyframesDepth)
        rules.push(...node.prelude.children.toArray());
    },
    leave(node) {
      if (node.type === 'Atrule' && /keyframes$/i.test(node.name)) keyframesDepth--;
    },
  });

  return rules;
}

function guardNode(selector, className = guardClass) {
  return selector.children.toArray().find((node) => {
    if (node.type !== 'PseudoClassSelector' || node.name !== 'where') return false;
    let found = false;
    csstree.walk(node, (child) => {
      if (child.type === 'ClassSelector' && child.name === className) found = true;
      if (child.type === 'IdSelector' && child.name === className) found = true;
    });
    return found;
  });
}

function assertGuardPlacement(css, label, className = guardClass) {
  const selectors = selectorRules(css);
  assert.ok(selectors.length, `${label} should emit selectors`);

  for (const selector of selectors) {
    const children = selector.children.toArray();
    const guard = guardNode(selector, className);
    assert.ok(guard, `${label}: missing guard on ${csstree.generate(selector)}`);

    const guardIndex = children.indexOf(guard);
    const lastCombinator = children.reduce(
      (index, node, current) => node.type === 'Combinator' ? current : index,
      -1,
    );
    const pseudoElement = children.findIndex((node) => node.type === 'PseudoElementSelector');

    assert.ok(
      guardIndex > lastCombinator,
      `${label}: guard must be on the declaration subject in ${csstree.generate(selector)}`,
    );
    if (pseudoElement !== -1) {
      assert.ok(
        guardIndex < pseudoElement,
        `${label}: guard must precede pseudo-element in ${csstree.generate(selector)}`,
      );
    }
  }
}

function assertUnguarded(css, label) {
  for (const selector of selectorRules(css)) {
    assert.equal(
      guardNode(selector),
      undefined,
      `${label}: global selector must remain unguarded: ${csstree.generate(selector)}`,
    );
  }
}

test('component partials guard every selector before and after minification', () => {
  for (const partial of componentPartials) {
    const css = compile(source(partial));
    assertGuardPlacement(css, partial);
    assertGuardPlacement(minify(css), `${partial} minified`);
  }
});

test('global partials remain unguarded', () => {
  for (const partial of globalPartials) assertUnguarded(compile(source(partial)), partial);
});

test('full and standalone bundles preserve valid guard placement after minification', () => {
  for (const entry of ['nimble.scss', 'nimble-core.scss', 'nimble-base.scss', 'nimble-utilities.scss', 'nimble-progress.scss', 'nimble-meter.scss', 'nimble-select.scss']) {
    const css = compile(source(entry));
    const guarded = selectorRules(css).filter((selector) => guardNode(selector));
    assert.ok(guarded.length, `${entry} should emit guarded component selectors`);
    for (const selector of guarded) assertGuardPlacement(`${csstree.generate(selector)} {}`, entry);
    const minified = minify(css);
    const minifiedGuarded = selectorRules(minified).filter((selector) => guardNode(selector));
    for (const selector of minifiedGuarded) assertGuardPlacement(`${csstree.generate(selector)} {}`, `${entry} minified`);
  }
});

test('Sass configuration supports default, false, custom, list, ID, and prefix variants', () => {
  const defaultCss = compileConfigured("'.no-nimble'");
  const defaultGuarded = selectorRules(defaultCss).filter((selector) => guardNode(selector));
  assert.ok(defaultGuarded.length, 'default configuration should emit component guards');
  for (const selector of defaultGuarded)
    assertGuardPlacement(`${csstree.generate(selector)} {}`, 'default configuration');

  const disabledCss = compileConfigured('false');
  assertUnguarded(disabledCss, 'false configuration');
  assert.match(disabledCss, /h1\s*\{/);

  const customCss = compileConfigured("'[data-unstyled], #third-party'");
  const customGuard = ':where(:not([data-unstyled],#third-party,[data-unstyled] *,#third-party *))';
  assert.ok(
    customCss.replaceAll(' ', '').includes(customGuard.replaceAll(' ', '')),
    'custom selector list must guard every root and descendant',
  );
  assert.ok(!customCss.includes('.no-nimble'));

  const prefixedCss = sass.compileString(
    "@use 'nimble' with ($prefix: '--custom-', $exclude-selector: false);",
    sassOptions,
  ).css;
  assert.match(prefixedCss, /--custom-primary/);
  assertUnguarded(prefixedCss, 'prefixed false configuration');
});

test('Sass configuration rejects invalid, empty, relative, and pseudo-element roots', () => {
  for (const configuration of ["'['", "''", "'> .third-party'", "'input::before'"]) {
    assert.throws(() => compileConfigured(configuration));
  }
});

test('deprecated compatibility export only warns', () => {
  const warnings = [];
  const script = readFileSync(resolve(root, 'site/no-nimble.js'), 'utf8');
  vm.runInNewContext(script, { console: { warn: (message) => warnings.push(message) } });
  assert.deepEqual(warnings, [
    '[nimble.css] `@leftium/nimble.css/no-nimble` is deprecated and no longer needed. Remove this import before a future release removes the compatibility export.',
  ]);
});
