import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isMasterAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();
    
    // Check if the Access & Logins columns exist in the clients table
    const result = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name IN (
        'website_cms', 'website_login_url', 'website_username', 'website_password',
        'hosting', 'domain_registrar', 'google_analytics', 'search_console',
        'google_business_profile', 'tag_manager', 'other_tools'
      )
    `;

    const columnCount = result.length;
    const expectedCount = 11;

    return NextResponse.json({
      status: columnCount === expectedCount ? 'migrated' : 'pending',
      columnCount,
      expectedCount,
      columns: result.map(r => r.column_name),
      message: columnCount === expectedCount 
        ? 'All Access & Logins columns exist in database'
        : `Missing ${expectedCount - columnCount} columns. Run migration to proceed.`
    });
  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
