/**
 * Platform-agnostic API building blocks shared by the production Cloudflare
 * Worker (worker.ts) and the local Express dev server (server.ts).
 *
 * Handlers here return an {@link ApiResult} (status + JSON body) and never
 * touch Request/Response or Express types, so each runtime stays a thin
 * adapter around the same logic.
 */

/** Status code + JSON body, ready for either runtime to serialise. */
export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

export function ok(body: Record<string, unknown> = {ok: true}): ApiResult {
  return {status: 200, body};
}

export function apiError(status: number, error: string, extra?: Record<string, unknown>): ApiResult {
  return {status, body: {error, ...extra}};
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Enquiries inbox; CONTACT_TO_EMAIL is often confused with CONTACT_FROM_EMAIL (noreply). */
export function contactSubmissionRecipient(raw: string | undefined): string {
  const t = raw?.trim();
  if (!t || t.toLowerCase() === 'noreply@kicero.co.uk') return 'info@kicero.co.uk';
  return t;
}

/** Email-related environment shared by both runtimes (worker env / process.env). */
export interface EmailEnv {
  SENDGRID_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  QUESTIONNAIRE_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
}

export type SendgridSendOutcome =
  | {ok: true}
  | {ok: false; providerStatus: number; providerMessage: string}
  | {ok: false; network: true};

export async function sendSendgridMail(
  apiKey: string,
  payload: unknown,
): Promise<SendgridSendOutcome> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const providerErrorText = await response.text();
      return {
        ok: false,
        providerStatus: response.status,
        providerMessage: providerErrorText.slice(0, 500),
      };
    }
    return {ok: true};
  } catch {
    return {ok: false, network: true};
  }
}
