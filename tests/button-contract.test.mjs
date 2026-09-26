import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import * as sass from 'sass';

const root = resolve(import.meta.dirname, '..');
const sassOptions = { loadPaths: [resolve(root, 'src')] };

function compile(partial) {
  return sass.compile(resolve(root, 'src', partial), sassOptions).css;
}

test('ARIA button semantics do not opt into Nimble button styling', () => {
  const css = [
    compile('_buttons.scss'),
    compile('_links.scss'),
    compile('_forms.scss'),
  ].join('\n');

  assert.doesNotMatch(
    css,
    /\[role=(?:"|')?button(?:"|')?\]/,
    'role="button" must remain independent of Nimble visual button styling',
  );
});

test('.nc-button shares the native button visual contract', () => {
  const css = compile('_buttons.scss');

  assert.match(css, /\.nc-button/);
  assert.match(css, /\.secondary:not\(a:not\(\.nc-button\)\)/);
  assert.match(css, /a:not\(\.nc-button\)\.secondary/);
  assert.match(css, /\.outline:not\(a:not\(\.nc-button\)\)/);
  assert.match(css, /\.nc-button[^}]*:hover|\.nc-button\):hover/);
  assert.match(css, /\.nc-button[^}]*:focus-visible|\.nc-button\):focus-visible/);
  assert.match(css, /\.nc-button[^}]*\.inline|\.nc-button\)\.inline/);
});

test('form rhythm treats .nc-button as a visual control', () => {
  const css = compile('_forms.scss');
  assert.match(css, /\.nc-button/);
});
