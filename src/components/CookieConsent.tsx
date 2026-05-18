import {motion, AnimatePresence} from 'motion/react';
import {X} from 'lucide-react';
import {useEffect, useId, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {useCookieConsent} from '../context/CookieConsentContext';

export default function CookieConsent() {
  const {
    hasAnswered,
    analyticsAllowed,
    acceptAll,
    rejectOptional,
    saveAnalyticsPreference,
    openPreferenceCentre,
    closePreferenceCentre,
    preferenceCentreOpen,
  } = useCookieConsent();

  const [draftAnalytics, setDraftAnalytics] = useState(analyticsAllowed);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const necessaryId = useId();
  const analyticsId = useId();

  useEffect(() => {
    if (preferenceCentreOpen) {
      setDraftAnalytics(analyticsAllowed);
    }
  }, [preferenceCentreOpen, analyticsAllowed]);

  useEffect(() => {
    if (!preferenceCentreOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const node = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    node?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePreferenceCentre();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [preferenceCentreOpen, closePreferenceCentre]);

  return (
    <>
      <AnimatePresence>
        {!hasAnswered && (
          <motion.div
            role="region"
            aria-label="Cookie consent"
            initial={{y: 120, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 120, opacity: 0}}
            transition={{duration: 0.45, ease: [0.16, 1, 0.3, 1]}}
            className="fixed bottom-0 left-0 right-0 z-[110] border-t border-brand-gray-200 bg-white/95 px-4 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-8"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="max-w-xl text-sm font-light leading-relaxed text-brand-gray-700">
                We use optional analytics to understand traffic in aggregate. We
                only turn these on if you allow them. See our{' '}
                <Link
                  to="/privacy"
                  className="underline underline-offset-2 hover:text-brand-black"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-2 md:justify-end">
                <button
                  type="button"
                  onClick={rejectOptional}
                  className="border border-brand-gray-300 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-gray-800 transition-colors hover:bg-brand-gray-100"
                >
                  Decline optional
                </button>
                <button
                  type="button"
                  onClick={openPreferenceCentre}
                  className="border border-brand-gray-300 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-gray-800 transition-colors hover:bg-brand-gray-100"
                >
                  Preferences
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="bg-black px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-brand-gray-800"
                >
                  Accept all
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {preferenceCentreOpen && (
          <motion.div
            key="cookie-pref-center"
            className="fixed inset-0 z-[115] flex items-center justify-center p-4"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
          >
            <button
              type="button"
              aria-label="Close preferences"
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={closePreferenceCentre}
            />
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{opacity: 0, scale: 0.96, y: 8}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.96, y: 8}}
              transition={{duration: 0.25, ease: [0.16, 1, 0.3, 1]}}
              className="relative z-[1] w-[calc(100%-2rem)] max-w-md rounded-lg border border-brand-gray-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2
                  id={titleId}
                  className="font-display text-lg font-bold uppercase tracking-tight text-brand-black"
                >
                  Cookie preferences
                </h2>
                <button
                  type="button"
                  onClick={closePreferenceCentre}
                  className="rounded p-1 text-brand-gray-500 hover:bg-brand-gray-100 hover:text-brand-black"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="mb-6 text-sm font-light leading-relaxed text-brand-gray-600">
                Choose which optional cookies we can use. You can update this
                any time from the footer.
              </p>

              <ul className="space-y-5 border-y border-brand-gray-100 py-5">
                <li className="flex gap-3">
                  <input
                    id={necessaryId}
                    type="checkbox"
                    checked
                    disabled
                    className="mt-1 h-4 w-4 rounded border-brand-gray-300"
                  />
                  <div>
                    <label
                      htmlFor={necessaryId}
                      className="text-sm font-bold uppercase tracking-wide text-brand-black"
                    >
                      Strictly necessary
                    </label>
                    <p className="mt-1 text-xs font-light text-brand-gray-600 leading-relaxed">
                      Stores your choices in this browser (localStorage) so we
                      do not ask again on every visit.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <input
                    id={analyticsId}
                    type="checkbox"
                    checked={draftAnalytics}
                    onChange={(e) => setDraftAnalytics(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-brand-gray-300 accent-black"
                  />
                  <div>
                    <label
                      htmlFor={analyticsId}
                      className="text-sm font-bold uppercase tracking-wide text-brand-black"
                    >
                      Analytics &amp; measurement
                    </label>
                    <p className="mt-1 text-xs font-light text-brand-gray-600 leading-relaxed">
                      Privacy-focused usage stats (for example Plausible) and,
                      where configured, session insights such as Microsoft
                      Clarity. No advertising cookies.
                    </p>
                  </div>
                </li>
              </ul>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closePreferenceCentre}
                  className="border border-brand-gray-300 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-gray-800 hover:bg-brand-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveAnalyticsPreference(draftAnalytics)}
                  className="bg-black px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-brand-gray-800"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
