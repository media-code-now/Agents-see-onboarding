'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import TopBar from '@/components/TopBar';
import Card, { CardBody, CardFooter, CardHeader } from '@/components/Card';
import Modal from '@/components/Modal';
import SearchBar from '@/components/SearchBar';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DateRangeFilter from '@/components/DateRangeFilter';
import { SecurityReview } from '@/types';
import { Plus, Edit, Eye, Trash2, AlertTriangle, Filter, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SecurityPage() {
  const { data, addSecurityReview, updateSecurityReview, deleteSecurityReview } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<SecurityReview | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingReview, setViewingReview] = useState<SecurityReview | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Get unique values for filters
  const clients = useMemo(() => {
    const unique = [...new Set(data.securityReviews.map(r => r.clientName))];
    return unique.map(name => ({ value: name, label: name }));
  }, [data.securityReviews]);

  const riskLevels = useMemo(() => [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
  ], []);

  const statuses = useMemo(() => [
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
  ], []);

  const filteredReviews = useMemo(() => {
    return data.securityReviews.filter((review) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        review.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.securityIssues?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      // Client filter
      const matchesClient = selectedClients.length === 0 ||
        selectedClients.includes(review.clientName);

      // Risk level filter
      const matchesRisk = selectedRiskLevels.length === 0 ||
        selectedRiskLevels.includes(review.riskLevel);

      // Status filter
      const matchesStatus = selectedStatuses.length === 0 ||
        selectedStatuses.includes(review.status);

      // Date range filter
      const reviewDate = review.reviewDate ? new Date(review.reviewDate) : null;
      const matchesStartDate = !startDate || (reviewDate && reviewDate >= new Date(startDate));
      const matchesEndDate = !endDate || (reviewDate && reviewDate <= new Date(endDate));

      return matchesSearch && matchesClient && matchesRisk && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [data.securityReviews, searchTerm, selectedClients, selectedRiskLevels, selectedStatuses, startDate, endDate]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedClients([]);
    setSelectedRiskLevels([]);
    setSelectedStatuses([]);
    setStartDate('');
    setEndDate('');
  };

  const activeFilterCount = 
    (searchTerm ? 1 : 0) +
    selectedClients.length +
    selectedRiskLevels.length +
    selectedStatuses.length +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);

    const reviewData = {
      clientName: formData.get('clientName') as string,
      reviewDate: formData.get('reviewDate') as string,
      riskLevel: formData.get('riskLevel') as SecurityReview['riskLevel'],
      criticalRisks: parseInt(formData.get('criticalRisks') as string) || 0,
      missingAccess: parseInt(formData.get('missingAccess') as string) || 0,
      securityIssues: formData.get('securityIssues') as string,
      requiredFixes: formData.get('requiredFixes') as string,
      recommendations: formData.get('recommendations') as string,
      status: formData.get('status') as SecurityReview['status'],
      notes: formData.get('notes') as string,
    };

    if (editingReview) {
      await updateSecurityReview(editingReview.id, reviewData);
    } else {
      await addSecurityReview(reviewData);
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setEditingReview(null);
  };

  const handleEdit = (review: SecurityReview) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleView = (review: SecurityReview) => {
    setViewingReview(review);
    setViewModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this security review?')) {
      deleteSecurityReview(id);
    }
  };

  const openNewReviewModal = () => {
    setEditingReview(null);
    setIsModalOpen(true);
  };

  const getRiskBadgeColor = (risk: string) => {
    const colors: Record<string, string> = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800',
    };
    return colors[risk] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Resolved': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Security Reviews" />

      <div className="p-10">
        {/* Header Actions */}
        <div className="mb-8 flex flex-col gap-4">
          {/* Top Row: Search and Buttons */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 max-w-xl">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search reviews by client, issues, or notes..."
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
                onClick={openNewReviewModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                New Security Review
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <MultiSelectFilter
                  label="Client"
                  options={clients}
                  selected={selectedClients}
                  onChange={setSelectedClients}
                />
                <MultiSelectFilter
                  label="Risk Level"
                  options={riskLevels}
                  selected={selectedRiskLevels}
                  onChange={setSelectedRiskLevels}
                />
                <MultiSelectFilter
                  label="Status"
                  options={statuses}
                  selected={selectedStatuses}
                  onChange={setSelectedStatuses}
                />
                <DateRangeFilter
                  label="Review Date Range"
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <p className="text-sm text-gray-400">
                  Showing {filteredReviews.length} of {data.securityReviews.length} reviews
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

        {/* Security Reviews Grid */}
        {filteredReviews.length === 0 ? (
          <Card>
            <CardBody>
              <p className="py-12 text-center text-sm text-gray-500">
                {activeFilterCount > 0
                  ? 'No security reviews found matching your filters.'
                  : 'No security reviews yet. Click "New Security Review" to get started!'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{review.clientName}</h3>
                      <p className="mt-1 text-sm text-gray-400">{formatDate(review.reviewDate)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getRiskBadgeColor(review.riskLevel)}`}>
                      {review.riskLevel} Risk
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(review.status)}`}>
                        {review.status}
                      </span>
                    </div>
                    
                    {review.criticalRisks && (
                      <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <p className="font-semibold text-red-400 text-xs">Critical Risks</p>
                        </div>
                        <p className="text-red-300 text-xs line-clamp-2">{review.criticalRisks}</p>
                      </div>
                    )}
                    
                    {review.missingAccess && (
                      <div>
                        <p className="font-semibold text-gray-400">Missing Access</p>
                        <p className="text-gray-300 line-clamp-2">{review.missingAccess}</p>
                      </div>
                    )}
                  </div>
                </CardBody>
                <CardFooter>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(review)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-3 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-white/10"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleView(review)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-3 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-white/10"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
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
          setEditingReview(null);
        }}
        title={editingReview ? 'Edit Security Review' : 'New Security Review'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400">Client Name *</label>
              <input
                type="text"
                name="clientName"
                defaultValue={editingReview?.clientName}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Review Date *</label>
              <input
                type="date"
                name="reviewDate"
                defaultValue={editingReview?.reviewDate}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400">Risk Level *</label>
              <select
                name="riskLevel"
                defaultValue={editingReview?.riskLevel}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Status *</label>
              <select
                name="status"
                defaultValue={editingReview?.status}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Critical Risks</label>
            <textarea
              name="criticalRisks"
              defaultValue={editingReview?.criticalRisks}
              rows={3}
              placeholder="List any critical security risks found..."
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Missing Access</label>
            <textarea
              name="missingAccess"
              defaultValue={editingReview?.missingAccess}
              rows={2}
              placeholder="What access is needed to complete the review?"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Security Issues</label>
            <textarea
              name="securityIssues"
              defaultValue={editingReview?.securityIssues}
              rows={3}
              placeholder="SSL certificates, outdated plugins, vulnerabilities, etc."
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Required Fixes</label>
            <textarea
              name="requiredFixes"
              defaultValue={editingReview?.requiredFixes}
              rows={3}
              placeholder="What needs to be fixed immediately?"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Recommendations</label>
            <textarea
              name="recommendations"
              defaultValue={editingReview?.recommendations}
              rows={3}
              placeholder="Security recommendations and best practices..."
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Additional Notes</label>
            <textarea
              name="notes"
              defaultValue={editingReview?.notes}
              rows={2}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsModalOpen(false);
                setEditingReview(null);
              }}
              className="flex-1 rounded-2xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving…' : (editingReview ? 'Update' : 'Create') + ' Review'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingReview && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setViewingReview(null);
          }}
          title={`Security Review: ${viewingReview.clientName}`}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">{viewingReview.clientName}</h3>
              <p className="text-sm text-gray-400">{formatDate(viewingReview.reviewDate)}</p>
              <div className="mt-2 flex gap-2">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getRiskBadgeColor(viewingReview.riskLevel)}`}>
                  {viewingReview.riskLevel} Risk
                </span>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(viewingReview.status)}`}>
                  {viewingReview.status}
                </span>
              </div>
            </div>

            {viewingReview.criticalRisks && (
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <h4 className="font-semibold text-red-400">Critical Risks</h4>
                </div>
                <p className="text-sm text-white whitespace-pre-wrap rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
                  {viewingReview.criticalRisks}
                </p>
              </div>
            )}

            {viewingReview.missingAccess && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-white">Missing Access</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingReview.missingAccess}</p>
              </div>
            )}

            {viewingReview.securityIssues && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-white">Security Issues</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingReview.securityIssues}</p>
              </div>
            )}

            {viewingReview.requiredFixes && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-white">Required Fixes</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingReview.requiredFixes}</p>
              </div>
            )}

            {viewingReview.recommendations && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-white">Recommendations</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingReview.recommendations}</p>
              </div>
            )}

            {viewingReview.notes && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-semibold text-white">Notes</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingReview.notes}</p>
              </div>
            )}

            <div className="flex gap-3 border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  handleEdit(viewingReview);
                }}
                className="flex-1 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 hover:scale-105"
              >
                Edit Review
              </button>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setViewingReview(null);
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
