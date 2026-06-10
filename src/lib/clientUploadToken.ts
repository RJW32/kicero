import {PAGE_OPTIONS_ORDER} from '../data/questionnaire';

const CLIENT_UPLOAD_TOKEN_VERSION = 1;
/** Signed links expire after this many seconds (shown in questionnaire email). */
export const CLIENT_UPLOAD_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

export type ClientUploadTokenPayload = {
  v: typeof CLIENT_UPLOAD_TOKEN_VERSION;
  exp: number;
  /** Folder segment under client-media/, includes client-identifying slug. */
  folder: string;
  /** Canonical page labels (PAGE_OPTIONS_ORDER values). */
  pages: readonly string[];
};

const enc = new TextEncoder();

function decodeBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const b64 = padded + '='.repeat(padLen);
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function encodeBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function canonicalMessage(p: ClientUploadTokenPayload): string {
  const pages = [...p.pages].sort().join('|');
  return `v:${p.v}|exp:${p.exp}|folder:${p.folder}|pages:${pages}`;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret.slice(0, 256)),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
}

/** Slug usable as an R2 path segment combining display name + disambiguator. */
export function buildClientUploadFolder(clientName: string, ref: string): string {
  const raw = clientName.trim() || 'client';
  const namePart = raw
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'client';
  let suffix = ref.trim().replace(/[^a-zA-Z0-9-]/g, '').slice(0, 24);
  if (!suffix) suffix = crypto.randomUUID().slice(0, 8);
  return `${namePart}-${suffix}`.slice(0, 80);
}

/** URL-safe slug for a questionnaire page label (e.g. "Portfolio / Gallery" → portfolio-gallery). */
export function pageSlugFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Server-side: mint a signed fragment for query param `t`. */
export async function mintClientUploadToken(
  secret: string,
  input: {
    folder: string;
    pages: readonly string[];
    ttlSeconds: number;
  },
): Promise<string> {
  if (!secret.trim()) throw new Error('CLIENT_UPLOAD_SECRET is required to mint tokens.');
  const exp = Math.floor(Date.now() / 1000) + input.ttlSeconds;
  const payload: ClientUploadTokenPayload = {
    v: CLIENT_UPLOAD_TOKEN_VERSION,
    exp,
    folder: input.folder,
    pages: [...input.pages],
  };
  const key = await importHmacKey(secret.trim());
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(canonicalMessage(payload)));
  const payloadB64 = encodeBase64Url(enc.encode(JSON.stringify(payload)));
  const sigB64 = encodeBase64Url(sig);
  return `${payloadB64}.${sigB64}`;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  return out === 0;
}

/** Validates HMAC + expiry + allowed page labels + folder shape. */
export async function verifyClientUploadToken(
  secret: string,
  token: string,
): Promise<ClientUploadTokenPayload | null> {
  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;
  let payload: ClientUploadTokenPayload;
  try {
    const json = new TextDecoder().decode(decodeBase64Url(parts[0]!));
    payload = JSON.parse(json) as ClientUploadTokenPayload;
  } catch {
    return null;
  }
  if (payload.v !== CLIENT_UPLOAD_TOKEN_VERSION || typeof payload.folder !== 'string') return null;
  if (!payload.folder.length || payload.folder.length > 80 || payload.folder.includes('/')) return null;
  if (!Number.isFinite(payload.exp) || Math.floor(Date.now() / 1000) >= payload.exp) return null;
  const allowedSet = new Set<string>(PAGE_OPTIONS_ORDER);
  if (!Array.isArray(payload.pages) || payload.pages.length === 0) return null;
  for (const p of payload.pages) {
    if (typeof p !== 'string' || !allowedSet.has(p)) return null;
  }
  try {
    const key = await importHmacKey(secret.trim());
    const expected = encodeBase64Url(
      await crypto.subtle.sign('HMAC', key, enc.encode(canonicalMessage(payload))),
    );
    if (!timingSafeEqualStr(parts[1]!, expected)) return null;
  } catch {
    return null;
  }
  return payload;
}

/** Client-only decode for UI (never trusted server-side). */
export function decodeClientUploadTokenForUi(token: string | undefined): Omit<
  ClientUploadTokenPayload,
  'v'
> & { v?: number } | null {
  if (!token?.trim()) return null;
  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;
  try {
    const json = new TextDecoder().decode(decodeBase64Url(parts[0]!));
    const o = JSON.parse(json) as Partial<ClientUploadTokenPayload>;
    if (typeof o.exp !== 'number' || typeof o.folder !== 'string' || !Array.isArray(o.pages)) {
      return null;
    }
    return {
      exp: o.exp,
      folder: o.folder,
      pages: [...o.pages].filter((p): p is string => typeof p === 'string'),
    };
  } catch {
    return null;
  }
}
