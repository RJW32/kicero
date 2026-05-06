import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import {questionnaireQuestions} from './src/data/questionnaire';

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
const upload = multer({storage: multer.memoryStorage(), limits: {fileSize: 10 * 1024 * 1024}});
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
    personalizations: [{to: [{email: config.CONTACT_TO_EMAIL}]}],
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

app.post('/api/questionnaire/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({error: 'Expected file upload.'});
  }

  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|doc|docx)$/i;
  if (!allowedExtensions.test(file.originalname) && !file.mimetype.startsWith('image/')) {
    return res.status(400).json({error: 'Unsupported file type.'});
  }

  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
  await fs.mkdir(localUploadDir, {recursive: true});
  await fs.writeFile(path.join(localUploadDir, key), file.buffer);

  return res.status(200).json({
    key,
    url: `http://localhost:${port}/uploads/${key}`,
    filename: file.originalname,
    size: file.size,
    contentType: file.mimetype,
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
  if (!clientName || !emailRegex.test(clientEmail)) {
    return res.status(400).json({error: 'Valid client name and email are required.'});
  }

  const config = getConfig();
  if (!config) {
    return res.status(500).json({error: 'Server email configuration is missing.'});
  }

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
  const subject = `Questionnaire: ${clientName}${ref ? ` [${ref}]` : ''}`;

  const sendgridPayload = {
    personalizations: [{to: [{email: config.CONTACT_TO_EMAIL}]}],
    from: {
      email: config.CONTACT_FROM_EMAIL,
      name: config.CONTACT_FROM_NAME,
    },
    reply_to: {
      email: clientEmail,
    },
    subject,
    content: [
      {
        type: 'text/plain',
        value: `New questionnaire submission\n\nClient name: ${clientName}\nClient email: ${clientEmail}\nRef: ${ref || '—'}\n\n${sectionText}${filesText}`,
      },
      {
        type: 'text/html',
        value: `<h2>${escapeHtml(subject)}</h2><pre>${escapeHtml(sectionText + filesText)}</pre>`,
      },
    ],
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
          'Thanks for completing our website questionnaire. We will review your answers and reply within 24 hours.',
      },
    ],
  };
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(autoReplyPayload),
  }).catch(() => null);

  return res.status(200).json({ok: true});
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
