/**
 * API Adapter Layer
 * Converts between database schema (snake_case) and TypeScript types (camelCase)
 */

import { Client, WeeklyPlan, SecurityReview, KanbanCard } from '@/types';

// ─── Database response types ──────────────────────────────────────────────────

export interface ClientDbRow {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  google_drive?: string;
  industry?: string;
  business_type?: string;
  timezone?: string;
  locations?: string;
  service_areas?: string;
  status: string;
  monthly_budget?: number;
  contract_start?: string;
  contract_end?: string;
  notes?: string;
  primary_contact?: string;
  // Access & Logins
  website_cms?: string;
  website_login_url?: string;
  website_username?: string;
  website_password?: string;
  hosting?: string;
  domain_registrar?: string;
  google_analytics?: string;
  search_console?: string;
  google_business_profile?: string;
  tag_manager?: string;
  other_tools?: string;
  // Services & SEO Basics
  main_services?: string;
  priority_services?: string;
  main_keywords?: string;
  secondary_keywords?: string;
  target_locations?: string;
  competitors?: string;
  gbp_url?: string;
  social_links?: string;
  // Client portal
  client_email?: string;
  client_password_hash?: string;
  client_password_temp?: string;
  created_date: string;
  created_by?: string;
  updated_at?: string;
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
  category?: string;
  due_date?: string;
  tags?: string[];
  order_index?: number;
  created_date?: string;
  updated_date?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── DB → TypeScript ──────────────────────────────────────────────────────────

export function dbRowToClient(row: ClientDbRow, clientName?: string): Client {
  return {
    id: row.id,
    businessName: clientName || row.name,
    website: row.website,
    industry: row.industry || 'Not Specified',
    businessType: row.business_type || row.industry,
    timezone: row.timezone,
    locations: row.locations,
    serviceAreas: row.service_areas,
    mainContact: (row.primary_contact || row.email || row.phone) ? {
      name: row.primary_contact || '',
      email: row.email || '',
      phone: row.phone || '',
    } : undefined,
    notes: row.notes,
    // Access & Logins
    websiteCMS: row.website_cms,
    websiteLoginURL: row.website_login_url,
    websiteUsername: row.website_username,
    websitePassword: row.website_password,
    hosting: row.hosting,
    domainRegistrar: row.domain_registrar,
    googleAnalytics: row.google_analytics,
    searchConsole: row.search_console,
    googleBusinessProfile: row.google_business_profile,
    tagManager: row.tag_manager,
    googleDrive: row.google_drive,
    otherTools: row.other_tools,
    // Services & SEO Basics
    mainServices: row.main_services,
    priorityServices: row.priority_services,
    mainKeywords: row.main_keywords,
    secondaryKeywords: row.secondary_keywords,
    targetLocations: row.target_locations,
    competitors: row.competitors,
    gbpURL: row.gbp_url,
    socialLinks: row.social_links,
    // Client portal
    clientEmail: row.client_email,
    clientPasswordTemp: row.client_password_temp,
    createdDate: row.created_date,
  };
}

export function dbRowToWeeklyPlan(row: WeeklyPlanDbRow, clientName: string): WeeklyPlan {
  return {
    id: row.id,
    clientName,
    weekOf: row.week_start,
    status: (row.status as WeeklyPlan['status']) || 'Stable',
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
  const statusToRisk: Record<string, 'Low' | 'Medium' | 'High'> = {
    low: 'Low', medium: 'Medium', high: 'High',
    pending: 'Medium', completed: 'Low',
  };
  return {
    id: row.id,
    clientName,
    reviewDate: row.review_date,
    riskLevel: statusToRisk[row.status?.toLowerCase()] || 'Medium',
    criticalRisks: 0,
    missingAccess: 0,
    status: (row.status as SecurityReview['status']) || 'Pending',
    notes: row.notes,
  };
}

export function dbRowToKanbanCard(row: KanbanCardDbRow): KanbanCard {
  const created = row.created_date || row.created_at || '';
  return {
    id: row.id,
    clientName: (row as any).client_name || '',
    title: row.title,
    description: row.description,
    column: (row.column || 'todo') as KanbanCard['column'],
    priority: (row.priority || 'medium') as KanbanCard['priority'],
    category: (row.category || 'Other') as KanbanCard['category'],
    assignedTo: row.assigned_to || undefined,
    dueDate: row.due_date,
    tags: row.tags || [],
    createdDate: created,
    updatedDate: row.updated_date || row.updated_at || created,
  };
}

// ─── TypeScript → DB ──────────────────────────────────────────────────────────

export function clientToDbRow(client: Omit<Client, 'id' | 'createdDate'>): Partial<ClientDbRow> {
  return {
    name: client.businessName,
    email: client.mainContact?.email,
    phone: client.mainContact?.phone,
    primary_contact: client.mainContact?.name,
    website: client.website,
    industry: client.industry,
    business_type: client.businessType,
    timezone: client.timezone,
    locations: client.locations,
    service_areas: client.serviceAreas,
    notes: client.notes,
    // Access & Logins
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
    // Services & SEO Basics
    main_services: client.mainServices,
    priority_services: client.priorityServices,
    main_keywords: client.mainKeywords,
    secondary_keywords: client.secondaryKeywords,
    target_locations: client.targetLocations,
    competitors: client.competitors,
    gbp_url: client.gbpURL,
    social_links: client.socialLinks,
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
    priority: card.priority,
    category: card.category,
    assigned_to: card.assignedTo,
    due_date: card.dueDate,
    tags: card.tags,
  };
}
