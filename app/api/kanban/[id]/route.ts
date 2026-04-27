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

    // Look up client_id from clientName if provided
    let clientId: string | null = null;
    if (body.clientName) {
      const clientRows = await sql`SELECT id FROM clients WHERE name = ${body.clientName} LIMIT 1`;
      clientId = clientRows[0]?.id ?? null;
    }

    const rows = await sql`
      UPDATE kanban_cards SET
        client_id   = COALESCE(${clientId}, client_id),
        title       = COALESCE(${body.title ?? null}, title),
        description = ${body.description ?? null},
        "column"    = COALESCE(${body.column ?? null}, "column"),
        priority    = COALESCE(${body.priority ?? null}, priority),
        assigned_to = ${body.assignedTo ?? null},
        due_date    = ${body.dueDate ?? null},
        category    = COALESCE(${body.category ?? null}, category),
        tags        = ${body.tags ?? null}
      WHERE id = ${id}
      RETURNING *,
        (SELECT name FROM clients WHERE id = client_id) AS client_name
    `;
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
