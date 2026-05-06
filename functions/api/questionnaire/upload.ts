import {assertAllowedUpload} from '../../../src/lib/questionnaireUploadPolicy';

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

  const v = assertAllowedUpload({
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
  });
  if (v.error) {
    return jsonResponse({error: v.error}, 400);
  }

  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `submissions/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFilename}`;
  await context.env.R2_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: {contentType: file.type || 'application/octet-stream'},
  });

  const base = (context.env.R2_PUBLIC_BASE ?? '').replace(/\/$/, '');
  const url = base ? `${base}/${key}` : key;

  return jsonResponse({
    key,
    url,
    filename: file.name,
    size: file.size,
    contentType: file.type || 'application/octet-stream',
  });
};
