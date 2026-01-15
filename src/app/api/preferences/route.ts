import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Default preferences
const DEFAULT_PREFERENCES = {
  defaultSenderName: '',
  defaultSenderEmail: '',
  defaultTone: 'professional' as const,
  notifications: { email: true, webhook: false },
};

// Update preferences schema
const updatePreferencesSchema = z.object({
  defaultSenderName: z.string().max(255).optional(),
  defaultSenderEmail: z.string().email().max(255).optional().or(z.literal('')),
  defaultTone: z.enum(['professional', 'friendly', 'casual', 'formal', 'enthusiastic']).optional(),
  notifications: z.object({
    email: z.boolean(),
    webhook: z.boolean(),
  }).optional(),
});

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

    // Try to get existing preferences
    const [existingPrefs] = await db
      .select()
      .from(userPreferences)
      .where(
        and(
          eq(userPreferences.organizationId, effectiveOrgId),
          eq(userPreferences.userId, session.userId)
        )
      )
      .limit(1);

    if (existingPrefs) {
      return NextResponse.json({
        id: existingPrefs.id,
        defaultSenderName: existingPrefs.defaultSenderName || '',
        defaultSenderEmail: existingPrefs.defaultSenderEmail || '',
        defaultTone: existingPrefs.defaultTone || 'professional',
        notifications: existingPrefs.notifications || { email: true, webhook: false },
      });
    }

    // Return default preferences if none exist
    return NextResponse.json(DEFAULT_PREFERENCES);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const validation = updatePreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if preferences exist
    const [existingPrefs] = await db
      .select()
      .from(userPreferences)
      .where(
        and(
          eq(userPreferences.organizationId, effectiveOrgId),
          eq(userPreferences.userId, session.userId)
        )
      )
      .limit(1);

    let result;

    if (existingPrefs) {
      // Update existing preferences
      [result] = await db
        .update(userPreferences)
        .set({
          ...(data.defaultSenderName !== undefined && { defaultSenderName: data.defaultSenderName }),
          ...(data.defaultSenderEmail !== undefined && { defaultSenderEmail: data.defaultSenderEmail }),
          ...(data.defaultTone !== undefined && { defaultTone: data.defaultTone }),
          ...(data.notifications !== undefined && { notifications: data.notifications }),
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.id, existingPrefs.id))
        .returning();
    } else {
      // Create new preferences
      [result] = await db
        .insert(userPreferences)
        .values({
          organizationId: effectiveOrgId,
          userId: session.userId,
          defaultSenderName: data.defaultSenderName || '',
          defaultSenderEmail: data.defaultSenderEmail || '',
          defaultTone: data.defaultTone || 'professional',
          notifications: data.notifications || { email: true, webhook: false },
        })
        .returning();
    }

    return NextResponse.json({
      id: result.id,
      defaultSenderName: result.defaultSenderName || '',
      defaultSenderEmail: result.defaultSenderEmail || '',
      defaultTone: result.defaultTone || 'professional',
      notifications: result.notifications || { email: true, webhook: false },
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
