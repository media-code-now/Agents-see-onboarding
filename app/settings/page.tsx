'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import TopBar from '@/components/TopBar';
import Card, { CardBody, CardHeader } from '@/components/Card';
import { Shield, Plus, Trash2, Crown, Bell, Mail, Send, CheckCircle } from 'lucide-react';

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-blue-500' : 'bg-white/10'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const {
    data,
    currentUser,
    isMasterAdmin,
    addMasterAdmin,
    removeMasterAdmin,
    updateNotificationPrefs,
    sendEmailNotifications,
    runNotificationCheck,
  } = useApp();

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const prefs = data.notificationPrefs;

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminEmail && isMasterAdmin) {
      addMasterAdmin(newAdminEmail);
      setNewAdminEmail('');
    }
  };

  const handleRemoveAdmin = (email: string) => {
    if (confirm(`Remove master admin access for ${email}?`)) {
      removeMasterAdmin(email);
    }
  };

  const handleTestEmail = async () => {
    setEmailTestStatus('sending');
    try {
      await sendEmailNotifications();
      setEmailTestStatus('sent');
      setTimeout(() => setEmailTestStatus('idle'), 3000);
    } catch {
      setEmailTestStatus('error');
      setTimeout(() => setEmailTestStatus('idle'), 3000);
    }
  };

  if (!currentUser || !isMasterAdmin) {
    return (
      <div className="min-h-screen">
        <TopBar title="Settings" />
        <div className="p-10">
          <Card>
            <CardBody>
              <div className="flex flex-col items-center justify-center py-12">
                <Shield className="mb-4 h-16 w-16 text-gray-500" />
                <h3 className="mb-2 text-xl font-semibold text-white">Access Denied</h3>
                <p className="text-sm text-gray-400">You need master admin privileges to access settings.</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar title="Settings" />

      <div className="space-y-6 p-10">

        {/* ── Master Admins ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Master Administrators</h2>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Master admins have full access to all features including team management.
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <form onSubmit={handleAddAdmin} className="flex gap-3">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white backdrop-blur-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  Add Admin
                </button>
              </form>

              <div className="mt-6 space-y-2">
                <h3 className="mb-3 text-sm font-semibold text-gray-400">Current Master Admins</h3>
                {data.masterAdmins.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    No master admins configured. Add yourself to get started!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.masterAdmins.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Crown className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm text-white">{email}</span>
                          {currentUser.email === email && (
                            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">You</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveAdmin(email)}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!data.masterAdmins.includes(currentUser.email) && (
                <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="mb-3 text-sm text-blue-300">
                    You&apos;re logged in as <strong>{currentUser.email}</strong> but don&apos;t have master admin access yet.
                  </p>
                  <button
                    onClick={() => addMasterAdmin(currentUser.email)}
                    className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-600"
                  >
                    Grant Master Admin Access to Myself
                  </button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* ── Notification Preferences ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Choose which events trigger in-app alerts.
            </p>
          </CardHeader>
          <CardBody>
            <div className="divide-y divide-white/5">
              <Toggle
                checked={prefs.notify_overdue_tasks}
                onChange={(v) => updateNotificationPrefs({ notify_overdue_tasks: v })}
                label="Overdue tasks"
                description="Alert when a Kanban card passes its due date without being completed"
              />
              <Toggle
                checked={prefs.notify_due_soon}
                onChange={(v) => updateNotificationPrefs({ notify_due_soon: v })}
                label="Due-soon reminders"
                description={`Alert when a task is due within ${prefs.due_soon_days} day${prefs.due_soon_days !== 1 ? 's' : ''}`}
              />
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Due-soon window</p>
                  <p className="mt-0.5 text-xs text-gray-500">How many days ahead counts as "due soon"</p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={prefs.due_soon_days}
                  onChange={(e) => updateNotificationPrefs({ due_soon_days: Number(e.target.value) })}
                  className="w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-center text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <Toggle
                checked={prefs.notify_high_priority}
                onChange={(v) => updateNotificationPrefs({ notify_high_priority: v })}
                label="High-priority tasks"
                description="Alert for active high-priority Kanban cards not yet done"
              />
              <Toggle
                checked={prefs.notify_security_issues}
                onChange={(v) => updateNotificationPrefs({ notify_security_issues: v })}
                label="Security issues"
                description="Alert for unresolved High-risk or pending Medium-risk security reviews"
              />
              <Toggle
                checked={prefs.notify_client_followups}
                onChange={(v) => updateNotificationPrefs({ notify_client_followups: v })}
                label="Client follow-ups"
                description="Alert when a weekly plan has client follow-up notes"
              />
              <Toggle
                checked={prefs.notify_weekly_plans}
                onChange={(v) => updateNotificationPrefs({ notify_weekly_plans: v })}
                label="Weekly plan status"
                description='Alert for plans marked "Needs Attention" or "Waiting on Client"'
              />
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={runNotificationCheck}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20"
              >
                <CheckCircle className="h-4 w-4 text-green-400" />
                Run check now
              </button>
            </div>
          </CardBody>
        </Card>

        {/* ── Email Notifications ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Email Notifications</h2>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Send alert digests to an email address. Requires <code className="rounded bg-white/10 px-1 py-0.5 text-xs">RESEND_API_KEY</code> in your environment.
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-5">
              <Toggle
                checked={prefs.email_enabled}
                onChange={(v) => updateNotificationPrefs({ email_enabled: v })}
                label="Enable email notifications"
                description="Send unread alerts to the address below"
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Recipient email
                </label>
                <input
                  type="email"
                  value={prefs.email_address}
                  onChange={(e) => updateNotificationPrefs({ email_address: e.target.value })}
                  placeholder={currentUser.email}
                  disabled={!prefs.email_enabled}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 backdrop-blur-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Send frequency
                </label>
                <select
                  value={prefs.email_frequency}
                  onChange={(e) =>
                    updateNotificationPrefs({ email_frequency: e.target.value as 'immediate' | 'daily' | 'weekly' })
                  }
                  disabled={!prefs.email_enabled}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white backdrop-blur-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
                >
                  <option value="immediate">Immediate (on next check)</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleTestEmail}
                  disabled={!prefs.email_enabled || !prefs.email_address || emailTestStatus === 'sending'}
                  className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 border border-purple-500/30 px-5 py-2.5 text-sm font-semibold text-purple-300 transition-all hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  {emailTestStatus === 'sending' ? 'Sending…' : emailTestStatus === 'sent' ? 'Sent!' : 'Send pending alerts now'}
                </button>
                {emailTestStatus === 'sent' && (
                  <span className="text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Emails dispatched
                  </span>
                )}
                {emailTestStatus === 'error' && (
                  <span className="text-sm text-red-400">Failed — check console</span>
                )}
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300 space-y-1">
                <p className="font-semibold">Setup required for email sending:</p>
                <p>1. Add <code className="bg-black/30 px-1 rounded">RESEND_API_KEY=re_...</code> to your <code className="bg-black/30 px-1 rounded">.env.local</code></p>
                <p>2. Optionally set <code className="bg-black/30 px-1 rounded">EMAIL_FROM=you@yourdomain.com</code></p>
                <p>Without this, alerts are logged to the server console only.</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ── About Admin Access ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">About Master Admin Access</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 text-sm text-gray-300">
              <p>
                <strong className="text-white">Master Admins</strong> have unrestricted access to all system features:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-1">
                <li>View and manage the Team Access tab</li>
                <li>Add, edit, and remove team members</li>
                <li>Grant or revoke master admin access</li>
                <li>Full access to all clients, plans, and security reviews</li>
                <li>Export and import system data</li>
              </ul>
              <p className="mt-4 text-gray-400">
                Regular users can access all features except Team Access management. Only master admins can see and modify team member information.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
