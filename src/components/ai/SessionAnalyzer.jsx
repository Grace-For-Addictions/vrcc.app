import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Video, MessageCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function SessionAnalyzer({ user, profile }) {
  const [recommendations, setRecommendations] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    analyzeUserSession();
  }, [user, profile]);

  const analyzeUserSession = async () => {
    setIsAnalyzing(true);
    try {
      // Get recent activity data
      const recentCheckIns = await base44.entities.DailyCheckIn.filter(
        { created_by: user.email },
        '-created_date',
        5
      );

      const recentAssessments = await base44.entities.Assessment.filter(
        { created_by: user.email },
        '-created_date',
        1
      );

      const upcomingEvents = await base44.entities.Event.list('-start_time', 5);

      // Build context for AI
      const context = {
        stage: profile.stage,
        my_why: profile.my_why,
        recent_moods: recentCheckIns.map(c => c.mood),
        current_streak: profile.current_streak || 0,
        recovery_capital_score: recentAssessments[0]?.overall_score,
        current_goal: profile.current_goal
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace (GPT-5.2 on Wix/Base44) analyzing a user's recovery journey to provide personalized recommendations.

USER CONTEXT:
- Recovery Stage: ${context.stage}
- Their Why: ${context.my_why || 'Not set'}
- Current Streak: ${context.current_streak} days
- Recent Moods: ${context.recent_moods.join(', ') || 'None recorded'}
- Recovery Capital Score: ${context.recovery_capital_score || 'Not assessed'}
- Current Goal: ${context.current_goal || 'Not set'}

ANALYZE and suggest 2-3 specific, actionable next steps. Focus on:
1. Resources they haven't explored yet
2. Events matching their stage/interests
3. Community connections that fit their needs
4. Content aligned with their "why"

Use neuroplasticity framing. Be warm and specific.

Return as JSON:`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["event", "resource", "connection", "content", "goal"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  action_link: { type: "string" },
                  action_label: { type: "string" },
                  neuroplasticity_connection: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(response.recommendations);
    } catch (error) {
      console.error('Session analysis failed', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!recommendations || recommendations.length === 0) return null;

  const iconMap = {
    event: Calendar,
    resource: Sparkles,
    connection: MessageCircle,
    content: Video,
    goal: Target
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6" />
          <h3 className="text-xl font-bold">Grace's Personalized Suggestions</h3>
        </div>
        <p className="text-purple-100 text-sm mb-6">Based on your recent activity and recovery journey</p>

        <div className="space-y-4">
          {recommendations.map((rec, idx) => {
            const Icon = iconMap[rec.type] || Sparkles;
            return (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-start gap-3 mb-3">
                  <Icon className="w-5 h-5 text-purple-200 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{rec.title}</h4>
                    <p className="text-sm text-purple-100">{rec.description}</p>
                    {rec.neuroplasticity_connection && (
                      <p className="text-xs text-purple-200 mt-2 italic">
                        🧠 {rec.neuroplasticity_connection}
                      </p>
                    )}
                  </div>
                </div>
                {rec.action_link && (
                  <Link to={createPageUrl(rec.action_link)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      {rec.action_label || 'Explore'}
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}