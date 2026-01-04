import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2, Clock, Users, BarChart3, MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function ProviderDashboard({ provider, referrals }) {
  const statusCounts = {
    pending: referrals.filter(r => r.status === 'pending').length,
    accepted: referrals.filter(r => r.status === 'accepted').length,
    completed: referrals.filter(r => r.status === 'completed').length,
    declined: referrals.filter(r => r.status === 'declined').length
  };

  const acceptanceRate = referrals.length > 0 
    ? ((statusCounts.accepted + statusCounts.completed) / referrals.length * 100).toFixed(0)
    : 0;

  const completionRate = referrals.length > 0
    ? (statusCounts.completed / referrals.length * 100).toFixed(0)
    : 0;

  // Service breakdown
  const serviceBreakdown = referrals.reduce((acc, r) => {
    acc[r.service_needed] = (acc[r.service_needed] || 0) + 1;
    return acc;
  }, {});

  const topServices = Object.entries(serviceBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GraceCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{referrals.length}</p>
              <p className="text-sm text-gray-600">Total Referrals</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{acceptanceRate}%</p>
              <p className="text-sm text-gray-600">Acceptance Rate</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{completionRate}%</p>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
          </div>
        </GraceCard>
      </div>

      {/* Service Distribution */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          Service Request Distribution
        </h3>
        <div className="space-y-3">
          {topServices.map(([service, count]) => (
            <div key={service}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{service}</span>
                <Badge>{count} requests</Badge>
              </div>
              <Progress value={(count / referrals.length) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </GraceCard>

      {/* Demographics (Anonymized) */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600" />
          Participant Demographics (Aggregated)
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Data shown with explicit user consent, fully anonymized and aggregated
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-indigo-700">{provider.county}</p>
            <p className="text-sm text-gray-600">Primary Service Area</p>
          </div>
          <div className="p-4 bg-teal-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-teal-700">{statusCounts.pending}</p>
            <p className="text-sm text-gray-600">Pending Review</p>
          </div>
        </div>
      </GraceCard>
    </div>
  );
}