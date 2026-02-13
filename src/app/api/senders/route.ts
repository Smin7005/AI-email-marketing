import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { senderVerificationService } from '@/lib/services/sender-verification';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Sender creation schema
const createSenderSchema = z.object({
  emailAddress: z.string().email('Invalid email address'),
});

/**
 * GET /api/senders - List all senders for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const effectiveOrgId = session.orgId || session.userId || 'personal-workspace';

    // Ensure the org has the default sender (lazy initialization for new orgs)
    await senderVerificationService.ensureDefaultSender(effectiveOrgId);

    const senders = await senderVerificationService.listSenders(effectiveOrgId);

    return NextResponse.json({
      senders,
      total: senders.length,
    });
  } catch (error) {
    console.error('Error fetching senders:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/senders - Add a new sender for verification
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const effectiveOrgId = session.orgId || session.userId || 'personal-workspace';

    // Parse and validate request body
    const body = await request.json();
    const validation = createSenderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { emailAddress } = validation.data;

    // Add sender
    const result = await senderVerificationService.addSender(
      effectiveOrgId,
      emailAddress
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating sender:', error);

    if (error instanceof Error) {
      // Handle known error cases
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'This email address is already registered' },
          { status: 409 }
        );
      }
      if (error.message.includes('Maximum of')) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 }
        );
      }
      if (error.message.includes('Invalid email') || error.message.includes('not allowed')) {
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
