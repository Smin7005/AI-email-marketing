import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

interface AuthContext {
  userId: string;
  organizationId: string;
  user: any;
}

export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const session = await auth();

  if (!session?.userId) {
    throw new Error('Unauthorized');
  }

  if (!session?.orgId) {
    throw new Error('No organization selected');
  }

  return {
    userId: session.userId,
    organizationId: session.orgId,
    user: session.user,
  };
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  try {
    return await requireAuth(req);
  } catch {
    return null;
  }
}