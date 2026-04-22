'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleMigrate = async () => {
    setIsLoading(true);
    setStatus('idle');
    
    try {
      // Get data from localStorage
      const localData = localStorage.getItem('seo-onboarding-data');
      
      if (!localData) {
        setStatus('error');
        setMessage('No localStorage data found to migrate');
        setIsLoading(false);
        return;
      }

      const data = JSON.parse(localData);
      let migratedCount = 0;

      // Migrate clients
      if (data.clients && data.clients.length > 0) {
        for (const client of data.clients) {
          const response = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: client.name,
              email: client.email,
              phone: client.phone,
              website: client.website,
              industry: client.industry,
              status: client.status,
              monthly_budget: client.monthlyBudget,
              contract_start: client.contractStart,
              contract_end: client.contractEnd,
              notes: client.notes,
              primary_contact: client.primaryContact,
            }),
          });
          
          if (response.ok) migratedCount++;
        }
      }

      // Migrate weekly plans
      if (data.weeklyPlans && data.weeklyPlans.length > 0) {
        for (const plan of data.weeklyPlans) {
          const response = await fetch('/api/weekly-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: plan.clientId,
              week_start: plan.weekStart,
              week_end: plan.weekEnd,
              status: plan.status,
              focus_areas: plan.focusAreas,
              goals: plan.goals,
              deliverables: plan.deliverables,
              notes: plan.notes,
            }),
          });
          
          if (response.ok) migratedCount++;
        }
      }

      // Migrate security reviews
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

      // Migrate kanban cards
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
      setMessage(`Successfully migrated ${migratedCount} records to Supabase!`);
      
      // Optionally clear localStorage after successful migration
      // localStorage.removeItem('seo-onboarding-data');
      
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
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Upload className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              Data Migration
            </h1>
            <p className="text-gray-400">
              Migrate your localStorage data to Supabase database
            </p>
          </div>

          {status === 'success' && (
            <div className="mb-6 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3">
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
            <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{message}</p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Before you begin:
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Make sure you&apos;ve set up your Supabase project and database</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Verify your environment variables are configured correctly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>You must be signed in to migrate data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>This will NOT delete your localStorage data</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleMigrate}
            disabled={isLoading || status === 'success'}
            className="w-full rounded-2xl bg-blue-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Migrating Data...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Migration Complete
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Start Migration
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
