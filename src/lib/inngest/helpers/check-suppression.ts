import { db } from '../../db';
import { suppressionList } from '../../db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { withOrganization } from '../../db/tenant';

export interface SuppressionCheck {
  email: string;
  isSuppressed: boolean;
  type?: string;
  reason?: string;
}

/**
 * Check if a single email is suppressed
 */
export async function checkSuppression(
  organizationId: string,
  email: string
): Promise<SuppressionCheck> {
  const result = await db
    .select({
      type: suppressionList.type,
      reason: suppressionList.reason,
    })
    .from(suppressionList)
    .where(
      and(
        withOrganization(organizationId),
        eq(suppressionList.email, email.toLowerCase())
      )
    )
    .limit(1);

  if (result.length > 0) {
    return {
      email,
      isSuppressed: true,
      type: result[0].type,
      reason: result[0].reason || undefined,
    };
  }

  return {
    email,
    isSuppressed: false,
  };
}

/**
 * Check multiple emails for suppression
 */
export async function checkSuppressionBulk(
  organizationId: string,
  emails: string[]
): Promise<SuppressionCheck[]> {
  if (emails.length === 0) {
    return [];
  }

  const results = await db
    .select({
      email: suppressionList.email,
      type: suppressionList.type,
      reason: suppressionList.reason,
    })
    .from(suppressionList)
    .where(
      and(
        withOrganization(organizationId),
        inArray(suppressionList.email, emails.map(e => e.toLowerCase()))
      )
    );

  const suppressionMap = new Map(
    results.map(r => [r.email, { type: r.type, reason: r.reason }])
  );

  return emails.map(email => {
    const suppressed = suppressionMap.get(email.toLowerCase());
    if (suppressed) {
      return {
        email,
        isSuppressed: true,
        type: suppressed.type,
        reason: suppressed.reason || undefined,
      };
    }

    return {
      email,
      isSuppressed: false,
    };
  });
}

/**
 * Get statistics about suppressed emails
 */
export async function getSuppressionStats(organizationId: string): Promise<{
  totalSuppressed: number;
  byType: Record<string, number>;
}> {
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(suppressionList)
    .where(withOrganization(organizationId));

  const typeCounts = await db
    .select({
      type: suppressionList.type,
      count: sql<number>`count(*)`,
    })
    .from(suppressionList)
    .where(withOrganization(organizationId))
    .groupBy(suppressionList.type);

  const byType: Record<string, number> = {
    unsubscribed: 0,
    bounced: 0,
    complained: 0,
  };

  typeCounts.forEach(item => {
    byType[item.type] = item.count;
  });

  return {
    totalSuppressed: totalResult[0].count,
    byType,
  };
}

/**
 * Add emails to suppression list in bulk
 */
export async function addToSuppressionList(
  organizationId: string,
  emails: string[],
  type: 'unsubscribed' | 'bounced' | 'complained',
  reason?: string,
  campaignId?: number
): Promise<number> {
  if (emails.length === 0) {
    return 0;
  }

  const values = emails.map(email => ({
    organizationId,
    email: email.toLowerCase(),
    type,
    reason,
    campaignId,
  }));

  const result = await db
    .insert(suppressionList)
    .values(values)
    .onConflictDoNothing(); // Don't error if already suppressed

  return 1;
}

/**
 * Process bounce event
 */
export async function processBounce(
  organizationId: string,
  email: string,
  bounceType: 'hard' | 'soft',
  reason?: string,
  campaignId?: number
): Promise<void> {
  await addToSuppressionList(
    organizationId,
    [email],
    'bounced',
    `${bounceType} bounce: ${reason || 'Unknown reason'}`,
    campaignId
  );
}

/**
 * Process complaint event
 */
export async function processComplaint(
  organizationId: string,
  email: string,
  reason?: string,
  campaignId?: number
): Promise<void> {
  await addToSuppressionList(
    organizationId,
    [email],
    'complained',
    reason || 'Spam complaint',
    campaignId
  );
}

/**
 * Filter out suppressed emails from a list
 */
export async function filterSuppressedEmails(
  organizationId: string,
  emails: string[]
): Promise<{
  allowed: string[];
  suppressed: SuppressionCheck[];
}> {
  const checks = await checkSuppressionBulk(organizationId, emails);

  const allowed: string[] = [];
  const suppressed: SuppressionCheck[] = [];

  checks.forEach(check => {
    if (check.isSuppressed) {
      suppressed.push(check);
    } else {
      allowed.push(check.email);
    }
  });

  return {
    allowed,
    suppressed,
  };
}

/**
 * Check if we should suppress based on bounce type
 */
export function shouldSuppressBounce(bounceType: string, subType?: string): boolean {
  // Always suppress hard bounces
  if (bounceType === 'Permanent') {
    return true;
  }

  // Suppress soft bounces after multiple attempts
  if (bounceType === 'Temporary') {
    // In a real implementation, you'd track bounce attempts
    // For now, we'll suppress on the first soft bounce for safety
    return true;
  }

  return false;
}

/**
 * Get suppression reasons for reporting
 */
export function getSuppressionReason(type: string, reason?: string): string {
  switch (type) {
    case 'unsubscribed':
      return reason || 'User unsubscribed';
    case 'bounced':
      return reason || 'Email bounced';
    case 'complained':
      return reason || 'Spam complaint';
    default:
      return reason || 'Unknown reason';
  }
}

/**
 * Clean up old suppression records (optional)
 */
export async function cleanupOldSuppressions(
  organizationId: string,
  olderThanDays = 365
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await db
    .delete(suppressionList)
    .where(
      and(
        withOrganization(organizationId),
        sql`${suppressionList.createdAt} < ${cutoffDate}`
      )
    );

  return 0;
}