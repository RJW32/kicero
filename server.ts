import 'dotenv/config';
import express from 'express';

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
};

const app = express();
app.use(express.json({limit: '100kb'}));

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

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
