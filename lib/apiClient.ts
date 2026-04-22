/**
 * API Client Wrapper
 * Handles all database API calls with proper type conversion
 */

import {
  Client, WeeklyPlan, SecurityReview, KanbanCard, TeamMember,
} from '@/types';
import {
  ClientDbRow, WeeklyPlanDbRow, SecurityReviewDbRow, KanbanCardDbRow,
  dbRowToClient, dbRowToWeeklyPlan, dbRowToSecurityReview, dbRowToKanbanCard,
  clientToDbRow, weeklyPlanToDbRow, securityReviewToDbRow, kanbanCardToDbRow,
} from './apiAdapter';

/**
 * Client operations
 */
export async function fetchClients(): Promise<Client[]> {
  try {
    const res = await fetch('/api/clients');
    if (!res.ok) throw new Error('Failed to fetch clients');
    
    const rows: ClientDbRow[] = await res.json();
    return rows.map(row => dbRowToClient(row, row.name));
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
}

export async function createClient(client: Omit<Client, 'id' | 'createdDate'>): Promise<Client | null> {
  try {
    const dbData = clientToDbRow(client);
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData),
    });

    if (!res.ok) throw new Error('Failed to create client');
    
    const row: ClientDbRow = await res.json();
    return dbRowToClient(row, row.name);
  } catch (error) {
    console.error('Error creating client:', error);
    return null;
  }
}

export async function updateClient(id: string, client: Omit<Client, 'id' | 'createdDate'>): Promise<Client | null> {
  try {
    const dbData = clientToDbRow(client);
    console.log('Sending to API:', { id, dbData });
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData),
    });

    if (!res.ok) throw new Error('Failed to update client');
    
    const row: ClientDbRow = await res.json();
    console.log('Response from API:', row);
    return dbRowToClient(row, row.name);
  } catch (error) {
    console.error('Error updating client:', error);
    return null;
  }
}

export async function deleteClient(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
}

/**
 * Weekly Plans operations
 */
export async function fetchWeeklyPlans(): Promise<WeeklyPlan[]> {
  try {
    const res = await fetch('/api/weekly-plans');
    if (!res.ok) throw new Error('Failed to fetch weekly plans');
    
    const rows: WeeklyPlanDbRow[] = await res.json();
    return rows.map(row => dbRowToWeeklyPlan(row, (row as any).client_name || `Client ${row.client_id}`));
  } catch (error) {
    console.error('Error fetching weekly plans:', error);
    return [];
  }
}

export async function createWeeklyPlan(plan: Omit<WeeklyPlan, 'id'>): Promise<WeeklyPlan | null> {
  try {
    const dbData = weeklyPlanToDbRow(plan);
    const res = await fetch('/api/weekly-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData),
    });

    if (!res.ok) throw new Error('Failed to create weekly plan');
    
    const row: WeeklyPlanDbRow = await res.json();
    return dbRowToWeeklyPlan(row, plan.clientName);
  } catch (error) {
    console.error('Error creating weekly plan:', error);
    return null;
  }
}

export async function updateWeeklyPlan(id: string, plan: Omit<WeeklyPlan, 'id'>): Promise<WeeklyPlan | null> {
  try {
    const dbData = weeklyPlanToDbRow(plan);
    const res = await fetch(`/api/weekly-plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData),
    });

    if (!res.ok) throw new Error('Failed to update weekly plan');
    
    const row: WeeklyPlanDbRow = await res.json();
    return dbRowToWeeklyPlan(row, plan.clientName);
  } catch (error) {
    console.error('Error updating weekly plan:', error);
    return null;
  }
}

export async function deleteWeeklyPlan(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/weekly-plans/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (error) {
    console.error('Error deleting weekly plan:', error);
    return false;
  }
}

/**
 * Security Reviews operations
 */
export async function fetchSecurityReviews(): Promise<SecurityReview[]> {
  try {
    const res = await fetch('/api/security-reviews');
    if (!res.ok) throw new Error('Failed to fetch security reviews');
    
    const rows: SecurityReviewDbRow[] = await res.json();
    return rows.map(row => dbRowToSecurityReview(row, (row as any).client_name || `Client ${row.client_id}`));
  } catch (error) {
    console.error('Error fetching security reviews:', error);
    return [];
  }
}

export async function createSecurityReview(review: Omit<SecurityReview, 'id'>): Promise<SecurityReview | null> {
  try {
    const dbData = securityReviewToDbRow(review);
    const res = await fetch('/api/security-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData),
    });

    if (!res.ok) throw new Error('Failed to create security review');
    
    const row: SecurityReviewDbRow = await res.json();
    return dbRowToSecurityReview(row, review.clientName);
  } catch (error) {
    console.error('Error creating security review:', error);
    return null;
  }
}

export async function updateSecurityReview(id: string, review: Omit<SecurityReview, 'id'>): Promise<SecurityReview | null> {
  try {
    const dbData = securityReviewToDbRow(review);
    const res = await fetch(`/api/security-reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData),
    });

    if (!res.ok) throw new Error('Failed to update security review');
    
    const row: SecurityReviewDbRow = await res.json();
    return dbRowToSecurityReview(row, review.clientName);
  } catch (error) {
    console.error('Error updating security review:', error);
    return null;
  }
}

export async function deleteSecurityReview(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/security-reviews/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (error) {
    console.error('Error deleting security review:', error);
    return false;
  }
}

/**
 * Kanban Cards operations
 */
export async function fetchKanbanCards(): Promise<KanbanCard[]> {
  try {
    const res = await fetch('/api/kanban');
    if (!res.ok) throw new Error('Failed to fetch kanban cards');
    
    const rows: KanbanCardDbRow[] = await res.json();
    return rows.map(row => dbRowToKanbanCard(row));
  } catch (error) {
    console.error('Error fetching kanban cards:', error);
    return [];
  }
}

export async function createKanbanCard(card: Omit<KanbanCard, 'id' | 'createdDate' | 'updatedDate'>): Promise<KanbanCard | null> {
  try {
    const dbData = kanbanCardToDbRow(card);
    const res = await fetch('/api/kanban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData),
    });

    if (!res.ok) throw new Error('Failed to create kanban card');
    
    const row: KanbanCardDbRow = await res.json();
    return dbRowToKanbanCard(row);
  } catch (error) {
    console.error('Error creating kanban card:', error);
    return null;
  }
}

export async function updateKanbanCard(id: string, card: Partial<Omit<KanbanCard, 'id' | 'createdDate'>>): Promise<KanbanCard | null> {
  try {
    const dbData: Record<string, unknown> = {};
    if (card.title) dbData.title = card.title;
    if (card.description) dbData.description = card.description;
    if (card.column) dbData.column = card.column;
    if (card.assignedTo) dbData.assigned_to = card.assignedTo;
    if (card.priority) dbData.priority = card.priority;
    if (card.dueDate) dbData.due_date = card.dueDate;

    const res = await fetch(`/api/kanban/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData),
    });

    if (!res.ok) throw new Error('Failed to update kanban card');
    
    const row: KanbanCardDbRow = await res.json();
    return dbRowToKanbanCard(row);
  } catch (error) {
    console.error('Error updating kanban card:', error);
    return null;
  }
}

export async function deleteKanbanCard(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/kanban/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (error) {
    console.error('Error deleting kanban card:', error);
    return false;
  }
}

/**
 * Team member operations
 */
export async function fetchTeamMembers(): Promise<TeamMember[]> {
  try {
    const res = await fetch('/api/team-members');
    if (!res.ok) throw new Error('Failed to fetch team members');
    
    const rows: Array<{
      id: string;
      name?: string;
      email?: string;
      role: string;
      department?: string;
      permissions?: string | string[];
      clients?: any[];
      date_added: string;
    }> = await res.json();
    
    return rows.map(row => ({
      id: row.id,
      name: row.name || 'Unnamed',
      email: row.email,
      role: row.role as 'Account Manager' | 'SEO Specialist' | 'Content Writer' | 'Developer' | 'Virtual Assistant',
      clients: Array.isArray(row.clients) ? row.clients : [],
      dateAdded: row.date_added,
    }));
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}

export async function createTeamMember(member: Omit<TeamMember, 'id' | 'dateAdded'> & { email?: string; password?: string }): Promise<TeamMember | null> {
  try {
    const res = await fetch('/api/team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: member.name,
        email: member.email,
        password: member.password,
        role: member.role,
        clients: member.clients || [],
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create team member');
    }
    
    const row: {
      id: string;
      name?: string;
      email?: string;
      role: string;
      clients?: any[];
      date_added: string;
    } = await res.json();
    
    return {
      id: row.id,
      name: row.name || 'Unnamed',
      email: row.email,
      role: row.role as 'Account Manager' | 'SEO Specialist' | 'Content Writer' | 'Developer' | 'Virtual Assistant',
      clients: Array.isArray(row.clients) ? row.clients : [],
      dateAdded: row.date_added,
    };
  } catch (error) {
    console.error('Error creating team member:', error);
    return null;
  }
}

export async function updateTeamMember(id: string, member: Omit<TeamMember, 'id' | 'dateAdded'>): Promise<TeamMember | null> {
  try {
    const res = await fetch(`/api/team-members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: member.role,
        clients: member.clients || [],
      }),
    });

    if (!res.ok) throw new Error('Failed to update team member');
    
    const row: {
      id: string;
      name?: string;
      email?: string;
      role: string;
      clients?: any[];
      date_added: string;
    } = await res.json();
    
    return {
      id: row.id,
      name: row.name || 'Unnamed',
      email: row.email,
      role: row.role as 'Account Manager' | 'SEO Specialist' | 'Content Writer' | 'Developer' | 'Virtual Assistant',
      clients: Array.isArray(row.clients) ? row.clients : [],
      dateAdded: row.date_added,
    };
  } catch (error) {
    console.error('Error updating team member:', error);
    return null;
  }
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/team-members/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (error) {
    console.error('Error deleting team member:', error);
    return false;
  }
}

/**
 * Notification operations
 */
export async function fetchNotifications(): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    
    const data: { notifications: Record<string, unknown>[] } = await res.json();
    return data.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true }),
    });
    return res.ok;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications/mark-all-read', { method: 'PATCH' });
    return res.ok;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

export async function broadcastNotification(
  type: string,
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' = 'medium',
  link?: string,
  entity_type?: string,
  entity_id?: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        title,
        message,
        priority,
        link: link || null,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        broadcast: true,
      }),
    });
    return res.ok;
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    return false;
  }
}

/**
 * Client account operations
 */
export async function generateClientTempPassword(clientId: string): Promise<{ tempPassword: string } | null> {
  try {
    const res = await fetch(`/api/clients/${clientId}/generate-temp-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to generate temporary password');
    const data = await res.json();
    return { tempPassword: data.tempPassword };
  } catch (error) {
    console.error('Error generating temp password:', error);
    return null;
  }
}