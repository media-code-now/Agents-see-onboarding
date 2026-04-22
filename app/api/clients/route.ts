import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sql = getDb();
    const rows = await sql`SELECT * FROM clients ORDER BY created_date DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('clients GET:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    console.log('POST /api/clients - received body:', body);
    
    const sql = getDb();
    const rows = await sql`
      INSERT INTO clients (
        name, email, phone, website, industry, status, notes, primary_contact, created_by,
        website_cms, website_login_url, website_username, website_password,
        hosting, domain_registrar, google_analytics, search_console,
        google_business_profile, tag_manager, other_tools
      )
      VALUES (
        ${body.name ?? null}, ${body.email ?? null}, ${body.phone ?? null},
        ${body.website ?? null}, ${body.industry ?? null}, ${body.status ?? 'active'},
        ${body.notes ?? null}, ${body.primary_contact ?? null}, ${session.user.id},
        ${body.website_cms ?? null}, ${body.website_login_url ?? null}, ${body.website_username ?? null},
        ${body.website_password ?? null}, ${body.hosting ?? null}, ${body.domain_registrar ?? null},
        ${body.google_analytics ?? null}, ${body.search_console ?? null},
        ${body.google_business_profile ?? null}, ${body.tag_manager ?? null}, ${body.other_tools ?? null}
      )
      RETURNING *
    `;
    console.log('POST /api/clients - created client:', rows[0]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('clients POST:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
