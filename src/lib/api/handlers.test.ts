import {describe, expect, it} from 'vitest';
import {mintClientUploadToken} from '../clientUploadToken';
import {processContactSubmission} from './contact';
import {processClientUploadPresign, processQuestionnaireUploadUrl} from './presign';
import {processQuestionnaireSubmission} from './questionnaire';
import {contactSubmissionRecipient} from './shared';

const NO_PRESIGN_ENV = {};
const NOT_CONFIGURED = {status: 503, body: {error: 'not configured', code: 'NO_PRESIGN'}};

describe('contactSubmissionRecipient', () => {
  it('falls back to the enquiries inbox when unset or set to noreply', () => {
    expect(contactSubmissionRecipient(undefined)).toBe('info@kicero.co.uk');
    expect(contactSubmissionRecipient('noreply@kicero.co.uk')).toBe('info@kicero.co.uk');
    expect(contactSubmissionRecipient('forms@kicero.co.uk')).toBe('forms@kicero.co.uk');
  });
});

describe('processContactSubmission', () => {
  it('silently accepts honeypot submissions', async () => {
    const r = await processContactSubmission({website: 'spam'}, {});
    expect(r).toEqual({status: 200, body: {ok: true}});
  });

  it('rejects missing fields, bad emails, and oversized input', async () => {
    expect((await processContactSubmission({}, {})).status).toBe(400);
    expect(
      (await processContactSubmission({name: 'A', email: 'bad', message: 'hi'}, {})).status,
    ).toBe(400);
    expect(
      (
        await processContactSubmission(
          {name: 'x'.repeat(201), email: 'a@b.co', message: 'hi'},
          {},
        )
      ).status,
    ).toBe(400);
  });

  it('returns 500 when SendGrid is not configured', async () => {
    const r = await processContactSubmission({name: 'A', email: 'a@b.co', message: 'hi'}, {});
    expect(r.status).toBe(500);
  });
});

describe('processQuestionnaireSubmission', () => {
  it('silently accepts honeypot submissions', async () => {
    const r = await processQuestionnaireSubmission(
      {website: 'spam'},
      {requestUrl: 'https://kicero.co.uk/', env: {}},
    );
    expect(r).toEqual({status: 200, body: {ok: true}});
  });

  it('requires a client name', async () => {
    const r = await processQuestionnaireSubmission(
      {answers: {}},
      {requestUrl: 'https://kicero.co.uk/', env: {}},
    );
    expect(r.status).toBe(400);
  });
});

describe('processQuestionnaireUploadUrl', () => {
  const valid = {
    filename: 'a.jpg',
    contentType: 'image/jpeg',
    size: 100,
    batchId: '123e4567-e89b-42d3-a456-426614174000',
  };

  it('requires a UUID batchId', async () => {
    const r = await processQuestionnaireUploadUrl(
      {...valid, batchId: 'nope'},
      {env: NO_PRESIGN_ENV, notConfigured: NOT_CONFIGURED},
    );
    expect(r.status).toBe(400);
  });

  it('rejects disallowed files', async () => {
    const r = await processQuestionnaireUploadUrl(
      {...valid, filename: 'a.exe', contentType: ''},
      {env: NO_PRESIGN_ENV, notConfigured: NOT_CONFIGURED},
    );
    expect(r.status).toBe(400);
  });

  it('returns the runtime-specific result when presigning is unavailable', async () => {
    const r = await processQuestionnaireUploadUrl(valid, {
      env: NO_PRESIGN_ENV,
      notConfigured: NOT_CONFIGURED,
    });
    expect(r).toBe(NOT_CONFIGURED);
  });
});

describe('processClientUploadPresign', () => {
  const SECRET = 'test-secret';

  it('returns 503 when client uploads are unconfigured', async () => {
    const r = await processClientUploadPresign({}, {env: NO_PRESIGN_ENV});
    expect(r.status).toBe(503);
    expect(r.body.code).toBe('NO_CLIENT_UPLOAD');
  });

  it('rejects missing fields and invalid tokens', async () => {
    const missing = await processClientUploadPresign(
      {},
      {env: NO_PRESIGN_ENV, clientUploadSecret: SECRET},
    );
    expect(missing.status).toBe(400);

    const invalid = await processClientUploadPresign(
      {token: 'bogus', pageLabel: 'Home', filename: 'a.jpg', contentType: 'image/jpeg', size: 5},
      {env: NO_PRESIGN_ENV, clientUploadSecret: SECRET},
    );
    expect(invalid.status).toBe(403);
  });

  it('rejects pages not covered by the token', async () => {
    const token = await mintClientUploadToken(SECRET, {
      folder: 'acme-1',
      pages: ['Home'],
      ttlSeconds: 60,
    });
    const r = await processClientUploadPresign(
      {token, pageLabel: 'About', filename: 'a.jpg', contentType: 'image/jpeg', size: 5},
      {env: NO_PRESIGN_ENV, clientUploadSecret: SECRET},
    );
    expect(r.status).toBe(403);
  });

  it('returns NO_PRESIGN when a valid request has no signing credentials', async () => {
    const token = await mintClientUploadToken(SECRET, {
      folder: 'acme-1',
      pages: ['Home'],
      ttlSeconds: 60,
    });
    const r = await processClientUploadPresign(
      {token, pageLabel: 'Home', filename: 'a.jpg', contentType: 'image/jpeg', size: 5},
      {env: NO_PRESIGN_ENV, clientUploadSecret: SECRET},
    );
    expect(r.status).toBe(503);
    expect(r.body.code).toBe('NO_PRESIGN');
  });
});
