import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sql = getDb();
    const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    const rows = unreadOnly
      ? await sql`SELECT * FROM notifications WHERE user_id = ${session.user.id} AND is_read = false ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`SELECT * FROM notifications WHERE user_id = ${session.user.id} ORDER BY created_at DESC LIMIT ${limit}`;

    return NextResponse.json({ notifications: rows });
  } catch (error) {
    console.error('notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_id, type, priority = 'medium', title, message, link, entity_type, entity_id } = await request.json();
    if (!user_id || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      INSERT INTO notifications (user_id, type, priority, title, message, link, entity_type, entity_id)
      VALUES (${user_id}, ${type}, ${priority}, ${title}, ${message}, ${link ?? null}, ${entity_type ?? null}, ${entity_id ?? null})
      RETURNING *
    `;
    return NextResponse.json({ notification: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
