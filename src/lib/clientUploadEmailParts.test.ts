import {describe, expect, it} from 'vitest';
import {buildClientUploadEmailParts, escapeAttr} from './clientUploadEmailParts';
import {verifyClientUploadToken} from './clientUploadToken';

const escapeHtmlBody = (input: string) =>
  input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

describe('escapeAttr', () => {
  it('escapes HTML attribute characters', () => {
    expect(escapeAttr(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#039;');
  });
});

describe('buildClientUploadEmailParts', () => {
  const base = {
    requestUrl: 'https://kicero.co.uk/api/questionnaire',
    clientName: 'Acme Ltd',
    ref: 'REF42',
    escapeHtmlBody,
  };

  it('returns a "not generated" stub when no pages are selected', async () => {
    const parts = await buildClientUploadEmailParts({...base, orderedPages: []});
    expect(parts.href).toBeNull();
    expect(parts.bucketFolder).toBeNull();
    expect(parts.plainAppend).toContain('Not generated');
  });

  it('mints a signed link when a secret is configured', async () => {
    const secret = 'unit-test-secret';
    const parts = await buildClientUploadEmailParts({
      ...base,
      orderedPages: ['Home', 'About'],
      clientUploadSecret: secret,
    });
    expect(parts.href).toContain('/client-upload?t=');
    expect(parts.bucketFolder).toBe('Acme-Ltd-REF42');
    const token = new URL(parts.href!).searchParams.get('t')!;
    const payload = await verifyClientUploadToken(secret, token);
    expect(payload?.pages).toEqual(['Home', 'About']);
  });

  it('falls back to the legacy pages link without a secret', async () => {
    const parts = await buildClientUploadEmailParts({...base, orderedPages: ['Home']});
    expect(parts.href).toContain('/client-upload?pages=Home');
    expect(parts.bucketFolder).toBeNull();
  });

  it('prefers PUBLIC_SITE_URL over the request origin', async () => {
    const parts = await buildClientUploadEmailParts({
      ...base,
      requestUrl: 'http://localhost:8787/api/questionnaire',
      publicSiteUrl: 'https://kicero.co.uk/',
      orderedPages: ['Home'],
    });
    expect(parts.href).toMatch(/^https:\/\/kicero\.co\.uk\/client-upload/);
  });
});
