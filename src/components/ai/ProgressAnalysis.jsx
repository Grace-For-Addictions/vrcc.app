import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Sparkles, Brain, Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function ProgressAnalysis({ user, shareWithSponsor = false }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: insights } = useQuery({
    queryKey: ['progressInsights', user?.email],
    queryFn: () => base44.entities.ProgressInsight.filter(
      { user_email: user.email },
      '-insight_date',
      10
    ),
    enabled: !!user,
    initialData: []
  });

  const { data: assessments } = useQuery({
    queryKey: ['userAssessments', user?.email],
    queryFn: () => base44.entities.Assessment.filter(
      { created_by: user.email },
      '-created_date',
      5
    ),
    enabled: !!user,
    initialData: []
  });

  const { data: checkIns } = useQuery({
    queryKey: ['recentCheckIns', user?.email],
    queryFn: () => base44.entities.DailyCheckIn.filter(
      { created_by: user.email },
      '-created_date',
      14
    ),
    enabled: !!user,
    initialData: []
  });

  const { data: meetings } = useQuery({
    queryKey: ['recentMeetings', user?.email],
    queryFn: () => base44.entities.MeetingLog.filter(
      { user_email: user.email },
      '-meeting_date',
      30
    ),
    enabled: !!user,
    initialData: []
  });

  const generateAnalysis = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);

      const barcScores = assessments.map(a => a.total_score);
      const moodScores = checkIns.map(c => c.mood_rating).filter(Boolean);
      const recentCheckInCount = checkIns.filter(c => {
        const daysSince = (new Date() - new Date(c.created_date)) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      }).length;
      const meetingCount = meetings.length;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace, an expert recovery data analyst. Analyze this user's recovery journey and provide predictive insights.

DATA:
- BARC-10 Scores (recent → oldest): ${barcScores.join(', ')}
- Mood Ratings (14 days): ${moodScores.join(', ')}
- Check-ins this week: ${recentCheckInCount}
- Meetings attended (30 days): ${meetingCount}
- Days in recovery: ${checkIns.length}

ANALYSIS REQUIRED:
1. Identify trends (improving, declining, stable)
2. Predict potential challenges or relapse triggers
3. Flag warning signs (mood dips >3 days, decreased activity, missed meetings)
4. Provide proactive recommendations
5. Celebrate wins and positive trends

Use compassionate, trauma-informed language. Be specific about data patterns.`,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["trend", "warning", "celebration", "recommendation", "prediction"] },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  risk_factors: { type: "array", items: { type: "string" } },
                  recommendations: { type: "array", items: { type: "string" } }
                }
              }
            },
            overall_trajectory: { type: "string" },
            risk_level: { type: "string" }
          }
        }
      });

      // Save insights to database
      const savedInsights = await Promise.all(
        analysis.insights.map(insight =>
          base44.entities.ProgressInsight.create({
            user_email: user.email,
            insight_date: new Date().toISOString(),
            insight_type: insight.type,
            severity: insight.severity,
            title: insight.title,
            description: insight.description,
            data_points: {
              barc_score_trend: barcScores,
              mood_trend: moodScores,
              activity_trend: recentCheckInCount >= 5 ? 'high' : recentCheckInCount >= 3 ? 'moderate' : 'low',
              meeting_attendance: meetingCount
            },
            ai_recommendations: insight.recommendations || [],
            risk_factors: insight.risk_factors || [],
            is_shared_with_sponsor: shareWithSponsor
          })
        )
      );

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progressInsights']);
      toast.success('Progress analysis complete!');
      setIsAnalyzing(false);
    },
    onError: () => {
      toast.error('Analysis failed. Please try again.');
      setIsAnalyzing(false);
    }
  });

  const getInsightIcon = (type) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'warning': return AlertTriangle;
      case 'celebration': return Sparkles;
      case 'recommendation': return Brain;
      case 'prediction': return Activity;
      default: return Activity;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const unreadInsights = insights.filter(i => !i.is_read);

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              AI Progress Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Predictive insights based on your recovery data
            </p>
          </div>
          <Button
            onClick={() => generateAnalysis.mutate()}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Run Analysis</>
            )}
          </Button>
        </div>
      </GraceCard>

      {unreadInsights.length > 0 && (
        <Badge className="bg-purple-600 text-white">
          {unreadInsights.length} new insight{unreadInsights.length !== 1 ? 's' : ''}
        </Badge>
      )}

      {insights.length === 0 ? (
        <GraceCard className="text-center py-12">
          <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No insights yet</h3>
          <p className="text-gray-500 mt-1">Run your first analysis to get started</p>
        </GraceCard>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, idx) => {
            const Icon = getInsightIcon(insight.insight_type);
            const severityClass = getSeverityColor(insight.severity);

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GraceCard className={`border-2 ${severityClass}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full ${severityClass} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        <Badge variant="outline">{insight.insight_type}</Badge>
                        {insight.severity === 'critical' && (
                          <Badge className="bg-red-600 text-white">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3">{insight.description}</p>

                      {insight.risk_factors?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-red-800 mb-1">⚠️ Risk Factors:</p>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                            {insight.risk_factors.map((risk, i) => (
                              <li key={i}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.ai_recommendations?.length > 0 && (
                        <div className="p-3 bg-white/60 rounded-lg">
                          <p className="text-sm font-medium text-purple-900 mb-2">💡 Recommendations:</p>
                          <ul className="space-y-1">
                            {insight.ai_recommendations.map((rec, i) => (
                              <li key={i} className="text-sm text-gray-700">{i + 1}. {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-3">
                        {new Date(insight.insight_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </GraceCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}