import { emailService } from '../../services/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailSendParams {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  campaignId?: number;
  organizationId?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

/**
 * Send email with best practices
 */
export async function sendEmailWithTracking(params: EmailSendParams): Promise<EmailSendResult> {
  try {
    // Validate email format
    if (!emailService.isValidEmail(params.to)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // Add default tags
    const tags = [
      ...(params.tags || []),
      { name: 'type', value: 'campaign' },
    ];

    if (params.campaignId) {
      tags.push({ name: 'campaign', value: params.campaignId.toString() });
    }

    if (params.organizationId) {
      tags.push({ name: 'organization', value: params.organizationId });
    }

    // Send email
    const result = await emailService.sendEmail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      tags,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error,
        provider: 'resend',
      };
    }

    // Track the email
    if (params.campaignId && params.organizationId) {
      await trackEmail(result.id, params.campaignId, params.organizationId, {
        to: params.to,
        subject: params.subject,
        from: params.from,
      });
    }

    return {
      success: true,
      messageId: result.id,
      provider: 'resend',
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'resend',
    };
  }
}

/**
 * Track email for analytics
 */
async function trackEmail(
  messageId: string,
  campaignId: number,
  organizationId: string,
  metadata: Record<string, any>
): Promise<void> {
  try {
    // This would typically integrate with your analytics service
    // For now, just log it
    console.log('Email tracked:', {
      messageId,
      campaignId,
      organizationId,
      metadata,
      timestamp: new Date().toISOString(),
    });

    // You could also send this to Inngest for async processing
    // await inngest.send({
    //   name: 'email/sent',
    //   data: {
    //     messageId,
    //     campaignId,
    //     organizationId,
    //     metadata,
    //   },
    // });
  } catch (error) {
    console.error('Failed to track email:', error);
  }
}

/**
 * Validate email before sending
 */
export function validateEmailParams(params: EmailSendParams): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate from address
  if (!params.from || !params.from.includes('@')) {
    errors.push('Invalid from address');
  }

  // Validate to address
  if (!params.to || !params.to.includes('@')) {
    errors.push('Invalid to address');
  }

  // Validate subject
  if (!params.subject || params.subject.length < 5) {
    errors.push('Subject too short (min 5 characters)');
  }

  if (params.subject.length > 200) {
    errors.push('Subject too long (max 200 characters)');
  }

  // Validate content
  if (!params.html || params.html.length < 10) {
    errors.push('Email content too short (min 10 characters)');
  }

  if (params.html.length > 10000) {
    errors.push('Email content too long (max 10000 characters)');
  }

  // Check for unsubscribe link
  if (!params.html.includes('unsubscribe')) {
    errors.push('Email missing unsubscribe link');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Add tracking pixels and links
 */
export function addTrackingToEmail(
  htmlContent: string,
  campaignId: number,
  organizationId: string,
  messageId: string
): string {
  // Add tracking pixel
  const trackingPixel = `
    <img src="${process.env.APP_URL}/api/track/pixel?mid=${messageId}&cid=${campaignId}&oid=${organizationId}"
         width="1" height="1" style="display:none;" alt="" />
  `;

  // Insert before closing body tag
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', `${trackingPixel}</body>`);
  }

  return htmlContent + trackingPixel;
}

/**
 * Rate limiting for email sending
 */
export class EmailRateLimiter {
  private sentTimestamps: number[] = [];
  private readonly maxPerSecond: number;
  private readonly windowMs: number;

  constructor(maxPerSecond: number, windowMs = 1000) {
    this.maxPerSecond = maxPerSecond;
    this.windowMs = windowMs;
  }

  /**
   * Check if we can send an email
   */
  canSend(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old timestamps
    this.sentTimestamps = this.sentTimestamps.filter(ts => ts > windowStart);

    return this.sentTimestamps.length < this.maxPerSecond;
  }

  /**
   * Record that an email was sent
   */
  recordSent(): void {
    this.sentTimestamps.push(Date.now());
  }

  /**
   * Wait until we can send an email
   */
  async waitUntilCanSend(): Promise<void> {
    while (!this.canSend()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.recordSent();
  }
}

/**
 * Process email sending results
 */
export function processEmailResults(results: EmailSendResult[]): {
  successful: number;
  failed: number;
  errors: string[];
} {
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const errors = results
    .filter(r => !r.success && r.error)
    .map(r => r.error!)
    .filter((error, index, arr) => arr.indexOf(error) === index); // Unique errors

  return {
    successful,
    failed,
    errors,
  };
}