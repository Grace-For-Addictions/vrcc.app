import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, Activity, Zap } from 'lucide-react';
import GraceCard from '@/components/common/GraceCard';

export default function RealTimeAnalytics() {
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);

  // Poll for new data every 5 seconds
  const { data: latestOutcomes } = useQuery({
    queryKey: ['realtimeOutcomes'],
    queryFn: () => base44.entities.OutcomeTracking.list('-created_date', 10),
    refetchInterval: 5000,
    initialData: []
  });

  const { data: latestSessions } = useQuery({
    queryKey: ['realtimeSessions'],
    queryFn: () => base44.entities.CoachingSessionLog.list('-created_date', 10),
    refetchInterval: 5000,
    initialData: []
  });

  const { data: latestReferrals } = useQuery({
    queryKey: ['realtimeReferrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 10),
    refetchInterval: 5000,
    initialData: []
  });

  useEffect(() => {
    // Track new submissions that impact dollar amounts
    const newUpdates = [];

    latestOutcomes.forEach(outcome => {
      if (outcome.cost_avoidance_estimate && new Date(outcome.created_date) > new Date(Date.now() - 30000)) {
        newUpdates.push({
          type: 'outcome',
          impact: outcome.cost_avoidance_estimate,
          description: `${outcome.outcome_type.replace(/_/g, ' ')} outcome recorded`,
          timestamp: outcome.created_date
        });
      }
    });

    latestSessions.forEach(session => {
      if (session.referral_made && new Date(session.created_date) > new Date(Date.now() - 30000)) {
        // Average referral value estimate
        const estimatedValue = 15000;
        newUpdates.push({
          type: 'referral',
          impact: estimatedValue,
          description: `${session.referral_type} referral made`,
          timestamp: session.created_date
        });
      }
    });

    if (newUpdates.length > 0) {
      setRealtimeUpdates(prev => [...newUpdates, ...prev].slice(0, 5));
    }
  }, [latestOutcomes, latestSessions, latestReferrals]);

  const totalRealtimeImpact = realtimeUpdates.reduce((sum, u) => sum + u.impact, 0);

  return (
    <GraceCard className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="font-bold text-lg">Real-Time Impact Monitor</h4>
          <p className="text-xs text-teal-100">Live tracking of value-generating activities</p>
        </div>
      </div>

      <div className="bg-white/10 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Last 30 seconds impact:</span>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-2xl font-bold">
              ${totalRealtimeImpact.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {realtimeUpdates.map((update, idx) => (
            <motion.div
              key={`${update.timestamp}-${idx}`}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white/10 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-300" />
                <div>
                  <p className="text-sm font-medium">{update.description}</p>
                  <p className="text-xs text-teal-100">
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold">
                <DollarSign className="w-4 h-4" />
                {update.impact.toLocaleString()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {realtimeUpdates.length === 0 && (
        <p className="text-center text-teal-100 text-sm py-4">
          Monitoring for new submissions...
        </p>
      )}
    </GraceCard>
  );
}