import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const sql = getDb();

    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const countRows = await sql`SELECT COUNT(*)::int AS count FROM users`;
    const isMasterAdmin = (countRows[0]?.count ?? 0) === 0;

    const rows = await sql`
      INSERT INTO users (name, email, password, is_master_admin)
      VALUES (${name}, ${email}, ${hashedPassword}, ${isMasterAdmin})
      RETURNING id, name, email, is_master_admin, created_at
    `;
    const newUser = rows[0];

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      isMasterAdmin: newUser.is_master_admin,
      createdAt: newUser.created_at,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
