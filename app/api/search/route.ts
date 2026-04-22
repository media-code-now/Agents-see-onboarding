import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const q = request.nextUrl.searchParams.get('q') ?? '';
    if (!q.trim()) return NextResponse.json({ clients: [], weeklyPlans: [], securityReviews: [] });

    const pattern = `%${q}%`;
    const sql = getDb();
    const [clients, plans, reviews] = await Promise.all([
      sql`SELECT id, name, email, website, industry FROM clients WHERE name ILIKE ${pattern} OR industry ILIKE ${pattern} LIMIT 10`,
      sql`SELECT id, status, week_start, week_end FROM weekly_plans LIMIT 5`,
      sql`SELECT id, status, review_date FROM security_reviews WHERE status ILIKE ${pattern} LIMIT 5`,
    ]);

    return NextResponse.json({ clients, weeklyPlans: plans, securityReviews: reviews });
  } catch (error) {
    console.error('search GET:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
