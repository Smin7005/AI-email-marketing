import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.CLERK_SECRET_KEY || 'fallback-secret';

export interface UnsubscribeTokenPayload {
  organizationId: string;
  campaignItemId: number;
  type: 'unsubscribe';
  timestamp: number;
}

export interface EmailTrackingTokenPayload {
  organizationId: string;
  campaignId: number;
  campaignItemId: number;
  eventType: 'open' | 'click';
  timestamp: number;
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
  data?: UnsubscribeTokenPayload;
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UnsubscribeTokenPayload;

    if (decoded.type !== 'unsubscribe') {
      return { valid: false, error: 'Invalid token type' };
    }

    return {
      valid: true,
      data: decoded,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

/**
 * Generate email tracking token
 */
export function generateTrackingToken(
  organizationId: string,
  campaignId: number,
  campaignItemId: number,
  eventType: 'open' | 'click'
): string {
  return jwt.sign(
    {
      organizationId,
      campaignId,
      campaignItemId,
      eventType,
      type: 'tracking',
      timestamp: Date.now(),
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Verify email tracking token
 */
export function verifyTrackingToken(token: string): {
  valid: boolean;
  data?: EmailTrackingTokenPayload;
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as EmailTrackingTokenPayload;

    return {
      valid: true,
      data: decoded,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

/**
 * Generate signed URL for unsubscribe
 */
export function generateUnsubscribeUrl(
  baseUrl: string,
  organizationId: string,
  campaignItemId: number
): string {
  const token = generateUnsubscribeToken(organizationId, campaignItemId);
  return `${baseUrl}/unsubscribe/${token}`;
}

/**
 * Generate tracking pixel URL
 */
export function generateTrackingPixelUrl(
  baseUrl: string,
  organizationId: string,
  campaignId: number,
  campaignItemId: number
): string {
  const token = generateTrackingToken(organizationId, campaignId, campaignItemId, 'open');
  return `${baseUrl}/api/track/pixel?token=${token}`;
}

/**
 * Generate tracking link URL
 */
export function generateTrackingLinkUrl(
  baseUrl: string,
  organizationId: string,
  campaignId: number,
  campaignItemId: number,
  originalUrl: string
): string {
  const token = generateTrackingToken(organizationId, campaignId, campaignItemId, 'click');
  const encodedUrl = encodeURIComponent(originalUrl);
  return `${baseUrl}/api/track/click?token=${token}&url=${encodedUrl}`;
}

/**
 * JWT configuration
 */
export const jwtConfig = {
  secret: JWT_SECRET,
  expiresIn: {
    unsubscribe: '1y',
    tracking: '30d',
  },
};

/**
 * Token types
 */
export const TokenTypes = {
  UNSUBSCRIBE: 'unsubscribe',
  TRACKING: 'tracking',
} as const;

export const jwtUtils = {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  generateTrackingToken,
  verifyTrackingToken,
  generateTrackingPixelUrl,
  generateTrackingLinkUrl,
  TokenTypes
};