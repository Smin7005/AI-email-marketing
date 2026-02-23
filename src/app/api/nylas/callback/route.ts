import { NextRequest, NextResponse } from 'next/server';
import { senderVerificationService } from '@/lib/services/sender-verification';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nylas/callback - Handle Nylas OAuth callback
 *
 * After the user authenticates with their email provider (Google, Microsoft, etc.),
 * Nylas redirects here with a code and state (sender DB ID).
 * We exchange the code for a grant ID and update the sender record.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state'); // sender DB ID

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/senders?error=missing_params', baseUrl)
    );
  }

  const senderId = parseInt(state, 10);
  if (isNaN(senderId)) {
    return NextResponse.redirect(
      new URL('/senders?error=invalid_state', baseUrl)
    );
  }

  try {
    await senderVerificationService.completeNylasAuth(senderId, code);

    // Redirect back to senders page with success indicator
    return NextResponse.redirect(
      new URL('/senders?nylas=connected', baseUrl)
    );
  } catch (error) {
    console.error('Nylas callback error:', error);

    return NextResponse.redirect(
      new URL('/senders?error=auth_failed', baseUrl)
    );
  }
}
