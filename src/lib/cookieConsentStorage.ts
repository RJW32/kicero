/** Bump when categories or policy change so users see the banner again. */
const COOKIE_CONSENT_VERSION = 1;

const COOKIE_CONSENT_STORAGE_KEY = 'kicero-cookie-consent';

type StoredCookieConsent = {
  v: number;
  /** Optional measurement scripts (Plausible, Microsoft Clarity, etc.). */
  analytics: boolean;
  /** ISO-ish unix ms for debugging / future expiry. */
  t: number;
};

function readStoredConsent(): StoredCookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCookieConsent;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.v !== 'number' ||
      typeof parsed.analytics !== 'boolean'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredConsent(analytics: boolean): void {
  if (typeof window === 'undefined') return;
  const payload: StoredCookieConsent = {
    v: COOKIE_CONSENT_VERSION,
    analytics,
    t: Date.now(),
  };
  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

export function getInitialConsentFromStorage(): {
  hasAnswered: boolean;
  analyticsAllowed: boolean;
} {
  const stored = readStoredConsent();
  if (!stored || stored.v !== COOKIE_CONSENT_VERSION) {
    return {hasAnswered: false, analyticsAllowed: false};
  }
  return {
    hasAnswered: true,
    analyticsAllowed: stored.analytics,
  };
}
