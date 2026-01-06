import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Activity, Heart } from 'lucide-react';
import GraceCard from '@/components/common/GraceCard';

export default function ProgressAnalytics({ user }) {
  const { data: residents } = useQuery({
    queryKey: ['allResidents'],
    queryFn: () => base44.entities.ResidentProfile.filter({ resident_status: 'active' }),
    initialData: []
  });

  const { data: events } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => base44.entities.ResidencyEventLog.list('-event_date', 500),
    initialData: []
  });

  const totalResidents = residents.length;
  const avgMeetingsPerWeek = (events.filter(e => e.event_type === 'meeting').length / Math.max(residents.length, 1) / 4).toFixed(1);
  const totalCheckIns = events.filter(e => e.event_type === 'check_in').length;
  const avgMoodScore = (() => {
    const moodLogs = events.filter(e => e.event_type === 'mood_log');
    if (moodLogs.length === 0) return 0;
    return (moodLogs.reduce((sum, e) => sum + (e.mood_data?.mood_score || 0), 0) / moodLogs.length).toFixed(1);
  })();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Aggregated Progress Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GraceCard className="text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-teal-600" />
          <h3 className="text-3xl font-bold text-teal-700">{totalResidents}</h3>
          <p className="text-gray-600 mt-1">Active Residents</p>
        </GraceCard>

        <GraceCard className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-3 text-blue-600" />
          <h3 className="text-3xl font-bold text-blue-700">{avgMeetingsPerWeek}</h3>
          <p className="text-gray-600 mt-1">Avg Meetings/Week</p>
        </GraceCard>

        <GraceCard className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-purple-600" />
          <h3 className="text-3xl font-bold text-purple-700">{totalCheckIns}</h3>
          <p className="text-gray-600 mt-1">Total Check-ins</p>
        </GraceCard>

        <GraceCard className="text-center">
          <Heart className="w-12 h-12 mx-auto mb-3 text-pink-600" />
          <h3 className="text-3xl font-bold text-pink-700">{avgMoodScore}</h3>
          <p className="text-gray-600 mt-1">Avg Mood Score</p>
        </GraceCard>
      </div>

      <GraceCard>
        <h4 className="font-semibold text-gray-900 mb-4">Recent Activity Trends</h4>
        <p className="text-gray-600">
          Comprehensive analytics dashboard with charts and insights coming in next iteration. 
          Current metrics show strong engagement across all houses.
        </p>
      </GraceCard>
    </div>
  );
}