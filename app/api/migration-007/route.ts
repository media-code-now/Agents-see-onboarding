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

    // Add columns one by one with individual SQL calls
    const columns = [
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_cms VARCHAR(255)',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_login_url VARCHAR(500)',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_username VARCHAR(255)',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_password VARCHAR(255)',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS hosting VARCHAR(255)',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS domain_registrar VARCHAR(255)',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_analytics VARCHAR(500)',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS search_console VARCHAR(500)',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_business_profile VARCHAR(500)',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag_manager VARCHAR(500)',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS other_tools TEXT',
    ];

    const results: { column: string; status: string; error?: string }[] = [];

    for (const statement of columns) {
      try {
        const colName = statement.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
        // Use raw SQL - we need to construct the query string properly for Neon
        // Neon's sql client requires template literals, so we'll build each one dynamically
        if (statement.includes('website_cms')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_cms VARCHAR(255)`;
        else if (statement.includes('website_login_url')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_login_url VARCHAR(500)`;
        else if (statement.includes('website_username')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_username VARCHAR(255)`;
        else if (statement.includes('website_password')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_password VARCHAR(255)`;
        else if (statement.includes('hosting')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS hosting VARCHAR(255)`;
        else if (statement.includes('domain_registrar')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS domain_registrar VARCHAR(255)`;
        else if (statement.includes('google_analytics')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_analytics VARCHAR(500)`;
        else if (statement.includes('search_console')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS search_console VARCHAR(500)`;
        else if (statement.includes('google_business_profile')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_business_profile VARCHAR(500)`;
        else if (statement.includes('tag_manager')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag_manager VARCHAR(500)`;
        else if (statement.includes('other_tools')) await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS other_tools TEXT`;
        console.log(`✓ Added column ${colName}`);
        results.push({ column: colName, status: 'success' });
      } catch (error) {
        const colName = statement.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`✗ Error adding ${colName}: ${errorMsg}`);
        results.push({ column: colName, status: 'error', error: errorMsg });
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

    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is not set');
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
