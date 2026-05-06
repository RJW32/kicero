import {questionnaireQuestions} from '../../src/data/questionnaire';

interface Env {
  SENDGRID_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_FROM_NAME?: string;
}

type PagesContext<TEnv> = {
  request: Request;
  env: TEnv;
};

type PagesFunction<TEnv> = (context: PagesContext<TEnv>) => Response | Promise<Response>;

interface QuestionnairePayload {
  clientName?: unknown;
  clientEmail?: unknown;
  ref?: unknown;
  answers?: unknown;
  files?: unknown;
  website?: unknown;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = (await context.request.json().catch(() => null)) as QuestionnairePayload | null;
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
  const files = Array.isArray(body.files)
    ? (body.files as Array<{filename: string; url: string}>)
    : [];

  if (website) return jsonResponse({ok: true}, 200);

  const hasClientEmail = emailRegex.test(clientEmail);

  if (!clientName) {
    return jsonResponse({error: 'Please provide your name.'}, 400);
  }

  const sendgridKey = context.env.SENDGRID_API_KEY;
  const toEmail = context.env.CONTACT_TO_EMAIL ?? 'info@kicero.co.uk';
  const fromEmail = context.env.CONTACT_FROM_EMAIL ?? 'noreply@kicero.co.uk';
  const fromName = context.env.CONTACT_FROM_NAME ?? 'Website Questionnaire';
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

  const subject = `Questionnaire: ${clientName}${ref ? ` [${ref}]` : ''}`;
  const internalNotice = [
    `New questionnaire submission`,
    ``,
    `Client name: ${clientName}`,
    `Client email: ${hasClientEmail ? clientEmail : 'Not provided'}`,
    `Ref: ${ref || '—'}`,
    ``,
    sectionText.trim(),
    '',
    filesText.trim(),
  ].join('\n');
  const payload = {
    personalizations: [{to: [{email: toEmail}]}],
    from: {email: fromEmail, name: fromName},
    ...(hasClientEmail ? {reply_to: {email: clientEmail}} : {}),
    subject,
    content: [
      {
        type: 'text/plain',
        value: internalNotice,
      },
      {
        type: 'text/html',
        value: `<h2>${escapeHtml(subject)}</h2><pre>${escapeHtml(sectionText + filesText)}</pre>`,
      },
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
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    }).catch(() => null);
  }

  return jsonResponse({ok: true}, 200);
};
