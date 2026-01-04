import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function GoalProgressNudges({ user, profile }) {
  const [nudge, setNudge] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || !profile || !profile.current_goal || dismissed) return;
    analyzeGoalProgress();
  }, [user, profile]);

  const analyzeGoalProgress = async () => {
    setIsAnalyzing(true);
    try {
      // Get recent activity for context
      const recentCheckIns = await base44.entities.DailyCheckIn.filter(
        { created_by: user.email },
        '-created_date',
        7
      );

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace (GPT-5.2 on Wix/Base44) providing gentle, encouraging goal progress nudges.

USER DATA:
- Goal: ${profile.current_goal}
- Their Why: ${profile.my_why || 'Not set'}
- Recovery Stage: ${profile.stage}
- Current Streak: ${profile.current_streak || 0} days
- Recent Check-ins: ${recentCheckIns.length} this week
- Points: ${profile.points || 0}

ANALYZE goal progress and provide ONE actionable nudge:
- If progress is good: celebrate and suggest next step
- If stalled: gently suggest adjustment or break goal into smaller steps
- Always connect to their "why"
- Use neuroplasticity framing

Return JSON:`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            nudge_type: { type: "string", enum: ["celebration", "gentle_reminder", "adjustment", "encouragement"] },
            message: { type: "string" },
            suggested_action: { type: "string" },
            why_connection: { type: "string" },
            brain_insight: { type: "string" }
          }
        }
      });

      setNudge(response);
    } catch (error) {
      console.error('Goal analysis failed', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!nudge || dismissed) return null;

  const nudgeIcons = {
    celebration: CheckCircle2,
    gentle_reminder: AlertCircle,
    adjustment: Target,
    encouragement: TrendingUp
  };

  const nudgeColors = {
    celebration: 'from-green-500 to-emerald-600',
    gentle_reminder: 'from-amber-500 to-orange-600',
    adjustment: 'from-blue-500 to-indigo-600',
    encouragement: 'from-purple-500 to-pink-600'
  };

  const Icon = nudgeIcons[nudge.nudge_type] || Target;
  const gradientClass = nudgeColors[nudge.nudge_type] || 'from-teal-500 to-teal-600';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed bottom-24 right-6 z-40 max-w-md"
      >
        <div className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-6 text-white shadow-2xl border-2 border-white/20`}>
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-white/70 hover:text-white text-xl"
          >
            ×
          </button>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-lg">Goal Progress Update</h4>
              <Badge className="mt-1 bg-white/20 text-white border-white/30">
                Powered by GPT-5.2
              </Badge>
            </div>
          </div>

          <p className="mb-4 text-white/95">{nudge.message}</p>

          {nudge.suggested_action && (
            <div className="mb-4 p-3 bg-white/10 rounded-lg border border-white/20">
              <p className="text-sm font-medium mb-1">💡 Suggested Next Step:</p>
              <p className="text-sm">{nudge.suggested_action}</p>
            </div>
          )}

          {nudge.why_connection && (
            <div className="mb-4 p-3 bg-white/10 rounded-lg border border-white/20">
              <p className="text-xs font-medium mb-1">💚 Connected to Your Why:</p>
              <p className="text-xs">{nudge.why_connection}</p>
            </div>
          )}

          {nudge.brain_insight && (
            <div className="p-3 bg-white/10 rounded-lg border border-white/20">
              <p className="text-xs font-medium mb-1">🧠 Brain Science:</p>
              <p className="text-xs">{nudge.brain_insight}</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}