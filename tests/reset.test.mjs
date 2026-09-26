import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import * as csstree from 'css-tree';
import * as sass from 'sass';

const root = resolve(import.meta.dirname, '..');
const reset = resolve(root, 'src', '_reset.scss');

function compileReset() {
  return sass.compile(reset, { loadPaths: [resolve(root, 'src')] }).css;
}

function hiddenRule(css) {
  const ast = csstree.parse(css, { context: 'stylesheet' });
  let match;

  csstree.walk(ast, (node) => {
    if (node.type !== 'Rule' || node.prelude.type !== 'SelectorList') return;

    const selector = csstree.generate(node.prelude).replaceAll('"', '');
    if (selector === ':where([hidden]:not([hidden=until-found i]))') match = node;
  });

  return match;
}

test('reset reinforces ordinary hidden state without breaking hidden=until-found', () => {
  const rule = hiddenRule(compileReset());
  assert.ok(rule, 'reset should exclude hidden=until-found from the enforced hidden state');

  const declarations = [];
  csstree.walk(rule.block, (node) => {
    if (node.type === 'Declaration') declarations.push(node);
  });

  const display = declarations.find((declaration) => declaration.property === 'display');
  assert.ok(display, 'hidden rule should set display');
  assert.equal(csstree.generate(display.value), 'none');
  assert.equal(display.important, true, 'hidden rule should beat ordinary author display rules');
});
