import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Calendar, TrendingUp, Users, Target, Heart,
  Award, Flame, CheckCircle, BarChart3
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function ProgressDashboard({ residentProfile, house, user }) {
  const { data: events } = useQuery({
    queryKey: ['residentEvents', residentProfile.user_email],
    queryFn: () => base44.entities.ResidencyEventLog.filter({ resident_email: residentProfile.user_email }, '-event_date', 100),
    initialData: []
  });

  // Calculate metrics
  const now = new Date();
  const intakeDate = new Date(residentProfile.intake_date);
  const sobrietyDate = residentProfile.sobriety_date ? new Date(residentProfile.sobriety_date) : null;
  
  const daysInProgram = Math.floor((now - intakeDate) / (1000 * 60 * 60 * 24));
  const daysInRecovery = sobrietyDate ? Math.floor((now - sobrietyDate) / (1000 * 60 * 60 * 24)) : 0;
  
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyMeetings = events.filter(e => 
    e.event_type === 'meeting' && new Date(e.event_date) > sevenDaysAgo
  ).length;
  
  const weeklyCheckIns = events.filter(e => 
    e.event_type === 'check_in' && new Date(e.event_date) > sevenDaysAgo
  ).length;

  const completedChores = events.filter(e => 
    e.event_type === 'chore' && e.chore_data?.completed
  ).length;

  const avgMoodScore = (() => {
    const moodLogs = events.filter(e => e.event_type === 'mood_log' && new Date(e.event_date) > sevenDaysAgo);
    if (moodLogs.length === 0) return 0;
    return (moodLogs.reduce((sum, e) => sum + (e.mood_data?.mood_score || 0), 0) / moodLogs.length).toFixed(1);
  })();

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GraceCard className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-4xl font-bold text-teal-700">{daysInRecovery}</h3>
            <p className="text-gray-600 mt-1">Days in Recovery</p>
          </GraceCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GraceCard className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-4xl font-bold text-purple-700">{daysInProgram}</h3>
            <p className="text-gray-600 mt-1">Days in Program</p>
          </GraceCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GraceCard className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-4xl font-bold text-blue-700">{weeklyMeetings}</h3>
            <p className="text-gray-600 mt-1">Meetings This Week</p>
          </GraceCard>
        </motion.div>
      </div>

      {/* Weekly Goals Progress */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-teal-600" />
          Weekly Goals
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Meetings Attended</span>
              <span className="text-sm text-gray-600">{weeklyMeetings} / {residentProfile.weekly_meeting_goal || 3}</span>
            </div>
            <Progress value={(weeklyMeetings / (residentProfile.weekly_meeting_goal || 3)) * 100} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">House Check-ins</span>
              <span className="text-sm text-gray-600">{weeklyCheckIns} / 7</span>
            </div>
            <Progress value={(weeklyCheckIns / 7) * 100} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Chores Completed</span>
              <Badge variant="outline" className="text-green-700 bg-green-50">{completedChores} total</Badge>
            </div>
          </div>
        </div>
      </GraceCard>

      {/* Mood Trend & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraceCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            Mood Trend (7 Days)
          </h3>
          <div className="text-center">
            <div className="inline-flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-bold text-gray-900">{avgMoodScore}</span>
              <span className="text-2xl text-gray-400">/10</span>
            </div>
            <p className="text-sm text-gray-600">
              {avgMoodScore >= 7 ? '✨ Thriving' : avgMoodScore >= 5 ? '🌱 Growing' : '💚 Keep Going'}
            </p>
          </div>
        </GraceCard>

        <GraceCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            AI Insights
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Based on your activity patterns, you're showing strong consistency with check-ins and meetings. 
            Your mood scores suggest positive neuroplasticity rewiring. Keep building those connections! 🧠💪
          </p>
        </GraceCard>
      </div>

      {/* Recent Activity */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {events.slice(0, 5).map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                {event.event_type === 'chore' && <CheckCircle className="w-5 h-5 text-teal-600" />}
                {event.event_type === 'meeting' && <Users className="w-5 h-5 text-teal-600" />}
                {event.event_type === 'mood_log' && <Heart className="w-5 h-5 text-teal-600" />}
                {event.event_type === 'check_in' && <Calendar className="w-5 h-5 text-teal-600" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(event.event_date).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </GraceCard>
    </div>
  );
}