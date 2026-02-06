import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { senderVerificationService } from '@/lib/services/sender-verification';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/senders/[id]/set-default - Set a sender as the default
 */
export async function POST(request: NextRequest, context: RouteParams) {
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

    await senderVerificationService.setDefaultSender(effectiveOrgId, senderId);

    // Get updated sender
    const sender = await senderVerificationService.getSender(effectiveOrgId, senderId);

    return NextResponse.json({
      message: 'Default sender updated successfully',
      sender,
    });
  } catch (error) {
    console.error('Error setting default sender:', error);

    if (error instanceof Error) {
      if (error.message === 'Sender not found') {
        return NextResponse.json(
          { error: 'Sender not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('must be verified')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
