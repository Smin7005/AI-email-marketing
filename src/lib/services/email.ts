import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResult {
  id: string;
  messageId?: string;
  error?: string;
}

export class EmailService {
  /**
   * Send a single email
   * @param options Email options
   * @returns Email result
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const { data, error } = await resend.emails.send({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        headers: options.headers,
        tags: options.tags,
      });

      if (error) {
        return {
          id: '',
          error: error.message,
        };
      }

      return {
        id: data?.id || '',
        messageId: data?.id,
      };
    } catch (error) {
      return {
        id: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send multiple emails with rate limiting
   * @param emails Array of email options
   * @param rateLimit Max emails per second (default: 10)
   * @returns Array of email results
   */
  async sendBulkEmails(emails: EmailOptions[], rateLimit = 10): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    const batchSize = Math.min(rateLimit, emails.length);

    // Process in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      // Send batch
      const batchResults = await Promise.allSettled(
        batch.map(email => this.sendEmail(email))
      );

      // Collect results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            id: '',
            error: result.reason?.message || 'Failed to send email',
          });
        }
      });

      // Wait 1 second between batches for rate limiting
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Validate email format
   * @param email Email address to validate
   * @returns true if valid
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format sender email with name
   * @param name Sender name
   * @param email Sender email
   * @returns Formatted sender string
   */
  formatSender(name: string, email: string): string {
    return `"${name}" <${email}>`;
  }

  /**
   * Generate unsubscribe footer
   * @param unsubscribeUrl Unsubscribe link URL
   * @returns HTML footer
   */
  generateUnsubscribeFooter(unsubscribeUrl: string): string {
    return `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 12px;">
        <p>If you no longer wish to receive these emails, <a href="${unsubscribeUrl}" style="color: #666;">click here to unsubscribe</a>.</p>
      </div>
    `;
  }

  /**
   * Add unsubscribe link to email content
   * @param htmlContent Original HTML content
   * @param unsubscribeUrl Unsubscribe link URL
   * @returns HTML content with unsubscribe footer
   */
  addUnsubscribeToEmail(htmlContent: string, unsubscribeUrl: string): string {
    const footer = this.generateUnsubscribeFooter(unsubscribeUrl);

    // Try to insert before closing body tag, otherwise append
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${footer}</body>`);
    }

    return htmlContent + footer;
  }

  /**
   * Track email in analytics
   * @param emailId Email ID from provider
   * @param campaignId Campaign ID
   * @param organizationId Organization ID
   * @param metadata Additional metadata
   */
  async trackEmail(emailId: string, campaignId: number, organizationId: string, metadata?: Record<string, any>) {
    // This would typically integrate with your analytics service
    // For now, just log it
    console.log('Email tracked:', {
      emailId,
      campaignId,
      organizationId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }
}

export const emailService = new EmailService();