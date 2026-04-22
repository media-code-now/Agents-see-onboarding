import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const sql = getDb();
    const rows = await sql`SELECT * FROM clients WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('clients/[id] GET:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const sql = getDb();
    const rows = await sql`
      UPDATE clients SET
        name = ${body.name ?? null},
        email = ${body.email ?? null},
        phone = ${body.phone ?? null},
        website = ${body.website ?? null},
        industry = ${body.industry ?? null},
        status = ${body.status ?? 'active'},
        notes = ${body.notes ?? null},
        website_cms = ${body.websiteCMS ?? null},
        website_login_url = ${body.websiteLoginURL ?? null},
        website_username = ${body.websiteUsername ?? null},
        website_password = ${body.websitePassword ?? null},
        hosting = ${body.hosting ?? null},
        domain_registrar = ${body.domainRegistrar ?? null},
        google_analytics = ${body.googleAnalytics ?? null},
        search_console = ${body.searchConsole ?? null},
        google_business_profile = ${body.googleBusinessProfile ?? null},
        tag_manager = ${body.tagManager ?? null},
        other_tools = ${body.otherTools ?? null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('clients/[id] PUT:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM clients WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('clients/[id] DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
