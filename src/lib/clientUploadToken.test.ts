import {describe, expect, it} from 'vitest';
import {
  buildClientUploadFolder,
  decodeClientUploadTokenForUi,
  mintClientUploadToken,
  pageSlugFromLabel,
  verifyClientUploadToken,
} from './clientUploadToken';

const SECRET = 'test-secret-for-unit-tests';

describe('mint/verify round trip', () => {
  it('verifies a freshly minted token', async () => {
    const token = await mintClientUploadToken(SECRET, {
      folder: 'acme-abc123',
      pages: ['Home', 'About'],
      ttlSeconds: 60,
    });
    const payload = await verifyClientUploadToken(SECRET, token);
    expect(payload).not.toBeNull();
    expect(payload?.folder).toBe('acme-abc123');
    expect(payload?.pages).toEqual(['Home', 'About']);
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await mintClientUploadToken(SECRET, {
      folder: 'acme-abc123',
      pages: ['Home'],
      ttlSeconds: 60,
    });
    expect(await verifyClientUploadToken('other-secret', token)).toBeNull();
  });

  it('rejects a tampered payload', async () => {
    const token = await mintClientUploadToken(SECRET, {
      folder: 'acme-abc123',
      pages: ['Home'],
      ttlSeconds: 60,
    });
    const [, sig] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({v: 1, exp: Math.floor(Date.now() / 1000) + 60, folder: 'evil', pages: ['Home']}),
    )
      .toString('base64')
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');
    expect(await verifyClientUploadToken(SECRET, `${forged}.${sig}`)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await mintClientUploadToken(SECRET, {
      folder: 'acme-abc123',
      pages: ['Home'],
      ttlSeconds: -10,
    });
    expect(await verifyClientUploadToken(SECRET, token)).toBeNull();
  });

  it('rejects unknown page labels', async () => {
    const token = await mintClientUploadToken(SECRET, {
      folder: 'acme-abc123',
      pages: ['Not A Real Page'],
      ttlSeconds: 60,
    });
    expect(await verifyClientUploadToken(SECRET, token)).toBeNull();
  });

  it('rejects malformed tokens', async () => {
    expect(await verifyClientUploadToken(SECRET, 'not-a-token')).toBeNull();
    expect(await verifyClientUploadToken(SECRET, 'a.b.c')).toBeNull();
    expect(await verifyClientUploadToken(SECRET, '')).toBeNull();
  });

  it('refuses to mint without a secret', async () => {
    await expect(
      mintClientUploadToken('  ', {folder: 'x', pages: ['Home'], ttlSeconds: 60}),
    ).rejects.toThrow();
  });
});

describe('decodeClientUploadTokenForUi', () => {
  it('decodes payload without verifying the signature', async () => {
    const token = await mintClientUploadToken(SECRET, {
      folder: 'acme-abc123',
      pages: ['Home'],
      ttlSeconds: 60,
    });
    const decoded = decodeClientUploadTokenForUi(token);
    expect(decoded?.folder).toBe('acme-abc123');
    expect(decoded?.pages).toEqual(['Home']);
  });

  it('returns null for garbage', () => {
    expect(decodeClientUploadTokenForUi(undefined)).toBeNull();
    expect(decodeClientUploadTokenForUi('garbage')).toBeNull();
  });
});

describe('buildClientUploadFolder', () => {
  it('slugifies the client name and appends the ref', () => {
    expect(buildClientUploadFolder('Acme Ltd!', 'REF42')).toBe('Acme-Ltd-REF42');
  });

  it('falls back to "client" and a random suffix when inputs are empty', () => {
    const folder = buildClientUploadFolder('', '');
    expect(folder).toMatch(/^client-[a-zA-Z0-9-]{8}$/);
  });
});

describe('pageSlugFromLabel', () => {
  it('slugifies page labels', () => {
    expect(pageSlugFromLabel('Portfolio / Gallery')).toBe('portfolio-gallery');
    expect(pageSlugFromLabel('Home')).toBe('home');
    expect(pageSlugFromLabel('  FAQ  ')).toBe('faq');
  });
});
