import {assertAllowedUpload, buildObjectKey} from '../../../src/lib/questionnaireUploadPolicy';

interface Env {
  R2_BUCKET: R2Bucket;
  R2_PUBLIC_BASE?: string;
}

interface R2Bucket {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | ReadableStream | Blob,
    options?: {httpMetadata?: {contentType?: string}},
  ) => Promise<void>;
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const formData = await context.request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) {
    return jsonResponse({error: 'Expected file upload.'}, 400);
  }

  const batchIdRaw =
    typeof formData?.get('batchId') === 'string'
      ? (formData.get('batchId') as string).trim()
      : '';
  const relativePathRaw =
    typeof formData?.get('relativePath') === 'string'
      ? (formData.get('relativePath') as string).trim()
      : '';

  const relativePath = relativePathRaw?.length ? relativePathRaw : undefined;

  let batchId: string | undefined;
  if (batchIdRaw) {
    if (!/^[a-f0-9-]{36}$/i.test(batchIdRaw)) {
      return jsonResponse({error: 'batchId must be a UUID so folder uploads stay grouped.'}, 400);
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
  if (v.error) {
    return jsonResponse({error: v.error}, 400);
  }

  const key = batchId
    ? buildObjectKey({
        filename: file.name,
        relativePath,
        submissionId: batchId,
      })
    : `submissions/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  await context.env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: {contentType},
  });

  const base = (context.env.R2_PUBLIC_BASE ?? '').replace(/\/$/, '');
  const url = base ? `${base}/${key}` : key;
  const displayName = relativePath?.length ? relativePath : file.name;

  return jsonResponse({
    key,
    url,
    filename: displayName,
    size: file.size,
    contentType,
    ...(relativePath ? {relativePath} : {}),
  });
};
