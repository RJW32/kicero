/** Shared rules for questionnaire uploads (worker + dev server + client hints). */

export const DEFAULT_MAX_FILES = 100;
export const DEFAULT_MAX_BYTES = 500 * 1024 * 1024; // 500 MB per file (videos)

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|avi)$/i;
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg|heic|avif)$/i;
const DOC_EXT = /\.(pdf|zip|doc|docx|txt|csv|xls|xlsx|ppt|pptx)$/i;

export interface UploadValidationInput {
  filename: string;
  contentType: string;
  size: number;
  relativePath?: string;
  maxFiles?: number;
  maxBytes?: number;
}

export function sanitizeRelativePath(input: string): string {
  const normalized = input.replace(/\\/g, '/').trim();
  const segments = normalized
    .split('/')
    .filter((s) => s.length > 0 && s !== '.' && s !== '..');
  const safe = segments
    .map((seg) => seg.replace(/[^a-zA-Z0-9._\- ]/g, '_'))
    .join('/');
  return safe.slice(0, 500);
}

export function buildObjectKey(params: {
  filename: string;
  relativePath?: string;
  submissionId: string;
}): string {
  const day = new Date().toISOString().slice(0, 10);
  const safeName = params.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  const rel = params.relativePath?.trim()
    ? sanitizeRelativePath(params.relativePath)
    : '';
  const suffix = rel || safeName;
  return `submissions/${day}/${params.submissionId}/${suffix}`;
}

export function assertAllowedUpload(input: UploadValidationInput): {error?: string} {
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES;
  const name = input.filename?.trim() ?? '';
  if (!name) return {error: 'Missing filename.'};
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return {error: 'Invalid file size.'};
  }
  if (input.size > maxBytes) {
    return {error: `File exceeds limit of ${Math.round(maxBytes / (1024 * 1024))} MB.`};
  }

  const ct = (input.contentType ?? '').toLowerCase();
  const looksOk =
    ct.startsWith('image/') ||
    ct.startsWith('video/') ||
    ct.startsWith('audio/') ||
    VIDEO_EXT.test(name) ||
    IMAGE_EXT.test(name) ||
    DOC_EXT.test(name);

  if (!looksOk) {
    return {error: 'Unsupported file type.'};
  }

  return {};
}
