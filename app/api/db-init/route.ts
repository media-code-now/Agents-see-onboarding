import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

// Columns that must exist on the clients table, grouped so they can be added safely one at a time.
const REQUIRED_CLIENT_COLUMNS: Array<{ name: string; ddl: string }> = [
  { name: 'business_type',          ddl: 'VARCHAR(255)' },
  { name: 'timezone',               ddl: 'VARCHAR(100)' },
  { name: 'locations',              ddl: 'TEXT' },
  { name: 'service_areas',          ddl: 'TEXT' },
  { name: 'website_cms',            ddl: 'VARCHAR(255)' },
  { name: 'website_login_url',      ddl: 'VARCHAR(500)' },
  { name: 'website_username',       ddl: 'VARCHAR(255)' },
  { name: 'website_password',       ddl: 'VARCHAR(255)' },
  { name: 'hosting',                ddl: 'VARCHAR(255)' },
  { name: 'domain_registrar',       ddl: 'VARCHAR(255)' },
  { name: 'google_analytics',       ddl: 'VARCHAR(255)' },
  { name: 'search_console',         ddl: 'VARCHAR(255)' },
  { name: 'google_business_profile',ddl: 'VARCHAR(255)' },
  { name: 'tag_manager',            ddl: 'VARCHAR(255)' },
  { name: 'google_drive',           ddl: 'VARCHAR(500)' },
  { name: 'other_tools',            ddl: 'TEXT' },
  { name: 'main_services',          ddl: 'TEXT' },
  { name: 'priority_services',      ddl: 'TEXT' },
  { name: 'main_keywords',          ddl: 'TEXT' },
  { name: 'secondary_keywords',     ddl: 'TEXT' },
  { name: 'target_locations',       ddl: 'TEXT' },
  { name: 'competitors',            ddl: 'TEXT' },
  { name: 'gbp_url',                ddl: 'VARCHAR(500)' },
  { name: 'social_links',           ddl: 'TEXT' },
  { name: 'client_email',           ddl: 'VARCHAR(255)' },
  { name: 'client_password_hash',   ddl: 'VARCHAR(255)' },
  { name: 'client_password_temp',   ddl: 'VARCHAR(255)' },
];

async function ensureColumns(
  sql: ReturnType<typeof getDb>,
  tableName: string,
  cols: Array<{ name: string; ddl: string }>,
) {
  const existingCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName}
  `;
  const existing = new Set(existingCols.map((r) => (r as { column_name: string }).column_name));
  const added: string[] = [];
  for (const col of cols) {
    if (existing.has(col.name)) continue;
    await sql.unsafe(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${col.name} ${col.ddl}`);
    added.push(col.name);
  }
  return added;
}

async function fixKanbanConstraints(sql: ReturnType<typeof getDb>) {
  const fixes: string[] = [];

  // Fix column CHECK constraint — add 'backlog' if missing
  const constraints = await sql`
    SELECT pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'kanban_cards' AND c.conname = 'kanban_cards_column_check'
  `;
  const def: string = (constraints[0] as { def?: string })?.def ?? '';
  if (!def.includes('backlog')) {
    await sql.unsafe(`ALTER TABLE kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_column_check`);
    await sql.unsafe(`ALTER TABLE kanban_cards ADD CONSTRAINT kanban_cards_column_check CHECK ("column" IN ('backlog','todo','in-progress','review','done'))`);
    fixes.push('column_check');
  }

  // Fix assigned_to — drop FK if it exists, change to TEXT if still UUID
  const fkRows = await sql`
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'kanban_cards' AND c.conname = 'kanban_cards_assigned_to_fkey'
  `;
  if (fkRows.length) {
    await sql.unsafe(`ALTER TABLE kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_assigned_to_fkey`);
    fixes.push('assigned_to_fkey_dropped');
  }

  const colType = await sql`
    SELECT data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kanban_cards' AND column_name = 'assigned_to'
  `;
  if (colType[0]?.data_type === 'uuid') {
    await sql.unsafe(`ALTER TABLE kanban_cards ALTER COLUMN assigned_to TYPE TEXT USING (assigned_to::TEXT)`);
    fixes.push('assigned_to_type_text');
  }

  // Make week_end nullable if it isn't already
  const weekEndNullable = await sql`
    SELECT is_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'weekly_plans' AND column_name = 'week_end'
  `;
  if (weekEndNullable[0]?.is_nullable === 'NO') {
    await sql.unsafe(`ALTER TABLE weekly_plans ALTER COLUMN week_end DROP NOT NULL`);
    fixes.push('week_end_nullable');
  }

  return fixes;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sql = getDb();

    const clientAdded    = await ensureColumns(sql, 'clients', REQUIRED_CLIENT_COLUMNS);
    const kanbanAdded    = await ensureColumns(sql, 'kanban_cards', [
      { name: 'category',     ddl: "VARCHAR(100) DEFAULT 'Other'" },
      { name: 'updated_date', ddl: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()' },
    ]);
    const kanbanFixes    = await fixKanbanConstraints(sql);

    return NextResponse.json({ ok: true, clients: clientAdded, kanban: kanbanAdded, kanbanFixes });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('db-init POST:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
