import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
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
    const rows = await sql.unsafe(
      `UPDATE kanban_cards SET ${clauses.join(', ')} WHERE id = $${i}
       RETURNING *, (SELECT name FROM clients WHERE id = client_id) AS client_name`,
      values as string[]
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
