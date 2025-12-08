import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.CLERK_SECRET_KEY || 'fallback-secret';

export interface UnsubscribeTemplateData {
  organizationId: string;
  campaignItemId: number;
  campaignId: number;
  businessName: string;
  baseUrl: string;
}

/**
 * Generate unsubscribe token
 */
export function generateUnsubscribeToken(
  organizationId: string,
  campaignItemId: number
): string {
  return jwt.sign(
    {
      organizationId,
      campaignItemId,
      type: 'unsubscribe',
      timestamp: Date.now(),
    },
    JWT_SECRET,
    { expiresIn: '1y' }
  );
}

/**
 * Verify unsubscribe token
 */
export function verifyUnsubscribeToken(token: string): {
  valid: boolean;
  organizationId?: string;
  campaignItemId?: number;
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'unsubscribe') {
      return { valid: false, error: 'Invalid token type' };
    }

    return {
      valid: true,
      organizationId: decoded.organizationId,
      campaignItemId: decoded.campaignItemId,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

/**
 * Create unsubscribe footer HTML
 */
export function createUnsubscribeFooter(unsubscribeUrl: string): string {
  return `
    <div style="
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      color: #666;
      font-size: 12px;
      font-family: Arial, sans-serif;
    ">
      <p style="margin: 0 0 10px 0;">
        <!--[if mso]-->
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${unsubscribeUrl}" style="height:40px;v-text-anchor:middle;width:150px;" arcsize="10%" strokecolor="#d9534f" fillcolor="#d9534f">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:sans-serif;font-size:13px;font-weight:bold;">Unsubscribe</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]--><!-- -->
        <a href="${unsubscribeUrl}" style="
          background-color: #d9534f;
          border: 1px solid #d9534f;
          border-radius: 4px;
          color: #ffffff;
          display: inline-block;
          font-family: Arial, sans-serif;
          font-size: 13px;
          font-weight: bold;
          line-height: 40px;
          text-align: center;
          text-decoration: none;
          width: 150px;
          -webkit-text-size-adjust: none;
          mso-hide: all;
        ">Unsubscribe</a>
        <!-- <![endif]-->
      </p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999;">
        You're receiving this because you subscribed to updates from our business directory.
        <br />
        If you no longer wish to receive these emails, please click the unsubscribe button above.
      </p>
    </div>
  `;
}

/**
 * Create unsubscribe page HTML
 */
export function createUnsubscribePage(
  businessName: string,
  success: boolean,
  error?: string
): string {
  if (success) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - ${businessName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            text-align: center;
          }
          h1 {
            color: #28a745;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Successfully Unsubscribed</h1>
          <p>
            You have been unsubscribed from ${businessName}'s email updates.
          </p>
          <p>
            We're sorry to see you go. You will no longer receive marketing emails from us.
          </p>
          <div class="footer">
            This change may take up to 24 hours to take effect.
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribe Error - ${businessName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            text-align: center;
          }
          h1 {
            color: #dc3545;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>Unsubscribe Failed</h1>
          <div class="error">
            ${error || 'An unknown error occurred while processing your unsubscribe request.'}
          </div>
          <p>
            We're sorry, but we couldn't process your unsubscribe request at this time.
          </p>
          <p>
            Please try again later or contact our support team if the problem persists.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Create unsubscribe confirmation email
 */
export function createUnsubscribeConfirmationEmail(
  businessName: string,
  unsubscribeUrl: string
): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Confirm Your Unsubscription</h2>
        <p>Hi there,</p>
        <p>We received a request to unsubscribe ${businessName} from our email updates.</p>
        <p>To complete the unsubscription process, please click the button below:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${unsubscribeUrl}" style="
            display: inline-block;
            background-color: #dc3545;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          ">Unsubscribe</a>
        </p>
        <p>If you didn't request this unsubscription, you can safely ignore this email.</p>
        <p>Best regards,<br>The Marketing Team</p>
      </body>
    </html>
  `;
}

/**
 * JWT token utilities
 */
export const jwtUtils = {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
};