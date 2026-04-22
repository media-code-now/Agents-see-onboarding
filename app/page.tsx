'use client';

import { useApp } from '@/contexts/AppContext';
import TopBar from '@/components/TopBar';
import Card, { CardBody, CardHeader } from '@/components/Card';
import { Users, Calendar, Shield, UserCog } from 'lucide-react';
import { formatDate, isThisWeek } from '@/lib/utils';

export default function DashboardPage() {
  const { data } = useApp();

  const stats = [
    {
      name: 'Total Clients',
      value: data.clients.length,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Active This Week',
      value: data.weeklyPlans.filter((w) => isThisWeek(w.weekOf)).length,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      name: 'Security Issues',
      value: data.securityReviews.filter((s) => s.riskLevel === 'High').length,
      icon: Shield,
      color: 'bg-red-500',
    },
    {
      name: 'Team Members',
      value: data.teamMembers.length,
      icon: UserCog,
      color: 'bg-purple-500',
    },
  ];

  const recentActivity = [
    ...data.clients.map((c) => ({ type: 'client', date: c.createdDate, name: c.businessName })),
    ...data.weeklyPlans.map((w) => ({ type: 'plan', date: w.weekOf, name: w.clientName })),
    ...data.securityReviews.map((s) => ({ type: 'security', date: s.reviewDate, name: s.clientName })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen">
      <TopBar title="Dashboard" />
      
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{stat.name}</p>
                      <p className="mt-3 text-4xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`rounded-2xl ${stat.color} p-4`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold tracking-tight text-white">Recent Activity</h2>
          </CardHeader>
          <CardBody>
            {recentActivity.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">No activity yet. Create your first client to get started!</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, index) => {
                  const icon = item.type === 'client' ? '👥' : item.type === 'plan' ? '📋' : '🔒';
                  const label = item.type === 'client' ? 'New Client' : item.type === 'plan' ? 'Weekly Plan' : 'Security Review';
                  
                  return (
                    <div key={index} className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-xl transition-all hover:bg-white/10">
                      <span className="text-3xl">{icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{label}: {item.name}</p>
                        <p className="mt-1 text-sm text-gray-500">{formatDate(item.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
