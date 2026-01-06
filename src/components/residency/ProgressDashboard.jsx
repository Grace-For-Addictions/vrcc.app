import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Calendar, TrendingUp, Users, Target, Heart,
  Award, Flame, CheckCircle, BarChart3, Sparkles, Loader2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

function AIInsights({ events, avgMoodScore, weeklyMeetings, daysInRecovery, residentProfile }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateInsights = async () => {
      setLoading(true);
      try {
        const moodLogs = events.filter(e => e.event_type === 'mood_log').slice(0, 14);
        const meetingPatterns = events.filter(e => e.event_type === 'meeting').slice(0, 10);
        
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an AI recovery coach analyzing a resident's progress in GFA recovery housing. Generate personalized, actionable insights based on:

Days in recovery: ${daysInRecovery}
Average mood (7 days): ${avgMoodScore}/10
Weekly meetings: ${weeklyMeetings}
Recent mood trend: ${moodLogs.map(m => m.mood_data?.mood_score || 'N/A').join(', ')}
Meeting attendance pattern: ${meetingPatterns.length} meetings in 2 weeks

Provide:
1. A warm, encouraging observation about their progress
2. One predictive insight (potential challenge or opportunity in next 7 days)
3. One specific actionable recommendation
4. A neuroplasticity connection

Keep it brief, warm, and person-first. Use emojis sparingly.`,
          response_json_schema: {
            type: "object",
            properties: {
              observation: { type: "string" },
              prediction: { type: "string" },
              recommendation: { type: "string" },
              brain_connection: { type: "string" }
            }
          }
        });

        setInsights(response);
      } catch (error) {
        setInsights({
          observation: "You're showing up, and that's what matters.",
          prediction: "Keep building your recovery momentum.",
          recommendation: "Focus on one meeting at a time.",
          brain_connection: "Every healthy choice rewires your brain for resilience."
        });
      } finally {
        setLoading(false);
      }
    };

    generateInsights();
  }, [events, avgMoodScore, weeklyMeetings, daysInRecovery]);

  if (loading) {
    return (
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          AI Insights
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </GraceCard>
    );
  }

  return (
    <GraceCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-teal-600" />
        AI Insights
      </h3>
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-teal-700 mb-1">Progress Observation:</p>
          <p className="text-gray-700">{insights.observation}</p>
        </div>
        <div>
          <p className="font-medium text-purple-700 mb-1">Next Week Prediction:</p>
          <p className="text-gray-700">{insights.prediction}</p>
        </div>
        <div>
          <p className="font-medium text-blue-700 mb-1">Recommendation:</p>
          <p className="text-gray-700">{insights.recommendation}</p>
        </div>
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 italic">🧠 {insights.brain_connection}</p>
        </div>
      </div>
    </GraceCard>
  );
}

function DailyAffirmation({ events, residentProfile }) {
  const [affirmation, setAffirmation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateAffirmation = async () => {
      setLoading(true);
      try {
        const todayEvents = events.filter(e => {
          const eventDate = new Date(e.event_date);
          const today = new Date();
          return eventDate.toDateString() === today.toDateString();
        });

        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate a personalized daily affirmation and focus for a recovery housing resident. Consider:

Today's logged activities: ${todayEvents.length > 0 ? todayEvents.map(e => e.title).join(', ') : 'Starting fresh today'}
Days in recovery: ${residentProfile.sobriety_date ? Math.floor((new Date() - new Date(residentProfile.sobriety_date)) / (1000 * 60 * 60 * 24)) : 'Building momentum'}

Provide:
1. A powerful, present-tense affirmation (I am..., I choose..., I embrace...)
2. Today's focus (one simple intention)

Keep it empowering, brief, and recovery-focused.`,
          response_json_schema: {
            type: "object",
            properties: {
              affirmation: { type: "string" },
              focus: { type: "string" }
            }
          }
        });

        setAffirmation(response);
      } catch (error) {
        setAffirmation({
          affirmation: "I am building a life worth living, one choice at a time.",
          focus: "Today, I choose connection over isolation."
        });
      } finally {
        setLoading(false);
      }
    };

    generateAffirmation();
  }, [events, residentProfile]);

  if (loading) {
    return (
      <GraceCard gradient>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </GraceCard>
    );
  }

  return (
    <GraceCard gradient className="text-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Today's Affirmation</h3>
        <p className="text-lg text-gray-800 font-medium mb-4 italic">"{affirmation.affirmation}"</p>
        <div className="pt-4 border-t border-teal-200">
          <p className="text-sm font-semibold text-teal-700 mb-1">Focus for Today:</p>
          <p className="text-gray-700">{affirmation.focus}</p>
        </div>
      </motion.div>
    </GraceCard>
  );
}

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

        <AIInsights 
          events={events}
          avgMoodScore={avgMoodScore}
          weeklyMeetings={weeklyMeetings}
          daysInRecovery={daysInRecovery}
          residentProfile={residentProfile}
        />
      </div>

      {/* Daily Affirmation */}
      <DailyAffirmation 
        events={events}
        residentProfile={residentProfile}
      />

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