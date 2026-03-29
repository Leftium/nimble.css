// no-nimble.js — Progressive enhancement for .no-nimble component isolation
// Wraps nimble.css scopeable rules in @scope at runtime. Auto-detects desktop
// Safari's @scope + @layer bug and gracefully degrades (no-op on broken browsers).
// No dependencies. No FOUC risk.

;(() => {
  const SENTINEL = '--nimble-scope-start'

  // --- Safari @scope + @layer bug detection ---
  // Desktop Safari 18.x parses @scope but silently fails to apply styles inside
  // @scope + @layer to certain elements. Test with a real element to be sure.
  function isScopeBroken() {
    const sheet = new CSSStyleSheet()
    try {
      sheet.replaceSync(
        '@scope (:root) to (.ns-t) { @layer ns-t { .ns-p { --ns: 1 } } }'
      )
    } catch {
      return true // @scope not supported at all
    }
    const el = document.createElement('div')
    el.className = 'ns-p'
    el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
    document.documentElement.appendChild(el)
    document.adoptedStyleSheets.push(sheet)
    const works = getComputedStyle(el).getPropertyValue('--ns').trim() === '1'
    el.remove()
    document.adoptedStyleSheets.pop()
    return !works
  }

  if (isScopeBroken()) return

  // --- Find nimble stylesheet by sentinel ---
  let nimbleSheet = null
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules)
        if (findSentinel(rule)) { nimbleSheet = sheet; break }
    } catch { /* cross-origin */ }
    if (nimbleSheet) break
  }
  if (!nimbleSheet) return

  // If already scoped via SCSS $exclude-selector, nothing to do
  for (const rule of nimbleSheet.cssRules)
    if (typeof CSSScopeRule !== 'undefined' && rule instanceof CSSScopeRule) return

  // --- Split rules: global vs scopeable ---
  // Sentinels appear inside @layer nimble.base and @layer nimble.utilities.
  // Rules before the sentinel in each layer block are global; after are scopeable.
  // Top-level rules after the last sentinel-containing block are scopeable.
  // @media print and @layer nimble.reset are always global.
  const globalCSS = []
  const scopeCSS = []
  let seenAnySentinel = false

  for (const rule of nimbleSheet.cssRules) {
    if (rule instanceof CSSLayerBlockRule && findSentinel(rule)) {
      // Split this layer block at the sentinel
      const layerName = rule.name
      const pre = [], post = []
      let past = false
      for (const inner of rule.cssRules) {
        if (!past && isSentinelRule(inner)) { past = true; continue }
        ;(past ? post : pre).push(inner.cssText)
      }
      if (pre.length)
        globalCSS.push(`@layer ${layerName} {\n${pre.join('\n')}\n}`)
      if (post.length)
        scopeCSS.push(`@layer ${layerName} {\n${post.join('\n')}\n}`)
      seenAnySentinel = true
    } else if (!seenAnySentinel ||
               rule instanceof CSSLayerStatementRule ||
               rule instanceof CSSMediaRule && rule.media.mediaText === 'print') {
      // Global: layer order declaration, reset layer, anything before first sentinel,
      // and @media print (loaded as global in SCSS)
      globalCSS.push(rule.cssText)
    } else {
      // After sentinel-containing blocks: scopeable (unlayered rules from forms, details, etc.)
      scopeCSS.push(rule.cssText)
    }
  }

  if (!scopeCSS.length) return

  // --- Build replacement stylesheet with @scope wrapper ---
  const css = globalCSS.join('\n') + '\n' +
    `@scope (:root) to (.no-nimble) {\n${scopeCSS.join('\n')}\n}`
  const replacement = new CSSStyleSheet()
  replacement.replaceSync(css)

  nimbleSheet.disabled = true
  document.adoptedStyleSheets.push(replacement)

  // --- Helpers ---
  function isSentinelRule(rule) {
    return rule instanceof CSSStyleRule &&
      rule.selectorText === ':root' &&
      rule.style.getPropertyValue(SENTINEL)
  }

  function findSentinel(rule) {
    if (isSentinelRule(rule)) return true
    if (rule.cssRules) {
      for (const inner of rule.cssRules)
        if (findSentinel(inner)) return true
    }
    return false
  }
})()
