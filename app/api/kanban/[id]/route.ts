import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

let _schemaReady = false;
async function ensureKanbanSchema() {
  if (_schemaReady) return;
  const sql = getDb();
  await sql.query("ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Other'");
  await sql.query('ALTER TABLE kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_assigned_to_fkey');
  await sql.query('ALTER TABLE kanban_cards ALTER COLUMN assigned_to TYPE TEXT USING (assigned_to::TEXT)');
  await sql.query('ALTER TABLE kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_column_check');
  await sql.query(`ALTER TABLE kanban_cards ADD CONSTRAINT kanban_cards_column_check CHECK ("column" IN ('backlog','todo','in-progress','review','done'))`);
  _schemaReady = true;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();

    await ensureKanbanSchema();
    const sql = getDb();

    const clauses: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if ('clientName' in body) {
      const clientRows = await sql`SELECT id FROM clients WHERE name = ${body.clientName} LIMIT 1`;
      clauses.push(`client_id = $${i++}`);
      values.push(clientRows[0]?.id ?? null);
    }
    if ('title'       in body) { clauses.push(`title = $${i++}`);        values.push(body.title); }
    if ('description' in body) { clauses.push(`description = $${i++}`);  values.push(body.description); }
    if ('column'      in body) { clauses.push(`"column" = $${i++}`);     values.push(body.column); }
    if ('priority'    in body) { clauses.push(`priority = $${i++}`);     values.push(body.priority); }
    if ('assignedTo'  in body) { clauses.push(`assigned_to = $${i++}`);  values.push(body.assignedTo); }
    if ('dueDate'     in body) { clauses.push(`due_date = $${i++}`);     values.push(body.dueDate); }
    if ('category'    in body) { clauses.push(`category = $${i++}`);     values.push(body.category); }
    if ('tags'        in body) { clauses.push(`tags = $${i++}`);         values.push(body.tags); }

    if (clauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const rows = await sql.query(
      `UPDATE kanban_cards SET ${clauses.join(', ')} WHERE id = $${i}
       RETURNING *, (SELECT name FROM clients WHERE id = client_id) AS client_name`,
      values
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('kanban PUT:', msg);
    return NextResponse.json({ error: 'Failed to update kanban card', detail: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM kanban_cards WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('kanban DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete kanban card' }, { status: 500 });
  }
}
