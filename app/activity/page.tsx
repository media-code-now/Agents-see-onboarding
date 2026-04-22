'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import TopBar from '@/components/TopBar';
import Card, { CardBody, CardHeader } from '@/components/Card';
import { ActivityLog, ActivityEntityType, ActivityAction } from '@/types';
import { History, ChevronDown, ChevronRight, RotateCcw, Trash2, Filter, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const ACTION_LABELS: Record<ActivityAction, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
};

const ACTION_COLORS: Record<ActivityAction, string> = {
  create: 'bg-green-500/20 text-green-400 border-green-500/30',
  update: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  delete: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const ENTITY_LABELS: Record<ActivityEntityType, string> = {
  client: 'Client',
  weekly_plan: 'Weekly Plan',
  security_review: 'Security Review',
  team_member: 'Team Member',
  kanban_card: 'Kanban Card',
  master_admin: 'Master Admin',
};

const ENTITY_ICONS: Record<ActivityEntityType, string> = {
  client: '👥',
  weekly_plan: '📋',
  security_review: '🔒',
  team_member: '👤',
  kanban_card: '🗂️',
  master_admin: '⭐',
};

function formatFieldName(field: string): string {
  if (field === '_rollback') return 'Rollback';
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (Array.isArray(val)) return val.join(', ') || '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val) || '—';
}

function LogRow({ log, onRollback }: { log: ActivityLog; onRollback: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const canRollback = (log.action === 'update' || log.action === 'delete') && log.snapshot !== null;
  const hasChanges = log.changes.length > 0;

  return (
    <>
      <tr
        className={`border-b border-white/5 transition-colors hover:bg-white/5 ${hasChanges ? 'cursor-pointer' : ''}`}
        onClick={() => hasChanges && setExpanded((v) => !v)}
      >
        <td className="py-4 pl-6 pr-3 text-sm text-gray-400 whitespace-nowrap">
          {new Date(log.timestamp).toLocaleString()}
        </td>
        <td className="px-3 py-4 text-sm text-white font-medium whitespace-nowrap">
          {log.userName ?? log.userEmail ?? <span className="text-gray-500 italic">anonymous</span>}
        </td>
        <td className="px-3 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ACTION_COLORS[log.action]}`}>
            {ACTION_LABELS[log.action]}
          </span>
        </td>
        <td className="px-3 py-4 text-sm text-gray-300 whitespace-nowrap">
          <span className="mr-1.5">{ENTITY_ICONS[log.entityType]}</span>
          {ENTITY_LABELS[log.entityType]}
        </td>
        <td className="px-3 py-4 text-sm text-white max-w-xs truncate">{log.entityName}</td>
        <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
          {hasChanges ? `${log.changes.length} field${log.changes.length !== 1 ? 's' : ''}` : '—'}
        </td>
        <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {canRollback && (
              <button
                onClick={() => onRollback(log.id)}
                title="Rollback to this state"
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/20"
              >
                <RotateCcw className="h-3 w-3" />
                Rollback
              </button>
            )}
            {hasChanges && (
              <button className="text-gray-500 hover:text-white transition-colors" onClick={() => setExpanded((v) => !v)}>
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
          </div>
        </td>
      </tr>

      {expanded && hasChanges && (
        <tr className="border-b border-white/5 bg-white/3">
          <td colSpan={7} className="px-6 py-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Field</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Before</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">After</th>
                  </tr>
                </thead>
                <tbody>
                  {log.changes.map((change, i) => (
                    <tr key={i} className={i < log.changes.length - 1 ? 'border-b border-white/5' : ''}>
                      <td className="px-4 py-2.5 font-medium text-gray-300">{formatFieldName(change.field)}</td>
                      <td className="px-4 py-2.5 text-red-400 max-w-xs truncate">{formatValue(change.oldValue)}</td>
                      <td className="px-4 py-2.5 text-green-400 max-w-xs truncate">{formatValue(change.newValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ActivityPage() {
  const { data, clearActivityLogs, rollbackActivity } = useApp();

  const [filterAction, setFilterAction] = useState<ActivityAction | 'all'>('all');
  const [filterEntity, setFilterEntity] = useState<ActivityEntityType | 'all'>('all');
  const [filterUser, setFilterUser] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    return data.activityLogs.filter((log) => {
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (filterEntity !== 'all' && log.entityType !== filterEntity) return false;
      if (filterUser && !`${log.userName ?? ''} ${log.userEmail ?? ''}`.toLowerCase().includes(filterUser.toLowerCase())) return false;
      if (filterDateFrom && log.timestamp < filterDateFrom) return false;
      if (filterDateTo && log.timestamp > filterDateTo + 'T23:59:59') return false;
      return true;
    });
  }, [data.activityLogs, filterAction, filterEntity, filterUser, filterDateFrom, filterDateTo]);

  const hasActiveFilters = filterAction !== 'all' || filterEntity !== 'all' || filterUser || filterDateFrom || filterDateTo;

  const handleRollback = (logId: string) => {
    const log = data.activityLogs.find((l) => l.id === logId);
    if (!log) return;
    const confirmed = window.confirm(
      `Rollback "${log.entityName}" to its state before this ${log.action}?\n\nThis will overwrite the current data.`
    );
    if (confirmed) {
      const ok = rollbackActivity(logId);
      if (!ok) alert('Rollback failed — no snapshot available for this entry.');
    }
  };

  const handleClear = () => {
    if (confirmClear) {
      clearActivityLogs();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 5000);
    }
  };

  const stats = useMemo(() => ({
    total: data.activityLogs.length,
    creates: data.activityLogs.filter((l) => l.action === 'create').length,
    updates: data.activityLogs.filter((l) => l.action === 'update').length,
    deletes: data.activityLogs.filter((l) => l.action === 'delete').length,
  }), [data.activityLogs]);

  return (
    <div className="min-h-screen">
      <TopBar title="Activity Log" />

      <div className="p-10 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Events', value: stats.total, color: 'text-white' },
            { label: 'Created', value: stats.creates, color: 'text-green-400' },
            { label: 'Updated', value: stats.updates, color: 'text-blue-400' },
            { label: 'Deleted', value: stats.deletes, color: 'text-red-400' },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                {[filterAction !== 'all', filterEntity !== 'all', !!filterUser, !!filterDateFrom, !!filterDateTo].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => { setFilterAction('all'); setFilterEntity('all'); setFilterUser(''); setFilterDateFrom(''); setFilterDateTo(''); }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-all"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}

          <div className="ml-auto">
            <button
              onClick={handleClear}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                confirmClear
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
              }`}
            >
              <Trash2 className="h-4 w-4" />
              {confirmClear ? 'Click again to confirm' : 'Clear log'}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <Card>
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Action</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value as ActivityAction | 'all')}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="all">All actions</option>
                    <option value="create">Created</option>
                    <option value="update">Updated</option>
                    <option value="delete">Deleted</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Entity type</label>
                  <select
                    value={filterEntity}
                    onChange={(e) => setFilterEntity(e.target.value as ActivityEntityType | 'all')}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="all">All types</option>
                    {(Object.keys(ENTITY_LABELS) as ActivityEntityType[]).map((k) => (
                      <option key={k} value={k}>{ENTITY_LABELS[k]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">User</label>
                  <input
                    type="text"
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    placeholder="Name or email…"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">From date</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/20 [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">To date</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/20 [color-scheme:dark]"
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Log table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-bold text-white">
                {filtered.length === data.activityLogs.length
                  ? `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`
                  : `${filtered.length} of ${data.activityLogs.length} events`}
              </h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <History className="mx-auto mb-4 h-10 w-10 text-gray-600" />
                <p className="text-gray-500">
                  {data.activityLogs.length === 0
                    ? 'No activity recorded yet. Actions you take will appear here.'
                    : 'No events match the current filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Time</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Changes</th>
                      <th className="py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log) => (
                      <LogRow key={log.id} log={log} onRollback={handleRollback} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
