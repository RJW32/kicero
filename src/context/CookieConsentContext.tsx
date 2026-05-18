import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  COOKIE_CONSENT_VERSION,
  getInitialConsentFromStorage,
  writeStoredConsent,
} from '../lib/cookieConsentStorage';

export type CookieConsentContextValue = {
  hasAnswered: boolean;
  analyticsAllowed: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  /** Persist analytics toggle and close the preference centre. */
  saveAnalyticsPreference: (allowed: boolean) => void;
  openPreferenceCentre: () => void;
  closePreferenceCentre: () => void;
  preferenceCentreOpen: boolean;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
);

export function CookieConsentProvider({children}: {children: ReactNode}) {
  const [hasAnswered, setHasAnswered] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return getInitialConsentFromStorage().hasAnswered;
  });
  const [analyticsAllowed, setAnalyticsAllowed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return getInitialConsentFromStorage().analyticsAllowed;
  });
  const [preferenceCentreOpen, setPreferenceCentreOpen] = useState(false);

  const openPreferenceCentre = useCallback(() => {
    setPreferenceCentreOpen(true);
  }, []);

  const closePreferenceCentre = useCallback(() => {
    setPreferenceCentreOpen(false);
  }, []);

  const acceptAll = useCallback(() => {
    writeStoredConsent(true);
    setAnalyticsAllowed(true);
    setHasAnswered(true);
    setPreferenceCentreOpen(false);
  }, []);

  const rejectOptional = useCallback(() => {
    const hadAnalytics = analyticsAllowed;
    writeStoredConsent(false);
    setAnalyticsAllowed(false);
    setHasAnswered(true);
    setPreferenceCentreOpen(false);
    if (hadAnalytics) window.location.reload();
  }, [analyticsAllowed]);

  const saveAnalyticsPreference = useCallback(
    (allowed: boolean) => {
      const hadAnalytics = analyticsAllowed;
      writeStoredConsent(allowed);
      setAnalyticsAllowed(allowed);
      setHasAnswered(true);
      setPreferenceCentreOpen(false);
      if (hadAnalytics && !allowed) window.location.reload();
    },
    [analyticsAllowed],
  );

  const value = useMemo(
    (): CookieConsentContextValue => ({
      hasAnswered,
      analyticsAllowed,
      acceptAll,
      rejectOptional,
      saveAnalyticsPreference,
      openPreferenceCentre,
      closePreferenceCentre,
      preferenceCentreOpen,
    }),
    [
      hasAnswered,
      analyticsAllowed,
      acceptAll,
      rejectOptional,
      saveAnalyticsPreference,
      openPreferenceCentre,
      closePreferenceCentre,
      preferenceCentreOpen,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}
