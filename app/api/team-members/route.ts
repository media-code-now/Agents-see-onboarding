import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const sql = getDb();
    const rows = await sql`SELECT * FROM team_members ORDER BY date_added DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('team-members GET:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const sql = getDb();

    // If password is provided, create a new user account
    let userId = body.userId;
    
    if (body.email && body.password) {
      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);
      
      // Create user in users table
      try {
        const userResult = await sql`
          INSERT INTO users (email, password, name, is_master_admin)
          VALUES (${body.email}, ${hashedPassword}, ${body.name}, false)
          RETURNING id
        `;
        userId = userResult[0].id;
      } catch (userError: any) {
        if (userError.message?.includes('duplicate key')) {
          return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }
        throw userError;
      }
    }

    // Create team member record
    const rows = await sql`
      INSERT INTO team_members (user_id, role, department, permissions, clients, added_by)
      VALUES (${userId ?? null}, ${body.role}, ${body.department ?? null},
              ${JSON.stringify(body.permissions ?? [])},
              ${JSON.stringify(body.clients ?? [])},
              ${session.user.id})
      RETURNING *
    `;
    
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('team-members POST:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
