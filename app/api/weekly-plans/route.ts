import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const sql = getDb();
    const rows = await sql`SELECT * FROM weekly_plans ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('weekly-plans GET:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly plans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const sql = getDb();
    const rows = await sql`
      INSERT INTO weekly_plans (client_id, week_start, week_end, status, goals, notes, created_by)
      VALUES (${body.clientId ?? null}, ${body.weekStart ?? null}, ${body.weekEnd ?? null},
              ${body.status ?? 'in-progress'}, ${body.goals ?? null}, ${body.notes ?? null}, ${session.user.id})
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('weekly-plans POST:', error);
    return NextResponse.json({ error: 'Failed to create weekly plan' }, { status: 500 });
  }
}
