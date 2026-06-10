import {
  orderedSelectedPages,
  pageLabelFromDetailSection,
  questionnaireQuestions,
} from '../../data/questionnaire';
import {buildClientUploadEmailParts} from '../clientUploadEmailParts';
import {appendExtraPageFeesToSections} from '../questionnaireNotification';
import {SENDGRID_DIRECT_LINK_TRACKING} from '../sendgridMail';
import {
  apiError,
  EMAIL_REGEX,
  escapeHtml,
  ok,
  sendSendgridMail,
  type ApiResult,
  type EmailEnv,
} from './shared';

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

export interface QuestionnaireEnv extends EmailEnv {
  PUBLIC_SITE_URL?: string;
  CLIENT_UPLOAD_SECRET?: string;
}

function formatSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate a questionnaire submission, send the internal notification email
 * (with a personalised client-upload link), and auto-reply to the client.
 */
export async function processQuestionnaireSubmission(
  rawBody: unknown,
  options: {requestUrl: string; env: QuestionnaireEnv},
): Promise<ApiResult> {
  const {env} = options;
  const body: QuestionnairePayload = rawBody && typeof rawBody === 'object' ? rawBody : {};

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

  // Honeypot trap: act successful to avoid signaling bots.
  if (website) return ok();

  const hasClientEmail = EMAIL_REGEX.test(clientEmail);

  if (!clientName) {
    return apiError(400, 'Please provide your name.');
  }

  const sendgridKey = env.SENDGRID_API_KEY;
  const toEmail = env.QUESTIONNAIRE_TO_EMAIL ?? 'forms@kicero.co.uk';
  const fromEmail = env.CONTACT_FROM_EMAIL ?? 'noreply@kicero.co.uk';
  const fromName = env.CONTACT_FROM_NAME ?? 'Website Questionnaire';
  if (!sendgridKey) return apiError(500, 'Server email configuration is missing.');

  const orderedPagesAnswer = orderedSelectedPages(
    Array.isArray(answers.pagesWanted) ? (answers.pagesWanted as string[]) : [],
  );

  const clientUploadParts = await buildClientUploadEmailParts({
    requestUrl: options.requestUrl,
    publicSiteUrl: env.PUBLIC_SITE_URL,
    clientName,
    ref,
    orderedPages: orderedPagesAnswer,
    clientUploadSecret: env.CLIENT_UPLOAD_SECRET,
  });

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

  const textContent = `New questionnaire submission

Client name: ${clientName}
Client email: ${hasClientEmail ? clientEmail : 'Not provided'}
Ref: ${ref || '—'}

${sectionText}${filesText}${clientUploadParts.plainAppend}
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
      {
        type: 'text/html',
        value: `<h2>${escapeHtml(subject)}</h2>${sectionsHtml}${filesHtml}${clientUploadParts.htmlAppend}`,
      },
    ],
    tracking_settings: SENDGRID_DIRECT_LINK_TRACKING,
  };

  const outcome = await sendSendgridMail(sendgridKey, payload);
  if (!outcome.ok) {
    if ('network' in outcome) {
      return apiError(502, 'Failed to reach email provider.');
    }
    return apiError(502, 'Email provider request failed.');
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
            'Thanks for completing our website questionnaire.\n\nA member at Kicero will contact you as soon as possible.',
        },
      ],
      tracking_settings: SENDGRID_DIRECT_LINK_TRACKING,
    };
    // Best-effort: the internal notification already succeeded.
    await sendSendgridMail(sendgridKey, autoReplyPayload);
  }

  return ok();
}
