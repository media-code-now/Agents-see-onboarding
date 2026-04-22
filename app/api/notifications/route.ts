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

    console.log('GET /api/notifications - userId:', session.user.id, 'unreadOnly:', unreadOnly, 'limit:', limit);

    const rows = unreadOnly
      ? await sql`SELECT * FROM notifications WHERE user_id = ${session.user.id} AND is_read = false ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`SELECT * FROM notifications WHERE user_id = ${session.user.id} ORDER BY created_at DESC LIMIT ${limit}`;

    console.log('GET /api/notifications - returned', rows.length, 'notifications');

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

    const { user_id, type, priority = 'medium', title, message, link, entity_type, entity_id, broadcast = false } = await request.json();
    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = getDb();
    
    // If broadcast is true, create notification for all users; otherwise just the specified user
    if (broadcast) {
      // Get all user IDs
      const allUsers = await sql`SELECT id FROM users WHERE is_master_admin = false`;
      
      if (allUsers.length === 0) {
        return NextResponse.json({ notification: null, message: 'No users to notify' }, { status: 201 });
      }
      
      // Create notification for each user
      const rows = await Promise.all(
        allUsers.map(user => 
          sql`
            INSERT INTO notifications (user_id, type, priority, title, message, link, entity_type, entity_id)
            VALUES (${user.id}, ${type}, ${priority}, ${title}, ${message}, ${link ?? null}, ${entity_type ?? null}, ${entity_id ?? null})
            RETURNING *
          `
        )
      );
      
      return NextResponse.json({ notifications: rows.flat(), broadcast: true, user_count: allUsers.length }, { status: 201 });
    } else {
      // Single user notification
      if (!user_id) {
        return NextResponse.json({ error: 'user_id required when broadcast is false' }, { status: 400 });
      }
      
      const rows = await sql`
        INSERT INTO notifications (user_id, type, priority, title, message, link, entity_type, entity_id)
        VALUES (${user_id}, ${type}, ${priority}, ${title}, ${message}, ${link ?? null}, ${entity_type ?? null}, ${entity_id ?? null})
        RETURNING *
      `;
      return NextResponse.json({ notification: rows[0] }, { status: 201 });
    }
  } catch (error) {
    console.error('notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
