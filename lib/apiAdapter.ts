/**
 * API Adapter Layer
 * Converts between database schema and TypeScript types to handle schema mismatch
 */

import { Client, WeeklyPlan, SecurityReview, KanbanCard } from '@/types';

// Database response types
export interface ClientDbRow {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  google_drive?: string;
  industry?: string;
  status: string;
  monthly_budget?: number;
  contract_start?: string;
  contract_end?: string;
  notes?: string;
  primary_contact?: string;
  created_date: string;
  created_by?: string;
  updated_at?: string;
  client_email?: string;
  client_password_hash?: string;
  client_password_temp?: string;
}

export interface WeeklyPlanDbRow {
  id: string;
  client_id: string;
  week_start: string;
  week_end: string;
  status: string;
  focus_areas?: string[];
  goals?: string;
  deliverables?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface SecurityReviewDbRow {
  id: string;
  client_id: string;
  review_date: string;
  status: string;
  access_type?: string;
  platform?: string;
  credentials_status?: string;
  two_factor_enabled?: boolean;
  last_password_change?: string;
  access_level?: string;
  notes?: string;
  next_review_date?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface KanbanCardDbRow {
  id: string;
  client_id?: string;
  title: string;
  description?: string;
  column: string;
  assigned_to?: string;
  priority?: string;
  due_date?: string;
  order_index?: number;
  created_at: string;
  updated_at?: string;
}

// Adapters: Database -> TypeScript Types

export function dbRowToClient(row: ClientDbRow, clientName?: string): Client {
  return {
    id: row.id,
    businessName: clientName || row.name,
    website: row.website,
    industry: row.industry || 'Not Specified',
    businessType: row.industry,
    googleDrive: row.google_drive,
    mainContact: row.email || row.phone ? {
      name: row.primary_contact || 'Contact',
      email: row.email || '',
      phone: row.phone || '',
    } : undefined,
    notes: row.notes,
    createdDate: row.created_date,
    clientEmail: row.client_email,
    clientPasswordTemp: row.client_password_temp,
    // Optional fields with defaults
    timezone: undefined,
    locations: undefined,
    serviceAreas: undefined,
    websiteCMS: undefined,
    websiteLoginURL: undefined,
    websiteUsername: undefined,
    websitePassword: undefined,
    hosting: undefined,
    domainRegistrar: undefined,
    googleAnalytics: undefined,
    searchConsole: undefined,
    googleBusinessProfile: undefined,
    tagManager: undefined,
    otherTools: undefined,
    mainServices: undefined,
    priorityServices: undefined,
    mainKeywords: undefined,
    secondaryKeywords: undefined,
    targetLocations: undefined,
    competitors: undefined,
    gbpURL: undefined,
    socialLinks: undefined,
  };
}

export function dbRowToWeeklyPlan(row: WeeklyPlanDbRow, clientName: string): WeeklyPlan {
  return {
    id: row.id,
    clientName,
    weekOf: row.week_start,
    status: (row.status as any) || 'Stable',
    mainFocus: row.focus_areas || [],
    notes: row.notes,
    onPageTasks: undefined,
    contentTasks: undefined,
    technicalTasks: undefined,
    blocked: undefined,
    clientFollowup: undefined,
    totalTasks: 0,
    blockedItems: 0,
  };
}

export function dbRowToSecurityReview(row: SecurityReviewDbRow, clientName: string): SecurityReview {
  // Map status to risk level
  const statusToRisk: { [key: string]: 'Low' | 'Medium' | 'High' } = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'pending': 'Medium',
    'completed': 'Low',
  };

  return {
    id: row.id,
    clientName,
    reviewDate: row.review_date,
    riskLevel: statusToRisk[row.status?.toLowerCase()] || 'Medium',
    criticalRisks: 0,
    missingAccess: 0,
    status: (row.status as 'Pending' | 'In Progress' | 'Resolved') || 'Pending',
    notes: row.notes,
  };
}

export function dbRowToKanbanCard(row: KanbanCardDbRow): KanbanCard {
  return {
    id: row.id,
    clientName: `Client ${row.client_id || 'Unknown'}`,
    title: row.title,
    description: row.description,
    column: row.column as any,
    assignedTo: row.assigned_to,
    priority: row.priority as any,
    createdDate: row.created_at,
    updatedDate: row.updated_at || row.created_at,
    dueDate: row.due_date,
    category: 'Other',
  };
}

// Adapters: TypeScript Types -> Database Row (for creation/updates)

export function clientToDbRow(client: Omit<Client, 'id' | 'createdDate'>): Partial<ClientDbRow> {
  return {
    name: client.businessName,
    email: client.mainContact?.email,
    phone: client.mainContact?.phone,
    website: client.website,
    industry: client.industry,
    notes: client.notes,
    primary_contact: client.mainContact?.name,
    google_drive: client.googleDrive,
  };
}

export function weeklyPlanToDbRow(plan: Omit<WeeklyPlan, 'id'>): Partial<WeeklyPlanDbRow> {
  return {
    week_start: plan.weekOf,
    status: plan.status,
    focus_areas: plan.mainFocus,
    goals: plan.mainFocus?.join(', '),
    deliverables: plan.mainFocus?.join('; '),
    notes: plan.notes,
  };
}

export function securityReviewToDbRow(review: Omit<SecurityReview, 'id'>): Partial<SecurityReviewDbRow> {
  return {
    review_date: review.reviewDate,
    status: review.riskLevel?.toLowerCase() || 'pending',
    notes: review.notes,
  };
}

export function kanbanCardToDbRow(card: Omit<KanbanCard, 'id' | 'createdDate' | 'updatedDate'>): Partial<KanbanCardDbRow> {
  return {
    title: card.title,
    description: card.description,
    column: card.column,
    assigned_to: card.assignedTo,
    priority: card.priority,
    due_date: card.dueDate,
  };
}
