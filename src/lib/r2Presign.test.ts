import {describe, expect, it} from 'vitest';
import {getPresignedPutUrl, hasR2SigningCredentials} from './r2Presign';

const ENV = {
  R2_ACCOUNT_ID: 'acct123',
  R2_ACCESS_KEY_ID: 'AKIAEXAMPLE',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_BUCKET_NAME: 'my-bucket',
};

describe('hasR2SigningCredentials', () => {
  it('requires all four credentials', () => {
    expect(hasR2SigningCredentials(ENV)).toBe(true);
    expect(hasR2SigningCredentials({...ENV, R2_BUCKET_NAME: ''})).toBe(false);
    expect(hasR2SigningCredentials({})).toBe(false);
  });
});

describe('getPresignedPutUrl', () => {
  it('produces a virtual-hosted-style signed URL for the bucket and key', async () => {
    const url = await getPresignedPutUrl(ENV, {
      key: 'client-media/acme/home/photo.jpg',
      contentType: 'image/jpeg',
    });
    const parsed = new URL(url);
    expect(parsed.host).toBe('my-bucket.acct123.r2.cloudflarestorage.com');
    expect(parsed.pathname).toBe('/client-media/acme/home/photo.jpg');
    expect(parsed.searchParams.get('X-Amz-Signature')).toBeTruthy();
    expect(parsed.searchParams.get('X-Amz-Expires')).toBe('3600');
    // Checksum query params break browser PUTs against R2 (see r2Presign.ts).
    expect(parsed.searchParams.get('x-amz-checksum-crc32')).toBeNull();
  });

  it('honours a custom endpoint and expiry', async () => {
    const url = await getPresignedPutUrl(
      {...ENV, R2_S3_ENDPOINT: 'https://acct123.eu.r2.cloudflarestorage.com'},
      {key: 'k.txt', contentType: '', expiresIn: 60},
    );
    const parsed = new URL(url);
    expect(parsed.host).toBe('my-bucket.acct123.eu.r2.cloudflarestorage.com');
    expect(parsed.searchParams.get('X-Amz-Expires')).toBe('60');
  });
});
