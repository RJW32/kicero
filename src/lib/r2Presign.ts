import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

export interface R2SigningEnv {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  /** EU/FedRAMP buckets: https://<account_id>.eu.r2.cloudflarestorage.com (see Cloudflare R2 docs). */
  R2_S3_ENDPOINT?: string;
}

export function hasR2SigningCredentials(
  env: Partial<R2SigningEnv>,
): env is R2SigningEnv {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET_NAME,
  );
}

export async function getPresignedPutUrl(
  env: R2SigningEnv,
  params: {key: string; contentType: string; expiresIn?: number},
): Promise<string> {
  const endpoint =
    env.R2_S3_ENDPOINT?.trim() ||
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  // Default SDK behaviour (WHEN_SUPPORTED) adds checksum query params to presigned PUTs.
  // Browser XHR/fetch uploads cannot satisfy those checksums reliably, so R2 rejects the PUT
  // (often 401/403) and error responses lack CORS — Safari/Chrome then report CORS failures.
  //
  // forcePathStyle: R2 resolves path-style uploads reliably; browser sends the same Host the URL was signed for.
  // signableHeaders: only sign 'host'. Signing 'content-type' causes R2 to validate the browser's
  // Content-Type header character-for-character against the signed value. Any browser normalisation
  // (e.g. appending '; charset=utf-8') triggers SignatureDoesNotMatch → 401, which R2 returns without
  // CORS headers so the browser masks it as a CORS error. File type is already validated server-side
  // by assertAllowedClientPortalUpload before the presigned URL is ever issued.
  const client = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: params.key,
    ContentType: params.contentType || 'application/octet-stream',
  });

  return getSignedUrl(client, command, {
    expiresIn: params.expiresIn ?? 3600,
    signableHeaders: new Set(['host']),
  });
}
