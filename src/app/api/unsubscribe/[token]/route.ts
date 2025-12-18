import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suppressionList } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { jwtUtils } from '@/lib/auth/jwt';
import { createUnsubscribePage } from '@/lib/email/templates/unsubscribe';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Verify unsubscribe token
    const verification = jwtUtils.verifyUnsubscribeToken(token);

    if (!verification.valid || !verification.data) {
      return new NextResponse(
        createUnsubscribePage('Unknown Business', false, verification.error),
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const { organizationId, campaignItemId } = verification.data;

    // Find campaign item to get business details
    const [campaignItem] = await db
      .select({
        id: suppressionList.id,
        email: suppressionList.email,
      })
      .from(suppressionList)
      .where(
        and(
          eq(suppressionList.organizationId, organizationId),
          eq(suppressionList.id, campaignItemId)
        )
      )
      .limit(1);

    // Add email to suppression list if not already there
    await db
      .insert(suppressionList)
      .values({
        organizationId,
        email: campaignItem?.email || 'unknown@example.com',
        type: 'unsubscribed',
        reason: 'User unsubscribed via link',
      })
      .onConflictDoNothing();

    // Return success page
    return new NextResponse(
      createUnsubscribePage('Our Service', true),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Error processing unsubscribe:', error);

    return new NextResponse(
      createUnsubscribePage('Unknown Business', false, 'An error occurred processing your request'),
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}