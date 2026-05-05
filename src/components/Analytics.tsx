import {useHead} from '@unhead/react';
import {useMemo} from 'react';
import {isPrerender} from '../hooks/useIsPrerender';

const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as
  | string
  | undefined;
const PLAUSIBLE_SCRIPT =
  (import.meta.env.VITE_PLAUSIBLE_SCRIPT as string | undefined) ??
  'https://plausible.io/js/script.js';
const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID as
  | string
  | undefined;

/**
 * Analytics injector. Skips entirely during prerender (to keep static HTML
 * tracker-free) and when no env vars are configured.
 *
 * Always calls hooks unconditionally — Rules of Hooks. We pass an empty list
 * of scripts when disabled.
 */
export default function Analytics() {
  const skip = isPrerender();

  const scripts = useMemo(() => {
    if (skip) return [] as Array<Record<string, unknown>>;
    const out: Array<Record<string, unknown>> = [];
    if (PLAUSIBLE_DOMAIN) {
      out.push({
        src: PLAUSIBLE_SCRIPT,
        defer: true,
        'data-domain': PLAUSIBLE_DOMAIN,
        tagPosition: 'head',
      });
    }
    if (CLARITY_PROJECT_ID) {
      out.push({
        innerHTML: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_PROJECT_ID}");`,
        tagPosition: 'head',
      });
    }
    return out;
  }, [skip]);

  // useHead's strict types require a `type` field on scripts; ours intentionally
  // omit it so the browser uses the default JS MIME. Cast through to keep
  // useHead permissive.
  useHead({script: scripts as never});

  return null;
}
