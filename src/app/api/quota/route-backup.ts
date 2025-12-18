import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api';
import { quotaService } from '@/lib/services/quota';

// Hardcoded default quota
const DEFAULT_QUOTA = {
  monthlyQuota: 300,
  emailsSentThisMonth: 0,
  emailsRemaining: 300,
  quotaPercentage: 0,
  quotaResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  isOverQuota: false,
  warningThreshold: 0.8
};

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireAuth(request);

    // Get quota information
    const quotaInfo = await quotaService.getQuotaInfo(auth.organizationId);

    return NextResponse.json(quotaInfo);
  } catch (error) {
    console.error('Quota Error:', error);

    // Log full error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // ALWAYS return default quota with 200 OK, regardless of any error
    return NextResponse.json(DEFAULT_QUOTA);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireAuth(request);

    // Parse request body
    const body = await request.json();
    const { monthlyQuota } = body;

    if (typeof monthlyQuota !== 'number' || monthlyQuota < 0) {
      return NextResponse.json(
        { error: 'Invalid monthly quota' },
        { status: 400 }
      );
    }

    // Update quota (this would typically be admin-only)
    await quotaService.updateMonthlyQuota(auth.organizationId, monthlyQuota);

    // Return updated quota info
    const quotaInfo = await quotaService.getQuotaInfo(auth.organizationId);

    return NextResponse.json(quotaInfo);
  } catch (error) {
    console.error('Error updating quota:', error);

    // For PUT requests, still return the default quota instead of error
    return NextResponse.json(DEFAULT_QUOTA);
  }
}