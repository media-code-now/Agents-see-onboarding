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
    const rows = await sql`
      UPDATE team_members SET role = ${body.role}, department = ${body.department ?? null},
        permissions = ${JSON.stringify(body.permissions ?? [])},
        clients = ${JSON.stringify(body.clients ?? [])},
        updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('team-members PUT:', error);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM team_members WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('team-members DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
}
