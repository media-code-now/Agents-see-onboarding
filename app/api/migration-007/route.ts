import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isMasterAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Master Admin required' }, { status: 401 });
    }

    const sql = getDb();
    
    console.log('Running migration 007: Add Access & Logins fields');

    // Add columns one by one to handle any issues
    const columns = [
      { name: 'website_cms', type: 'VARCHAR(255)' },
      { name: 'website_login_url', type: 'VARCHAR(500)' },
      { name: 'website_username', type: 'VARCHAR(255)' },
      { name: 'website_password', type: 'VARCHAR(255)' },
      { name: 'hosting', type: 'VARCHAR(255)' },
      { name: 'domain_registrar', type: 'VARCHAR(255)' },
      { name: 'google_analytics', type: 'VARCHAR(500)' },
      { name: 'search_console', type: 'VARCHAR(500)' },
      { name: 'google_business_profile', type: 'VARCHAR(500)' },
      { name: 'tag_manager', type: 'VARCHAR(500)' },
      { name: 'other_tools', type: 'TEXT' },
    ];

    const results: { column: string; status: string; error?: string }[] = [];

    for (const col of columns) {
      try {
        const query = `ALTER TABLE clients ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`;
        await sql.unsafe(query);
        console.log(`✓ Added column ${col.name}`);
        results.push({ column: col.name, status: 'success' });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`✗ Error adding ${col.name}: ${errorMsg}`);
        results.push({ column: col.name, status: 'error', error: errorMsg });
      }
    }

    return NextResponse.json({
      message: 'Migration 007 completed',
      results,
    });
  } catch (error) {
    console.error('migration-007 error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Migration failed', details: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isMasterAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Master Admin required' }, { status: 401 });
    }

    const sql = getDb();

    // Check which columns exist
    const result = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'clients' 
      AND column_name IN ('website_cms', 'website_login_url', 'website_username', 'website_password', 
                          'hosting', 'domain_registrar', 'google_analytics', 'search_console',
                          'google_business_profile', 'tag_manager', 'other_tools')
      ORDER BY column_name
    `;

    const existingColumns = result.map((r: Record<string, unknown>) => r.column_name as string);
    const expectedColumns = [
      'website_cms', 'website_login_url', 'website_username', 'website_password',
      'hosting', 'domain_registrar', 'google_analytics', 'search_console',
      'google_business_profile', 'tag_manager', 'other_tools'
    ];
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));

    return NextResponse.json({
      existing: existingColumns,
      missing: missingColumns,
      allColumnsPresent: missingColumns.length === 0,
    });
  } catch (error) {
    console.error('check-migration-007 error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Check failed', details: errorMsg }, { status: 500 });
  }
}
