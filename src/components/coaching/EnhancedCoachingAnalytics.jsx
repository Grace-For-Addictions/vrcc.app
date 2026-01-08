import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, CheckCircle, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { Input } from '@/components/ui/input';

const COLORS = ['#14b8a6', '#8b5cf6', '#f97316', '#3b82f6', '#ec4899', '#10b981'];

export default function EnhancedCoachingAnalytics({ sessions, user }) {
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    const dateMatch = dateRange === 'all' || 
      (new Date(s.activity_date) > new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000));
    const coachMatch = selectedCoach === 'all' || s.coach_name === selectedCoach;
    const typeMatch = activityFilter === 'all' || s.activity_type === activityFilter;
    return dateMatch && coachMatch && typeMatch;
  });

  // Calculate KPIs
  const totalSessions = filteredSessions.length;
  const uniqueParticipants = new Set(filteredSessions.map(s => s.contact_email || s.contact_name)).size;
  const completionRate = filteredSessions.filter(s => s.attendance === 'Yes (Completed)').length / totalSessions * 100;
  const referralsMade = filteredSessions.filter(s => s.referral_made).length;
  const referralSuccessRate = filteredSessions.filter(s => 
    s.referral_status === 'Completed' || s.referral_status === 'Attended'
  ).length / (referralsMade || 1) * 100;
  const goalsSet = filteredSessions.filter(s => s.goal_set).length;
  const warmHandoffs = filteredSessions.filter(s => s.warm_handoff).length;
  const avgDaysInRecovery = filteredSessions.filter(s => s.days_in_recovery)
    .reduce((sum, s) => sum + (s.days_in_recovery || 0), 0) / 
    (filteredSessions.filter(s => s.days_in_recovery).length || 1);

  // Activity type breakdown
  const activityBreakdown = filteredSessions.reduce((acc, s) => {
    acc[s.activity_type] = (acc[s.activity_type] || 0) + 1;
    return acc;
  }, {});

  const activityChartData = Object.entries(activityBreakdown).map(([name, value]) => ({
    name,
    sessions: value
  }));

  // Monthly trend
  const monthlyTrend = filteredSessions.reduce((acc, s) => {
    const month = new Date(s.activity_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const trendData = Object.entries(monthlyTrend).map(([month, count]) => ({
    month,
    sessions: count
  }));

  // Referral outcomes
  const referralOutcomes = filteredSessions.filter(s => s.referral_status).reduce((acc, s) => {
    acc[s.referral_status] = (acc[s.referral_status] || 0) + 1;
    return acc;
  }, {});

  const referralChartData = Object.entries(referralOutcomes).map(([name, value]) => ({
    name,
    value
  }));

  // Client engagement patterns
  const clientEngagement = filteredSessions.reduce((acc, s) => {
    const key = s.contact_email || s.contact_name;
    if (!acc[key]) {
      acc[key] = { name: s.contact_name, sessions: 0, lastSession: s.activity_date };
    }
    acc[key].sessions++;
    if (new Date(s.activity_date) > new Date(acc[key].lastSession)) {
      acc[key].lastSession = s.activity_date;
    }
    return acc;
  }, {});

  const topClients = Object.values(clientEngagement)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  // Unique coaches
  const coaches = ['all', ...new Set(sessions.map(s => s.coach_name).filter(Boolean))];
  const activityTypes = ['all', ...new Set(sessions.map(s => s.activity_type).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GraceCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Coach</label>
            <Select value={selectedCoach} onValueChange={setSelectedCoach}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {coaches.map(coach => (
                  <SelectItem key={coach} value={coach}>
                    {coach === 'all' ? 'All Coaches' : coach}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Activity Type</label>
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GraceCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GraceCard className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <div className="text-3xl font-bold text-blue-700">{totalSessions}</div>
          <div className="text-xs text-gray-600">Total Sessions</div>
        </GraceCard>

        <GraceCard className="text-center">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <div className="text-3xl font-bold text-green-700">{Math.round(completionRate)}%</div>
          <div className="text-xs text-gray-600">Completion Rate</div>
        </GraceCard>

        <GraceCard className="text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <div className="text-3xl font-bold text-purple-700">{Math.round(referralSuccessRate)}%</div>
          <div className="text-xs text-gray-600">Referral Success</div>
        </GraceCard>

        <GraceCard className="text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-teal-600" />
          <div className="text-3xl font-bold text-teal-700">{uniqueParticipants}</div>
          <div className="text-xs text-gray-600">Unique Clients</div>
        </GraceCard>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GraceCard className="text-center">
          <div className="text-2xl font-bold text-gray-900">{referralsMade}</div>
          <div className="text-xs text-gray-600">Referrals Made</div>
        </GraceCard>
        <GraceCard className="text-center">
          <div className="text-2xl font-bold text-gray-900">{goalsSet}</div>
          <div className="text-xs text-gray-600">Goals Set</div>
        </GraceCard>
        <GraceCard className="text-center">
          <div className="text-2xl font-bold text-gray-900">{warmHandoffs}</div>
          <div className="text-xs text-gray-600">Warm Handoffs</div>
        </GraceCard>
        <GraceCard className="text-center">
          <div className="text-2xl font-bold text-gray-900">{Math.round(avgDaysInRecovery)}</div>
          <div className="text-xs text-gray-600">Avg Days Recovery</div>
        </GraceCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Type Distribution */}
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4">Activity Type Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sessions" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </GraceCard>

        {/* Referral Outcomes */}
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4">Referral Outcomes</h4>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie
                data={referralChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {referralChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </GraceCard>

        {/* Session Trend */}
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4">Session Volume Trend</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sessions" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </GraceCard>

        {/* Top Engaged Clients */}
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4">Most Engaged Clients</h4>
          <div className="space-y-2">
            {topClients.map((client, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">
                    Last: {new Date(client.lastSession).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline">{client.sessions} sessions</Badge>
              </div>
            ))}
          </div>
        </GraceCard>
      </div>

      {/* Client Progress Tracking */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Client Progress Trends
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-1">Progressing Well</p>
            <p className="text-2xl font-bold text-green-700">
              {filteredSessions.filter(s => s.participant_status?.includes('Progress')).length}
            </p>
            <p className="text-xs text-gray-600">Active participants making progress</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-900 mb-1">Needs Support</p>
            <p className="text-2xl font-bold text-orange-700">
              {filteredSessions.filter(s => s.participant_status?.includes('Struggling')).length}
            </p>
            <p className="text-xs text-gray-600">May benefit from increased outreach</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Successfully Completed</p>
            <p className="text-2xl font-bold text-blue-700">
              {filteredSessions.filter(s => s.participant_status?.includes('Successful')).length}
            </p>
            <p className="text-xs text-gray-600">Graduated from services</p>
          </div>
        </div>
      </GraceCard>

      {/* Engagement Patterns */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Engagement Patterns</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="text-sm font-medium text-gray-900">Goal Setting Rate</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${(goalsSet / totalSessions) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-purple-700">{Math.round((goalsSet / totalSessions) * 100)}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
            <span className="text-sm font-medium text-gray-900">Warm Handoff Rate</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-teal-600 h-2 rounded-full" 
                  style={{ width: `${(warmHandoffs / referralsMade) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-teal-700">
                {Math.round((warmHandoffs / (referralsMade || 1)) * 100)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-gray-900">Multi-Session Clients</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(topClients.filter(c => c.sessions > 1).length / uniqueParticipants) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-blue-700">
                {Math.round((topClients.filter(c => c.sessions > 1).length / uniqueParticipants) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </GraceCard>
    </div>
  );
}