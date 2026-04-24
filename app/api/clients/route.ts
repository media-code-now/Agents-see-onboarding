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

    const b = await request.json();
    if (!b.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const sql = getDb();
    const rows = await sql`
      INSERT INTO clients (
        name, email, phone, website, industry, business_type, timezone, locations, service_areas,
        notes, primary_contact, created_by,
        website_cms, website_login_url, website_username, website_password,
        hosting, domain_registrar, google_analytics, search_console,
        google_business_profile, tag_manager, google_drive, other_tools,
        main_services, priority_services, main_keywords, secondary_keywords,
        target_locations, competitors, gbp_url, social_links
      )
      VALUES (
        ${b.name}, ${b.email ?? null}, ${b.phone ?? null},
        ${b.website ?? null}, ${b.industry ?? null}, ${b.business_type ?? null},
        ${b.timezone ?? null}, ${b.locations ?? null}, ${b.service_areas ?? null},
        ${b.notes ?? null}, ${b.primary_contact ?? null}, ${session.user.id},
        ${b.website_cms ?? null}, ${b.website_login_url ?? null}, ${b.website_username ?? null}, ${b.website_password ?? null},
        ${b.hosting ?? null}, ${b.domain_registrar ?? null}, ${b.google_analytics ?? null}, ${b.search_console ?? null},
        ${b.google_business_profile ?? null}, ${b.tag_manager ?? null}, ${b.google_drive ?? null}, ${b.other_tools ?? null},
        ${b.main_services ?? null}, ${b.priority_services ?? null}, ${b.main_keywords ?? null}, ${b.secondary_keywords ?? null},
        ${b.target_locations ?? null}, ${b.competitors ?? null}, ${b.gbp_url ?? null}, ${b.social_links ?? null}
      )
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('clients POST:', msg);
    return NextResponse.json({ error: 'Failed to create client', details: msg }, { status: 500 });
  }
}
