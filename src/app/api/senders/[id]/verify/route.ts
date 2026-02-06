import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { senderVerificationService } from '@/lib/services/sender-verification';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/senders/[id]/verify - Check and update verification status
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

    // Check verification status with AWS SES
    const sender = await senderVerificationService.checkVerificationStatus(
      effectiveOrgId,
      senderId
    );

    // Get updated DNS records
    const dnsRecords = senderVerificationService.getDnsRecords({
      domain: sender.domain,
      verificationToken: sender.verificationToken,
      dkimTokens: sender.dkimTokens,
      verificationStatus: sender.verificationStatus,
      dkimStatus: sender.dkimStatus,
    });

    // Determine if fully verified
    const isFullyVerified =
      sender.verificationStatus === 'verified' &&
      sender.dkimStatus === 'success';

    return NextResponse.json({
      sender,
      dnsRecords,
      verificationDetails: {
        domainStatus: sender.verificationStatus,
        dkimStatus: sender.dkimStatus,
        lastCheckedAt: sender.lastVerifiedAt,
        isFullyVerified,
      },
    });
  } catch (error) {
    console.error('Error verifying sender:', error);

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
