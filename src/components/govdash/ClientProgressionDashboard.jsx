import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Award, Activity } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import GraceCard from '@/components/common/GraceCard';
import { Badge } from '@/components/ui/badge';

export default function ClientProgressionDashboard() {
  const { data: assessments } = useQuery({
    queryKey: ['all-assessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 500),
    initialData: []
  });

  const { data: journeys } = useQuery({
    queryKey: ['all-journeys'],
    queryFn: () => base44.entities.RecoveryJourney.list('-last_ai_update', 200),
    initialData: []
  });

  const { data: sessions } = useQuery({
    queryKey: ['all-sessions-progression'],
    queryFn: () => base44.entities.CoachingSessionLog.list('-activity_date', 1000),
    initialData: []
  });

  // Build progression data
  const progressionData = journeys.map(j => {
    const userAssessments = assessments.filter(a => a.created_by === j.user_email);
    const latestScore = userAssessments[0]?.total_score || 0;
    const firstScore = userAssessments[userAssessments.length - 1]?.total_score || 0;
    const improvement = latestScore - firstScore;
    
    const userSessions = sessions.filter(s => s.contact_email === j.user_email).length;

    return {
      engagement_score: j.engagement_score || 0,
      recovery_capital: latestScore,
      improvement,
      phase: j.journey_phase,
      session_count: userSessions,
      email: j.user_email
    };
  });

  // Phase statistics
  const phaseStats = {
    onboarding: progressionData.filter(p => p.phase === 'onboarding').length,
    early_engagement: progressionData.filter(p => p.phase === 'early_engagement').length,
    active_participation: progressionData.filter(p => p.phase === 'active_participation').length,
    sustained_recovery: progressionData.filter(p => p.phase === 'sustained_recovery').length,
    peer_leader: progressionData.filter(p => p.phase === 'peer_leader').length
  };

  const avgRecoveryCapital = progressionData.length > 0 
    ? Math.round(progressionData.reduce((sum, p) => sum + p.recovery_capital, 0) / progressionData.length)
    : 0;

  const avgEngagement = progressionData.length > 0
    ? Math.round(progressionData.reduce((sum, p) => sum + p.engagement_score, 0) / progressionData.length)
    : 0;

  const phaseColors = {
    onboarding: '#60a5fa',
    early_engagement: '#34d399',
    active_participation: '#14b8a6',
    sustained_recovery: '#a78bfa',
    peer_leader: '#fbbf24'
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Activity className="w-6 h-6 text-teal-600" />
          Client Progression & Engagement Analytics
        </h3>
        <p className="text-gray-700">Interactive visualization of recovery journey stages and outcome correlations</p>
      </GraceCard>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GraceCard className="text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-teal-600" />
          <div className="text-3xl font-bold text-teal-700">{progressionData.length}</div>
          <div className="text-xs text-gray-600">Active Clients</div>
        </GraceCard>

        <GraceCard className="text-center">
          <Award className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <div className="text-3xl font-bold text-purple-700">{avgRecoveryCapital}</div>
          <div className="text-xs text-gray-600">Avg Recovery Capital</div>
        </GraceCard>

        <GraceCard className="text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <div className="text-3xl font-bold text-green-700">{avgEngagement}</div>
          <div className="text-xs text-gray-600">Avg Engagement Score</div>
        </GraceCard>

        <GraceCard className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <div className="text-3xl font-bold text-blue-700">{phaseStats.peer_leader}</div>
          <div className="text-xs text-gray-600">Peer Leaders</div>
        </GraceCard>
      </div>

      {/* Phase Distribution */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Recovery Journey Phase Distribution</h4>
        <div className="space-y-3">
          {Object.entries(phaseStats).map(([phase, count]) => (
            <div key={phase}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 capitalize">{phase.replace(/_/g, ' ')}</span>
                <Badge variant="outline">{count} clients</Badge>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / progressionData.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                  style={{ backgroundColor: phaseColors[phase] }}
                />
              </div>
            </div>
          ))}
        </div>
      </GraceCard>

      {/* Engagement vs Recovery Capital Scatter */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Engagement Score vs Recovery Capital Correlation</h4>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number" 
              dataKey="engagement_score" 
              name="Engagement" 
              label={{ value: 'Engagement Score', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="recovery_capital" 
              name="Recovery Capital" 
              label={{ value: 'Recovery Capital (BARC-10)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Clients" data={progressionData} fill="#14b8a6">
              {progressionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={phaseColors[entry.phase] || '#14b8a6'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(phaseColors).map(([phase, color]) => (
            <div key={phase} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600 capitalize">{phase.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </GraceCard>

      {/* Top Performers */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Highest Engagement & Improvement</h4>
        <div className="space-y-3">
          {progressionData
            .sort((a, b) => (b.engagement_score + b.improvement) - (a.engagement_score + a.improvement))
            .slice(0, 10)
            .map((client, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.email.split('@')[0]}</p>
                    <p className="text-xs text-gray-600 capitalize">{client.phase.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-teal-700">Engagement: {client.engagement_score}</p>
                  <p className="text-xs text-gray-600">Capital: {client.recovery_capital} (+{client.improvement})</p>
                </div>
              </motion.div>
            ))}
        </div>
      </GraceCard>
    </div>
  );
}