'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import {
  AppData, Client, WeeklyPlan, SecurityReview, TeamMember, User, KanbanCard,
  ActivityLog, ActivityAction, ActivityEntityType, FieldChange,
} from '@/types';
import { Notification, NotificationPreferences } from '@/types/notification';
import { loadData, saveData, exportData as exportDataUtil, importData as importDataUtil, MAX_ACTIVITY_LOGS, MAX_NOTIFICATIONS } from '@/lib/storage';
import { runNotificationEngine, filterNewCandidates, candidateToNotification } from '@/lib/notificationEngine';
import * as apiClient from '@/lib/apiClient';

// Fields that must never be logged in plaintext
const REDACTED_FIELDS = new Set(['websitePassword', 'password']);
// Fields that are irrelevant to change diffs
const SKIP_DIFF_FIELDS = new Set(['id', 'createdDate', 'dateAdded', 'updatedDate']);

function redact(field: string, value: unknown): unknown {
  return REDACTED_FIELDS.has(field) ? '[redacted]' : value;
}

function computeChanges(before: Record<string, unknown>, after: Record<string, unknown>): FieldChange[] {
  const changes: FieldChange[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (SKIP_DIFF_FIELDS.has(key)) continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes.push({ field: key, oldValue: redact(key, before[key]), newValue: redact(key, after[key]) });
    }
  }
  return changes;
}

interface AppContextType {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isMasterAdmin: boolean;
  addMasterAdmin: (email: string) => void;
  removeMasterAdmin: (email: string) => void;
  addClient: (client: Omit<Client, 'id' | 'createdDate'>) => Promise<void>;
  updateClient: (id: string, client: Omit<Client, 'id' | 'createdDate'>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addWeeklyPlan: (plan: Omit<WeeklyPlan, 'id'>) => Promise<void>;
  updateWeeklyPlan: (id: string, plan: Omit<WeeklyPlan, 'id'>) => Promise<void>;
  deleteWeeklyPlan: (id: string) => Promise<void>;
  addSecurityReview: (review: Omit<SecurityReview, 'id'>) => Promise<void>;
  updateSecurityReview: (id: string, review: Omit<SecurityReview, 'id'>) => Promise<void>;
  deleteSecurityReview: (id: string) => Promise<void>;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'dateAdded'>) => Promise<void>;
  updateTeamMember: (id: string, member: Omit<TeamMember, 'id' | 'dateAdded'>) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  addKanbanCard: (card: Omit<KanbanCard, 'id' | 'createdDate' | 'updatedDate'>) => Promise<void>;
  updateKanbanCard: (id: string, card: Partial<Omit<KanbanCard, 'id' | 'createdDate'>>) => Promise<void>;
  deleteKanbanCard: (id: string) => Promise<void>;
  moveKanbanCard: (id: string, newColumn: KanbanCard['column']) => Promise<void>;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  clearActivityLogs: () => void;
  rollbackActivity: (logId: string) => boolean;
  // Notifications
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updateNotificationPrefs: (prefs: Partial<NotificationPreferences>) => void;
  runNotificationCheck: () => void;
  sendEmailNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>(() => loadData());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { data: session, status } = useSession();
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(true);
  const hasLoadedDb = useRef(false);

  // Fetch data from API when authenticated
  useEffect(() => {
    if (status !== 'authenticated' || hasLoadedDb.current) return;

    const loadDataFromApi = async () => {
      try {
        const [clients, weeklyPlans, securityReviews, kanbanCards, teamMembers, notificationsData] = await Promise.all([
          apiClient.fetchClients(),
          apiClient.fetchWeeklyPlans(),
          apiClient.fetchSecurityReviews(),
          apiClient.fetchKanbanCards(),
          apiClient.fetchTeamMembers(),
          apiClient.fetchNotifications(),
        ]);

        // Map DB rows to Notification objects
        const mappedNotifications: Notification[] = notificationsData.map((n: Record<string, unknown>) => ({
          id: n.id as string,
          user_id: n.user_id as string,
          type: n.type as any,
          priority: n.priority as any || 'medium',
          title: n.title as string,
          message: n.message as string,
          link: n.link as string | undefined,
          entity_type: n.entity_type as any,
          entity_id: n.entity_id as string | undefined,
          is_read: (n.is_read as boolean) || false,
          is_emailed: (n.is_emailed as boolean) || false,
          created_at: n.created_at as string,
          read_at: n.read_at as string | undefined,
        }));

        console.log('Loaded notifications from API (initial load):', { total: mappedNotifications.length, raw: notificationsData });

        // Always use API data if available (even if empty arrays), only fallback to localStorage on error
        setData((prev) => ({
          ...prev,
          clients,
          weeklyPlans,
          securityReviews,
          kanbanCards,
          teamMembers,
          notifications: mappedNotifications,
        }));

        hasLoadedDb.current = true;
      } catch (error) {
        console.error('Error loading data from API:', error);
        hasLoadedDb.current = true;
        // Keep existing data on error
      } finally {
        setIsLoadingFromDb(false);
      }
    };

    setIsLoadingFromDb(true);
    loadDataFromApi();
  }, [status]);

  // Periodic refresh of data from API to sync changes from other users
  useEffect(() => {
    if (status !== 'authenticated' || !hasLoadedDb.current) return;

    const refreshDataFromApi = async () => {
      try {
        const [clients, weeklyPlans, securityReviews, kanbanCards, teamMembers, notificationsData] = await Promise.all([
          apiClient.fetchClients(),
          apiClient.fetchWeeklyPlans(),
          apiClient.fetchSecurityReviews(),
          apiClient.fetchKanbanCards(),
          apiClient.fetchTeamMembers(),
          apiClient.fetchNotifications(),
        ]);

        // Map DB rows to Notification objects
        const mappedNotifications: Notification[] = notificationsData.map((n: Record<string, unknown>) => ({
          id: n.id as string,
          user_id: n.user_id as string,
          type: n.type as any,
          priority: n.priority as any || 'medium',
          title: n.title as string,
          message: n.message as string,
          link: n.link as string | undefined,
          entity_type: n.entity_type as any,
          entity_id: n.entity_id as string | undefined,
          is_read: (n.is_read as boolean) || false,
          is_emailed: (n.is_emailed as boolean) || false,
          created_at: n.created_at as string,
          read_at: n.read_at as string | undefined,
        }));

        console.log('Refreshed notifications from API (30s refresh):', { total: mappedNotifications.length, raw: notificationsData });

        // Always update with fresh API data to sync changes from other users
        setData((prev) => ({
          ...prev,
          clients,
          weeklyPlans,
          securityReviews,
          kanbanCards,
          teamMembers,
          notifications: mappedNotifications,
        }));
      } catch (error) {
        console.error('Error refreshing data from API:', error);
      }
    };

    // Refresh every 30 seconds to keep data synced across users
    const interval = setInterval(refreshDataFromApi, 30 * 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const isMasterAdmin = session?.user?.isMasterAdmin || false;

  // Sync currentUser and masterAdmins from the active session
  useEffect(() => {
    if (session?.user?.email) {
      const s = session.user;
      // Build a User object from session (localStorage users array may be empty in local-auth mode)
      const synced: User = {
        id: s.id ?? 'local-1',
        name: s.name ?? s.email ?? '',
        email: s.email!,
        isMasterAdmin: s.isMasterAdmin ?? false,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(synced);

      // Auto-register in masterAdmins list if session says so
      if (s.isMasterAdmin) {
        setData((prev) => {
          if (prev.masterAdmins.includes(s.email!)) return prev;
          return { ...prev, masterAdmins: [...prev.masterAdmins, s.email!] };
        });
      }
    } else {
      setCurrentUser(null);
    }
  }, [session]);

  // Stable reference for current session user info
  const sessionUser = {
    id: session?.user?.id ?? null,
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
  };

  const appendLog = useCallback((
    action: ActivityAction,
    entityType: ActivityEntityType,
    entityId: string,
    entityName: string,
    changes: FieldChange[],
    snapshot: unknown,
  ) => {
    const entry: ActivityLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: sessionUser.id,
      userName: sessionUser.name,
      userEmail: sessionUser.email,
      action,
      entityType,
      entityId,
      entityName,
      changes,
      snapshot,
    };
    setData((prev) => ({
      ...prev,
      activityLogs: [entry, ...prev.activityLogs].slice(0, MAX_ACTIVITY_LOGS),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const addMasterAdmin = (email: string) => {
    if (!data.masterAdmins.includes(email)) {
      setData((prev) => ({ ...prev, masterAdmins: [...prev.masterAdmins, email] }));
      appendLog('create', 'master_admin', email, email, [], null);
    }
  };

  const removeMasterAdmin = (email: string) => {
    appendLog('delete', 'master_admin', email, email, [], email);
    setData((prev) => ({
      ...prev,
      masterAdmins: prev.masterAdmins.filter((e) => e !== email),
    }));
  };

  const addClient = async (client: Omit<Client, 'id' | 'createdDate'>) => {
    const apiResult = await apiClient.createClient(client);
    if (apiResult) {
      setData((prev) => ({ ...prev, clients: [...prev.clients, apiResult] }));
      appendLog('create', 'client', apiResult.id, apiResult.businessName, [], null);
    } else {
      // Fallback to local creation if API fails
      const newClient: Client = { ...client, id: Date.now().toString(), createdDate: new Date().toISOString() };
      setData((prev) => ({ ...prev, clients: [...prev.clients, newClient] }));
      appendLog('create', 'client', newClient.id, newClient.businessName, [], null);
    }
  };

  const updateClient = async (id: string, client: Omit<Client, 'id' | 'createdDate'>) => {
    const before = data.clients.find((c) => c.id === id);
    const apiResult = await apiClient.updateClient(id, client);
    
    setData((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => (c.id === id ? (apiResult || { ...client, id, createdDate: c.createdDate }) : c)),
    }));
    
    if (before) {
      appendLog('update', 'client', id, before.businessName,
        computeChanges(before as unknown as Record<string, unknown>, client as unknown as Record<string, unknown>),
        before);
    }
  };

  const deleteClient = async (id: string) => {
    const before = data.clients.find((c) => c.id === id);
    appendLog('delete', 'client', id, before?.businessName ?? id, [], before ?? null);
    
    await apiClient.deleteClient(id);
    setData((prev) => ({ ...prev, clients: prev.clients.filter((c) => c.id !== id) }));
  };

  const addWeeklyPlan = async (plan: Omit<WeeklyPlan, 'id'>) => {
    const apiResult = await apiClient.createWeeklyPlan(plan);
    if (apiResult) {
      setData((prev) => ({ ...prev, weeklyPlans: [...prev.weeklyPlans, apiResult] }));
      appendLog('create', 'weekly_plan', apiResult.id, `${apiResult.clientName} – ${apiResult.weekOf}`, [], null);
    } else {
      const newPlan: WeeklyPlan = { ...plan, id: Date.now().toString() };
      setData((prev) => ({ ...prev, weeklyPlans: [...prev.weeklyPlans, newPlan] }));
      appendLog('create', 'weekly_plan', newPlan.id, `${newPlan.clientName} – ${newPlan.weekOf}`, [], null);
    }
  };

  const updateWeeklyPlan = async (id: string, plan: Omit<WeeklyPlan, 'id'>) => {
    const before = data.weeklyPlans.find((p) => p.id === id);
    const apiResult = await apiClient.updateWeeklyPlan(id, plan);
    
    setData((prev) => ({
      ...prev,
      weeklyPlans: prev.weeklyPlans.map((p) => (p.id === id ? (apiResult || { ...plan, id }) : p)),
    }));
    if (before) {
      appendLog('update', 'weekly_plan', id, `${before.clientName} – ${before.weekOf}`,
        computeChanges(before as unknown as Record<string, unknown>, plan as unknown as Record<string, unknown>),
        before);
    }
  };

  const deleteWeeklyPlan = async (id: string) => {
    const before = data.weeklyPlans.find((p) => p.id === id);
    appendLog('delete', 'weekly_plan', id, before ? `${before.clientName} – ${before.weekOf}` : id, [], before ?? null);
    
    await apiClient.deleteWeeklyPlan(id);
    setData((prev) => ({ ...prev, weeklyPlans: prev.weeklyPlans.filter((p) => p.id !== id) }));
  };

  const addSecurityReview = async (review: Omit<SecurityReview, 'id'>) => {
    const apiResult = await apiClient.createSecurityReview(review);
    if (apiResult) {
      setData((prev) => ({ ...prev, securityReviews: [...prev.securityReviews, apiResult] }));
      appendLog('create', 'security_review', apiResult.id, `${apiResult.clientName} – ${apiResult.reviewDate}`, [], null);
    } else {
      const newReview: SecurityReview = { ...review, id: Date.now().toString() };
      setData((prev) => ({ ...prev, securityReviews: [...prev.securityReviews, newReview] }));
      appendLog('create', 'security_review', newReview.id, `${newReview.clientName} – ${newReview.reviewDate}`, [], null);
    }
  };

  const updateSecurityReview = async (id: string, review: Omit<SecurityReview, 'id'>) => {
    const before = data.securityReviews.find((r) => r.id === id);
    const apiResult = await apiClient.updateSecurityReview(id, review);
    
    setData((prev) => ({
      ...prev,
      securityReviews: prev.securityReviews.map((r) => (r.id === id ? (apiResult || { ...review, id }) : r)),
    }));
    if (before) {
      appendLog('update', 'security_review', id, `${before.clientName} – ${before.reviewDate}`,
        computeChanges(before as unknown as Record<string, unknown>, review as unknown as Record<string, unknown>),
        before);
    }
  };

  const deleteSecurityReview = async (id: string) => {
    const before = data.securityReviews.find((r) => r.id === id);
    appendLog('delete', 'security_review', id, before ? `${before.clientName} – ${before.reviewDate}` : id, [], before ?? null);
    
    await apiClient.deleteSecurityReview(id);
    setData((prev) => ({ ...prev, securityReviews: prev.securityReviews.filter((r) => r.id !== id) }));
  };

  const addTeamMember = async (member: Omit<TeamMember, 'id' | 'dateAdded'>) => {
    const apiResult = await apiClient.createTeamMember(member);
    if (apiResult) {
      setData((prev) => ({ ...prev, teamMembers: [...prev.teamMembers, apiResult] }));
      appendLog('create', 'team_member', apiResult.id, apiResult.name, [], null);
    }
  };

  const updateTeamMember = async (id: string, member: Omit<TeamMember, 'id' | 'dateAdded'>) => {
    const before = data.teamMembers.find((m) => m.id === id);
    const apiResult = await apiClient.updateTeamMember(id, member);
    if (apiResult) {
      setData((prev) => ({
        ...prev,
        teamMembers: prev.teamMembers.map((m) => (m.id === id ? apiResult : m)),
      }));
      if (before) {
        appendLog('update', 'team_member', id, before.name,
          computeChanges(before as unknown as Record<string, unknown>, member as unknown as Record<string, unknown>),
          before);
      }
    }
  };

  const deleteTeamMember = async (id: string) => {
    const before = data.teamMembers.find((m) => m.id === id);
    const success = await apiClient.deleteTeamMember(id);
    if (success) {
      appendLog('delete', 'team_member', id, before?.name ?? id, [], before ?? null);
      setData((prev) => ({ ...prev, teamMembers: prev.teamMembers.filter((m) => m.id !== id) }));
    }
  };

  const addKanbanCard = async (card: Omit<KanbanCard, 'id' | 'createdDate' | 'updatedDate'>) => {
    const apiResult = await apiClient.createKanbanCard(card);
    if (apiResult) {
      setData((prev) => ({ ...prev, kanbanCards: [...prev.kanbanCards, apiResult] }));
      appendLog('create', 'kanban_card', apiResult.id, `${apiResult.clientName} – ${apiResult.title}`, [], null);
    } else {
      const now = new Date().toISOString();
      const newCard: KanbanCard = { ...card, id: Date.now().toString(), createdDate: now, updatedDate: now };
      setData((prev) => ({ ...prev, kanbanCards: [...prev.kanbanCards, newCard] }));
      appendLog('create', 'kanban_card', newCard.id, `${newCard.clientName} – ${newCard.title}`, [], null);
    }
  };

  const updateKanbanCard = async (id: string, card: Partial<Omit<KanbanCard, 'id' | 'createdDate'>>) => {
    const before = data.kanbanCards.find((c) => c.id === id);
    const apiResult = await apiClient.updateKanbanCard(id, card);
    
    setData((prev) => ({
      ...prev,
      kanbanCards: prev.kanbanCards.map((c) =>
        c.id === id ? (apiResult || { ...c, ...card, updatedDate: new Date().toISOString() }) : c
      ),
    }));
    if (before) {
      appendLog('update', 'kanban_card', id, `${before.clientName} – ${before.title}`,
        computeChanges(before as unknown as Record<string, unknown>, { ...before, ...card } as unknown as Record<string, unknown>),
        before);
    }
  };

  const deleteKanbanCard = async (id: string) => {
    const before = data.kanbanCards.find((c) => c.id === id);
    appendLog('delete', 'kanban_card', id, before ? `${before.clientName} – ${before.title}` : id, [], before ?? null);
    
    await apiClient.deleteKanbanCard(id);
    setData((prev) => ({ ...prev, kanbanCards: prev.kanbanCards.filter((c) => c.id !== id) }));
  };

  const moveKanbanCard = async (id: string, newColumn: KanbanCard['column']) => {
    const before = data.kanbanCards.find((c) => c.id === id);
    await apiClient.updateKanbanCard(id, { column: newColumn });
    
    setData((prev) => ({
      ...prev,
      kanbanCards: prev.kanbanCards.map((c) =>
        c.id === id ? { ...c, column: newColumn, updatedDate: new Date().toISOString() } : c
      ),
    }));
    if (before && before.column !== newColumn) {
      appendLog('update', 'kanban_card', id, `${before.clientName} – ${before.title}`,
        [{ field: 'column', oldValue: before.column, newValue: newColumn }],
        before);
    }
  };

  const clearActivityLogs = () => {
    setData((prev) => ({ ...prev, activityLogs: [] }));
  };

  // Restores an entity to its pre-change snapshot. Returns true on success.
  const rollbackActivity = (logId: string): boolean => {
    const log = data.activityLogs.find((l) => l.id === logId);
    if (!log || !log.snapshot) return false;

    setData((prev) => {
      const rollbackEntry: ActivityLog = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        userId: sessionUser.id,
        userName: sessionUser.name,
        userEmail: sessionUser.email,
        action: 'update',
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        changes: [{ field: '_rollback', oldValue: logId, newValue: null }],
        snapshot: null,
      };

      switch (log.entityType) {
        case 'client': {
          const snap = log.snapshot as Client;
          return {
            ...prev,
            clients: log.action === 'delete'
              ? [...prev.clients, snap]
              : prev.clients.map((c) => (c.id === log.entityId ? snap : c)),
            activityLogs: [rollbackEntry, ...prev.activityLogs].slice(0, MAX_ACTIVITY_LOGS),
          };
        }
        case 'weekly_plan': {
          const snap = log.snapshot as WeeklyPlan;
          return {
            ...prev,
            weeklyPlans: log.action === 'delete'
              ? [...prev.weeklyPlans, snap]
              : prev.weeklyPlans.map((p) => (p.id === log.entityId ? snap : p)),
            activityLogs: [rollbackEntry, ...prev.activityLogs].slice(0, MAX_ACTIVITY_LOGS),
          };
        }
        case 'security_review': {
          const snap = log.snapshot as SecurityReview;
          return {
            ...prev,
            securityReviews: log.action === 'delete'
              ? [...prev.securityReviews, snap]
              : prev.securityReviews.map((r) => (r.id === log.entityId ? snap : r)),
            activityLogs: [rollbackEntry, ...prev.activityLogs].slice(0, MAX_ACTIVITY_LOGS),
          };
        }
        case 'team_member': {
          const snap = log.snapshot as TeamMember;
          return {
            ...prev,
            teamMembers: log.action === 'delete'
              ? [...prev.teamMembers, snap]
              : prev.teamMembers.map((m) => (m.id === log.entityId ? snap : m)),
            activityLogs: [rollbackEntry, ...prev.activityLogs].slice(0, MAX_ACTIVITY_LOGS),
          };
        }
        case 'kanban_card': {
          const snap = log.snapshot as KanbanCard;
          return {
            ...prev,
            kanbanCards: log.action === 'delete'
              ? [...prev.kanbanCards, snap]
              : prev.kanbanCards.map((c) => (c.id === log.entityId ? snap : c)),
            activityLogs: [rollbackEntry, ...prev.activityLogs].slice(0, MAX_ACTIVITY_LOGS),
          };
        }
        default:
          return prev;
      }
    });

    return true;
  };

  // ── Notification engine ────────────────────────────────────────────────────
  const notificationCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runNotificationCheck = useCallback(() => {
    setData((prev) => {
      const userId = session?.user?.id ?? session?.user?.email ?? 'local';
      const candidates = runNotificationEngine(prev, prev.notificationPrefs, userId);
      const newOnes = filterNewCandidates(candidates, prev.notifications)
        .map(candidateToNotification);
      if (newOnes.length === 0) return prev;
      return {
        ...prev,
        notifications: [...newOnes, ...prev.notifications].slice(0, MAX_NOTIFICATIONS),
      };
    });
  }, [session]);

  // Run engine on mount (deferred) and every 5 minutes
  useEffect(() => {
    const initial = setTimeout(runNotificationCheck, 0);
    notificationCheckRef.current = setInterval(runNotificationCheck, 5 * 60 * 1000);
    return () => {
      clearTimeout(initial);
      if (notificationCheckRef.current) clearInterval(notificationCheckRef.current);
    };
  }, [runNotificationCheck]);

  const markNotificationRead = async (id: string) => {
    const success = await apiClient.markNotificationRead(id);
    if (success) {
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
      }));
    }
  };

  const markAllNotificationsRead = async () => {
    const success = await apiClient.markAllNotificationsRead();
    if (success) {
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.is_read ? n : { ...n, is_read: true, read_at: new Date().toISOString() }
        ),
      }));
    }
  };

  const deleteNotification = async (id: string) => {
    const success = await apiClient.deleteNotification(id);
    if (success) {
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.filter((n) => n.id !== id),
      }));
    }
  };

  const updateNotificationPrefs = (prefs: Partial<NotificationPreferences>) => {
    setData((prev) => ({
      ...prev,
      notificationPrefs: { ...prev.notificationPrefs, ...prefs },
    }));
  };

  const sendEmailNotifications = async () => {
    const pending = data.notifications.filter((n) => !n.is_emailed && !n.is_read);
    if (!pending.length || !data.notificationPrefs.email_enabled) return;
    const toEmail = data.notificationPrefs.email_address || session?.user?.email;
    if (!toEmail) return;
    try {
      await fetch('/api/notifications/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: pending, toEmail }),
      });
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          !n.is_emailed && !n.is_read ? { ...n, is_emailed: true } : n
        ),
      }));
    } catch (err) {
      console.error('[sendEmailNotifications]', err);
    }
  };

  // ── Data import/export ─────────────────────────────────────────────────────
  const handleExportData = () => { exportDataUtil(data); };

  const handleImportData = async (file: File) => {
    const importedData = await importDataUtil(file);
    setData(importedData);
  };

  return (
    <AppContext.Provider
      value={{
        data,
        setData,
        currentUser,
        setCurrentUser,
        isMasterAdmin,
        addMasterAdmin,
        removeMasterAdmin,
        addClient,
        updateClient,
        deleteClient,
        addWeeklyPlan,
        updateWeeklyPlan,
        deleteWeeklyPlan,
        addSecurityReview,
        updateSecurityReview,
        deleteSecurityReview,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        addKanbanCard,
        updateKanbanCard,
        deleteKanbanCard,
        moveKanbanCard,
        exportData: handleExportData,
        importData: handleImportData,
        clearActivityLogs,
        rollbackActivity,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        updateNotificationPrefs,
        runNotificationCheck,
        sendEmailNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
