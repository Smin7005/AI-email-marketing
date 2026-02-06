import {
  SESClient,
  VerifyDomainIdentityCommand,
  VerifyDomainDkimCommand,
  GetIdentityVerificationAttributesCommand,
  GetIdentityDkimAttributesCommand,
  DeleteIdentityCommand,
  GetSendQuotaCommand,
  GetAccountSendingEnabledCommand,
  SendEmailCommand,
} from '@aws-sdk/client-ses';

export interface VerificationAttributes {
  verificationStatus: 'Pending' | 'Success' | 'Failed' | 'TemporaryFailure' | 'NotStarted';
  verificationToken?: string;
}

export interface DkimAttributes {
  dkimEnabled: boolean;
  dkimVerificationStatus: 'Pending' | 'Success' | 'Failed' | 'TemporaryFailure' | 'NotStarted';
  dkimTokens?: string[];
}

export interface SendQuota {
  max24HourSend: number;
  maxSendRate: number;
  sentLast24Hours: number;
}

export interface SESEmailOptions {
  to: string;
  from: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  configurationSetName?: string;
  tags?: Record<string, string>;
}

export class SESService {
  private client: SESClient;
  private region: string;

  constructor(region?: string) {
    this.region = region || process.env.AWS_SES_REGION || 'ap-southeast-1';
    this.client = new SESClient({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Initiate domain verification with AWS SES
   * Returns a verification token that must be added as a TXT record
   */
  async verifyDomainIdentity(domain: string): Promise<{ verificationToken: string }> {
    const command = new VerifyDomainIdentityCommand({
      Domain: domain,
    });

    const response = await this.client.send(command);

    if (!response.VerificationToken) {
      throw new Error('No verification token returned from AWS SES');
    }

    return {
      verificationToken: response.VerificationToken,
    };
  }

  /**
   * Initiate DKIM verification for a domain
   * Returns 3 DKIM tokens that must be added as CNAME records
   */
  async verifyDomainDkim(domain: string): Promise<{ dkimTokens: string[] }> {
    const command = new VerifyDomainDkimCommand({
      Domain: domain,
    });

    const response = await this.client.send(command);

    if (!response.DkimTokens || response.DkimTokens.length === 0) {
      throw new Error('No DKIM tokens returned from AWS SES');
    }

    return {
      dkimTokens: response.DkimTokens,
    };
  }

  /**
   * Get verification status for one or more identities (domains or email addresses)
   */
  async getIdentityVerificationAttributes(
    identities: string[]
  ): Promise<Map<string, VerificationAttributes>> {
    const command = new GetIdentityVerificationAttributesCommand({
      Identities: identities,
    });

    const response = await this.client.send(command);
    const result = new Map<string, VerificationAttributes>();

    if (response.VerificationAttributes) {
      for (const [identity, attrs] of Object.entries(response.VerificationAttributes)) {
        result.set(identity, {
          verificationStatus: (attrs.VerificationStatus as VerificationAttributes['verificationStatus']) || 'NotStarted',
          verificationToken: attrs.VerificationToken,
        });
      }
    }

    return result;
  }

  /**
   * Get DKIM attributes for one or more identities
   */
  async getIdentityDkimAttributes(
    identities: string[]
  ): Promise<Map<string, DkimAttributes>> {
    const command = new GetIdentityDkimAttributesCommand({
      Identities: identities,
    });

    const response = await this.client.send(command);
    const result = new Map<string, DkimAttributes>();

    if (response.DkimAttributes) {
      for (const [identity, attrs] of Object.entries(response.DkimAttributes)) {
        result.set(identity, {
          dkimEnabled: attrs.DkimEnabled || false,
          dkimVerificationStatus: (attrs.DkimVerificationStatus as DkimAttributes['dkimVerificationStatus']) || 'NotStarted',
          dkimTokens: attrs.DkimTokens,
        });
      }
    }

    return result;
  }

  /**
   * Delete an identity (domain or email address) from SES
   */
  async deleteIdentity(identity: string): Promise<void> {
    const command = new DeleteIdentityCommand({
      Identity: identity,
    });

    await this.client.send(command);
  }

  /**
   * Get the current send quota for the account
   */
  async getSendQuota(): Promise<SendQuota> {
    const command = new GetSendQuotaCommand({});

    const response = await this.client.send(command);

    return {
      max24HourSend: response.Max24HourSend || 0,
      maxSendRate: response.MaxSendRate || 0,
      sentLast24Hours: response.SentLast24Hours || 0,
    };
  }

  /**
   * Check if the account is in sandbox mode
   * In sandbox mode, you can only send to verified email addresses
   */
  async isInSandbox(): Promise<boolean> {
    const command = new GetAccountSendingEnabledCommand({});

    try {
      const response = await this.client.send(command);
      // If sending is enabled, check the quota to determine sandbox status
      if (response.Enabled) {
        const quota = await this.getSendQuota();
        // Sandbox mode typically has a 200/day limit
        return quota.max24HourSend <= 200;
      }
      return true;
    } catch {
      // If we can't check, assume sandbox mode for safety
      return true;
    }
  }

  /**
   * Send an email using AWS SES
   */
  async sendEmail(options: SESEmailOptions): Promise<{ messageId: string }> {
    const source = options.fromName
      ? `${options.fromName} <${options.from}>`
      : options.from;

    const command = new SendEmailCommand({
      Source: source,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8',
          },
          ...(options.text && {
            Text: {
              Data: options.text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
      ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
      ConfigurationSetName: options.configurationSetName,
      Tags: options.tags
        ? Object.entries(options.tags).map(([Name, Value]) => ({ Name, Value }))
        : undefined,
    });

    const response = await this.client.send(command);

    if (!response.MessageId) {
      throw new Error('No message ID returned from AWS SES');
    }

    return {
      messageId: response.MessageId,
    };
  }

  /**
   * Get the AWS region this service is configured for
   */
  getRegion(): string {
    return this.region;
  }
}

// Default singleton instance
export const sesService = new SESService();
