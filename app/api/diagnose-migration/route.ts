import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isMasterAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Master Admin required' }, { status: 401 });
    }

    const sql = getDb();

    // Check columns that exist
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'clients'
      ORDER BY ordinal_position
    `;

    const columnNames = (columns as Array<{ column_name: string; data_type: string }>).map(c => c.column_name);
    
    // Try a simple insert
    let insertTest = null;
    let insertError = null;
    try {
      const result = await sql`
        INSERT INTO clients (name, created_by)
        VALUES ('TEST_' || NOW()::text, '00000000-0000-0000-0000-000000000000')
        RETURNING id, name, created_at
      `;
      insertTest = result[0] || null;
    } catch (e) {
      insertError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({
      columnCount: columns.length,
      allColumns: columnNames,
      hasWebsiteCms: columnNames.includes('website_cms'),
      hasMissingColumns: !columnNames.includes('website_cms'),
      insertTest: {
        success: insertTest !== null,
        result: insertTest,
        error: insertError,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isMasterAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Master Admin required' }, { status: 401 });
    }

    const sql = getDb();
    const results = [];

    // Try adding each column one at a time
    const columns_to_add = [
      'website_cms',
      'website_login_url',
      'website_username',
      'website_password',
      'hosting',
      'domain_registrar',
      'google_analytics',
      'search_console',
      'google_business_profile',
      'tag_manager',
      'other_tools',
    ];

    for (const colName of columns_to_add) {
      try {
        if (colName === 'website_cms') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_cms VARCHAR(255)`;
        } else if (colName === 'website_login_url') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_login_url VARCHAR(500)`;
        } else if (colName === 'website_username') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_username VARCHAR(255)`;
        } else if (colName === 'website_password') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_password VARCHAR(255)`;
        } else if (colName === 'hosting') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS hosting VARCHAR(255)`;
        } else if (colName === 'domain_registrar') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS domain_registrar VARCHAR(255)`;
        } else if (colName === 'google_analytics') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_analytics VARCHAR(500)`;
        } else if (colName === 'search_console') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS search_console VARCHAR(500)`;
        } else if (colName === 'google_business_profile') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_business_profile VARCHAR(500)`;
        } else if (colName === 'tag_manager') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag_manager VARCHAR(500)`;
        } else if (colName === 'other_tools') {
          await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS other_tools TEXT`;
        }
        console.log(`✓ Added ${colName}`);
        results.push({ column: colName, status: 'success' });
      } catch (error) {
        const err = error instanceof Error ? error.message : String(error);
        console.error(`✗ Failed to add ${colName}: ${err}`);
        results.push({ column: colName, status: 'error', error: err });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
