export type NotificationType =
  | 'task_overdue'
  | 'task_due_soon'
  | 'high_priority_task'
  | 'security_issue'
  | 'client_followup'
  | 'weekly_plan_pending';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  entity_type?: 'kanban_card' | 'weekly_plan' | 'security_review' | 'client';
  entity_id?: string;
  is_read: boolean;
  is_emailed: boolean;
  created_at: string;
  read_at?: string;
  // internal dedup key: `${type}:${entity_id}` — not persisted to DB
  dedupeKey?: string;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  email_address: string;
  email_frequency: 'immediate' | 'daily' | 'weekly';
  notify_overdue_tasks: boolean;
  notify_due_soon: boolean;
  notify_high_priority: boolean;
  notify_security_issues: boolean;
  notify_client_followups: boolean;
  notify_weekly_plans: boolean;
  due_soon_days: number; // how many days ahead counts as "due soon"
}
