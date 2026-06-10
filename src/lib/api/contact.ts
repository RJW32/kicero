import {SENDGRID_DIRECT_LINK_TRACKING} from '../sendgridMail';
import {
  apiError,
  contactSubmissionRecipient,
  EMAIL_REGEX,
  escapeHtml,
  ok,
  sendSendgridMail,
  type ApiResult,
  type EmailEnv,
} from './shared';

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
}

/** Validate a contact-form submission and forward it to SendGrid. */
export async function processContactSubmission(
  rawBody: unknown,
  env: EmailEnv,
): Promise<ApiResult> {
  const body: ContactPayload = rawBody && typeof rawBody === 'object' ? rawBody : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const website = typeof body.website === 'string' ? body.website.trim() : '';

  // Honeypot trap: act successful to avoid signaling bots.
  if (website) return ok();

  if (!name || !email || !message) {
    return apiError(400, 'Missing required fields.');
  }
  if (!EMAIL_REGEX.test(email)) {
    return apiError(400, 'Invalid email format.');
  }
  if (name.length > 200 || email.length > 320 || message.length > 5000) {
    return apiError(400, 'Input exceeds allowed length.');
  }

  const sendgridKey = env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    return apiError(500, 'Server email configuration is missing.');
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
    personalizations: [{to: [{email: contactSubmissionRecipient(env.CONTACT_TO_EMAIL)}]}],
    from: {
      email: env.CONTACT_FROM_EMAIL ?? 'noreply@kicero.co.uk',
      name: env.CONTACT_FROM_NAME ?? 'Website Contact Form',
    },
    reply_to: {email},
    subject: `Contact form: ${name}`,
    content: [
      {type: 'text/plain', value: textContent},
      {type: 'text/html', value: htmlContent},
    ],
    tracking_settings: SENDGRID_DIRECT_LINK_TRACKING,
  };

  const outcome = await sendSendgridMail(sendgridKey, payload);
  if (!outcome.ok) {
    if ('network' in outcome) {
      return apiError(502, 'Failed to reach email provider.');
    }
    return apiError(502, 'Email provider request failed.', {
      providerStatus: outcome.providerStatus,
      providerMessage: outcome.providerMessage,
    });
  }
  return ok();
}
