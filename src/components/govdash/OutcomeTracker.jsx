import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Filter, Download, BarChart3, PieChart, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GraceCard from '@/components/common/GraceCard';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#14b8a6', '#8b5cf6', '#f97316', '#3b82f6', '#ec4899', '#10b981'];

export default function OutcomeTracker({ sessions, outcomes }) {
  const [dateRange, setDateRange] = useState('90');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');

  // Filter data
  const filteredSessions = sessions.filter(s => {
    const dateMatch = dateRange === 'all' || 
      (new Date(s.activity_date) > new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000));
    const programMatch = programFilter === 'all' || s.operating_program === programFilter;
    return dateMatch && programMatch;
  });

  const filteredOutcomes = outcomes.filter(o => {
    const dateMatch = dateRange === 'all' || 
      (new Date(o.outcome_date) > new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000));
    const typeMatch = outcomeFilter === 'all' || o.outcome_type === outcomeFilter;
    return dateMatch && typeMatch;
  });

  // Calculate metrics
  const totalParticipants = new Set(filteredSessions.map(s => s.contact_email || s.contact_name)).size;
  const housingStability = filteredOutcomes.filter(o => o.outcome_type === 'housing_stability').length;
  const crisisDiversion = filteredOutcomes.filter(o => o.outcome_type === 'crisis_diversion').length;
  const employmentGained = filteredOutcomes.filter(o => o.outcome_type === 'employment_gained').length;
  const overdosePrevented = filteredOutcomes.filter(o => o.outcome_type === 'overdose_prevented').length;
  
  const totalCostAvoidance = filteredOutcomes.reduce((sum, o) => sum + (o.cost_avoidance_estimate || 0), 0);

  // Outcome type distribution
  const outcomeDistribution = filteredOutcomes.reduce((acc, o) => {
    acc[o.outcome_type] = (acc[o.outcome_type] || 0) + 1;
    return acc;
  }, {});

  const outcomeChartData = Object.entries(outcomeDistribution).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    count: value
  }));

  // Monthly trend
  const monthlyTrend = filteredOutcomes.reduce((acc, o) => {
    const month = new Date(o.outcome_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const trendData = Object.entries(monthlyTrend).map(([month, count]) => ({
    month,
    outcomes: count
  }));

  // Program effectiveness
  const programStats = filteredSessions.reduce((acc, s) => {
    const prog = s.operating_program || 'Not specified';
    if (!acc[prog]) {
      acc[prog] = { sessions: 0, referrals: 0, goals: 0 };
    }
    acc[prog].sessions++;
    if (s.referral_made) acc[prog].referrals++;
    if (s.goal_set) acc[prog].goals++;
    return acc;
  }, {});

  const programs = Object.keys(programStats);

  const exportData = () => {
    const csvData = filteredOutcomes.map(o => ({
      Date: o.outcome_date,
      Type: o.outcome_type,
      Description: o.description,
      CostAvoidance: o.cost_avoidance_estimate,
      VerifiedBy: o.verified_by
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GFA_Outcomes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GraceCard>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-bold text-gray-900">Advanced Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Outcome Type</label>
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="housing_stability">Housing Stability</SelectItem>
                <SelectItem value="crisis_diversion">Crisis Diversion</SelectItem>
                <SelectItem value="employment_gained">Employment Gained</SelectItem>
                <SelectItem value="justice_reduction">Justice Reduction</SelectItem>
                <SelectItem value="overdose_prevented">Overdose Prevention</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Program</label>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={exportData} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </GraceCard>

      {/* Impact Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GraceCard className="text-center">
          <div className="text-3xl font-bold text-teal-700">{totalParticipants}</div>
          <div className="text-xs text-gray-600">Unique Participants</div>
        </GraceCard>

        <GraceCard className="text-center">
          <div className="text-3xl font-bold text-blue-700">{housingStability}</div>
          <div className="text-xs text-gray-600">Housing Secured</div>
        </GraceCard>

        <GraceCard className="text-center">
          <div className="text-3xl font-bold text-green-700">{employmentGained}</div>
          <div className="text-xs text-gray-600">Jobs Obtained</div>
        </GraceCard>

        <GraceCard className="text-center">
          <div className="text-3xl font-bold text-orange-700">{crisisDiversion}</div>
          <div className="text-xs text-gray-600">Crisis Diversions</div>
        </GraceCard>

        <GraceCard className="text-center">
          <div className="text-3xl font-bold text-red-700">{overdosePrevented}</div>
          <div className="text-xs text-gray-600">Overdoses Prevented</div>
        </GraceCard>
      </div>

      {/* Cost Avoidance */}
      <GraceCard gradient>
        <div className="text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-3 text-green-600" />
          <h3 className="text-4xl font-bold text-green-700 mb-2">
            ${totalCostAvoidance.toLocaleString()}
          </h3>
          <p className="text-gray-700 font-medium">Estimated Cost Avoidance to Iowa Systems</p>
          <p className="text-sm text-gray-600 mt-2">
            Based on verified outcomes in healthcare, justice, housing, and crisis services
          </p>
        </div>
      </GraceCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4">Outcome Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={outcomeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </GraceCard>

        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4">Monthly Outcome Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="outcomes" stroke="#14b8a6" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </GraceCard>
      </div>

      {/* Program Performance */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Program Performance Comparison</h4>
        <div className="space-y-3">
          {Object.entries(programStats).map(([program, stats]) => (
            <div key={program} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-gray-900">{program}</h5>
                <Badge variant="outline">{stats.sessions} sessions</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Referral Rate</p>
                  <p className="font-bold text-teal-700">
                    {Math.round((stats.referrals / stats.sessions) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Goal Setting Rate</p>
                  <p className="font-bold text-purple-700">
                    {Math.round((stats.goals / stats.sessions) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Participants</p>
                  <p className="font-bold text-blue-700">{stats.sessions}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GraceCard>
    </div>
  );
}