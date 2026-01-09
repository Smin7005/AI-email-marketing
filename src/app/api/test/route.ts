import { NextResponse } from 'next/server';
import { getCompanyDbClient } from '@/lib/db/company-client';

export async function GET() {
  try {
    // Test company database connection
    const companyDb = getCompanyDbClient();
    const { count } = await companyDb
      .from('rawdata_yellowpage_new')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      message: 'Company database connection successful',
      businessCount: count || 0,
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