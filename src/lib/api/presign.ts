import {
  CLIENT_UPLOAD_BRANDING_LABEL,
  isAllowedClientUploadPageLabel,
} from '../../data/questionnaire';
import {pageSlugFromLabel, verifyClientUploadToken} from '../clientUploadToken';
import {
  assertAllowedBrandingPortalUpload,
  assertAllowedClientPortalUpload,
  assertAllowedUpload,
  buildClientMediaObjectKey,
  buildObjectKey,
} from '../questionnaireUploadPolicy';
import {
  getPresignedPutUrl,
  hasR2SigningCredentials,
  type R2SigningEnv,
} from '../r2Presign';
import {apiError, ok, type ApiResult} from './shared';

const PRESIGN_EXPIRES_SECONDS = 3600;
const UUID_RE = /^[a-f0-9-]{36}$/i;

export interface PresignEnv extends Partial<R2SigningEnv> {
  R2_PUBLIC_BASE?: string;
}

function publicUrlForKey(key: string, publicBase: string | undefined): string {
  const base = (publicBase ?? '').replace(/\/$/, '');
  return base ? `${base}/${key}` : key;
}

interface UploadUrlPayload {
  filename?: unknown;
  contentType?: unknown;
  size?: unknown;
  relativePath?: unknown;
  batchId?: unknown;
}

/**
 * Presign a direct-to-R2 PUT for a questionnaire upload.
 * `notConfigured` lets each runtime keep its own fallback semantics
 * (the dev server advertises the multipart fallback; the worker returns 503).
 */
export async function processQuestionnaireUploadUrl(
  rawBody: unknown,
  options: {env: PresignEnv; notConfigured: ApiResult},
): Promise<ApiResult> {
  const body: UploadUrlPayload = rawBody && typeof rawBody === 'object' ? rawBody : {};

  const filename = typeof body.filename === 'string' ? body.filename : '';
  const contentType =
    typeof body.contentType === 'string' && body.contentType.length > 0
      ? body.contentType
      : 'application/octet-stream';
  const size = typeof body.size === 'number' ? body.size : Number.NaN;
  const relativePathRaw =
    typeof body.relativePath === 'string' ? body.relativePath.trim() : undefined;
  const relativePath = relativePathRaw?.length ? relativePathRaw : undefined;
  const batchId = typeof body.batchId === 'string' ? body.batchId.trim() : '';

  if (!UUID_RE.test(batchId)) {
    return apiError(400, 'batchId must be a UUID so folder uploads stay grouped.');
  }

  const v = assertAllowedUpload({filename, contentType, size, relativePath});
  if (v.error) return apiError(400, v.error);

  const {env} = options;
  const publicBase = env.R2_PUBLIC_BASE;
  if (!hasR2SigningCredentials(env)) {
    return options.notConfigured;
  }

  try {
    const key = buildObjectKey({filename, relativePath, submissionId: batchId});
    const putUrl = await getPresignedPutUrl(env, {
      key,
      contentType,
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    });
    return ok({
      putUrl,
      key,
      url: publicUrlForKey(key, publicBase),
      filename: relativePath ?? filename,
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    });
  } catch {
    return apiError(500, 'Could not create upload URL.');
  }
}

interface ClientUploadPresignPayload {
  token?: unknown;
  pageLabel?: unknown;
  filename?: unknown;
  contentType?: unknown;
  size?: unknown;
}

/** Presign a direct-to-R2 PUT for the signed client upload portal. */
export async function processClientUploadPresign(
  rawBody: unknown,
  options: {env: PresignEnv; clientUploadSecret?: string},
): Promise<ApiResult> {
  const secret = options.clientUploadSecret?.trim();
  if (!secret) {
    return apiError(503, 'Client uploads are not configured.', {code: 'NO_CLIENT_UPLOAD'});
  }

  const body: ClientUploadPresignPayload = rawBody && typeof rawBody === 'object' ? rawBody : {};
  const token = typeof body.token === 'string' ? body.token : '';
  const pageLabel = typeof body.pageLabel === 'string' ? body.pageLabel.trim() : '';
  const filename = typeof body.filename === 'string' ? body.filename : '';
  const contentType =
    typeof body.contentType === 'string' && body.contentType.length > 0
      ? body.contentType
      : 'application/octet-stream';
  const size = typeof body.size === 'number' ? body.size : Number.NaN;

  if (!token || !pageLabel || !filename) {
    return apiError(400, 'token, pageLabel, and filename are required.');
  }

  let payload;
  try {
    payload = await verifyClientUploadToken(secret, token);
  } catch {
    return apiError(500, 'Could not validate upload token.');
  }

  if (!payload || !isAllowedClientUploadPageLabel(pageLabel, payload.pages)) {
    return apiError(403, 'Invalid or expired upload link.');
  }

  const v =
    pageLabel === CLIENT_UPLOAD_BRANDING_LABEL
      ? assertAllowedBrandingPortalUpload({filename, contentType, size})
      : assertAllowedClientPortalUpload({filename, contentType, size});
  if (v.error) return apiError(400, v.error);

  const {env} = options;
  const publicBase = env.R2_PUBLIC_BASE;
  if (!hasR2SigningCredentials(env)) {
    return apiError(
      503,
      'Direct upload is not configured. Set R2_ACCOUNT_ID and R2 API token credentials.',
      {code: 'NO_PRESIGN'},
    );
  }

  try {
    const key = buildClientMediaObjectKey({
      folder: payload.folder,
      pageSlug: pageSlugFromLabel(pageLabel),
      filename,
    });
    const putUrl = await getPresignedPutUrl(env, {
      key,
      contentType,
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    });
    return ok({
      putUrl,
      key,
      url: publicUrlForKey(key, publicBase),
      filename,
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    });
  } catch {
    return apiError(500, 'Could not create upload URL.');
  }
}
