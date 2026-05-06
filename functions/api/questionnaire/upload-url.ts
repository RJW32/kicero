import {assertAllowedUpload, buildObjectKey} from '../../../src/lib/questionnaireUploadPolicy';
import {getPresignedPutUrl, hasR2SigningCredentials, type R2SigningEnv} from '../../../src/lib/r2Presign';

interface Env {
  R2_PUBLIC_BASE?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
}

type PagesContext<TEnv> = {
  request: Request;
  env: TEnv;
};

type PagesFunction<TEnv> = (context: PagesContext<TEnv>) => Response | Promise<Response>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
}

interface UploadUrlPayload {
  filename?: unknown;
  contentType?: unknown;
  size?: unknown;
  relativePath?: unknown;
  batchId?: unknown;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = (await context.request.json().catch(() => null)) as UploadUrlPayload | null;
  if (!body) return jsonResponse({error: 'Invalid JSON body.'}, 400);

  const filename = typeof body.filename === 'string' ? body.filename : '';
  const contentType =
    typeof body.contentType === 'string' && body.contentType.length > 0
      ? body.contentType
      : 'application/octet-stream';
  const size = typeof body.size === 'number' ? body.size : Number.NaN;
  const relativePath =
    typeof body.relativePath === 'string' ? body.relativePath.trim() : undefined;
  const batchIdRaw = typeof body.batchId === 'string' ? body.batchId.trim() : '';

  if (!/^[a-f0-9-]{36}$/i.test(batchIdRaw)) {
    return jsonResponse({error: 'batchId must be a UUID so folder uploads stay grouped.'}, 400);
  }

  const v = assertAllowedUpload({
    filename,
    contentType,
    size,
    relativePath,
  });
  if (v.error) return jsonResponse({error: v.error}, 400);

  const signingEnv: Partial<R2SigningEnv> = {
    R2_ACCOUNT_ID: context.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: context.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: context.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: context.env.R2_BUCKET_NAME,
  };

  if (!hasR2SigningCredentials(signingEnv)) {
    return jsonResponse(
      {
        error: 'Direct upload is not configured. Set R2 S3 API credentials.',
        code: 'NO_PRESIGN',
      },
      503,
    );
  }

  const key = buildObjectKey({
    filename,
    relativePath: relativePath?.length ? relativePath : undefined,
    submissionId: batchIdRaw,
  });

  try {
    const putUrl = await getPresignedPutUrl(signingEnv, {key, contentType, expiresIn: 3600});
    const base = (context.env.R2_PUBLIC_BASE ?? '').replace(/\/$/, '');
    const publicUrl = base ? `${base}/${key}` : key;
    const displayName = relativePath?.length ? relativePath : filename;

    return jsonResponse({
      putUrl,
      key,
      url: publicUrl,
      filename: displayName,
      expiresIn: 3600,
    });
  } catch {
    return jsonResponse({error: 'Could not create upload URL.'}, 500);
  }
};
