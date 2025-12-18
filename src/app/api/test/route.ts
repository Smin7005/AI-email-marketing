import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { businesses } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Test database connection
    const result = await db.select({ count: sql<number>`count(*)` }).from(businesses);
    const count = result[0].count;

    return NextResponse.json({
      message: 'Database connection successful',
      businessCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}