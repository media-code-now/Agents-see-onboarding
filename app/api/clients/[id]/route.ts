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
    const b = await request.json();
    const sql = getDb();
    const rows = await sql`
      UPDATE clients SET
        name                    = ${b.name ?? null},
        email                   = ${b.email ?? null},
        phone                   = ${b.phone ?? null},
        website                 = ${b.website ?? null},
        industry                = ${b.industry ?? null},
        business_type           = ${b.business_type ?? null},
        timezone                = ${b.timezone ?? null},
        locations               = ${b.locations ?? null},
        service_areas           = ${b.service_areas ?? null},
        notes                   = ${b.notes ?? null},
        primary_contact         = ${b.primary_contact ?? null},
        website_cms             = ${b.website_cms ?? null},
        website_login_url       = ${b.website_login_url ?? null},
        website_username        = ${b.website_username ?? null},
        website_password        = ${b.website_password ?? null},
        hosting                 = ${b.hosting ?? null},
        domain_registrar        = ${b.domain_registrar ?? null},
        google_analytics        = ${b.google_analytics ?? null},
        search_console          = ${b.search_console ?? null},
        google_business_profile = ${b.google_business_profile ?? null},
        tag_manager             = ${b.tag_manager ?? null},
        google_drive            = ${b.google_drive ?? null},
        other_tools             = ${b.other_tools ?? null},
        main_services           = ${b.main_services ?? null},
        priority_services       = ${b.priority_services ?? null},
        main_keywords           = ${b.main_keywords ?? null},
        secondary_keywords      = ${b.secondary_keywords ?? null},
        target_locations        = ${b.target_locations ?? null},
        competitors             = ${b.competitors ?? null},
        gbp_url                 = ${b.gbp_url ?? null},
        social_links            = ${b.social_links ?? null},
        updated_at              = NOW()
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
