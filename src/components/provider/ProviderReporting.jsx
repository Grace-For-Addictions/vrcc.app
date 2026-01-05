import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Download, TrendingUp, Users, CheckCircle2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function ProviderReporting({ provider, referrals }) {
  const [timeRange, setTimeRange] = useState('30');
  const [exporting, setExporting] = useState(false);

  const filterByDays = (days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    return referrals.filter(r => new Date(r.created_date) >= cutoff);
  };

  const filteredReferrals = filterByDays(timeRange);

  // Calculate metrics
  const acceptanceRate = filteredReferrals.length > 0
    ? ((filteredReferrals.filter(r => r.status === 'accepted' || r.status === 'completed').length / filteredReferrals.length) * 100).toFixed(1)
    : 0;

  const completionRate = filteredReferrals.length > 0
    ? ((filteredReferrals.filter(r => r.status === 'completed').length / filteredReferrals.length) * 100).toFixed(1)
    : 0;

  const avgResponseTime = filteredReferrals
    .filter(r => r.status !== 'pending')
    .reduce((sum, r) => {
      const created = new Date(r.created_date);
      const updated = new Date(r.updated_date);
      return sum + (updated - created) / (1000 * 60 * 60 * 24); // days
    }, 0) / (filteredReferrals.filter(r => r.status !== 'pending').length || 1);

  // Service breakdown
  const serviceBreakdown = filteredReferrals.reduce((acc, r) => {
    acc[r.service_needed] = (acc[r.service_needed] || 0) + 1;
    return acc;
  }, {});

  // Demographic aggregation (anonymized)
  const referralTypeBreakdown = filteredReferrals.reduce((acc, r) => {
    acc[r.referral_type] = (acc[r.referral_type] || 0) + 1;
    return acc;
  }, {});

  const exportReport = async () => {
    setExporting(true);
    try {
      const reportData = {
        provider: provider.organization_name,
        report_period: `Last ${timeRange} days`,
        generated: new Date().toISOString(),
        summary: {
          total_referrals: filteredReferrals.length,
          acceptance_rate: `${acceptanceRate}%`,
          completion_rate: `${completionRate}%`,
          avg_response_time_days: avgResponseTime.toFixed(1)
        },
        service_breakdown: serviceBreakdown,
        referral_type_breakdown: referralTypeBreakdown
      };

      const csv = [
        'Provider Referral Report',
        `Organization: ${reportData.provider}`,
        `Period: ${reportData.report_period}`,
        `Generated: ${new Date(reportData.generated).toLocaleString()}`,
        '',
        'Summary Metrics',
        `Total Referrals,${reportData.summary.total_referrals}`,
        `Acceptance Rate,${reportData.summary.acceptance_rate}`,
        `Completion Rate,${reportData.summary.completion_rate}`,
        `Avg Response Time (days),${reportData.summary.avg_response_time_days}`,
        '',
        'Service Breakdown',
        ...Object.entries(serviceBreakdown).map(([service, count]) => `${service},${count}`),
        '',
        'Referral Type Breakdown',
        ...Object.entries(referralTypeBreakdown).map(([type, count]) => `${type},${count}`)
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `provider_report_${provider.organization_name}_${Date.now()}.csv`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={timeRange} onValueChange={setTimeRange}>
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

        <Button onClick={exportReport} disabled={exporting} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GraceCard>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Acceptance Rate</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{acceptanceRate}%</p>
          <Progress value={acceptanceRate} className="h-2 mt-2" />
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{completionRate}%</p>
          <Progress value={completionRate} className="h-2 mt-2" />
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Referrals</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{filteredReferrals.length}</p>
          <p className="text-sm text-gray-500 mt-2">Avg response: {avgResponseTime.toFixed(1)} days</p>
        </GraceCard>
      </div>

      {/* Service Distribution */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          Service Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(serviceBreakdown).map(([service, count]) => (
            <div key={service}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{service}</span>
                <Badge variant="outline">{count} ({((count / filteredReferrals.length) * 100).toFixed(0)}%)</Badge>
              </div>
              <Progress value={(count / filteredReferrals.length) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </GraceCard>

      {/* Referral Type Breakdown */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Type Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(referralTypeBreakdown).map(([type, count]) => (
            <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </GraceCard>
    </div>
  );
}