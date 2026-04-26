import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const sql = getDb();
    const rows = await sql`SELECT * FROM weekly_plans WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('weekly-plans/[id] GET:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly plan' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const sql = getDb();
    const rows = await sql`
      UPDATE weekly_plans SET
        status       = ${body.status ?? 'in-progress'},
        focus_areas  = ${body.focus_areas ?? null},
        goals        = ${body.goals ?? null},
        deliverables = ${body.deliverables ?? null},
        notes        = ${body.notes ?? null},
        updated_at   = NOW()
      WHERE id = ${id}
      RETURNING *,
        (SELECT name FROM clients WHERE id = client_id) AS client_name
    `;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('weekly-plans/[id] PUT:', error);
    return NextResponse.json({ error: 'Failed to update weekly plan' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM weekly_plans WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('weekly-plans/[id] DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete weekly plan' }, { status: 500 });
  }
}
