import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sql = getDb();
    
    // Create a test notification for the current user
    const userId = session.user.id;
    const rows = await sql`
      INSERT INTO notifications (user_id, type, priority, title, message, entity_type, is_read, is_emailed, created_at)
      VALUES (
        ${userId},
        'general',
        'medium',
        'Test Notification',
        'This is a test notification to verify the notification system is working',
        'system',
        false,
        false,
        NOW()
      )
      RETURNING *
    `;

    console.log('Created test notification:', rows[0]);
    return NextResponse.json({ success: true, notification: rows[0] });
  } catch (error) {
    console.error('test-notification POST:', error);
    return NextResponse.json({ error: 'Failed to create test notification' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sql = getDb();
    
    // Check how many notifications exist for this user
    const rows = await sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${session.user.id}`;
    const count = rows[0]?.count || 0;
    
    return NextResponse.json({ 
      userId: session.user.id,
      userEmail: session.user.email,
      notificationCount: count 
    });
  } catch (error) {
    console.error('test-notification GET:', error);
    return NextResponse.json({ error: 'Failed to check notifications' }, { status: 500 });
  }
}
