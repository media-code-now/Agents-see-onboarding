import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const sql = getDb();
    const rows = await sql`
      SELECT
        kc.*,
        c.name as client_name
      FROM kanban_cards kc
      LEFT JOIN clients c ON kc.client_id = c.id
      ORDER BY kc.order_index ASC, kc.created_date DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('kanban GET:', error);
    return NextResponse.json({ error: 'Failed to fetch kanban cards' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const sql = getDb();

    // Look up client_id from clientName
    let clientId: string | null = null;
    if (body.clientName) {
      const clientRows = await sql`SELECT id FROM clients WHERE name = ${body.clientName} LIMIT 1`;
      clientId = clientRows[0]?.id ?? null;
    }

    const rows = await sql`
      INSERT INTO kanban_cards
        (client_id, title, description, "column", priority, assigned_to, due_date, category, tags, order_index, created_by)
      VALUES
        (${clientId},
         ${body.title},
         ${body.description ?? null},
         ${body.column ?? 'todo'},
         ${body.priority ?? 'medium'},
         ${body.assignedTo ?? null},
         ${body.dueDate ?? null},
         ${body.category ?? 'Other'},
         ${body.tags ?? null},
         0,
         ${session.user.id})
      RETURNING *,
        (SELECT name FROM clients WHERE id = client_id) AS client_name
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('kanban POST:', error);
    return NextResponse.json({ error: 'Failed to create kanban card' }, { status: 500 });
  }
}
