'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import TopBar from '@/components/TopBar';
import Card, { CardBody, CardFooter, CardHeader } from '@/components/Card';
import Modal from '@/components/Modal';
import { TeamMember } from '@/types';
import { Plus, Edit, Eye, Trash2, Filter, Shield } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function TeamAccessPage() {
  const { data, currentUser, isMasterAdmin, addTeamMember, updateTeamMember, deleteTeamMember } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [roleFilter, setRoleFilter] = useState('');

  // Check if user has master admin access
  if (!currentUser || !isMasterAdmin) {
    return (
      <div className="min-h-screen">
        <TopBar title="Team Access" />
        <div className="p-10">
          <Card>
            <CardBody>
              <div className="flex flex-col items-center justify-center py-12">
                <Shield className="h-16 w-16 text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
                <p className="text-sm text-gray-400 text-center max-w-md">
                  This page is only accessible to master administrators. Please contact your administrator if you need access.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const filteredMembers = roleFilter
    ? data.teamMembers.filter((member) => member.role === roleFilter)
    : data.teamMembers;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const clientsText = formData.get('clients') as string;
    const clients = clientsText
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c);

    const memberData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as TeamMember['role'],
      clients: clients,
      accessNotes: formData.get('accessNotes') as string,
      notes: formData.get('notes') as string,
    };

    if (editingMember) {
      updateTeamMember(editingMember.id, memberData);
    } else {
      addTeamMember(memberData);
    }

    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleView = (member: TeamMember) => {
    setViewingMember(member);
    setViewModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      deleteTeamMember(id);
    }
  };

  const openNewMemberModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'Account Manager': 'bg-blue-100 text-blue-800',
      'SEO Specialist': 'bg-purple-100 text-purple-800',
      'Content Writer': 'bg-green-100 text-green-800',
      'Developer': 'bg-orange-100 text-orange-800',
      'Virtual Assistant': 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Team Access" />

      <div className="p-10">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-6 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="Account Manager">Account Manager</option>
              <option value="SEO Specialist">SEO Specialist</option>
              <option value="Content Writer">Content Writer</option>
              <option value="Developer">Developer</option>
              <option value="Virtual Assistant">Virtual Assistant</option>
            </select>
          </div>
          <button
            onClick={openNewMemberModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Add Team Member
          </button>
        </div>

        {/* Team Members Grid */}
        {filteredMembers.length === 0 ? (
          <Card>
            <CardBody>
              <p className="py-8 text-center text-gray-400">
                {roleFilter
                  ? 'No team members found with this role.'
                  : 'No team members yet. Click "Add Team Member" to get started!'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{member.name}</h3>
                      <p className="text-sm text-gray-400">{member.email || 'No email'}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-400">Assigned Clients</p>
                      <p className="text-sm text-white">
                        {member.clients && member.clients.length > 0
                          ? member.clients.join(', ')
                          : 'No clients assigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400">Date Added</p>
                      <p className="text-sm text-white">{formatDate(member.dateAdded)}</p>
                    </div>
                  </div>
                </CardBody>
                <CardFooter>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/10"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleView(member)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/10"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="inline-flex items-center justify-center rounded-2xl border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
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
          setEditingMember(null);
        }}
        title={editingMember ? 'Edit Team Member' : 'New Team Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400">Name *</label>
              <input
                type="text"
                name="name"
                defaultValue={editingMember?.name}
                required
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={editingMember?.email}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Role *</label>
            <select
              name="role"
              defaultValue={editingMember?.role}
              required
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select role</option>
              <option value="Account Manager">Account Manager</option>
              <option value="SEO Specialist">SEO Specialist</option>
              <option value="Content Writer">Content Writer</option>
              <option value="Developer">Developer</option>
              <option value="Virtual Assistant">Virtual Assistant</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Assigned Clients</label>
            <input
              type="text"
              name="clients"
              defaultValue={editingMember?.clients?.join(', ')}
              placeholder="Client1, Client2, Client3"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">Separate multiple clients with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Access Level Notes</label>
            <textarea
              name="accessNotes"
              defaultValue={editingMember?.accessNotes}
              rows={3}
              placeholder="Document what access this team member has (logins, tools, permissions, etc.)"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">Additional Notes</label>
            <textarea
              name="notes"
              defaultValue={editingMember?.notes}
              rows={3}
              placeholder="Any additional information about this team member"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-3 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingMember(null);
              }}
              className="flex-1 rounded-2xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-400 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 hover:scale-105"
            >
              {editingMember ? 'Update' : 'Add'} Team Member
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingMember && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setViewingMember(null);
          }}
          title={`Team Member: ${viewingMember.name}`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{viewingMember.name}</h3>
                <p className="text-sm text-gray-400">{viewingMember.email || 'No email provided'}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${getRoleBadgeColor(viewingMember.role)}`}>
                {viewingMember.role}
              </span>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="mb-2 font-semibold text-white">Assigned Clients</h4>
              {viewingMember.clients && viewingMember.clients.length > 0 ? (
                <ul className="space-y-1">
                  {viewingMember.clients.map((client, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                      {client}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No clients assigned</p>
              )}
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="mb-2 font-semibold text-white">Access Level</h4>
              <p className="text-sm text-white whitespace-pre-wrap">
                {viewingMember.accessNotes || 'No access information documented'}
              </p>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="mb-2 font-semibold text-white">Additional Notes</h4>
              <p className="text-sm text-white whitespace-pre-wrap">
                {viewingMember.notes || 'No additional notes'}
              </p>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-sm text-gray-400">Date Added: {formatDate(viewingMember.dateAdded)}</p>
            </div>

            <div className="flex gap-3 border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  handleEdit(viewingMember);
                }}
                className="flex-1 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 hover:scale-105"
              >
                Edit Member
              </button>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setViewingMember(null);
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
