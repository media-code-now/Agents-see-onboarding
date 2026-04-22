import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { Notification } from '@/types/notification';

interface SendEmailsBody {
  notifications: Notification[];
  toEmail: string;
}

// POST /api/notifications/send-emails
// Sends pending notification emails via Resend (if RESEND_API_KEY is set).
// Falls back to a console log stub so the rest of the system works without it.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SendEmailsBody = await request.json();
    const { notifications, toEmail } = body;

    if (!notifications?.length || !toEmail) {
      return NextResponse.json({ error: 'Missing notifications or toEmail' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      // No email service configured — log and return gracefully
      console.log('[Notifications] Email would be sent to', toEmail, 'with', notifications.length, 'notification(s):',
        notifications.map((n) => `[${n.priority.toUpperCase()}] ${n.title}`).join(', '));
      return NextResponse.json({ sent: false, reason: 'RESEND_API_KEY not configured', count: notifications.length });
    }

    // Build a simple digest email
    const criticalCount = notifications.filter((n) => n.priority === 'critical').length;
    const subject = criticalCount > 0
      ? `⚠️ ${criticalCount} critical alert${criticalCount !== 1 ? 's' : ''} — SEO Onboarding`
      : `📋 ${notifications.length} notification${notifications.length !== 1 ? 's' : ''} — SEO Onboarding`;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#111;margin-bottom:4px">SEO Onboarding Alerts</h2>
        <p style="color:#666;font-size:14px;margin-top:0">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
        ${notifications.map((n) => {
          const color = n.priority === 'critical' ? '#ef4444'
            : n.priority === 'high' ? '#f97316'
            : n.priority === 'medium' ? '#eab308'
            : '#3b82f6';
          return `
            <div style="margin-bottom:16px;padding:16px;border-left:4px solid ${color};background:#f9fafb;border-radius:4px">
              <div style="font-weight:600;color:#111;margin-bottom:4px">${n.title}</div>
              <div style="color:#374151;font-size:14px">${n.message}</div>
              ${n.link ? `<a href="${n.link}" style="color:${color};font-size:13px;text-decoration:none;margin-top:8px;display:inline-block">View details →</a>` : ''}
            </div>`;
        }).join('')}
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">
          You received this because email notifications are enabled in your SEO Onboarding settings.
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'SEO Onboarding <notifications@yourdomain.com>',
        to: [toEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Resend] Error sending email:', err);
      return NextResponse.json({ error: 'Email send failed', detail: err }, { status: 502 });
    }

    return NextResponse.json({ sent: true, count: notifications.length });
  } catch (error) {
    console.error('[send-emails] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
