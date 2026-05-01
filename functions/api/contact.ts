interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
}

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ContactPayload;

  try {
    body = (await context.request.json()) as ContactPayload;
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

  const sendgridKey = context.env.SENDGRID_API_KEY;
  const toEmail = context.env.CONTACT_TO_EMAIL ?? 'info@kicero.co.uk';
  const fromEmail = context.env.CONTACT_FROM_EMAIL ?? 'noreply@kicero.co.uk';
  const fromName = context.env.CONTACT_FROM_NAME ?? 'Website Contact Form';

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
};
