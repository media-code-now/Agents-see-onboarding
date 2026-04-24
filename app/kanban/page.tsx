'use client';

import { Suspense } from 'react';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import TopBar from '@/components/TopBar';
import Modal from '@/components/Modal';
import SearchBar from '@/components/SearchBar';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DateRangeFilter from '@/components/DateRangeFilter';
import { KanbanCard } from '@/types';
import { Plus, Edit, Trash2, Filter, GripVertical, Calendar, User, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-500' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'review', title: 'Review', color: 'bg-purple-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
] as const;

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
] as const;

const CATEGORIES = [
  'On-Page SEO',
  'Content',
  'Technical',
  'Link Building',
  'Analytics',
  'Other',
] as const;

function KanbanPage() {
  const searchParams = useSearchParams();
  const { data, addKanbanCard, updateKanbanCard, deleteKanbanCard, moveKanbanCard } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  // Get unique values for filters
  const clients = useMemo(() => {
    const unique = [...new Set(data.kanbanCards.map(c => c.clientName).filter(Boolean))];
    return unique.map(name => ({ value: name, label: name }));
  }, [data.kanbanCards]);

  const assignees = useMemo(() => {
    const unique = [...new Set(data.kanbanCards.map(c => c.assignedTo).filter((n): n is string => Boolean(n)))];
    return unique.map(name => ({ value: name, label: name }));
  }, [data.kanbanCards]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    data.kanbanCards.forEach(card => {
      card.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).map(tag => ({ value: tag, label: tag }));
  }, [data.kanbanCards]);

  const priorityOptions = PRIORITIES.map(p => ({ value: p.value, label: p.label }));
  const categoryOptions = CATEGORIES.map(c => ({ value: c, label: c }));

  const filteredCards = useMemo(() => {
    return data.kanbanCards.filter((card) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.clientName.toLowerCase().includes(searchTerm.toLowerCase());

      // Client filter
      const matchesClient = selectedClients.length === 0 ||
        selectedClients.includes(card.clientName);

      // Priority filter
      const matchesPriority = selectedPriorities.length === 0 ||
        selectedPriorities.includes(card.priority);

      // Category filter
      const matchesCategory = selectedCategories.length === 0 ||
        (card.category && selectedCategories.includes(card.category));

      // Assignee filter
      const matchesAssignee = selectedAssignees.length === 0 ||
        (card.assignedTo && selectedAssignees.includes(card.assignedTo));

      // Tags filter
      const matchesTags = selectedTags.length === 0 ||
        (card.tags && card.tags.some(tag => selectedTags.includes(tag)));

      // Date range filter
      const cardDate = card.dueDate ? new Date(card.dueDate) : null;
      const matchesStartDate = !startDate || (cardDate && cardDate >= new Date(startDate));
      const matchesEndDate = !endDate || (cardDate && cardDate <= new Date(endDate));

      return matchesSearch && matchesClient && matchesPriority && matchesCategory && 
             matchesAssignee && matchesTags && matchesStartDate && matchesEndDate;
    });
  }, [data.kanbanCards, searchTerm, selectedClients, selectedPriorities, selectedCategories, 
      selectedAssignees, selectedTags, startDate, endDate]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedClients([]);
    setSelectedPriorities([]);
    setSelectedCategories([]);
    setSelectedAssignees([]);
    setSelectedTags([]);
    setStartDate('');
    setEndDate('');
  };

  const activeFilterCount = 
    (searchTerm ? 1 : 0) +
    selectedClients.length +
    selectedPriorities.length +
    selectedCategories.length +
    selectedAssignees.length +
    selectedTags.length +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);

    const tagsText = formData.get('tags') as string;
    const tags = tagsText
      ? tagsText.split(',').map((t) => t.trim()).filter((t) => t)
      : [];

    const cardData = {
      clientName: formData.get('clientName') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      column: (formData.get('column') as KanbanCard['column']) || 'backlog',
      priority: formData.get('priority') as KanbanCard['priority'],
      category: formData.get('category') as KanbanCard['category'],
      assignedTo: formData.get('assignedTo') as string,
      dueDate: formData.get('dueDate') as string,
      tags: tags,
    };

    if (editingCard) {
      await updateKanbanCard(editingCard.id, cardData);
    } else {
      await addKanbanCard(cardData);
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const handleEdit = (card: KanbanCard) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      deleteKanbanCard(id);
    }
  };

  const openNewCardModal = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const handleDragStart = (cardId: string) => {
    setDraggedCard(cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: KanbanCard['column']) => {
    if (draggedCard) {
      moveKanbanCard(draggedCard, columnId);
      setDraggedCard(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITIES.find((p) => p.value === priority)?.color || 'bg-gray-100 text-gray-800';
  };

  const uniqueClients = Array.from(new Set(data.clients.map((c) => c.businessName)));
  const teamMembers = data.teamMembers.map((m) => m.name);

  return (
    <div className="min-h-screen">
      <TopBar title="Kanban Board" />

      <div className="p-10">
        {/* Header Actions */}
        <div className="mb-8 flex flex-col gap-4">
          {/* Top Row: Search and Buttons */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 max-w-xl">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search cards by title, description, or client..."
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
                onClick={openNewCardModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                New Card
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
                  label="Priority"
                  options={priorityOptions}
                  selected={selectedPriorities}
                  onChange={setSelectedPriorities}
                />
                <MultiSelectFilter
                  label="Category"
                  options={categoryOptions}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                />
                <MultiSelectFilter
                  label="Assignee"
                  options={assignees}
                  selected={selectedAssignees}
                  onChange={setSelectedAssignees}
                />
                <MultiSelectFilter
                  label="Tags"
                  options={allTags}
                  selected={selectedTags}
                  onChange={setSelectedTags}
                />
                <DateRangeFilter
                  label="Due Date Range"
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <p className="text-sm text-gray-400">
                  Showing {filteredCards.length} of {data.kanbanCards.length} cards
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

        {/* Kanban Board */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {COLUMNS.map((column) => {
            const columnCards = filteredCards.filter((card) => card.column === column.id);
            
            return (
              <div
                key={column.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id as KanbanCard['column'])}
                className="flex flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl"
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
                  <div className={`h-3 w-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-white">{column.title}</h3>
                  <span className="ml-auto text-sm text-gray-400">{columnCards.length}</span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 p-4 min-h-[500px]">
                  {columnCards.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-8">
                      No cards
                    </p>
                  ) : (
                    columnCards.map((card) => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => handleDragStart(card.id)}
                        className="group cursor-move rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all hover:bg-white/10 hover:scale-[1.02]"
                      >
                        {/* Card Header */}
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm">{card.title}</h4>
                            <p className="mt-1 text-xs text-gray-400">{card.clientName}</p>
                          </div>
                          <GripVertical className="h-4 w-4 text-gray-500" />
                        </div>

                        {/* Description */}
                        {card.description && (
                          <p className="mb-3 text-xs text-gray-300 line-clamp-2">
                            {card.description}
                          </p>
                        )}

                        {/* Tags */}
                        {card.tags && card.tags.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-1">
                            {card.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="mb-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(card.priority)}`}>
                              {card.priority}
                            </span>
                            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                              {card.category}
                            </span>
                          </div>
                          
                          {card.assignedTo && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <User className="h-3 w-3" />
                              <span>{card.assignedTo}</span>
                            </div>
                          )}
                          
                          {card.dueDate && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(card.dueDate)}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 border-t border-white/10 pt-3">
                          <button
                            onClick={() => handleEdit(card)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-2 py-2 text-xs font-medium text-gray-400 transition-all hover:bg-white/10"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(card.id)}
                            className="inline-flex items-center justify-center rounded-2xl border border-red-500/50 px-2 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCard(null);
        }}
        title={editingCard ? 'Edit Card' : 'New Card'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400">Client *</label>
              <select
                name="clientName"
                defaultValue={editingCard?.clientName}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select client</option>
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Column *</label>
              <select
                name="column"
                defaultValue={editingCard?.column || 'backlog'}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Title *</label>
            <input
              type="text"
              name="title"
              defaultValue={editingCard?.title}
              required
              placeholder="e.g., Optimize homepage meta tags"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Description</label>
            <textarea
              name="description"
              defaultValue={editingCard?.description}
              rows={3}
              placeholder="Add more details about this task..."
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400">Priority *</label>
              <select
                name="priority"
                defaultValue={editingCard?.priority || 'medium'}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Category *</label>
              <select
                name="category"
                defaultValue={editingCard?.category}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400">Assigned To</label>
              <select
                name="assignedTo"
                defaultValue={editingCard?.assignedTo}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Due Date</label>
              <input
                type="date"
                name="dueDate"
                defaultValue={editingCard?.dueDate}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Tags</label>
            <input
              type="text"
              name="tags"
              defaultValue={editingCard?.tags?.join(', ')}
              placeholder="keyword research, urgent, client-requested (comma-separated)"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsModalOpen(false);
                setEditingCard(null);
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
              {isSaving ? 'Saving…' : (editingCard ? 'Update' : 'Create') + ' Card'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function KanbanPageWrapper() {
  return (
    <Suspense>
      <KanbanPage />
    </Suspense>
  );
}
