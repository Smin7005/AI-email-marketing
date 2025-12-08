import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api';
import { businessService } from '@/lib/services/business';
import { validateEmail } from '@/lib/email/validate';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const cities = searchParams.getAll('city');
    const industries = searchParams.getAll('industry');
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // For development/testing, allow access without auth
    // In production, always require authentication
    let organizationId = 'test-org-123';

    try {
      const auth = await requireAuth(request);
      organizationId = auth.organizationId;
    } catch (error) {
      // In development mode, continue with test org
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using test organization for development');
      } else {
        throw error;
      }
    }

    // Search businesses
    const results = await businessService.searchBusinesses({
      cities: cities.length > 0 ? cities : undefined,
      industries: industries.length > 0 ? industries : undefined,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      businesses: results.businesses,
      total: results.total,
      page: results.page,
      limit: results.limit,
      totalPages: results.totalPages,
    });
  } catch (error) {
    console.error('Error searching businesses:', error);

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

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireAuth(request);

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const validation = validateEmail(email);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid email format',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Check if email is already suppressed
    // This would typically be used for unsubscribe functionality

    return NextResponse.json({
      message: 'Email validated successfully',
      email: validation.normalized,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error('Error validating email:', error);

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