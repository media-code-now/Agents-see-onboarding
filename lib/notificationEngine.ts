import { AppData } from '@/types';
import { Notification, NotificationPreferences, NotificationType, NotificationPriority } from '@/types/notification';

type Candidate = Omit<Notification, 'id' | 'is_read' | 'is_emailed' | 'created_at' | 'read_at'> & {
  dedupeKey: string;
};

function candidate(
  type: NotificationType,
  priority: NotificationPriority,
  title: string,
  message: string,
  entityType: Notification['entity_type'],
  entityId: string,
  link: string,
  userId: string,
): Candidate {
  return {
    user_id: userId,
    type,
    priority,
    title,
    message,
    link,
    entity_type: entityType,
    entity_id: entityId,
    dedupeKey: `${type}:${entityId}`,
  };
}

export function runNotificationEngine(
  data: AppData,
  prefs: NotificationPreferences,
  userId: string,
): Candidate[] {
  const results: Candidate[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const dueSoonDate = new Date(now.getTime() + (prefs.due_soon_days ?? 2) * 24 * 60 * 60 * 1000);
  const dueSoonStr = dueSoonDate.toISOString().split('T')[0];

  // --- Overdue tasks ---
  if (prefs.notify_overdue_tasks) {
    for (const card of data.kanbanCards) {
      if (card.dueDate && card.dueDate < todayStr && card.column !== 'done') {
        const daysLate = Math.floor((now.getTime() - new Date(card.dueDate).getTime()) / 86400000);
        results.push(candidate(
          'task_overdue', 'critical',
          'Overdue Task',
          `"${card.title}" for ${card.clientName} was due ${daysLate === 1 ? 'yesterday' : `${daysLate} days ago`} (${card.dueDate})`,
          'kanban_card', card.id, '/kanban', userId,
        ));
      }
    }
  }

  // --- Due soon tasks ---
  if (prefs.notify_due_soon) {
    for (const card of data.kanbanCards) {
      if (card.dueDate && card.dueDate >= todayStr && card.dueDate <= dueSoonStr && card.column !== 'done') {
        const daysUntil = Math.ceil((new Date(card.dueDate).getTime() - now.getTime()) / 86400000);
        results.push(candidate(
          'task_due_soon', 'high',
          'Task Due Soon',
          `"${card.title}" for ${card.clientName} is due ${daysUntil <= 0 ? 'today' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}`,
          'kanban_card', card.id, '/kanban', userId,
        ));
      }
    }
  }

  // --- High-priority active tasks ---
  if (prefs.notify_high_priority) {
    for (const card of data.kanbanCards) {
      if (card.priority === 'high' && card.column !== 'done' && card.column !== 'backlog') {
        results.push(candidate(
          'high_priority_task', 'high',
          'High Priority Task Active',
          `"${card.title}" (${card.clientName}) is high priority — currently in ${card.column.replace('-', ' ')}`,
          'kanban_card', card.id, '/kanban', userId,
        ));
      }
    }
  }

  // --- Security issues ---
  if (prefs.notify_security_issues) {
    for (const review of data.securityReviews) {
      if (review.riskLevel === 'High' && review.status !== 'Resolved') {
        results.push(candidate(
          'security_issue', 'critical',
          'Critical Security Risk',
          `${review.clientName} has ${review.criticalRisks} critical risk${review.criticalRisks !== 1 ? 's' : ''} — status: ${review.status}`,
          'security_review', review.id, '/security', userId,
        ));
      } else if (review.riskLevel === 'Medium' && review.status === 'Pending') {
        results.push(candidate(
          'security_issue', 'high',
          'Security Review Pending',
          `${review.clientName} has a medium-risk security review that hasn't been started`,
          'security_review', review.id, '/security', userId,
        ));
      }
    }
  }

  // --- Client follow-ups ---
  if (prefs.notify_client_followups) {
    for (const plan of data.weeklyPlans) {
      if (plan.clientFollowup && plan.clientFollowup.trim().length > 0) {
        const preview = plan.clientFollowup.trim().substring(0, 90);
        results.push(candidate(
          'client_followup', 'medium',
          'Client Follow-up Needed',
          `${plan.clientName} (week of ${plan.weekOf}): ${preview}${plan.clientFollowup.length > 90 ? '…' : ''}`,
          'weekly_plan', plan.id, '/weekly-plans', userId,
        ));
      }
    }
  }

  // --- Weekly plans needing attention ---
  if (prefs.notify_weekly_plans) {
    for (const plan of data.weeklyPlans) {
      if (plan.status === 'Needs Attention') {
        results.push(candidate(
          'weekly_plan_pending', 'high',
          'Plan Needs Attention',
          `${plan.clientName} weekly plan (${plan.weekOf}) is flagged as "Needs Attention"`,
          'weekly_plan', plan.id, '/weekly-plans', userId,
        ));
      } else if (plan.status === 'Waiting on Client') {
        results.push(candidate(
          'weekly_plan_pending', 'medium',
          'Waiting on Client',
          `${plan.clientName} weekly plan (${plan.weekOf}) is blocked — waiting on client`,
          'weekly_plan', plan.id, '/weekly-plans', userId,
        ));
      }
    }
  }

  return results;
}

// Returns only candidates that don't already have an unread counterpart
export function filterNewCandidates(
  candidates: Candidate[],
  existing: Notification[],
): Candidate[] {
  const unreadKeys = new Set(
    existing
      .filter((n) => !n.is_read && n.entity_id)
      .map((n) => `${n.type}:${n.entity_id}`)
  );
  return candidates.filter((c) => !unreadKeys.has(c.dedupeKey));
}

export function candidateToNotification(c: Candidate): Notification {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: c.user_id,
    type: c.type,
    priority: c.priority,
    title: c.title,
    message: c.message,
    link: c.link,
    entity_type: c.entity_type,
    entity_id: c.entity_id,
    is_read: false,
    is_emailed: false,
    created_at: new Date().toISOString(),
    dedupeKey: c.dedupeKey,
  };
}
