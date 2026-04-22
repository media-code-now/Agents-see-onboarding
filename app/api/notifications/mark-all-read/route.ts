import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sql = getDb();
    await sql`
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE user_id = ${session.user.id} AND is_read = false
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('mark-all-read POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
