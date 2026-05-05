/**
 * Returns true when the page is being rendered by the prerender pipeline
 * (puppeteer hits routes with ?prerender=1). Use to skip heavy/animated UI
 * during static HTML generation.
 *
 * This is intentionally a pure function (not a hook) so it can be evaluated
 * once at module/component init without scheduling state.
 */
export function isPrerender(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return new URLSearchParams(window.location.search).get('prerender') === '1';
  } catch {
    return false;
  }
}
