import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const sql = getDb();
    const rows = await sql`SELECT * FROM security_reviews ORDER BY review_date DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('security-reviews GET:', error);
    return NextResponse.json({ error: 'Failed to fetch security reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const sql = getDb();
    const rows = await sql`
      INSERT INTO security_reviews (client_id, review_date, status, notes, created_by)
      VALUES (${body.clientId ?? null}, ${body.reviewDate ?? null}, ${body.status ?? 'pending'},
              ${body.notes ?? null}, ${session.user.id})
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('security-reviews POST:', error);
    return NextResponse.json({ error: 'Failed to create security review' }, { status: 500 });
  }
}
