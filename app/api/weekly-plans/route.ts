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
        wp.*,
        c.name as client_name
      FROM weekly_plans wp
      LEFT JOIN clients c ON wp.client_id = c.id
      ORDER BY wp.created_at DESC
    `;
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

    // Look up client_id from clientName
    let clientId: string | null = null;
    if (body.clientName) {
      const clientRows = await sql`SELECT id FROM clients WHERE name = ${body.clientName} LIMIT 1`;
      clientId = clientRows[0]?.id ?? null;
    }

    // Accept both camelCase and snake_case keys
    const weekStart = body.week_start || body.weekStart || null;
    // Auto-calculate week_end (start + 6 days) so the NOT NULL constraint is always satisfied
    const weekEnd = body.week_end || body.weekEnd || (() => {
      if (!weekStart) return null;
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 6);
      return d.toISOString().split('T')[0];
    })();

    const rows = await sql`
      INSERT INTO weekly_plans
        (client_id, week_start, week_end, status, focus_areas, goals, deliverables, notes, created_by)
      VALUES
        (${clientId}, ${weekStart}, ${weekEnd},
         ${body.status ?? 'in-progress'},
         ${body.focus_areas ?? null},
         ${body.goals ?? null},
         ${body.deliverables ?? null},
         ${body.notes ?? null},
         ${session.user.id})
      RETURNING *,
        (SELECT name FROM clients WHERE id = client_id) AS client_name
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('weekly-plans POST:', error);
    return NextResponse.json({ error: 'Failed to create weekly plan' }, { status: 500 });
  }
}
