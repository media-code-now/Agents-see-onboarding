'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import TopBar from '@/components/TopBar';
import Card, { CardBody, CardFooter, CardHeader } from '@/components/Card';
import Modal from '@/components/Modal';
import SearchBar from '@/components/SearchBar';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DateRangeFilter from '@/components/DateRangeFilter';
import { Client } from '@/types';
import { Plus, Edit, Eye, Trash2, KanbanSquare, Filter, X, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ClientsPage() {
  const router = useRouter();
  const { data, addClient, updateClient, deleteClient } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);
  
  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Get unique values for filters
  const industries = useMemo(() => {
    const unique = [...new Set(data.clients.map(c => c.industry).filter(Boolean))];
    return unique.map(ind => ({ value: ind, label: ind }));
  }, [data.clients]);

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'paused', label: 'Paused' },
  ];

  const filteredClients = useMemo(() => {
    return data.clients.filter((client) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.mainContact?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = selectedStatuses.length === 0 ||
        (client.businessType && selectedStatuses.includes(client.businessType));

      // Industry filter
      const matchesIndustry = selectedIndustries.length === 0 ||
        selectedIndustries.includes(client.industry);

      // Date range filter
      const clientDate = new Date(client.createdDate);
      const matchesStartDate = !startDate || clientDate >= new Date(startDate);
      const matchesEndDate = !endDate || clientDate <= new Date(endDate);

      return matchesSearch && matchesStatus && matchesIndustry && matchesStartDate && matchesEndDate;
    });
  }, [data.clients, searchTerm, selectedStatuses, selectedIndustries, startDate, endDate]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedStatuses([]);
    setSelectedIndustries([]);
    setStartDate('');
    setEndDate('');
  };

  const activeFilterCount = 
    (searchTerm ? 1 : 0) +
    selectedStatuses.length +
    selectedIndustries.length +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const clientData = {
      businessName: formData.get('businessName') as string,
      website: formData.get('website') as string,
      industry: formData.get('industry') as string,
      businessType: formData.get('businessType') as string,
      timezone: formData.get('timezone') as string,
      locations: formData.get('locations') as string,
      serviceAreas: formData.get('serviceAreas') as string,
      mainContact: {
        name: formData.get('contactName') as string,
        email: formData.get('contactEmail') as string,
        phone: formData.get('contactPhone') as string,
      },
      // Access & Logins
      websiteCMS: formData.get('websiteCMS') as string,
      websiteLoginURL: formData.get('websiteLoginURL') as string,
      websiteUsername: formData.get('websiteUsername') as string,
      websitePassword: formData.get('websitePassword') as string,
      hosting: formData.get('hosting') as string,
      domainRegistrar: formData.get('domainRegistrar') as string,
      googleAnalytics: formData.get('googleAnalytics') as string,
      searchConsole: formData.get('searchConsole') as string,
      googleBusinessProfile: formData.get('googleBusinessProfile') as string,
      tagManager: formData.get('tagManager') as string,
      googleDrive: formData.get('googleDrive') as string,
      otherTools: formData.get('otherTools') as string,
      // Services & SEO Basics
      mainServices: formData.get('mainServices') as string,
      priorityServices: formData.get('priorityServices') as string,
      mainKeywords: formData.get('mainKeywords') as string,
      secondaryKeywords: formData.get('secondaryKeywords') as string,
      targetLocations: formData.get('targetLocations') as string,
      competitors: formData.get('competitors') as string,
      gbpURL: formData.get('gbpURL') as string,
      socialLinks: formData.get('socialLinks') as string,
      notes: formData.get('notes') as string,
    };

    if (editingClient) {
      updateClient(editingClient.id, clientData);
    } else {
      addClient(clientData);
    }

    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleView = (client: Client) => {
    setViewingClient(client);
    setViewModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient(id);
    }
  };

  const openNewClientModal = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Clients" />

      <div className="p-10">
        {/* Header Actions */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-xl">
              <SearchBar
                placeholder="Search clients by name, industry, website..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={openNewClientModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 hover:scale-105 shadow-lg shadow-blue-500/20"
              >
                <Plus className="h-4 w-4" />
                New Client
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Advanced Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear all
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MultiSelectFilter
                  label="Status"
                  options={statuses}
                  selected={selectedStatuses}
                  onChange={setSelectedStatuses}
                  placeholder="All statuses"
                />
                
                <MultiSelectFilter
                  label="Industry"
                  options={industries}
                  selected={selectedIndustries}
                  onChange={setSelectedIndustries}
                  placeholder="All industries"
                />
                
                <DateRangeFilter
                  label="Created Date"
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-400">
              Showing <span className="font-semibold text-white">{filteredClients.length}</span> of <span className="font-semibold text-white">{data.clients.length}</span> clients
            </p>
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <Card>
            <CardBody>
              <p className="py-8 text-center text-gray-400">
                {searchTerm || activeFilterCount > 0 ? 'No clients found matching your filters.' : 'No clients yet. Click "New Client" to get started!'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{client.businessName}</h3>
                      <p className="text-sm text-gray-400">{client.industry}</p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Active
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span>🌐</span>
                      <span className="text-gray-400">{client.website || 'No website'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="text-gray-400">{client.locations || 'No location'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span className="text-gray-400">{client.mainContact?.name || 'No contact'}</span>
                    </div>
                  </div>
                </CardBody>
                <CardFooter>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => router.push(`/kanban?client=${encodeURIComponent(client.businessName)}`)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-blue-500/20 border border-blue-500/30 px-3 py-2 text-sm font-medium text-blue-300 transition-all hover:bg-blue-500/30 hover:scale-105"
                    >
                      <KanbanSquare className="h-3.5 w-3.5" />
                      Kanban Board
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/10"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleView(client)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/10"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="inline-flex items-center justify-center rounded-2xl border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
          setEditingClient(null);
        }}
        title={editingClient ? 'Edit Client' : 'New Client'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="border-b border-white/10 pb-4">
            <h3 className="mb-3 font-semibold text-white">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  defaultValue={editingClient?.businessName}
                  required
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Website</label>
                  <input
                    type="url"
                    name="website"
                    defaultValue={editingClient?.website}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Industry *</label>
                  <input
                    type="text"
                    name="industry"
                    defaultValue={editingClient?.industry}
                    required
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Business Type</label>
                  <select
                    name="businessType"
                    defaultValue={editingClient?.businessType}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="Local Service">Local Service</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Timezone</label>
                  <input
                    type="text"
                    name="timezone"
                    defaultValue={editingClient?.timezone}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">Locations</label>
                <input
                  type="text"
                  name="locations"
                  defaultValue={editingClient?.locations}
                  placeholder="e.g., Austin, Texas"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl placeholder-gray-400 px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">Service Areas</label>
                <textarea
                  name="serviceAreas"
                  defaultValue={editingClient?.serviceAreas}
                  rows={2}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Main Contact */}
          <div className="border-b border-white/10 pb-4">
            <h3 className="mb-3 font-semibold text-white">Main Contact</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Name</label>
                <input
                  type="text"
                  name="contactName"
                  defaultValue={editingClient?.mainContact?.name}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    defaultValue={editingClient?.mainContact?.email}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    defaultValue={editingClient?.mainContact?.phone}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Access & Logins */}
          <div className="border-b border-white/10 pb-4">
            <h3 className="mb-3 font-semibold text-white">Access & Logins</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Website CMS</label>
                  <input
                    type="text"
                    name="websiteCMS"
                    defaultValue={editingClient?.websiteCMS}
                    placeholder="e.g., WordPress, Wix, Shopify"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Website Login URL</label>
                  <input
                    type="url"
                    name="websiteLoginURL"
                    defaultValue={editingClient?.websiteLoginURL}
                    placeholder="e.g., https://example.com/wp-admin"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Website Username</label>
                  <input
                    type="text"
                    name="websiteUsername"
                    defaultValue={editingClient?.websiteUsername}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Website Password</label>
                  <input
                    type="password"
                    name="websitePassword"
                    defaultValue={editingClient?.websitePassword}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Hosting Provider</label>
                  <input
                    type="text"
                    name="hosting"
                    defaultValue={editingClient?.hosting}
                    placeholder="e.g., GoDaddy, Bluehost, AWS"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Domain Registrar</label>
                  <input
                    type="text"
                    name="domainRegistrar"
                    defaultValue={editingClient?.domainRegistrar}
                    placeholder="e.g., Namecheap, GoDaddy"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Google Analytics</label>
                  <input
                    type="text"
                    name="googleAnalytics"
                    defaultValue={editingClient?.googleAnalytics}
                    placeholder="Access email or account ID"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Search Console</label>
                  <input
                    type="text"
                    name="searchConsole"
                    defaultValue={editingClient?.searchConsole}
                    placeholder="Access email or verified"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Google Business Profile</label>
                  <input
                    type="text"
                    name="googleBusinessProfile"
                    defaultValue={editingClient?.googleBusinessProfile}
                    placeholder="Access email"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Tag Manager</label>
                  <input
                    type="text"
                    name="tagManager"
                    defaultValue={editingClient?.tagManager}
                    placeholder="Access email or container ID"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Google Drive</label>
                  <input
                    type="url"
                    name="googleDrive"
                    defaultValue={editingClient?.googleDrive}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Other Tools</label>
                  <input
                    type="text"
                    name="otherTools"
                    defaultValue={editingClient?.otherTools}
                    placeholder="e.g., SEMrush, Ahrefs"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Services & SEO Basics */}
          <div className="border-b border-white/10 pb-4">
            <h3 className="mb-3 font-semibold text-white">Services & SEO Basics</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Main Services</label>
                <textarea
                  name="mainServices"
                  defaultValue={editingClient?.mainServices}
                  rows={2}
                  placeholder="List primary services offered"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">Priority Services</label>
                <textarea
                  name="priorityServices"
                  defaultValue={editingClient?.priorityServices}
                  rows={2}
                  placeholder="Services to focus on for SEO"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">Main Keywords</label>
                <textarea
                  name="mainKeywords"
                  defaultValue={editingClient?.mainKeywords}
                  rows={2}
                  placeholder="Primary keywords to target (one per line)"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">Secondary Keywords</label>
                <textarea
                  name="secondaryKeywords"
                  defaultValue={editingClient?.secondaryKeywords}
                  rows={2}
                  placeholder="Secondary keywords to target (one per line)"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">Target Locations</label>
                <textarea
                  name="targetLocations"
                  defaultValue={editingClient?.targetLocations}
                  rows={2}
                  placeholder="Geographic areas to target (one per line)"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">Competitors</label>
                <textarea
                  name="competitors"
                  defaultValue={editingClient?.competitors}
                  rows={2}
                  placeholder="Main competitor websites (one per line)"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">Google Business Profile URL</label>
                <input
                  type="url"
                  name="gbpURL"
                  defaultValue={editingClient?.gbpURL}
                  placeholder="https://www.google.com/maps/..."
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400">Social Media Links</label>
                <textarea
                  name="socialLinks"
                  defaultValue={editingClient?.socialLinks}
                  rows={3}
                  placeholder="Facebook, Instagram, LinkedIn, etc. (one per line)"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-400">Additional Notes</label>
            <textarea
              name="notes"
              defaultValue={editingClient?.notes}
              rows={3}
              placeholder="Any additional information or special requirements"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingClient(null);
              }}
              className="flex-1 rounded-2xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-400 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 hover:scale-105"
            >
              {editingClient ? 'Update' : 'Create'} Client
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingClient && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setViewingClient(null);
          }}
          title={`Client Details: ${viewingClient.businessName}`}
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-white">{viewingClient.businessName}</h3>
              <p className="text-sm text-gray-400">{viewingClient.industry}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-400">Website</p>
                <p className="text-sm text-white">{viewingClient.website || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Business Type</p>
                <p className="text-sm text-white">{viewingClient.businessType || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Locations</p>
                <p className="text-sm text-white">{viewingClient.locations || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Timezone</p>
                <p className="text-sm text-white">{viewingClient.timezone || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-400">Service Areas</p>
              <p className="text-sm text-white whitespace-pre-wrap">{viewingClient.serviceAreas || 'Not provided'}</p>
            </div>

            {/* Main Contact */}
            <div className="border-t border-white/10 pt-4">
              <h4 className="mb-2 font-semibold text-white">Main Contact</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-400">Name</p>
                  <p className="text-sm text-white">{viewingClient.mainContact?.name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Email</p>
                  <p className="text-sm text-white">{viewingClient.mainContact?.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Phone</p>
                  <p className="text-sm text-white">{viewingClient.mainContact?.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Access & Logins */}
            <div className="border-t border-white/10 pt-4">
              <h4 className="mb-3 font-semibold text-white">Access & Logins</h4>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Website CMS</p>
                    <p className="text-sm text-white">{viewingClient.websiteCMS || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Login URL</p>
                    <p className="text-sm text-white break-all">{viewingClient.websiteLoginURL || 'Not provided'}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Username</p>
                    <p className="text-sm text-white">{viewingClient.websiteUsername || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Password</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white flex-1">
                        {viewingClient.websitePassword ? (showPasswords ? viewingClient.websitePassword : '••••••••') : 'Not provided'}
                      </p>
                      {viewingClient.websitePassword && (
                        <button
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300"
                        >
                          {showPasswords ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Hosting</p>
                    <p className="text-sm text-white">{viewingClient.hosting || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Domain Registrar</p>
                    <p className="text-sm text-white">{viewingClient.domainRegistrar || 'Not provided'}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Google Analytics</p>
                    <p className="text-sm text-white">{viewingClient.googleAnalytics || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Search Console</p>
                    <p className="text-sm text-white">{viewingClient.searchConsole || 'Not provided'}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Google Business Profile</p>
                    <p className="text-sm text-white">{viewingClient.googleBusinessProfile || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Tag Manager</p>
                    <p className="text-sm text-white">{viewingClient.tagManager || 'Not provided'}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Google Drive</p>
                    {viewingClient.googleDrive ? (
                      <a
                        href={viewingClient.googleDrive}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Drive
                      </a>
                    ) : (
                      <p className="text-sm text-white">Not provided</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Other Tools</p>
                    <p className="text-sm text-white">{viewingClient.otherTools || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services & SEO */}
            <div className="border-t border-white/10 pt-4">
              <h4 className="mb-3 font-semibold text-white">Services & SEO Basics</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-400">Main Services</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{viewingClient.mainServices || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Priority Services</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{viewingClient.priorityServices || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Main Keywords</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{viewingClient.mainKeywords || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Secondary Keywords</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{viewingClient.secondaryKeywords || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Target Locations</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{viewingClient.targetLocations || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Competitors</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{viewingClient.competitors || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Google Business Profile URL</p>
                  <p className="text-sm text-white break-all">{viewingClient.gbpURL || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Social Media Links</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{viewingClient.socialLinks || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Client Account Credentials */}
            <div className="border-t border-white/10 pt-4">
              <h4 className="mb-3 font-semibold text-white">Client Account Login</h4>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-400">System Email</p>
                  <p className="text-sm text-white break-all">{viewingClient.mainContact?.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Temporary Login Password</p>
                  {generatedTempPassword ? (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-black/30 px-3 py-2 rounded font-mono text-green-400 break-all">
                        {generatedTempPassword}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedTempPassword);
                          alert('Password copied to clipboard');
                        }}
                        className="text-xs px-2 py-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-300 whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-black/30 px-3 py-2 rounded text-center font-mono">
                        ••••••••
                      </code>
                      <button
                        onClick={async () => {
                          setGeneratingPassword(true);
                          try {
                            const { generateClientTempPassword } = await import('@/lib/apiClient');
                            const result = await generateClientTempPassword(viewingClient.id);
                            if (result) {
                              setGeneratedTempPassword(result.tempPassword);
                            }
                          } catch (error) {
                            console.error('Error generating password:', error);
                            alert('Failed to generate password');
                          } finally {
                            setGeneratingPassword(false);
                          }
                        }}
                        disabled={generatingPassword}
                        className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 whitespace-nowrap disabled:opacity-50"
                      >
                        {generatingPassword ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    🔒 Generate a temporary password for the client to use on first login. They will be prompted to change it.
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t border-white/10 pt-4">
              <h4 className="mb-2 font-semibold text-white">Additional Notes</h4>
              <p className="text-sm text-white whitespace-pre-wrap">{viewingClient.notes || 'No notes'}</p>
            </div>

            <div className="text-sm text-gray-400">
              Created: {formatDate(viewingClient.createdDate)}
            </div>

            <div className="flex gap-3 border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  handleEdit(viewingClient);
                }}
                className="flex-1 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 hover:scale-105"
              >
                Edit Client
              </button>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setViewingClient(null);
                }}
                className="flex-1 rounded-2xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-400 transition-colors hover:bg-white/10"
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
