import {questionnaireQuestions} from './src/data/questionnaire';
import {
  assertAllowedUpload,
  buildObjectKey,
} from './src/lib/questionnaireUploadPolicy';
import {
  hasR2SigningCredentials,
  getPresignedPutUrl,
  type R2SigningEnv,
} from './src/lib/r2Presign';

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
}

interface AssetFetcher {
  fetch: (request: Request) => Promise<Response>;
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
  SENDGRID_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
}

interface R2Bucket {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | ReadableStream | Blob,
    options?: {httpMetadata?: {contentType?: string}},
  ) => Promise<void>;
}

interface QuestionnairePayload {
  clientName?: unknown;
  clientEmail?: unknown;
  ref?: unknown;
  answers?: unknown;
  files?: unknown;
  website?: unknown;
}

interface UploadedAsset {
  key: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
  relativePath?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {status: 204});
  }

  if (request.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed.'}, 405);
  }

  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return jsonResponse({error: 'Invalid JSON body.'}, 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const website = typeof body.website === 'string' ? body.website.trim() : '';

  if (website) {
    return jsonResponse({ok: true}, 200);
  }

  if (!name || !email || !message) {
    return jsonResponse({error: 'Missing required fields.'}, 400);
  }

  if (!emailRegex.test(email)) {
    return jsonResponse({error: 'Invalid email format.'}, 400);
  }

  if (name.length > 200 || email.length > 320 || message.length > 5000) {
    return jsonResponse({error: 'Input exceeds allowed length.'}, 400);
  }

  const sendgridKey = env.SENDGRID_API_KEY;
  const toEmail = env.CONTACT_TO_EMAIL ?? 'info@kicero.co.uk';
  const fromEmail = env.CONTACT_FROM_EMAIL ?? 'noreply@kicero.co.uk';
  const fromName = env.CONTACT_FROM_NAME ?? 'Website Contact Form';

  if (!sendgridKey) {
    return jsonResponse({error: 'Server email configuration is missing.'}, 500);
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replaceAll('\n', '<br/>');

  const textContent = `New contact form submission

Name: ${name}
Email: ${email}

Message:
${message}
`;

  const htmlContent = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${safeName}</p>
    <p><strong>Email:</strong> ${safeEmail}</p>
    <p><strong>Message:</strong><br/>${safeMessage}</p>
  `.trim();

  const payload = {
    personalizations: [{to: [{email: toEmail}]}],
    from: {
      email: fromEmail,
      name: fromName,
    },
    reply_to: {
      email,
    },
    subject: `Contact form: ${name}`,
    content: [
      {type: 'text/plain', value: textContent},
      {type: 'text/html', value: htmlContent},
    ],
  };

  try {
    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!sendgridResponse.ok) {
      const providerErrorText = await sendgridResponse.text();
      return jsonResponse(
        {
          error: 'Email provider request failed.',
          providerStatus: sendgridResponse.status,
          providerMessage: providerErrorText.slice(0, 500),
        },
        502,
      );
    }

    return jsonResponse({ok: true}, 200);
  } catch {
    return jsonResponse({error: 'Failed to reach email provider.'}, 502);
  }
}

function formatSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadUrlPayload {
  filename?: unknown;
  contentType?: unknown;
  size?: unknown;
  relativePath?: unknown;
  batchId?: unknown;
}

async function handleQuestionnaireUploadUrl(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed.'}, 405);
  }

  const body = (await request.json().catch(() => null)) as UploadUrlPayload | null;
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
  const batchId = batchIdRaw;

  const v = assertAllowedUpload({filename, contentType, size, relativePath});
  if (v.error) return jsonResponse({error: v.error}, 400);

  const signingEnv: Partial<R2SigningEnv> = {
    R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: env.R2_BUCKET_NAME,
  };

  if (!hasR2SigningCredentials(signingEnv)) {
    return jsonResponse(
      {
        error:
          'Direct upload is not configured. Set R2_ACCOUNT_ID and R2 API token credentials on the worker.',
        code: 'NO_PRESIGN',
      },
      503,
    );
  }

  const key = buildObjectKey({
    filename,
    relativePath: relativePath?.length ? relativePath : undefined,
    submissionId: batchId,
  });

  const putUrl = await getPresignedPutUrl(signingEnv, {
    key,
    contentType,
    expiresIn: 3600,
  });

  const base = (env.R2_PUBLIC_BASE ?? '').replace(/\/$/, '');
  const publicUrl = base ? `${base}/${key}` : key;
  const displayName = relativePath?.length ? relativePath : filename;

  return jsonResponse({
    putUrl,
    key,
    url: publicUrl,
    filename: displayName,
    expiresIn: 3600,
  });
}

async function handleQuestionnaireUpload(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed.'}, 405);
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) {
    return jsonResponse({error: 'Expected file upload.'}, 400);
  }

  const v = assertAllowedUpload({
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
  });
  if (v.error) return jsonResponse({error: v.error}, 400);

  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `submissions/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFilename}`;
  await env.R2_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: {contentType: file.type || 'application/octet-stream'},
  });

  const base = (env.R2_PUBLIC_BASE ?? '').replace(/\/$/, '');
  const url = base ? `${base}/${key}` : key;

  return jsonResponse({
    key,
    url,
    filename: file.name,
    size: file.size,
    contentType: file.type || 'application/octet-stream',
  });
}

async function handleQuestionnaire(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed.'}, 405);
  }

  const body = (await request.json().catch(() => null)) as QuestionnairePayload | null;
  if (!body) return jsonResponse({error: 'Invalid JSON body.'}, 400);

  const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : '';
  const clientEmail =
    typeof body.clientEmail === 'string' ? body.clientEmail.trim().toLowerCase() : '';
  const ref = typeof body.ref === 'string' ? body.ref.trim() : '';
  const website = typeof body.website === 'string' ? body.website.trim() : '';
  const answers =
    body.answers && typeof body.answers === 'object'
      ? (body.answers as Record<string, unknown>)
      : {};
  const files = Array.isArray(body.files) ? (body.files as UploadedAsset[]) : [];

  if (website) return jsonResponse({ok: true}, 200);

  const hasClientEmail = emailRegex.test(clientEmail);

  if (!clientName) {
    return jsonResponse({error: 'Please provide your name.'}, 400);
  }

  const sendgridKey = env.SENDGRID_API_KEY;
  const toEmail = env.CONTACT_TO_EMAIL ?? 'info@kicero.co.uk';
  const fromEmail = env.CONTACT_FROM_EMAIL ?? 'noreply@kicero.co.uk';
  const fromName = env.CONTACT_FROM_NAME ?? 'Website Questionnaire';
  if (!sendgridKey) return jsonResponse({error: 'Server email configuration is missing.'}, 500);

  const sections = new Map<string, Array<{label: string; value: string}>>();
  for (const question of questionnaireQuestions) {
    const raw = answers[question.id];
    const value = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'string'
        ? raw.trim()
        : '';
    const list = sections.get(question.section) ?? [];
    list.push({label: question.label, value: value || '—'});
    sections.set(question.section, list);
  }

  const sectionText = Array.from(sections.entries())
    .map(([section, items]) => {
      const rows = items.map((item) => `${item.label}: ${item.value}`).join('\n');
      return `${section}\n${rows}`;
    })
    .join('\n\n');

  const filesText = files.length
    ? `\n\nUploaded files:\n${files.map((file) => `- ${file.filename}: ${file.url}`).join('\n')}`
    : '\n\nUploaded files:\n- None';

  const textContent = `New questionnaire submission

Client name: ${clientName}
Client email: ${hasClientEmail ? clientEmail : 'Not provided'}
Ref: ${ref || '—'}

${sectionText}${filesText}
`;

  const sectionsHtml = Array.from(sections.entries())
    .map(([section, items]) => {
      const rows = items
        .map((item) => `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`)
        .join('');
      return `<h3>${escapeHtml(section)}</h3><ul>${rows}</ul>`;
    })
    .join('');
  const filesHtml = files.length
    ? `<h3>Uploaded files</h3><ul>${files
        .map(
          (file) =>
            `<li><a href="${escapeHtml(file.url)}">${escapeHtml(file.filename)}</a> (${formatSize(file.size)})</li>`,
        )
        .join('')}</ul>`
    : '<h3>Uploaded files</h3><p>None</p>';

  const subject = `Questionnaire: ${clientName}${ref ? ` [${ref}]` : ''}`;
  const payload = {
    personalizations: [{to: [{email: toEmail}]}],
    from: {email: fromEmail, name: fromName},
    ...(hasClientEmail ? {reply_to: {email: clientEmail}} : {}),
    subject,
    content: [
      {type: 'text/plain', value: textContent},
      {type: 'text/html', value: `<h2>${escapeHtml(subject)}</h2>${sectionsHtml}${filesHtml}`},
    ],
  };

  const sendResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendgridKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!sendResponse.ok) {
    return jsonResponse({error: 'Email provider request failed.'}, 502);
  }

  if (hasClientEmail) {
    const autoReplyPayload = {
      personalizations: [{to: [{email: clientEmail}]}],
      from: {email: fromEmail, name: 'Kicero'},
      subject: "We've received your questionnaire - Kicero",
      content: [
        {
          type: 'text/plain',
          value:
            'Thanks for completing our website questionnaire. Kicero will be in touch.',
        },
      ],
    };
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(autoReplyPayload),
    }).catch(() => null);
  }

  return jsonResponse({ok: true}, 200);
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
    if (url.pathname === '/api/questionnaire') {
      return handleQuestionnaire(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
