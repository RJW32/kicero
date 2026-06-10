import {describe, expect, it} from 'vitest';
import {
  DEFAULT_MAX_BYTES,
  assertAllowedBrandingPortalUpload,
  assertAllowedClientPortalUpload,
  assertAllowedUpload,
  buildClientMediaObjectKey,
  buildObjectKey,
  sanitizeRelativePath,
} from './questionnaireUploadPolicy';

describe('sanitizeRelativePath', () => {
  it('strips traversal segments and unsafe characters', () => {
    expect(sanitizeRelativePath('../..//etc/passwd')).toBe('etc/passwd');
    expect(sanitizeRelativePath('photos\\summer\\pic 1.jpg')).toBe('photos/summer/pic 1.jpg');
    expect(sanitizeRelativePath('a/<b>/c?.png')).toBe('a/_b_/c_.png');
  });

  it('caps length at 500 characters', () => {
    expect(sanitizeRelativePath('x'.repeat(600)).length).toBe(500);
  });
});

describe('buildObjectKey', () => {
  it('uses sanitized relative path when provided', () => {
    const key = buildObjectKey({
      filename: 'pic.jpg',
      relativePath: 'folder/pic.jpg',
      submissionId: 'abc123',
    });
    expect(key).toMatch(/^submissions\/\d{4}-\d{2}-\d{2}\/abc123\/folder\/pic\.jpg$/);
  });

  it('falls back to sanitized filename', () => {
    const key = buildObjectKey({filename: 'my file!.png', submissionId: 'id1'});
    expect(key.endsWith('/id1/my_file_.png')).toBe(true);
  });
});

describe('buildClientMediaObjectKey', () => {
  it('builds client-media keys with sanitized segments', () => {
    const key = buildClientMediaObjectKey({
      folder: 'Acme Ltd',
      pageSlug: 'home',
      filename: 'hero image.jpg',
    });
    expect(key).toMatch(/^client-media\/Acme_Ltd\/home\/\d{4}-\d{2}-\d{2}-hero_image\.jpg$/);
  });
});

describe('assertAllowedUpload', () => {
  it('accepts images, videos, audio, and known document extensions', () => {
    expect(assertAllowedUpload({filename: 'a.jpg', contentType: 'image/jpeg', size: 100})).toEqual({});
    expect(assertAllowedUpload({filename: 'a.mp4', contentType: '', size: 100})).toEqual({});
    expect(assertAllowedUpload({filename: 'a.pdf', contentType: '', size: 100})).toEqual({});
  });

  it('rejects missing filename, bad size, oversize, and unknown types', () => {
    expect(assertAllowedUpload({filename: '', contentType: '', size: 10}).error).toBeTruthy();
    expect(assertAllowedUpload({filename: 'a.jpg', contentType: '', size: 0}).error).toBeTruthy();
    expect(
      assertAllowedUpload({filename: 'a.jpg', contentType: '', size: DEFAULT_MAX_BYTES + 1}).error,
    ).toBeTruthy();
    expect(assertAllowedUpload({filename: 'a.exe', contentType: '', size: 10}).error).toBe(
      'Unsupported file type.',
    );
  });
});

describe('assertAllowedClientPortalUpload', () => {
  it('allows images and videos only', () => {
    expect(
      assertAllowedClientPortalUpload({filename: 'a.png', contentType: 'image/png', size: 5}),
    ).toEqual({});
    expect(
      assertAllowedClientPortalUpload({filename: 'a.pdf', contentType: 'application/pdf', size: 5})
        .error,
    ).toBe('Only images and videos are allowed on this page.');
  });
});

describe('assertAllowedBrandingPortalUpload', () => {
  it('allows images, videos, and PDFs but rejects other documents', () => {
    expect(
      assertAllowedBrandingPortalUpload({filename: 'logo.pdf', contentType: 'application/pdf', size: 5}),
    ).toEqual({});
    expect(
      assertAllowedBrandingPortalUpload({filename: 'doc.docx', contentType: '', size: 5}).error,
    ).toBe('Branding uploads must be images, videos, or PDF files.');
  });
});
