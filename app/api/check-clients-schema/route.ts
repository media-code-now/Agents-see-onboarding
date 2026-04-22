import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    
    // Get all columns in the clients table
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'clients'
      ORDER BY ordinal_position
    `;
    
    // Try a test insert with minimal fields
    const testInsert = await sql`
      INSERT INTO clients (name, created_by)
      VALUES ('TEST_' || NOW()::text, '00000000-0000-0000-0000-000000000000')
      RETURNING id, name, created_at
    `;
    
    // Count total clients
    const count = await sql`SELECT COUNT(*) as total FROM clients`;
    
    return NextResponse.json({
      columns: columns.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable,
        default: c.column_default
      })),
      test_insert: testInsert[0] || null,
      total_clients: count[0]?.total || 0
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMsg, details: JSON.stringify(error, null, 2) },
      { status: 500 }
    );
  }
}
