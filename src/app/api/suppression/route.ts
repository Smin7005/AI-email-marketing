import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api';
import { suppressionService } from '@/lib/services/suppression';
import { validateEmail } from '@/lib/email/validate';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireAuth(request);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || undefined;

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get suppression list
    const results = await suppressionService.getSuppressionList(
      auth.organizationId,
      page,
      limit,
      type as any
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching suppression list:', error);

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

    // Parse request body
    const body = await request.json();
    const { email, type, reason } = body;

    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email and type are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const validation = validateEmail(email);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid email format',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Add to suppression list
    const record = await suppressionService.addToSuppressionList(
      auth.organizationId,
      {
        email: validation.normalized,
        type,
        reason,
      }
    );

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error adding to suppression list:', error);

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

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireAuth(request);

    // Parse request body
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
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Remove from suppression list
    await suppressionService.removeFromSuppressionList(
      auth.organizationId,
      validation.normalized
    );

    return NextResponse.json({
      message: 'Email removed from suppression list',
      email: validation.normalized,
    });
  } catch (error) {
    console.error('Error removing from suppression list:', error);

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