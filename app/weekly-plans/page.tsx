'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import TopBar from '@/components/TopBar';
import Card, { CardBody, CardFooter, CardHeader } from '@/components/Card';
import Modal from '@/components/Modal';
import SearchBar from '@/components/SearchBar';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DateRangeFilter from '@/components/DateRangeFilter';
import { WeeklyPlan } from '@/types';
import { Plus, Edit, Eye, Trash2, Filter, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function WeeklyPlansPage() {
  const { data, addWeeklyPlan, updateWeeklyPlan, deleteWeeklyPlan } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WeeklyPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<WeeklyPlan | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Get unique values for filters
  const clients = useMemo(() => {
    const unique = [...new Set(data.weeklyPlans.map(p => p.clientName))];
    return unique.map(name => ({ value: name, label: name }));
  }, [data.weeklyPlans]);

  const statuses = useMemo(() => [
    { value: 'Stable', label: 'Stable' },
    { value: 'Needs Attention', label: 'Needs Attention' },
    { value: 'Waiting on Client', label: 'Waiting on Client' },
  ], []);

  const filteredPlans = useMemo(() => {
    return data.weeklyPlans.filter((plan) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        plan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.onPageTasks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.contentTasks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.technicalTasks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      // Client filter
      const matchesClient = selectedClients.length === 0 ||
        selectedClients.includes(plan.clientName);

      // Status filter
      const matchesStatus = selectedStatuses.length === 0 ||
        selectedStatuses.includes(plan.status);

      // Date range filter
      const planDate = plan.weekOf ? new Date(plan.weekOf) : null;
      const matchesStartDate = !startDate || (planDate && planDate >= new Date(startDate));
      const matchesEndDate = !endDate || (planDate && planDate <= new Date(endDate));

      return matchesSearch && matchesClient && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [data.weeklyPlans, searchTerm, selectedClients, selectedStatuses, startDate, endDate]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedClients([]);
    setSelectedStatuses([]);
    setStartDate('');
    setEndDate('');
  };

  const activeFilterCount = 
    (searchTerm ? 1 : 0) +
    selectedClients.length +
    selectedStatuses.length +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const onPageTasks = formData.get('onPageTasks') as string;
    const contentTasks = formData.get('contentTasks') as string;
    const technicalTasks = formData.get('technicalTasks') as string;
    const blockedItemsStr = formData.get('blockedItems') as string;
    const planData: Omit<WeeklyPlan, 'id'> = {
      clientName: formData.get('clientName') as string,
      weekOf: formData.get('weekOf') as string,
      status: formData.get('status') as WeeklyPlan['status'],
      mainFocus: editingPlan?.mainFocus ?? [],
      onPageTasks,
      contentTasks,
      technicalTasks,
      blockedItems: blockedItemsStr ? Number(blockedItemsStr) : 0,
      clientFollowup: formData.get('clientFollowUp') as string,
      notes: formData.get('notes') as string,
      totalTasks: editingPlan?.totalTasks ?? 0,
    };

    if (editingPlan) {
      updateWeeklyPlan(editingPlan.id, planData);
    } else {
      addWeeklyPlan(planData);
    }

    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleEdit = (plan: WeeklyPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleView = (plan: WeeklyPlan) => {
    setViewingPlan(plan);
    setViewModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this weekly plan?')) {
      deleteWeeklyPlan(id);
    }
  };

  const openNewPlanModal = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'Stable': 'bg-green-100 text-green-800',
      'Needs Attention': 'bg-yellow-100 text-yellow-800',
      'Waiting on Client': 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Weekly Plans" />

      <div className="p-10">
        {/* Header Actions */}
        <div className="mb-8 flex flex-col gap-4">
          {/* Top Row: Search and Buttons */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 max-w-xl">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search plans by client, tasks, or notes..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 relative"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={openNewPlanModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                New Weekly Plan
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <MultiSelectFilter
                  label="Client"
                  options={clients}
                  selected={selectedClients}
                  onChange={setSelectedClients}
                />
                <MultiSelectFilter
                  label="Status"
                  options={statuses}
                  selected={selectedStatuses}
                  onChange={setSelectedStatuses}
                />
                <DateRangeFilter
                  label="Week Of Date Range"
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <p className="text-sm text-gray-400">
                  Showing {filteredPlans.length} of {data.weeklyPlans.length} plans
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Weekly Plans Grid */}
        {filteredPlans.length === 0 ? (
          <Card>
            <CardBody>
              <p className="py-12 text-center text-sm text-gray-500">
                {activeFilterCount > 0
                  ? 'No weekly plans found matching your filters.'
                  : 'No weekly plans yet. Click "New Weekly Plan" to get started!'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{plan.clientName}</h3>
                      <p className="mt-1 text-sm text-gray-400">Week of {formatDate(plan.weekOf)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(plan.status)}`}>
                      {plan.status}
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3 text-sm">
                    {plan.onPageTasks && (
                      <div>
                        <p className="font-semibold text-gray-400">On-Page</p>
                        <p className="text-gray-300 line-clamp-2">{plan.onPageTasks}</p>
                      </div>
                    )}
                    {plan.contentTasks && (
                      <div>
                        <p className="font-semibold text-gray-400">Content</p>
                        <p className="text-gray-300 line-clamp-2">{plan.contentTasks}</p>
                      </div>
                    )}
                    {plan.blockedItems && (
                      <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3">
                        <p className="font-semibold text-red-400 text-xs">⚠️ Blocked</p>
                        <p className="text-red-300 text-xs line-clamp-1">{plan.blockedItems}</p>
                      </div>
                    )}
                  </div>
                </CardBody>
                <CardFooter>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-3 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-white/10"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleView(plan)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-3 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-white/10"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="inline-flex items-center justify-center rounded-2xl border border-red-500/50 px-3 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlan(null);
        }}
        title={editingPlan ? 'Edit Weekly Plan' : 'New Weekly Plan'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400">Client Name *</label>
              <input
                type="text"
                name="clientName"
                defaultValue={editingPlan?.clientName}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Week Of *</label>
              <input
                type="date"
                name="weekOf"
                defaultValue={editingPlan?.weekOf}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Status *</label>
            <select
              name="status"
              defaultValue={editingPlan?.status}
              required
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Stable">Stable</option>
              <option value="Needs Attention">Needs Attention</option>
              <option value="Waiting on Client">Waiting on Client</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">On-Page Tasks</label>
            <textarea
              name="onPageTasks"
              defaultValue={editingPlan?.onPageTasks}
              rows={3}
              placeholder="Meta tags, headings, internal linking, etc."
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Content Tasks</label>
            <textarea
              name="contentTasks"
              defaultValue={editingPlan?.contentTasks}
              rows={3}
              placeholder="Blog posts, page content, updates, etc."
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Technical Tasks</label>
            <textarea
              name="technicalTasks"
              defaultValue={editingPlan?.technicalTasks}
              rows={3}
              placeholder="Schema markup, site speed, technical fixes, etc."
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Blocked Items</label>
            <textarea
              name="blockedItems"
              defaultValue={editingPlan?.blockedItems}
              rows={2}
              placeholder="What's preventing progress?"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Client Follow-Up Needed</label>
            <textarea
              name="clientFollowUp"
              defaultValue={editingPlan?.clientFollowup}
              rows={2}
              placeholder="What do you need from the client?"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Additional Notes</label>
            <textarea
              name="notes"
              defaultValue={editingPlan?.notes}
              rows={2}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingPlan(null);
              }}
              className="flex-1 rounded-2xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 hover:scale-105"
            >
              {editingPlan ? 'Update' : 'Create'} Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingPlan && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setViewingPlan(null);
          }}
          title={`Weekly Plan: ${viewingPlan.clientName}`}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">{viewingPlan.clientName}</h3>
              <p className="text-sm text-gray-400">Week of {formatDate(viewingPlan.weekOf)}</p>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(viewingPlan.status)}`}>
                {viewingPlan.status}
              </span>
            </div>

            {viewingPlan.onPageTasks && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-white">On-Page Tasks</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingPlan.onPageTasks}</p>
              </div>
            )}

            {viewingPlan.contentTasks && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-white">Content Tasks</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingPlan.contentTasks}</p>
              </div>
            )}

            {viewingPlan.technicalTasks && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-white">Technical Tasks</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingPlan.technicalTasks}</p>
              </div>
            )}

            {viewingPlan.blockedItems && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-red-400">⚠️ Blocked Items</h4>
                <p className="text-sm text-white whitespace-pre-wrap rounded-2xl bg-red-500/10 border border-red-500/20 p-4">{viewingPlan.blockedItems}</p>
              </div>
            )}

            {viewingPlan.clientFollowup && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-white">Client Follow-Up</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingPlan.clientFollowup}</p>
              </div>
            )}

            {viewingPlan.notes && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-white">Notes</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingPlan.notes}</p>
              </div>
            )}

            <div className="flex gap-3 border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  handleEdit(viewingPlan);
                }}
                className="flex-1 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 hover:scale-105"
              >
                Edit Plan
              </button>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setViewingPlan(null);
                }}
                className="flex-1 rounded-2xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
