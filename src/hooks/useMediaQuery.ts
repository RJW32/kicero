import {useEffect, useState} from 'react';

/**
 * Subscribe to a CSS media query in a way that's safe for SSR/prerender.
 * Returns the initial value (defaultValue) on the first server-side render,
 * and the live match status afterward in the browser.
 */
function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, [query]);

  return matches;
}

/** True when the user has requested reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** True for fine-pointer devices (real mouse/trackpad, not touch). */
export function useIsFinePointer(): boolean {
  return useMediaQuery('(pointer: fine)');
}
