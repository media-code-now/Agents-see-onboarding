'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaStatus, setSchemaStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [schemaMessage, setSchemaMessage] = useState('');

  const router = useRouter();

  const handleRunSchemaMigrations = async () => {
    setSchemaLoading(true);
    setSchemaStatus('idle');
    try {
      const res = await fetch('/api/run-all-migrations', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Migration failed');
      const count = data.results?.length ?? 0;
      setSchemaStatus('success');
      setSchemaMessage(`Schema up to date — ${count} migration file(s) applied.`);
    } catch (err) {
      setSchemaStatus('error');
      setSchemaMessage(err instanceof Error ? err.message : 'Schema migration failed');
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleMigrate = async () => {
    setIsLoading(true);
    setStatus('idle');

    try {
      const localData = localStorage.getItem('seo-onboarding-data');

      if (!localData) {
        setStatus('error');
        setMessage('No localStorage data found to migrate');
        setIsLoading(false);
        return;
      }

      const data = JSON.parse(localData);
      let migratedCount = 0;

      if (data.clients && data.clients.length > 0) {
        for (const client of data.clients) {
          const response = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: client.businessName || client.name,
              email: client.mainContact?.email || client.email,
              phone: client.mainContact?.phone || client.phone,
              primary_contact: client.mainContact?.name || client.primaryContact,
              website: client.website,
              industry: client.industry,
              business_type: client.businessType,
              timezone: client.timezone,
              locations: client.locations,
              service_areas: client.serviceAreas,
              notes: client.notes,
              website_cms: client.websiteCMS,
              website_login_url: client.websiteLoginURL,
              website_username: client.websiteUsername,
              website_password: client.websitePassword,
              hosting: client.hosting,
              domain_registrar: client.domainRegistrar,
              google_analytics: client.googleAnalytics,
              search_console: client.searchConsole,
              google_business_profile: client.googleBusinessProfile,
              tag_manager: client.tagManager,
              google_drive: client.googleDrive,
              other_tools: client.otherTools,
              main_services: client.mainServices,
              priority_services: client.priorityServices,
              main_keywords: client.mainKeywords,
              secondary_keywords: client.secondaryKeywords,
              target_locations: client.targetLocations,
              competitors: client.competitors,
              gbp_url: client.gbpURL,
              social_links: client.socialLinks,
            }),
          });
          if (response.ok) migratedCount++;
        }
      }

      if (data.weeklyPlans && data.weeklyPlans.length > 0) {
        for (const plan of data.weeklyPlans) {
          const response = await fetch('/api/weekly-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: plan.clientId,
              week_start: plan.weekStart || plan.weekOf,
              week_end: plan.weekEnd,
              status: plan.status,
              focus_areas: plan.mainFocus || plan.focusAreas,
              goals: plan.goals,
              deliverables: plan.deliverables,
              notes: plan.notes,
            }),
          });
          if (response.ok) migratedCount++;
        }
      }

      if (data.securityReviews && data.securityReviews.length > 0) {
        for (const review of data.securityReviews) {
          const response = await fetch('/api/security-reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: review.clientId,
              review_date: review.reviewDate,
              status: review.status,
              access_type: review.accessType,
              platform: review.platform,
              credentials_status: review.credentialsStatus,
              two_factor_enabled: review.twoFactorEnabled,
              last_password_change: review.lastPasswordChange,
              access_level: review.accessLevel,
              notes: review.notes,
              next_review_date: review.nextReviewDate,
            }),
          });
          if (response.ok) migratedCount++;
        }
      }

      if (data.kanbanCards && data.kanbanCards.length > 0) {
        for (const card of data.kanbanCards) {
          const response = await fetch('/api/kanban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: card.clientId,
              title: card.title,
              description: card.description,
              column: card.column,
              priority: card.priority,
              assigned_to: card.assignedTo,
              due_date: card.dueDate,
              tags: card.tags,
              order_index: card.orderIndex,
            }),
          });
          if (response.ok) migratedCount++;
        }
      }

      setStatus('success');
      setMessage(`Successfully migrated ${migratedCount} records to Neon!`);
    } catch (error) {
      setStatus('error');
      setMessage('Migration failed. Please try again or contact support.');
      console.error('Migration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Schema Migrations */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <Database className="h-12 w-12 text-purple-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-1">Step 1 — Schema Migrations</h2>
            <p className="text-gray-400 text-sm">Applies all pending SQL migrations to your Neon database</p>
          </div>

          {schemaStatus === 'success' && (
            <div className="mb-4 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-300">{schemaMessage}</p>
            </div>
          )}
          {schemaStatus === 'error' && (
            <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{schemaMessage}</p>
            </div>
          )}

          <button
            onClick={handleRunSchemaMigrations}
            disabled={schemaLoading || schemaStatus === 'success'}
            className="w-full rounded-2xl bg-purple-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {schemaLoading ? (
              <><Loader2 className="h-5 w-5 animate-spin" />Running Migrations...</>
            ) : schemaStatus === 'success' ? (
              <><CheckCircle className="h-5 w-5" />Schema Up to Date</>
            ) : (
              <><Database className="h-5 w-5" />Run Schema Migrations</>
            )}
          </button>
        </div>

        {/* Data Migration */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <Upload className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-1">Step 2 — Data Migration</h2>
            <p className="text-gray-400 text-sm">Move localStorage data into your Neon database</p>
          </div>

          {status === 'success' && (
            <div className="mb-4 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-300">{message}</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-3 text-sm font-medium text-green-400 hover:text-green-300 underline"
                >
                  Go to Dashboard →
                </button>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{message}</p>
            </div>
          )}

          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 mb-6 text-sm text-gray-300 space-y-1">
            <p className="text-white font-medium mb-2">Before you begin:</p>
            <p>• Run Step 1 first to ensure the schema is up to date</p>
            <p>• Your Neon <code className="text-blue-300">DATABASE_URL</code> must be set</p>
            <p>• LocalStorage data is <strong>not</strong> deleted after migration</p>
          </div>

          <button
            onClick={handleMigrate}
            disabled={isLoading || status === 'success'}
            className="w-full rounded-2xl bg-blue-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <><Loader2 className="h-5 w-5 animate-spin" />Migrating Data...</>
            ) : status === 'success' ? (
              <><CheckCircle className="h-5 w-5" />Migration Complete</>
            ) : (
              <><Upload className="h-5 w-5" />Start Data Migration</>
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
