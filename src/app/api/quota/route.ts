import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api';
import { quotaService } from '@/lib/services/quota';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireAuth(request);

    // Get quota information
    const quotaInfo = await quotaService.getQuotaInfo(auth.organizationId);

    return NextResponse.json(quotaInfo);
  } catch (error) {
    console.error('Error fetching quota:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'No organization selected') {
        return NextResponse.json(
          { error: 'Organization required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'No organization selected') {
        return NextResponse.json(
          { error: 'Organization required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}