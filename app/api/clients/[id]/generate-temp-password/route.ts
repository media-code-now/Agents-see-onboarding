import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

// Generate a random temporary password
function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const sql = getDb();

    // Get the client
    const client = await sql`SELECT * FROM clients WHERE id = ${id}`;
    if (!client.length) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Update client with new temporary password
    const updated = await sql`
      UPDATE clients
      SET client_password_temp = ${tempPassword}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, client_email, client_password_temp
    `;

    return NextResponse.json({
      message: 'Temporary password generated',
      tempPassword,
      client: updated[0],
    });
  } catch (error) {
    console.error('generate-temp-password error:', error);
    return NextResponse.json({ error: 'Failed to generate password' }, { status: 500 });
  }
}
