export interface Client {
  id: string;
  businessName: string;
  website?: string;
  industry: string;
  businessType?: string;
  timezone?: string;
  locations?: string;
  serviceAreas?: string;
  mainContact?: {
    name: string;
    email: string;
    phone: string;
  };
  // Access & Logins
  websiteCMS?: string;
  websiteLoginURL?: string;
  websiteUsername?: string;
  websitePassword?: string;
  hosting?: string;
  domainRegistrar?: string;
  googleAnalytics?: string;
  searchConsole?: string;
  googleBusinessProfile?: string;
  tagManager?: string;
  googleDrive?: string;
  otherTools?: string;
  // Services & SEO Basics
  mainServices?: string;
  priorityServices?: string;
  mainKeywords?: string;
  secondaryKeywords?: string;
  targetLocations?: string;
  competitors?: string;
  gbpURL?: string;
  socialLinks?: string;
  notes?: string;
  // Client Account
  clientEmail?: string;
  clientPasswordTemp?: string;
  createdDate: string;
}

export interface WeeklyPlan {
  id: string;
  clientName: string;
  weekOf: string;
  status: 'Stable' | 'Needs Attention' | 'Waiting on Client';
  mainFocus: string[];
  onPageTasks?: string;
  contentTasks?: string;
  technicalTasks?: string;
  blocked?: string;
  clientFollowup?: string;
  notes?: string;
  totalTasks: number;
  blockedItems: number;
}

export interface SecurityReview {
  id: string;
  clientName: string;
  reviewDate: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  criticalRisksText?: string;
  criticalRisks: number;
  missingAccessText?: string;
  missingAccess: number;
  securityIssues?: string;
  requiredFixes?: string;
  recommendations?: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  notes?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: 'Account Manager' | 'SEO Specialist' | 'Content Writer' | 'Developer' | 'Virtual Assistant';
  clients?: string[];
  accessNotes?: string;
  notes?: string;
  dateAdded: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Only used during registration, never exposed
  isMasterAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface KanbanCard {
  id: string;
  clientName: string;
  title: string;
  description?: string;
  column: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: 'On-Page SEO' | 'Content' | 'Technical' | 'Link Building' | 'Analytics' | 'Other';
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
  createdDate: string;
  updatedDate: string;
}

export type { Notification, NotificationPreferences, NotificationType, NotificationPriority } from './notification';

export type ActivityAction = 'create' | 'update' | 'delete';
export type ActivityEntityType =
  | 'client'
  | 'weekly_plan'
  | 'security_review'
  | 'team_member'
  | 'kanban_card'
  | 'master_admin';

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityName: string;
  changes: FieldChange[];
  snapshot: unknown; // pre-change state for rollback
}

export interface AppData {
  clients: Client[];
  weeklyPlans: WeeklyPlan[];
  securityReviews: SecurityReview[];
  teamMembers: TeamMember[];
  masterAdmins: string[];
  kanbanCards: KanbanCard[];
  users: User[];
  activityLogs: ActivityLog[];
  notifications: import('./notification').Notification[];
  notificationPrefs: import('./notification').NotificationPreferences;
}
