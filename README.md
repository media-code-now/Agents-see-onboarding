# SEO Agency Onboarding System

A modern Next.js application built with TypeScript and Tailwind CSS for managing SEO agency client onboarding, weekly planning, security reviews, and team access control.

## 🚀 Features

- **Client Management**: Organize and track all client information including business details, contacts, and services
- **Weekly Planning**: Create and manage weekly work plans with task tracking and status updates
- **Security Reviews**: Conduct and document security audits with risk assessments
- **Team Access Control**: Manage team members and their client assignments
- **Data Export/Import**: Backup and restore all data via JSON files
- **Local Storage**: All data persists in browser localStorage
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Data Storage**: Browser localStorage

## 📦 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser at http://localhost:3000
```

## 🎯 Usage Guide

### Dashboard
View statistics and recent activity across all modules.

### Managing Clients
1. Navigate to "Clients"
2. Click "New Client"
3. Fill in business information
4. Save to add to your client list

### Data Backup
- **Export**: Download JSON backup of all data
- **Import**: Restore from previous backup file

## 📁 Project Structure

```
nextjs-app/
├── app/              # Pages and routes
├── components/       # Reusable UI components
├── contexts/         # State management
├── lib/             # Utilities and helpers
└── types/           # TypeScript definitions
```

## 🚀 Deployment

```bash
npm run build
npm start
```

Deploy to Vercel, Netlify, or any Node.js hosting platform.

---

**Built with Next.js, TypeScript, and Tailwind CSS**

