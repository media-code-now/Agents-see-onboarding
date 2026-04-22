import { AppData } from '@/types';
import { NotificationPreferences } from '@/types/notification';

const STORAGE_KEY = 'seo-onboarding-data';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  email_enabled: false,
  email_address: '',
  email_frequency: 'immediate',
  notify_overdue_tasks: true,
  notify_due_soon: true,
  notify_high_priority: true,
  notify_security_issues: true,
  notify_client_followups: true,
  notify_weekly_plans: true,
  due_soon_days: 2,
};

const EMPTY_DATA: AppData = {
  clients: [],
  weeklyPlans: [],
  securityReviews: [],
  teamMembers: [],
  masterAdmins: [],
  kanbanCards: [],
  users: [],
  activityLogs: [],
  notifications: [],
  notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
};

export const loadData = (): AppData => {
  if (typeof window === 'undefined') return { ...EMPTY_DATA };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (!d.masterAdmins) d.masterAdmins = [];
      if (!d.kanbanCards) d.kanbanCards = [];
      if (!d.users) d.users = [];
      if (!d.activityLogs) d.activityLogs = [];
      if (!d.notifications) d.notifications = [];
      if (!d.notificationPrefs) d.notificationPrefs = { ...DEFAULT_NOTIFICATION_PREFS };
      else d.notificationPrefs = { ...DEFAULT_NOTIFICATION_PREFS, ...d.notificationPrefs };
      return d;
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }

  return { ...EMPTY_DATA };
};

export const saveData = (data: AppData): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

export const exportData = (data: AppData): void => {
  const blob = new Blob(
    [JSON.stringify({ ...data, exportDate: new Date().toISOString() }, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seo-onboarding-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const d = JSON.parse(event.target?.result as string);
        resolve({
          clients: d.clients || [],
          weeklyPlans: d.weeklyPlans || [],
          securityReviews: d.securityReviews || [],
          teamMembers: d.teamMembers || [],
          masterAdmins: d.masterAdmins || [],
          kanbanCards: d.kanbanCards || [],
          users: d.users || [],
          activityLogs: d.activityLogs || [],
          notifications: d.notifications || [],
          notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS, ...(d.notificationPrefs || {}) },
        });
      } catch {
        reject(new Error('Invalid file format'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

export const MAX_ACTIVITY_LOGS = 1000;
export const MAX_NOTIFICATIONS = 200;
