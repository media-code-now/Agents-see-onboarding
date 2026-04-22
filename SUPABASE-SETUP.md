# SEO Agency Onboarding System - Supabase Setup Guide

## 🚀 Getting Started with Supabase

This application now uses **Supabase** (PostgreSQL) for data persistence, replacing localStorage for production-ready multi-user access.

---

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available at [supabase.com](https://supabase.com))

---

## 🛠️ Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `seo-onboarding` (or your choice)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Select closest to your users
4. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click **"Settings"** (⚙️ icon)
2. Click **"API"** in the sidebar
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")

### Step 3: Configure Environment Variables

1. Open `.env.local` in the root of the `nextjs-app` folder
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Create Database Schema

1. In Supabase dashboard, click **"SQL Editor"** in the sidebar
2. Click **"New query"**
3. Open the file: `nextjs-app/supabase/schema.sql`
4. Copy **ALL** content from `schema.sql`
5. Paste into the SQL Editor in Supabase
6. Click **"Run"** (or press `Ctrl/Cmd + Enter`)
7. You should see: **"Success. No rows returned"**

### Step 5: Verify Database Setup

1. Click **"Table Editor"** in the Supabase sidebar
2. You should see these tables:
   - ✅ `users`
   - ✅ `clients`
   - ✅ `weekly_plans`
   - ✅ `security_reviews`
   - ✅ `team_members`
   - ✅ `kanban_cards`
   - ✅ `master_admins`

### Step 6: Install Dependencies & Start Dev Server

```bash
cd nextjs-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 👤 First User Registration

1. Visit [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)
2. Create your account (first user becomes **Master Admin** automatically)
3. You'll be auto-signed in and redirected to the dashboard

---

## 🗄️ Database Schema Overview

### Tables Created:

| Table | Description |
|-------|-------------|
| **users** | User accounts with authentication |
| **clients** | Client information and details |
| **weekly_plans** | Weekly planning for each client |
| **security_reviews** | Security audit and access reviews |
| **team_members** | Team member roles and permissions |
| **kanban_cards** | Task board cards with drag-drop |
| **master_admins** | Master admin tracking |

### Features:

- ✅ **UUID Primary Keys** - Better than auto-incrementing integers
- ✅ **Foreign Key Relationships** - Data integrity enforced
- ✅ **Timestamps** - Automatic `created_at` and `updated_at`
- ✅ **Row Level Security (RLS)** - Built-in authorization
- ✅ **Indexes** - Optimized query performance
- ✅ **Cascading Deletes** - Clean up related data automatically

---

## 🔐 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- **Authenticated users** can view/create/update/delete their data
- **Master admins** have elevated permissions
- **Anonymous users** cannot access any data

### Password Security

- Passwords hashed with **bcrypt** (12 rounds)
- Never stored in plain text
- Server-side verification only

### Session Management

- **JWT tokens** with 30-day expiry
- Secure HTTP-only cookies
- NextAuth.js for authentication

---

## 📊 Data Migration from localStorage

If you have existing data in localStorage, follow these steps:

### Manual Migration

1. Open your browser's DevTools (F12)
2. Go to **Console** tab
3. Run this command:

```javascript
const data = localStorage.getItem('seo-onboarding-data');
console.log(JSON.parse(data));
```

4. Copy the output
5. Use the Supabase Table Editor to manually add records

### Automated Migration (Coming Soon)

A migration utility will be added to automatically transfer localStorage data to Supabase.

---

## 🌐 API Routes

All data operations now use these API endpoints:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/clients` | GET, POST | Manage clients |
| `/api/clients/[id]` | GET, PUT, DELETE | Single client operations |
| `/api/weekly-plans` | GET, POST | Manage weekly plans |
| `/api/weekly-plans/[id]` | GET, PUT, DELETE | Single plan operations |
| `/api/security-reviews` | GET, POST | Manage security reviews |
| `/api/security-reviews/[id]` | GET, PUT, DELETE | Single review operations |
| `/api/team-members` | GET, POST | Manage team members |
| `/api/team-members/[id]` | GET, PUT, DELETE | Single member operations |
| `/api/kanban` | GET, POST | Manage kanban cards |
| `/api/kanban/[id]` | GET, PUT, DELETE | Single card operations |

All endpoints require authentication via NextAuth session.

---

## 🚀 Production Deployment

### Environment Variables

Set these in your production environment:

```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-a-new-secret-key-here
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Supabase Production Tips

- Use **Production** branch (not Staging)
- Enable **Email Confirmations** for new users
- Set up **Database Backups** (Settings → Database → Backups)
- Monitor usage in **Reports** tab

---

## 🐛 Troubleshooting

### "Failed to fetch" errors

- Check your `.env.local` has correct Supabase URL and key
- Verify database schema was created successfully
- Check Supabase dashboard for any errors

### Authentication not working

- Ensure `users` table exists
- Verify RLS policies are enabled
- Check NextAuth configuration in `.env.local`

### Data not saving

- Open browser DevTools → Network tab
- Check for failed API requests
- Verify session is active (look for NextAuth cookies)

### Cannot create first user

- Check Supabase SQL Editor for errors
- Verify `schema.sql` ran successfully
- Make sure RLS policies allow inserts

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

---

## 🎯 What Changed from localStorage?

| Before (localStorage) | After (Supabase) |
|-----------------------|------------------|
| Browser-only storage | Cloud PostgreSQL database |
| Single user per browser | Multi-user with authentication |
| Data lost on clear | Persistent data storage |
| No backup | Automatic backups |
| Client-side only | Server-side API routes |
| No real-time sync | Real-time capabilities available |

---

## ✅ Benefits of Supabase

- ✨ **Real Database** - PostgreSQL with full SQL support
- 🔐 **Built-in Auth** - User management out of the box
- 🚀 **Instant APIs** - Auto-generated REST endpoints
- ⚡ **Real-time** - Listen to database changes
- 💾 **Automatic Backups** - Never lose data
- 📊 **Dashboard** - Visual table editor and SQL editor
- 🆓 **Free Tier** - 500MB database, 2GB bandwidth/month
- 🌍 **Global CDN** - Fast worldwide access

---

## 📝 Next Steps

1. ✅ Complete Supabase setup
2. ✅ Register first user (becomes master admin)
3. ✅ Start adding clients and data
4. 🔜 Invite team members
5. 🔜 Set up production deployment
6. 🔜 Configure email templates (optional)
7. 🔜 Enable OAuth providers (Google, GitHub, etc.)

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.

**Ready to Deploy?** Follow the Production Deployment section above.

---

Made with ❤️ using Next.js + Supabase + NextAuth.js
