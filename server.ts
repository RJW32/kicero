import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import {
  CLIENT_UPLOAD_BRANDING_LABEL,
  isAllowedClientUploadPageLabel,
  orderedSelectedPages,
  pageLabelFromDetailSection,
  questionnaireQuestions,
} from './src/data/questionnaire';
import {buildClientUploadEmailParts} from './src/lib/clientUploadEmailParts';
import {appendExtraPageFeesToSections} from './src/lib/questionnaireNotification';
import {SENDGRID_DIRECT_LINK_TRACKING} from './src/lib/sendgridMail';
import {
  pageSlugFromLabel,
  verifyClientUploadToken,
} from './src/lib/clientUploadToken';
import {
  assertAllowedBrandingPortalUpload,
  assertAllowedClientPortalUpload,
  assertAllowedUpload,
  buildClientMediaObjectKey,
  buildObjectKey,
  DEFAULT_MAX_BYTES,
} from './src/lib/questionnaireUploadPolicy';
import {
  getPresignedPutUrl,
  hasR2SigningCredentials,
  type R2SigningEnv,
} from './src/lib/r2Presign';

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
};

type QuestionnairePayload = {
  clientName?: unknown;
  clientEmail?: unknown;
  ref?: unknown;
  answers?: unknown;
  files?: unknown;
  website?: unknown;
};

const app = express();
app.use(express.json({limit: '100kb'}));
const port = Number(process.env.PORT ?? 8787);
const localUploadDir = process.env.LOCAL_UPLOAD_DIR ?? 'uploads';

const uploadDisk = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      await fs.mkdir(localUploadDir, {recursive: true});
      cb(null, localUploadDir);
    },
    filename: (_req, file, cb) => {
      const uniq = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${uniq}-${safe}`);
    },
  }),
  limits: {fileSize: DEFAULT_MAX_BYTES},
});

app.use('/uploads', express.static(localUploadDir));

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Enquiries inbox; CONTACT_TO_EMAIL is often confused with CONTACT_FROM_EMAIL (noreply). */
function contactSubmissionRecipient(raw: string | undefined): string {
  const t = raw?.trim();
  if (!t || t.toLowerCase() === 'noreply@kicero.co.uk') return 'info@kicero.co.uk';
  return t;
}

function getConfig() {
  const {
    SENDGRID_API_KEY,
    CONTACT_TO_EMAIL,
    CONTACT_FROM_EMAIL,
    CONTACT_FROM_NAME,
  } = process.env;

  if (!SENDGRID_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL || !CONTACT_FROM_NAME) {
    return null;
  }

  return {SENDGRID_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL, CONTACT_FROM_NAME};
}

function r2EnvFromProcess(): Partial<R2SigningEnv> {
  return {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_S3_ENDPOINT: process.env.R2_S3_ENDPOINT,
  };
}

app.post('/api/contact', async (req, res) => {
  const body: ContactPayload = req.body ?? {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const website = typeof body.website === 'string' ? body.website.trim() : '';

  // Honeypot trap: act successful to avoid signaling bots.
  if (website) {
    return res.status(200).json({ok: true});
  }

  if (!name || !email || !message) {
    return res.status(400).json({error: 'Missing required fields.'});
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({error: 'Invalid email format.'});
  }

  if (name.length > 200 || email.length > 320 || message.length > 5000) {
    return res.status(400).json({error: 'Input exceeds allowed length.'});
  }

  const config = getConfig();
  if (!config) {
    return res.status(500).json({error: 'Server email configuration is missing.'});
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

  const sendgridPayload = {
    personalizations: [{to: [{email: contactSubmissionRecipient(config.CONTACT_TO_EMAIL)}]}],
    from: {
      email: config.CONTACT_FROM_EMAIL,
      name: config.CONTACT_FROM_NAME,
    },
    reply_to: {
      email,
    },
    subject: `Contact form: ${name}`,
    content: [
      {type: 'text/plain', value: textContent},
      {type: 'text/html', value: htmlContent},
    ],
    tracking_settings: SENDGRID_DIRECT_LINK_TRACKING,
  };

  try {
    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendgridPayload),
    });

    if (!sendgridResponse.ok) {
      const providerErrorText = await sendgridResponse.text();
      return res.status(502).json({
        error: 'Email provider request failed.',
        providerStatus: sendgridResponse.status,
        providerMessage: providerErrorText.slice(0, 500),
      });
    }

    return res.status(200).json({ok: true});
  } catch {
    return res.status(502).json({error: 'Failed to reach email provider.'});
  }
});

app.post('/api/questionnaire/upload-url', async (req, res) => {
  const body = req.body ?? {};
  const filename = typeof body.filename === 'string' ? body.filename : '';
  const contentType =
    typeof body.contentType === 'string' && body.contentType.length > 0
      ? body.contentType
      : 'application/octet-stream';
  const size = typeof body.size === 'number' ? body.size : Number.NaN;
  const relativePath =
    typeof body.relativePath === 'string' ? body.relativePath.trim() : undefined;
  const batchId = typeof body.batchId === 'string' ? body.batchId.trim() : '';

  if (!/^[a-f0-9-]{36}$/i.test(batchId)) {
    return res
      .status(400)
      .json({error: 'batchId must be a UUID so folder uploads stay grouped.'});
  }

  const rel = relativePath?.length ? relativePath : undefined;
  const v = assertAllowedUpload({filename, contentType, size, relativePath: rel});
  if (v.error) return res.status(400).json({error: v.error});

  const signingEnv = r2EnvFromProcess();
  if (!hasR2SigningCredentials(signingEnv)) {
    return res.status(501).json({
      error: 'Direct upload to R2 is not configured in .env (use multipart fallback).',
      fallback: true,
    });
  }

  try {
    const key = buildObjectKey({
      filename,
      relativePath: rel,
      submissionId: batchId,
    });
    const putUrl = await getPresignedPutUrl(signingEnv, {
      key,
      contentType,
      expiresIn: 3600,
    });
    const publicBase = (process.env.R2_PUBLIC_BASE ?? '').replace(/\/$/, '');
    const publicUrl = publicBase ? `${publicBase}/${key}` : key;
    const displayName = rel?.length ? rel : filename;
    return res.status(200).json({
      putUrl,
      key,
      url: publicUrl,
      filename: displayName,
      expiresIn: 3600,
    });
  } catch {
    return res.status(500).json({error: 'Could not create upload URL.'});
  }
});

app.post('/api/client-upload/presign', async (req, res) => {
  const secret = process.env.CLIENT_UPLOAD_SECRET?.trim();
  if (!secret) {
    return res.status(503).json({error: 'Client uploads are not configured.', code: 'NO_CLIENT_UPLOAD'});
  }

  const body = req.body ?? {};
  const token = typeof body.token === 'string' ? body.token : '';
  const pageLabel = typeof body.pageLabel === 'string' ? body.pageLabel.trim() : '';
  const filename = typeof body.filename === 'string' ? body.filename : '';
  const contentType =
    typeof body.contentType === 'string' && body.contentType.length > 0
      ? body.contentType
      : 'application/octet-stream';
  const size = typeof body.size === 'number' ? body.size : Number.NaN;

  if (!token || !pageLabel || !filename) {
    return res.status(400).json({error: 'token, pageLabel, and filename are required.'});
  }

  let payload;
  try {
    payload = await verifyClientUploadToken(secret, token);
  } catch {
    return res.status(500).json({error: 'Could not validate upload token.'});
  }

  if (!payload || !isAllowedClientUploadPageLabel(pageLabel, payload.pages)) {
    return res.status(403).json({error: 'Invalid or expired upload link.'});
  }

  const pageSlug = pageSlugFromLabel(pageLabel);
  const v =
    pageLabel === CLIENT_UPLOAD_BRANDING_LABEL
      ? assertAllowedBrandingPortalUpload({filename, contentType, size})
      : assertAllowedClientPortalUpload({filename, contentType, size});
  if (v.error) return res.status(400).json({error: v.error});

  const signingEnv = r2EnvFromProcess();
  if (!hasR2SigningCredentials(signingEnv)) {
    return res.status(503).json({
      error: 'Direct upload to R2 is not configured in .env.',
      code: 'NO_PRESIGN',
    });
  }

  try {
    const key = buildClientMediaObjectKey({
      folder: payload.folder,
      pageSlug,
      filename,
    });
    const putUrl = await getPresignedPutUrl(signingEnv, {
      key,
      contentType,
      expiresIn: 3600,
    });
    const publicBase = (process.env.R2_PUBLIC_BASE ?? '').replace(/\/$/, '');
    const publicUrl = publicBase ? `${publicBase}/${key}` : key;
    return res.status(200).json({putUrl, key, url: publicUrl, filename, expiresIn: 3600});
  } catch {
    return res.status(500).json({error: 'Could not create upload URL.'});
  }
});

app.post('/api/questionnaire/upload', uploadDisk.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({error: 'Expected file upload.'});
  }

  const relativePath =
    typeof req.body?.relativePath === 'string' ? req.body.relativePath.trim() : '';
  const batchId =
    typeof req.body?.batchId === 'string' ? req.body.batchId.trim() : '';
  if (batchId && !/^[a-f0-9-]{36}$/i.test(batchId)) {
    await fs.unlink(file.path).catch(() => null);
    return res.status(400).json({error: 'batchId must be a UUID.'});
  }
  const displayName = relativePath || file.originalname;

  const v = assertAllowedUpload({
    filename: file.originalname,
    contentType: file.mimetype || 'application/octet-stream',
    size: file.size,
    relativePath: relativePath || undefined,
  });
  if (v.error) {
    await fs.unlink(file.path).catch(() => null);
    return res.status(400).json({error: v.error});
  }

  const key = file.filename;

  return res.status(200).json({
    key,
    url: `http://localhost:${port}/uploads/${encodeURI(key)}`,
    filename: displayName,
    size: file.size,
    contentType: file.mimetype || 'application/octet-stream',
    relativePath: relativePath || undefined,
  });
});

app.post('/api/questionnaire', async (req, res) => {
  const body: QuestionnairePayload = req.body ?? {};
  const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : '';
  const clientEmail =
    typeof body.clientEmail === 'string' ? body.clientEmail.trim().toLowerCase() : '';
  const ref = typeof body.ref === 'string' ? body.ref.trim() : '';
  const website = typeof body.website === 'string' ? body.website.trim() : '';
  const answers =
    body.answers && typeof body.answers === 'object'
      ? (body.answers as Record<string, unknown>)
      : {};
  const files = Array.isArray(body.files)
    ? (body.files as Array<{filename: string; url: string}>)
    : [];

  if (website) return res.status(200).json({ok: true});

  const hasClientEmail = emailRegex.test(clientEmail);

  if (!clientName) {
    return res.status(400).json({error: 'Please provide your name.'});
  }

  const config = getConfig();
  if (!config) {
    return res.status(500).json({error: 'Server email configuration is missing.'});
  }

  const orderedPagesAnswer = orderedSelectedPages(
    Array.isArray(answers.pagesWanted) ? (answers.pagesWanted as string[]) : [],
  );

  const requestProto =
    typeof req.headers['x-forwarded-proto'] === 'string'
      ? req.headers['x-forwarded-proto'].split(',')[0]?.trim()
      : undefined;
  const inferredOrigin = `${requestProto ?? req.protocol}://${req.get('host')}`;
  const dummyRequestUrl = `${inferredOrigin}/`;

  const clientUploadParts = await buildClientUploadEmailParts({
    requestUrl: dummyRequestUrl,
    publicSiteUrl: process.env.PUBLIC_SITE_URL,
    clientName,
    ref,
    orderedPages: orderedPagesAnswer,
    clientUploadSecret: process.env.CLIENT_UPLOAD_SECRET,
    escapeHtmlBody: escapeHtml,
  });
  const clientUploadNotice = clientUploadParts.plainAppend;
  const uploadHtmlExtra = clientUploadParts.htmlAppend;

  const sections = new Map<string, Array<{label: string; value: string}>>();
  for (const question of questionnaireQuestions) {
    const pageOnlyLabel = pageLabelFromDetailSection(question.section);
    if (pageOnlyLabel !== null && !orderedPagesAnswer.includes(pageOnlyLabel)) {
      continue;
    }
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

  appendExtraPageFeesToSections(sections, answers.pagesWanted);

  const sectionText = Array.from(sections.entries())
    .map(([section, items]) => {
      const rows = items.map((item) => `${item.label}: ${item.value}`).join('\n');
      return `${section}\n${rows}`;
    })
    .join('\n\n');
  const filesText = files.length
    ? `\n\nUploaded files:\n${files.map((file) => `- ${file.filename}: ${file.url}`).join('\n')}`
    : '\n\nUploaded files:\n- None';
  const subject = `Questionnaire: ${clientName}${ref ? ` [${ref}]` : ''}`;
  const questionnaireToEmail =
    process.env.QUESTIONNAIRE_TO_EMAIL ?? 'forms@kicero.co.uk';

  const internalNotice = `New questionnaire submission\n\nClient name: ${clientName}\nClient email: ${hasClientEmail ? clientEmail : 'Not provided'}\nRef: ${ref || '—'}\n\n${sectionText}${filesText}${clientUploadNotice}`;
  const sendgridPayload = {
    personalizations: [{to: [{email: questionnaireToEmail}]}],
    from: {
      email: config.CONTACT_FROM_EMAIL,
      name: config.CONTACT_FROM_NAME,
    },
    ...(hasClientEmail
      ? {
          reply_to: {
            email: clientEmail,
          },
        }
      : {}),
    subject,
    content: [
      {
        type: 'text/plain',
        value: internalNotice,
      },
      {
        type: 'text/html',
        value: `<h2>${escapeHtml(subject)}</h2><pre>${escapeHtml(sectionText + filesText)}</pre>${uploadHtmlExtra}`,
      },
    ],
    tracking_settings: SENDGRID_DIRECT_LINK_TRACKING,
  };

  try {
    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendgridPayload),
    });
    if (!sendgridResponse.ok) {
      return res.status(502).json({error: 'Email provider request failed.'});
    }
  } catch {
    return res.status(502).json({error: 'Failed to reach email provider.'});
  }

  if (hasClientEmail) {
    const autoReplyPayload = {
      personalizations: [{to: [{email: clientEmail}]}],
      from: {
        email: config.CONTACT_FROM_EMAIL,
        name: 'Kicero',
      },
      subject: "We've received your questionnaire - Kicero",
      content: [
        {
          type: 'text/plain',
          value:
            'Thanks for completing our website questionnaire.\n\nA member at Kicero will contact you as soon as possible.',
        },
      ],
      tracking_settings: SENDGRID_DIRECT_LINK_TRACKING,
    };
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(autoReplyPayload),
    }).catch(() => null);
  }

  return res.status(200).json({ok: true});
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
