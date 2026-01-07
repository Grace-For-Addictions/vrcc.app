import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Target, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function CoachingAnalytics({ sessions, user }) {
  const analytics = {
    totalSessions: sessions.length,
    uniqueParticipants: new Set(sessions.map(s => s.contact_name)).size,
    referralsMade: sessions.filter(s => s.referral_made).length,
    goalsSet: sessions.filter(s => s.goal_set).length,
    warmHandoffs: sessions.filter(s => s.warm_handoff).length,
    avgDaysInRecovery: sessions.filter(s => s.days_in_recovery).length > 0
      ? Math.round(sessions.filter(s => s.days_in_recovery).reduce((sum, s) => sum + parseInt(s.days_in_recovery || 0), 0) / sessions.filter(s => s.days_in_recovery).length)
      : 0,
    activityTypeBreakdown: sessions.reduce((acc, s) => {
      acc[s.activity_type] = (acc[s.activity_type] || 0) + 1;
      return acc;
    }, {}),
    referralTypes: sessions
      .filter(s => s.referral_type)
      .reduce((acc, s) => {
        acc[s.referral_type] = (acc[s.referral_type] || 0) + 1;
        return acc;
      }, {})
  };

  const topActivityTypes = Object.entries(analytics.activityTypeBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topReferralTypes = Object.entries(analytics.referralTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GraceCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-blue-700">{analytics.totalSessions}</p>
              <p className="text-sm text-gray-600">Total Sessions</p>
            </div>
            <BarChart3 className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
          <Progress value={100} className="h-2" />
        </GraceCard>

        <GraceCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-green-700">{analytics.uniqueParticipants}</p>
              <p className="text-sm text-gray-600">Unique Participants</p>
            </div>
            <Users className="w-10 h-10 text-green-600 opacity-20" />
          </div>
          <Progress value={(analytics.uniqueParticipants / analytics.totalSessions) * 100} className="h-2" />
        </GraceCard>

        <GraceCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-purple-700">{analytics.referralsMade}</p>
              <p className="text-sm text-gray-600">Referrals Made</p>
            </div>
            <Target className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
          <Progress value={(analytics.referralsMade / analytics.totalSessions) * 100} className="h-2" />
        </GraceCard>
      </div>

      {/* Key Performance Indicators */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-600" />
          Key Performance Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-teal-50 rounded-lg">
            <p className="text-sm font-medium text-teal-900 mb-2">Goal Setting Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-teal-700">
                {((analytics.goalsSet / analytics.totalSessions) * 100).toFixed(0)}%
              </span>
              <span className="text-sm text-gray-600">of sessions</span>
            </div>
            <Progress value={(analytics.goalsSet / analytics.totalSessions) * 100} className="mt-2 h-2" />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Warm Hand-off Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-700">
                {analytics.referralsMade > 0 ? ((analytics.warmHandoffs / analytics.referralsMade) * 100).toFixed(0) : 0}%
              </span>
              <span className="text-sm text-gray-600">of referrals</span>
            </div>
            <Progress value={analytics.referralsMade > 0 ? (analytics.warmHandoffs / analytics.referralsMade) * 100 : 0} className="mt-2 h-2" />
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-900 mb-2">Avg Days in Recovery</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-700">{analytics.avgDaysInRecovery}</span>
              <span className="text-sm text-gray-600">days</span>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">Referral Effectiveness</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-700">
                {((analytics.referralsMade / analytics.totalSessions) * 100).toFixed(0)}%
              </span>
              <span className="text-sm text-gray-600">conversion</span>
            </div>
            <Progress value={(analytics.referralsMade / analytics.totalSessions) * 100} className="mt-2 h-2" />
          </div>
        </div>
      </GraceCard>

      {/* Activity Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraceCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Activity Types</h3>
          <div className="space-y-3">
            {topActivityTypes.map(([type, count], idx) => (
              <motion.div
                key={type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                  <Badge variant="outline">{count} sessions</Badge>
                </div>
                <Progress value={(count / analytics.totalSessions) * 100} className="h-2" />
              </motion.div>
            ))}
          </div>
        </GraceCard>

        <GraceCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Referral Types</h3>
          <div className="space-y-3">
            {topReferralTypes.length > 0 ? (
              topReferralTypes.map(([type, count], idx) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                    <Badge variant="outline">{count} referrals</Badge>
                  </div>
                  <Progress value={(count / analytics.referralsMade) * 100} className="h-2" />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No referrals tracked yet</p>
              </div>
            )}
          </div>
        </GraceCard>
      </div>
    </div>
  );
}