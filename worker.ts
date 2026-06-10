/**
 * Production Cloudflare Worker: routes /api/* to the shared handlers in
 * src/lib/api/ and serves the prerendered static site for everything else.
 * The local Express equivalent lives in server.ts.
 */
import {processContactSubmission} from './src/lib/api/contact';
import {
  processClientUploadPresign,
  processQuestionnaireUploadUrl,
  type PresignEnv,
} from './src/lib/api/presign';
import {processQuestionnaireSubmission} from './src/lib/api/questionnaire';
import {apiError, type ApiResult} from './src/lib/api/shared';
import {assertAllowedUpload, buildObjectKey} from './src/lib/questionnaireUploadPolicy';

interface AssetFetcher {
  fetch: (request: Request) => Promise<Response>;
}

interface R2Bucket {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | ReadableStream | Blob,
    options?: {httpMetadata?: {contentType?: string}},
  ) => Promise<void>;
}

interface Env {
  ASSETS: AssetFetcher;
  R2_BUCKET: R2Bucket;
  R2_PUBLIC_BASE?: string;
  /** R2 S3 API — create keys in Cloudflare dashboard; required for direct browser uploads */
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  /** Override when bucket uses EU / FedRAMP jurisdiction API hostname */
  R2_S3_ENDPOINT?: string;
  SENDGRID_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  /** Inbox for questionnaire submissions (internal SendGrid "to" address) */
  QUESTIONNAIRE_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
  PUBLIC_SITE_URL?: string;
  /** Required for personalised signed client upload links + presigned PUTs (+ use wrangler secret in prod). */
  CLIENT_UPLOAD_SECRET?: string;
}

function toResponse(result: ApiResult): Response {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {'Content-Type': 'application/json'},
  });
}

function presignEnv(env: Env): PresignEnv {
  return {
    R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: env.R2_BUCKET_NAME,
    R2_S3_ENDPOINT: env.R2_S3_ENDPOINT,
    R2_PUBLIC_BASE: env.R2_PUBLIC_BASE,
  };
}

const METHOD_NOT_ALLOWED = apiError(405, 'Method not allowed.');
const INVALID_JSON = apiError(400, 'Invalid JSON body.');

async function readJsonBody(request: Request): Promise<unknown | null> {
  return request.json().catch(() => null);
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {status: 204});
  }
  if (request.method !== 'POST') return toResponse(METHOD_NOT_ALLOWED);

  const body = await readJsonBody(request);
  if (body === null) return toResponse(INVALID_JSON);
  return toResponse(await processContactSubmission(body, env));
}

async function handleQuestionnaireUploadUrl(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return toResponse(METHOD_NOT_ALLOWED);

  const body = await readJsonBody(request);
  if (body === null) return toResponse(INVALID_JSON);
  return toResponse(
    await processQuestionnaireUploadUrl(body, {
      env: presignEnv(env),
      notConfigured: apiError(
        503,
        'Direct upload is not configured. Set R2_ACCOUNT_ID and R2 API token credentials on the worker.',
        {code: 'NO_PRESIGN'},
      ),
    }),
  );
}

/** Same-origin multipart fallback: streams the file straight into R2. */
async function handleQuestionnaireUpload(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return toResponse(METHOD_NOT_ALLOWED);

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) {
    return toResponse(apiError(400, 'Expected file upload.'));
  }

  const batchIdRaw =
    typeof formData?.get('batchId') === 'string'
      ? (formData.get('batchId') as string).trim()
      : '';
  const relativePathRaw =
    typeof formData?.get('relativePath') === 'string'
      ? (formData.get('relativePath') as string).trim()
      : '';
  const relativePath = relativePathRaw.length ? relativePathRaw : undefined;

  let batchId: string | undefined;
  if (batchIdRaw) {
    if (!/^[a-f0-9-]{36}$/i.test(batchIdRaw)) {
      return toResponse(apiError(400, 'batchId must be a UUID so folder uploads stay grouped.'));
    }
    batchId = batchIdRaw;
  }

  const contentType = file.type || 'application/octet-stream';

  const v = assertAllowedUpload({
    filename: file.name,
    contentType,
    size: file.size,
    relativePath,
  });
  if (v.error) return toResponse(apiError(400, v.error));

  const key = batchId
    ? buildObjectKey({filename: file.name, relativePath, submissionId: batchId})
    : `submissions/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  await env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: {contentType},
  });

  const base = (env.R2_PUBLIC_BASE ?? '').replace(/\/$/, '');
  const url = base ? `${base}/${key}` : key;

  return toResponse({
    status: 200,
    body: {
      key,
      url,
      filename: relativePath ?? file.name,
      size: file.size,
      contentType,
      ...(relativePath ? {relativePath} : {}),
    },
  });
}

async function handleClientUploadPresign(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return toResponse(METHOD_NOT_ALLOWED);

  const body = await readJsonBody(request);
  if (body === null) return toResponse(INVALID_JSON);
  return toResponse(
    await processClientUploadPresign(body, {
      env: presignEnv(env),
      clientUploadSecret: env.CLIENT_UPLOAD_SECRET,
    }),
  );
}

async function handleQuestionnaire(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return toResponse(METHOD_NOT_ALLOWED);

  const body = await readJsonBody(request);
  if (body === null) return toResponse(INVALID_JSON);
  return toResponse(
    await processQuestionnaireSubmission(body, {requestUrl: request.url, env}),
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') {
      return handleContact(request, env);
    }
    if (url.pathname === '/api/questionnaire/upload-url') {
      return handleQuestionnaireUploadUrl(request, env);
    }
    if (url.pathname === '/api/questionnaire/upload') {
      return handleQuestionnaireUpload(request, env);
    }
    if (url.pathname === '/api/client-upload/presign') {
      return handleClientUploadPresign(request, env);
    }
    if (url.pathname === '/api/questionnaire') {
      return handleQuestionnaire(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
