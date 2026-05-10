import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const ACTION = 'contact_form';

const ssm = new SSMClient({});
const ses = new SESClient({});

let cachedRecipients: string[] | undefined;

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  recaptchaToken: string;
}

interface WpVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  message?: string;
}

type RecaptchaResult =
  | { success: true; score: number | undefined }
  | { success: false; reason: string; details?: unknown };

async function getRecipients(): Promise<string[]> {
  if (cachedRecipients !== undefined) return cachedRecipients;
  const r = await ssm.send(
    new GetParameterCommand({ Name: process.env.RECIPIENTS_PARAM }),
  );
  cachedRecipients = (r.Parameter?.Value ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return cachedRecipients;
}

// Delegate verification to WordPress, which holds the Google secret and
// threshold in admin settings. WP returns the verified result; we trust it.
// This keeps reCAPTCHA configuration in one place (WP admin) instead of
// duplicating the secret in SSM.
async function verifyRecaptcha(token: string): Promise<RecaptchaResult> {
  const wpBase = process.env.WP_API_BASE;
  if (!wpBase) return { success: false, reason: 'wp-api-base-not-configured' };

  const url = `${wpBase}/?rest_route=/wp/v2/recaptcha/verify`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: ACTION }),
    });
  } catch (e) {
    return { success: false, reason: 'wp-verify-network-error', details: String(e) };
  }

  // WP returns 200 on verified and 400 on rejected, both with the same JSON
  // body shape. Trust the body's `success` field over the HTTP status. A
  // missing/invalid body indicates a real WP outage.
  const data = (await res.json().catch(() => null)) as WpVerifyResponse | null;
  if (!data || typeof data.success !== 'boolean') {
    return { success: false, reason: 'wp-verify-bad-response', details: res.status };
  }

  if (!data.success) {
    return {
      success: false,
      reason: 'wp-verify-rejected',
      details: { score: data.score, message: data.message },
    };
  }
  return { success: true, score: data.score };
}

function validate(body: unknown): ContactPayload | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid body' };
  const b = body as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const email = typeof b.email === 'string' ? b.email.trim() : '';
  const subject = typeof b.subject === 'string' ? b.subject.trim() : '';
  const message = typeof b.message === 'string' ? b.message.trim() : '';
  const recaptchaToken = typeof b.recaptchaToken === 'string' ? b.recaptchaToken : '';

  if (!name) return { error: 'Name is required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Valid email is required' };
  if (!subject) return { error: 'Subject is required' };
  if (!message) return { error: 'Message is required' };
  if (!recaptchaToken) return { error: 'reCAPTCHA token is required' };
  if (name.length > 200 || subject.length > 300 || message.length > 5000) {
    return { error: 'Field length exceeds limit' };
  }
  return { name, email, subject, message, recaptchaToken };
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(event.body ?? '{}');
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const validation = validate(parsed);
    if ('error' in validation) return jsonResponse(400, validation);

    const recaptcha = await verifyRecaptcha(validation.recaptchaToken);
    if (!recaptcha.success) {
      console.warn('reCAPTCHA rejected', { reason: recaptcha.reason });
      return jsonResponse(403, { error: 'reCAPTCHA verification failed', reason: recaptcha.reason });
    }

    const recipients = await getRecipients();
    if (recipients.length === 0) {
      console.error('No recipients configured in SSM');
      return jsonResponse(500, { error: 'Service misconfigured' });
    }

    const fromAddress = process.env.FROM_ADDRESS;
    if (!fromAddress) {
      console.error('FROM_ADDRESS env var not set');
      return jsonResponse(500, { error: 'Service misconfigured' });
    }

    const subject = `[Portfolio Contact] ${validation.subject}`;
    const textBody = [
      `From: ${validation.name} <${validation.email}>`,
      `Subject: ${validation.subject}`,
      '',
      validation.message,
    ].join('\n');
    const htmlBody = [
      `<p><strong>From:</strong> ${escapeHtml(validation.name)} &lt;${escapeHtml(validation.email)}&gt;</p>`,
      `<p><strong>Subject:</strong> ${escapeHtml(validation.subject)}</p>`,
      '<hr>',
      `<p>${escapeHtml(validation.message).replace(/\n/g, '<br>')}</p>`,
    ].join('\n');

    await ses.send(
      new SendEmailCommand({
        Source: fromAddress,
        Destination: { ToAddresses: recipients },
        ReplyToAddresses: [validation.email],
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: textBody, Charset: 'UTF-8' },
            Html: { Data: htmlBody, Charset: 'UTF-8' },
          },
        },
      }),
    );

    return jsonResponse(200, { success: true });
  } catch (e) {
    console.error('Contact form handler error:', e);
    return jsonResponse(500, { error: 'Internal error' });
  }
};
