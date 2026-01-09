import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Target, Zap, Heart, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function RecoveryPlanAI({ user }) {
  const [plan, setPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch user's latest assessment
  const { data: latestAssessment } = useQuery({
    queryKey: ['latestAssessment', user?.email],
    queryFn: async () => {
      const assessments = await base44.entities.Assessment.filter(
        { created_by: user.email },
        '-created_date',
        1
      );
      return assessments[0] || null;
    },
    enabled: !!user
  });

  // Fetch recent check-ins
  const { data: recentCheckIns } = useQuery({
    queryKey: ['recentCheckIns', user?.email],
    queryFn: async () => {
      const checkIns = await base44.entities.DailyCheckIn.filter(
        { created_by: user.email },
        '-created_date',
        7
      );
      return checkIns;
    },
    enabled: !!user,
    initialData: []
  });

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  // Fetch active goals
  const { data: activeGoals } = useQuery({
    queryKey: ['activeGoals', user?.email],
    queryFn: async () => {
      const goals = await base44.entities.ResidentGoal.filter({
        resident_email: user.email,
        is_completed: false
      });
      return goals;
    },
    enabled: !!user,
    initialData: []
  });

  const generateRecoveryPlan = async () => {
    if (!user) {
      toast.error('Please log in to generate a recovery plan');
      return;
    }

    setIsGenerating(true);
    try {
      // Calculate average mood from recent check-ins
      const avgMood = recentCheckIns.length > 0
        ? recentCheckIns.reduce((sum, ci) => sum + (ci.mood_rating || 0), 0) / recentCheckIns.length
        : 0;

      // Get BARC-10 score
      const barcScore = latestAssessment?.total_score || 0;

      // Calculate days in recovery from profile
      const daysInRecovery = profile?.recovery_date
        ? Math.floor((new Date() - new Date(profile.recovery_date)) / (1000 * 60 * 60 * 24))
        : 0;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace, an expert recovery coach specializing in neuroplasticity-informed, trauma-sensitive support. Generate a personalized recovery plan.

USER CONTEXT:
- BARC-10 Recovery Capital Score: ${barcScore}/50 (Personal: ${latestAssessment?.dimension_scores?.personal || 0}, Social: ${latestAssessment?.dimension_scores?.social || 0}, Community: ${latestAssessment?.dimension_scores?.community || 0})
- Days in Recovery: ${daysInRecovery || 'Not specified'}
- Recent Average Mood: ${avgMood.toFixed(1)}/10 (past 7 days)
- Recovery Stage: ${profile?.stage || 'exploring'}
- Active Goals: ${activeGoals.map(g => g.goal_description).join(', ') || 'None set'}
- My Why: ${profile?.my_why || 'Not specified'}
- Recent Check-in Patterns: ${recentCheckIns.length} check-ins in past 7 days

RECOVERY FOCUS AREAS:
${latestAssessment?.dimension_scores?.personal < 15 ? '- Personal recovery capital needs strengthening (self-care, coping skills)' : ''}
${latestAssessment?.dimension_scores?.social < 15 ? '- Social recovery capital needs attention (relationships, support network)' : ''}
${latestAssessment?.dimension_scores?.community < 15 ? '- Community recovery capital could grow (belonging, purpose, contribution)' : ''}
${avgMood < 5 ? '- Recent mood patterns suggest need for emotional support' : ''}
${recentCheckIns.length < 3 ? '- Engagement has been low - consider consistency-building strategies' : ''}

Generate a comprehensive, actionable recovery plan with:
1. 3-5 SPECIFIC, personalized suggestions based on their exact needs (not generic advice)
2. One IMMEDIATE action they can take today (very specific, achievable in <30 min)
3. Connection to neuroplasticity - how will these actions rewire their brain?
4. Warm, encouraging motivational message that honors their "why"
5. Recognition of their strengths and progress

Use person-first, stigma-free, trauma-informed language. Be specific and actionable, not vague.`,
        response_json_schema: {
          type: 'object',
          properties: {
            personalized_suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  action: { type: 'string' },
                  why_this_matters: { type: 'string' },
                  brain_benefit: { type: 'string' }
                }
              }
            },
            immediate_action: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                time_needed: { type: 'string' },
                expected_outcome: { type: 'string' }
              }
            },
            neuroplasticity_insight: { type: 'string' },
            motivational_message: { type: 'string' },
            strengths_recognized: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      setPlan(aiResponse);
      toast.success('Your personalized recovery plan is ready! 💚');
    } catch (error) {
      console.error('Recovery plan generation error:', error);
      toast.error('Unable to generate plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <GraceCard className="text-center py-8">
        <Brain className="w-12 h-12 mx-auto text-teal-400 mb-4" />
        <p className="text-gray-600">Log in to access your AI Recovery Coach</p>
      </GraceCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <GraceCard gradient>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Brain className="w-7 h-7 text-purple-600" />
              AI Recovery Coach
            </h3>
            <p className="text-gray-600">
              Personalized, brain-science based recovery plan powered by your data
            </p>
          </div>
          <Button
            onClick={generateRecoveryPlan}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : plan ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Regenerate Plan
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Plan
              </>
            )}
          </Button>
        </div>
      </GraceCard>

      {/* Generated Plan */}
      {plan && (
        <>
          {/* Immediate Action */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GraceCard className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-orange-900 mb-2">
                    🚀 Do This Right Now
                  </h4>
                  <p className="text-orange-800 font-medium mb-2">
                    {plan.immediate_action?.action}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-orange-700">
                    <span>⏱️ {plan.immediate_action?.time_needed}</span>
                    <span>•</span>
                    <span>✨ {plan.immediate_action?.expected_outcome}</span>
                  </div>
                </div>
              </div>
            </GraceCard>
          </motion.div>

          {/* Personalized Suggestions */}
          <GraceCard>
            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-teal-600" />
              Your Personalized Action Plan
            </h4>
            <div className="space-y-4">
              {plan.personalized_suggestions?.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200"
                >
                  <h5 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-600 text-white text-sm">
                      {idx + 1}
                    </span>
                    {suggestion.title}
                  </h5>
                  <p className="text-gray-700 mb-2">{suggestion.action}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">
                        <strong>Why:</strong> {suggestion.why_this_matters}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">
                        <strong>Brain Benefit:</strong> {suggestion.brain_benefit}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GraceCard>

          {/* Neuroplasticity Insight */}
          {plan.neuroplasticity_insight && (
            <GraceCard className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <div className="flex items-start gap-4">
                <Brain className="w-8 h-8 text-purple-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-purple-900 mb-2">
                    🧠 How Your Brain Will Change
                  </h4>
                  <p className="text-purple-800">{plan.neuroplasticity_insight}</p>
                </div>
              </div>
            </GraceCard>
          )}

          {/* Strengths & Motivation */}
          <GraceCard className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            {plan.strengths_recognized?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  Your Strengths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {plan.strengths_recognized.map((strength, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white rounded-full text-sm text-green-800 border border-green-300"
                    >
                      ✨ {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-white/60 rounded-lg">
              <p className="text-green-900 italic font-medium">
                "{plan.motivational_message}"
              </p>
              <p className="text-green-700 text-sm mt-2">— AI Grace, your recovery companion 💚</p>
            </div>
          </GraceCard>
        </>
      )}

      {/* Empty State */}
      {!plan && !isGenerating && (
        <GraceCard className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Brain className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Ready for Your Personalized Recovery Plan?
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Based on your BARC-10 score, recent check-ins, goals, and recovery journey, 
              I'll create a brain-science backed action plan just for you.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>📊 Assessment Data</span>
              <span>•</span>
              <span>❤️ Mood Patterns</span>
              <span>•</span>
              <span>🎯 Active Goals</span>
              <span>•</span>
              <span>🧠 Neuroplasticity</span>
            </div>
          </motion.div>
        </GraceCard>
      )}
    </div>
  );
}