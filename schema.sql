-- SEO Agency Onboarding System — Neon PostgreSQL Schema
-- Run this once against your Neon database to initialize all tables.
-- No Supabase RLS — access control is enforced at the API layer via NextAuth sessions.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  password     VARCHAR(255) NOT NULL,
  is_master_admin BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login   TIMESTAMP WITH TIME ZONE,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Clients ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255),
  phone          VARCHAR(50),
  website        VARCHAR(500),
  google_drive   VARCHAR(500),
  industry       VARCHAR(255),
  status         VARCHAR(50) DEFAULT 'active',
  monthly_budget DECIMAL(10, 2),
  contract_start DATE,
  contract_end   DATE,
  notes          TEXT,
  primary_contact VARCHAR(255),
  created_date   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by     UUID REFERENCES users(id),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Weekly Plans ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_plans (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id    UUID REFERENCES clients(id) ON DELETE CASCADE,
  week_start   DATE NOT NULL,
  week_end     DATE NOT NULL,
  status       VARCHAR(50) DEFAULT 'in-progress',
  focus_areas  TEXT[],
  goals        TEXT,
  deliverables TEXT,
  notes        TEXT,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Security Reviews ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_reviews (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id            UUID REFERENCES clients(id) ON DELETE CASCADE,
  review_date          DATE NOT NULL,
  status               VARCHAR(50) DEFAULT 'pending',
  access_type          VARCHAR(100),
  platform             VARCHAR(100),
  credentials_status   VARCHAR(50),
  two_factor_enabled   BOOLEAN DEFAULT FALSE,
  last_password_change DATE,
  access_level         VARCHAR(100),
  notes                TEXT,
  next_review_date     DATE,
  created_by           UUID REFERENCES users(id),
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Team Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(100) NOT NULL,
  department  VARCHAR(100),
  permissions JSONB DEFAULT '[]',
  is_active   BOOLEAN DEFAULT TRUE,
  date_added  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by    UUID REFERENCES users(id),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Kanban Cards ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_cards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL,
  description TEXT,
  column      VARCHAR(50) NOT NULL CHECK (column IN ('todo', 'in-progress', 'review', 'done')),
  priority    VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id),
  due_date    DATE,
  tags        TEXT[],
  order_index INTEGER DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by  UUID REFERENCES users(id)
);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type        VARCHAR(50) NOT NULL,
  priority    VARCHAR(20) DEFAULT 'medium',
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  link        VARCHAR(500),
  entity_type VARCHAR(50),
  entity_id   UUID,
  is_read     BOOLEAN DEFAULT FALSE,
  is_emailed  BOOLEAN DEFAULT FALSE,
  read_at     TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Notification Preferences ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_enabled           BOOLEAN DEFAULT TRUE,
  email_frequency         VARCHAR(20) DEFAULT 'immediate',
  notify_overdue_tasks    BOOLEAN DEFAULT TRUE,
  notify_due_soon         BOOLEAN DEFAULT TRUE,
  notify_high_priority    BOOLEAN DEFAULT TRUE,
  notify_security_issues  BOOLEAN DEFAULT TRUE,
  notify_client_followups BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email                    ON users(email);
CREATE INDEX IF NOT EXISTS idx_clients_status                 ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_date           ON clients(created_date);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_client            ON weekly_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_dates             ON weekly_plans(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_security_reviews_client        ON security_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_security_reviews_date          ON security_reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_client            ON kanban_cards(client_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_column            ON kanban_cards(column);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_assigned          ON kanban_cards(assigned_to);
CREATE INDEX IF NOT EXISTS idx_team_members_user              ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id          ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read          ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at       ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user_id            ON notification_preferences(user_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_weekly_plans_updated_at
  BEFORE UPDATE ON weekly_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_security_reviews_updated_at
  BEFORE UPDATE ON security_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_kanban_cards_updated_at
  BEFORE UPDATE ON kanban_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
