/**
 * SendGrid per-message tracking overrides.
 * Account-level click tracking rewrites links to url####.kicero.co.uk, which browsers
 * flag as impersonating kicero.co.uk and can break signed client-upload query params.
 */
export const SENDGRID_DIRECT_LINK_TRACKING = {
  click_tracking: {enable: false, enable_text: false},
  open_tracking: {enable: false},
} as const;
