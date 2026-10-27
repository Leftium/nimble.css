import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { transform, Features } from 'lightningcss';
import * as sass from 'sass';
import { chromePath, openChrome } from './helpers/chrome.mjs';

const root = resolve(import.meta.dirname, '..');

test('join divider states in full and minified CSS', {
  skip: chromePath ? false : 'Set CHROME_BIN to run browser regressions',
  timeout: 60000,
}, async (t) => {
  const browser = await openChrome(t);
  const css = sass.compile(resolve(root, 'src/nimble.scss')).css;
  const minified = transform({
    code: Buffer.from(css), minify: true,
    targets: { chrome: 120 << 16, firefox: 120 << 16, safari: (17 << 16) | (5 << 8) },
    exclude: Features.Colors | Features.ColorFunction,
  }).code.toString();
  // Reuse the actual demo's custom surfaces, including their hover overrides.
  const demo = readFileSync(resolve(root, 'site/demo/extended.html'), 'utf8');
  const demoStyle = demo.match(/<style>([\s\S]*?)<\/style>/)[1];
  for (const [format, stylesheet] of [['full', css], ['minified', minified]]) {
    await browser.evaluate(`document.head.innerHTML = '<style></style>';
      document.querySelector('style').textContent = ${JSON.stringify(stylesheet + demoStyle + '\nbutton { transition: none !important; }')};`);
    for (const theme of ['light', 'dark']) {
      await browser.evaluate(`document.documentElement.dataset.theme = '${theme}'`);
      const label = `${format}/${theme}`;
      async function fixture(children, classes = '', wrapper = '') {
        await browser.evaluate(`document.body.innerHTML = ${JSON.stringify(
          `<div class="${wrapper}"><div id="join" class="nc-join ${classes}">${children}</div></div>`,
        )}`);
        await browser.send('DOM.enable');
        await browser.send('CSS.enable');
        const { root: document } = await browser.send('DOM.getDocument');
        return document.nodeId;
      }
      async function force(documentId, index, pseudoClasses) {
        const { nodeId } = await browser.send('DOM.querySelector', {
          nodeId: documentId, selector: `#join > :nth-child(${index})`,
        });
        await browser.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: pseudoClasses });
      }
      const dividers = () => browser.evaluate(`Array.from(document.querySelector('#join').children)
        .slice(1).map(el => getComputedStyle(el, '::before').content)`);
      const expect = async (values, state) => assert.deepEqual(await dividers(), values, `${label}: ${state}`);

      for (const variant of ['', 'secondary', 'outline']) {
        const documentId = await fixture(`<button class="${variant}">A</button><button class="${variant}">B</button><button class="${variant}">C</button>`);
        await expect(['""', '""'], `${variant} idle`);
        for (const [index, expected] of [[1, ['none', '""']], [2, ['none', 'none']], [3, ['""', 'none']]]) {
          await force(documentId, index, ['hover']);
          await expect(expected, `${variant} hover ${index}`);
          await force(documentId, index, []);
        }
        await force(documentId, 1, ['hover']);
        await force(documentId, 2, ['hover']);
        await expect(['""', 'none'], `${variant} both neighbors hovered`);
        await force(documentId, 1, []);
        await force(documentId, 2, ['focus-visible']);
        await expect(['""', '""'], `${variant} keyboard focus`);
        const shadow = await browser.evaluate(`getComputedStyle(document.querySelector('#join > :nth-child(2)')).boxShadow`);
        assert.notEqual(shadow, 'none', `${label}: focus ring`);
        await force(documentId, 2, []);
        await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        assert.equal(await browser.evaluate(`document.activeElement.matches('#join > button:focus-visible')`), true, `${label}: keyboard navigation`);
        await expect(['""', '""'], `${variant} actual keyboard focus`);
        if (variant === 'outline') {
          assert.deepEqual(await browser.evaluate(`[
            getComputedStyle(document.querySelector('#join')).borderTopWidth,
            getComputedStyle(document.querySelector('#join > button')).borderTopWidth,
          ]`), ['1px', '0px'], `${label}: outline borders collapse onto group`);
        }

        await fixture(`<button class="${variant}">A</button><button class="${variant}" disabled>B</button><button class="${variant}" disabled>C</button><button class="${variant}">D</button>`);
        await expect(['none', '""', 'none'], `${variant} disabled boundaries`);
      }

      const resetId = await fixture('<button>P</button><button type="reset">R</button><button class="secondary">S</button><button type="reset">R</button><button>P</button>');
      await expect(['none', '""', '""', 'none'], 'implicit secondary reset');
      await force(resetId, 3, ['hover']);
      await expect(['none', 'none', 'none', 'none'], 'secondary hover between reset buttons');
      await fixture('<button class="outline" type="reset">R</button><button class="outline">O</button><button class="secondary">S</button>');
      await expect(['""', 'none'], 'outline takes precedence over reset');

      for (const custom of ['demo-light-buttons', 'demo-dark-buttons']) {
        const documentId = await fixture('<button>A</button><button>B</button><button disabled>C</button>', custom);
        const background = () => browser.evaluate(`getComputedStyle(document.querySelector('#join > :nth-child(2)')).backgroundColor`);
        const idle = await background();
        await force(documentId, 2, ['hover']);
        await expect(['""', 'none'], `${custom} hover and disabled`);
        assert.equal(await background(), idle, `${label}: custom background stays unchanged`);
      }
      const mixedId = await fixture('<button>P</button><button class="secondary">S</button><button class="outline">O</button><button>P</button>', 'demo-light-buttons');
      await force(mixedId, 2, ['hover']);
      await expect(['none', 'none', 'none'], 'custom hover override preserves mixed variants');

      await fixture('<input type="search"><button>Go</button><select><option>A</option></select><button>Go</button>');
      await expect(['none', '""', 'none'], 'input/select joins');
      await fixture('<button>A</button><button>B</button>', '', 'no-nimble');
      await expect(['none'], 'excluded subtree');
      await fixture('<button>A</button><button class="no-nimble">B</button>');
      await expect(['none'], 'excluded child');

      await fixture('<button>A</button><button>B</button>');
      await browser.evaluate(`document.querySelector('#join').style.setProperty('--nc-join-divider', 'rgb(1, 2, 3)')`);
      assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('#join > :last-child'), '::before').backgroundColor`), 'rgb(1, 2, 3)');
      await browser.evaluate(`document.querySelector('#join').className = ''; document.querySelector('#join').setAttribute('role', 'group')`);
      assert.notEqual(await browser.evaluate(`getComputedStyle(document.querySelector('#join')).display`), 'inline-flex', 'group semantics do not opt into joins');
    }
  }
});
