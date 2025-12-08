import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  campaignId?: number;
  organizationId?: string;
}

export async function sendEmail(options: EmailOptions): Promise<string> {
  const from = options.from || `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`;

  const { data, error } = await resend.emails.send({
    from,
    to: [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text,
    tags: [
      {
        name: 'campaign_id',
        value: options.campaignId?.toString() || 'unknown',
      },
      {
        name: 'organization_id',
        value: options.organizationId || 'unknown',
      },
    ],
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to send email: No data returned');
  }

  return data.id;
}

export { resend };
