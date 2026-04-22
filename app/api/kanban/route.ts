import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const sql = getDb();
    const rows = await sql`SELECT * FROM kanban_cards ORDER BY order_index ASC, created_date DESC`;
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
    const rows = await sql`
      INSERT INTO kanban_cards (client_id, title, description, "column", priority, assigned_to, due_date, created_by)
      VALUES (${body.clientId ?? null}, ${body.title}, ${body.description ?? null},
              ${body.column ?? 'todo'}, ${body.priority ?? 'medium'},
              ${body.assignedTo ?? null}, ${body.dueDate ?? null}, ${session.user.id})
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('kanban POST:', error);
    return NextResponse.json({ error: 'Failed to create kanban card' }, { status: 500 });
  }
}
