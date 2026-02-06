import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { senderVerificationService } from '@/lib/services/sender-verification';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/senders/[id] - Get a specific sender with DNS records
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const session = await auth();

    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const effectiveOrgId = session.orgId || session.userId || 'personal-workspace';
    const { id } = await context.params;
    const senderId = parseInt(id, 10);

    if (isNaN(senderId)) {
      return NextResponse.json(
        { error: 'Invalid sender ID' },
        { status: 400 }
      );
    }

    const sender = await senderVerificationService.getSender(effectiveOrgId, senderId);

    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    // Get DNS records for display
    const dnsRecords = senderVerificationService.getDnsRecords({
      domain: sender.domain,
      verificationToken: sender.verificationToken,
      dkimTokens: sender.dkimTokens,
      verificationStatus: sender.verificationStatus,
      dkimStatus: sender.dkimStatus,
    });

    return NextResponse.json({
      sender,
      dnsRecords,
    });
  } catch (error) {
    console.error('Error fetching sender:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/senders/[id] - Delete a sender
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const session = await auth();

    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const effectiveOrgId = session.orgId || session.userId || 'personal-workspace';
    const { id } = await context.params;
    const senderId = parseInt(id, 10);

    if (isNaN(senderId)) {
      return NextResponse.json(
        { error: 'Invalid sender ID' },
        { status: 400 }
      );
    }

    await senderVerificationService.removeSender(effectiveOrgId, senderId);

    return NextResponse.json(
      { message: 'Sender deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting sender:', error);

    if (error instanceof Error) {
      if (error.message === 'Sender not found') {
        return NextResponse.json(
          { error: 'Sender not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
