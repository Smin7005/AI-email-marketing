import Nylas from 'nylas';

export interface NylasEmailOptions {
  grantId: string;
  to: string;
  from: string;
  fromName?: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export class NylasService {
  private client: Nylas;

  constructor() {
    this.client = new Nylas({
      apiKey: process.env.NYLAS_API_KEY!,
      apiUri: process.env.NYLAS_API_URI || 'https://api.us.nylas.com',
    });
  }

  /**
   * Generate the Nylas hosted OAuth URL for connecting a user's email account.
   * The state parameter carries the sender DB ID so the callback can update the right record.
   */
  getAuthUrl(emailAddress: string, senderDbId: number): string {
    const params = new URLSearchParams({
      client_id: process.env.NYLAS_CLIENT_ID!,
      redirect_uri: process.env.NYLAS_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/nylas/callback`,
      response_type: 'code',
      login_hint: emailAddress,
      state: String(senderDbId),
    });

    const apiUri = process.env.NYLAS_API_URI || 'https://api.us.nylas.com';
    return `${apiUri}/v3/connect/auth?${params.toString()}`;
  }

  /**
   * Exchange an OAuth authorization code for a Nylas grant ID.
   * Called from the OAuth callback route after the user authenticates.
   */
  async exchangeCodeForGrant(code: string): Promise<{ grantId: string; email: string }> {
    const apiUri = process.env.NYLAS_API_URI || 'https://api.us.nylas.com';
    const response = await fetch(`${apiUri}/v3/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.NYLAS_CLIENT_ID!,
        client_secret: process.env.NYLAS_API_KEY!,
        redirect_uri: process.env.NYLAS_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/nylas/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for grant: ${error}`);
    }

    const data = await response.json();
    return {
      grantId: data.grant_id,
      email: data.email,
    };
  }

  /**
   * Send an email via Nylas using a connected user's grant
   */
  async sendEmail(options: NylasEmailOptions): Promise<{ messageId: string }> {
    const message = await this.client.messages.send({
      identifier: options.grantId,
      requestBody: {
        to: [{ email: options.to }],
        from: [{
          email: options.from,
          name: options.fromName,
        }],
        subject: options.subject,
        body: options.html,
        replyTo: options.replyTo ? [{ email: options.replyTo }] : undefined,
      },
    });

    return {
      messageId: message.data.id || '',
    };
  }

  /**
   * Check if a Nylas grant is still valid/connected
   */
  async verifyGrant(grantId: string): Promise<boolean> {
    try {
      await this.client.grants.find({ grantId });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Revoke/delete a Nylas grant (disconnect the user's email)
   */
  async revokeGrant(grantId: string): Promise<void> {
    try {
      await this.client.grants.destroy({ grantId });
    } catch (error) {
      console.error('Failed to revoke Nylas grant:', error);
    }
  }
}

// Default singleton instance
export const nylasService = new NylasService();
