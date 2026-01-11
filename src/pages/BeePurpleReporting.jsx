import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import RoleGuard from '@/components/navigation/RoleGuard';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, Download, Filter, TrendingUp, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceHeader from '@/components/common/GraceHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function BeePurpleReporting() {
  const [dateRange, setDateRange] = useState('30');
  const [demographicFilter, setDemographicFilter] = useState('all');

  // Fetch all relevant data
  const { data: profiles } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: []
  });

  const { data: assessments } = useQuery({
    queryKey: ['allAssessments', dateRange],
    queryFn: () => base44.entities.Assessment.list('-created_date', parseInt(dateRange) * 10),
    initialData: []
  });

  const { data: checkIns } = useQuery({
    queryKey: ['allCheckIns', dateRange],
    queryFn: () => base44.entities.DailyCheckIn.list('-created_date', parseInt(dateRange) * 10),
    initialData: []
  });

  const { data: communications } = useQuery({
    queryKey: ['allCommunications', dateRange],
    queryFn: () => base44.entities.CommunicationLog.list('-created_date', parseInt(dateRange) * 10),
    initialData: []
  });

  const { data: goals } = useQuery({
    queryKey: ['allGoals'],
    queryFn: () => base44.entities.MenteeGoal.list(),
    initialData: []
  });

  // Calculate demographics
  const demographicsData = [
    { name: 'Substance Use', value: profiles.filter(p => p.pathways?.includes('substance_use')).length },
    { name: 'Mental Health', value: profiles.filter(p => p.pathways?.includes('mental_health')).length },
    { name: 'Justice Involved', value: profiles.filter(p => p.pathways?.includes('justice_involved')).length },
    { name: 'Family Ally', value: profiles.filter(p => p.pathways?.includes('family_ally')).length },
    { name: 'Youth', value: profiles.filter(p => p.pathways?.includes('youth')).length }
  ];

  // Engagement over time
  const last30Days = [...Array(30)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      date: format(date, 'MMM d'),
      checkIns: checkIns.filter(c => c.created_date?.startsWith(dateStr)).length,
      assessments: assessments.filter(a => a.created_date?.startsWith(dateStr)).length
    };
  });

  // Goal completion rates
  const goalStats = [
    { status: 'Active', count: goals.filter(g => g.status === 'active').length },
    { status: 'Completed', count: goals.filter(g => g.status === 'completed').length },
    { status: 'On Hold', count: goals.filter(g => g.status === 'on_hold').length },
    { status: 'Abandoned', count: goals.filter(g => g.status === 'abandoned').length }
  ];

  // Communication breakdown
  const commStats = [
    { type: 'Phone', count: communications.filter(c => c.type === 'phone').length },
    { type: 'Email', count: communications.filter(c => c.type === 'email').length },
    { type: 'Meeting', count: communications.filter(c => c.type === 'meeting').length },
    { type: 'Message', count: communications.filter(c => c.type === 'message').length }
  ];

  // Recovery capital trends
  const avgBarcScore = assessments.length > 0
    ? (assessments.reduce((sum, a) => sum + (a.total_score || 0), 0) / assessments.length).toFixed(1)
    : 0;

  const exportReport = () => {
    const reportData = {
      generated: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      summary: {
        totalParticipants: profiles.length,
        totalCheckIns: checkIns.length,
        totalAssessments: assessments.length,
        avgRecoveryCapital: avgBarcScore,
        totalCommunications: communications.length,
        totalGoals: goals.length
      },
      demographics: demographicsData,
      goalStats,
      communicationStats: commStats
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beepurple-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <RoleGuard allowedRoles={['program_staff']} pageName="BeePurple Analytics & Reporting">
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader
          title="BeePurple Analytics & Reporting"
          subtitle="Custom reports and insights from your 5CRM data"
          icon={BarChart3}
        />

        {/* Controls */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={exportReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-sm text-gray-600">Total Participants</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{checkIns.length}</p>
                <p className="text-sm text-gray-600">Check-ins</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{avgBarcScore}</p>
                <p className="text-sm text-gray-600">Avg BARC Score</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{communications.length}</p>
                <p className="text-sm text-gray-600">Communications</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="engagement" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
          </TabsList>

          {/* Engagement Tab */}
          <TabsContent value="engagement">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Engagement Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last30Days}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="checkIns" stroke="#8884d8" name="Check-ins" />
                  <Line type="monotone" dataKey="assessments" stroke="#82ca9d" name="Assessments" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Participant Pathways</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={demographicsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {demographicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Goal Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={goalStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Communication Channels</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={commStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </RoleGuard>
  );
}