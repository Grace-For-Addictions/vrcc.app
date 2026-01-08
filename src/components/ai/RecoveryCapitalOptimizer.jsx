import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, User, Users, MapPin, Loader2, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import GraceCard from '@/components/common/GraceCard';

export default function RecoveryCapitalOptimizer({ user, latestAssessment }) {
  const [optimizations, setOptimizations] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateOptimizations = async () => {
    if (!latestAssessment) return;

    setLoading(true);
    try {
      const [sessions, resources, events] = await Promise.all([
        base44.entities.CoachingSession.filter({ created_by: user.email }, '-created_date', 5),
        base44.entities.Resource.list('-created_date', 100),
        base44.entities.Event.list('-start_time', 10)
      ]);

      const personalScore = latestAssessment.dimension_scores?.personal || 0;
      const socialScore = latestAssessment.dimension_scores?.social || 0;
      const communityScore = latestAssessment.dimension_scores?.community || 0;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI Recovery Capital Optimizer analyzing BARC-10 assessment scores to suggest targeted interventions.

CURRENT SCORES (out of max):
- Personal Recovery Capital: ${personalScore}/30 (${Math.round(personalScore/30*100)}%)
- Social Recovery Capital: ${socialScore}/10 (${Math.round(socialScore/10*100)}%)
- Community Recovery Capital: ${communityScore}/10 (${Math.round(communityScore/10*100)}%)

CONTEXT:
- Recent coaching sessions: ${sessions.length}
- Available resources: ${resources.length}
- Upcoming events: ${events.length}

For EACH dimension (Personal, Social, Community), provide:
1. Gap analysis (what's missing or weak)
2. 3 specific, actionable interventions ranked by priority
3. Expected impact on score (low/medium/high)
4. Estimated timeline for improvement (weeks)
5. Resources/connections needed
6. Neuroplasticity connection (how this builds new pathways)

Be specific, practical, and evidence-based. Reference Iowa resources when possible.`,
        response_json_schema: {
          type: "object",
          properties: {
            personal: {
              type: "object",
              properties: {
                gap_analysis: { type: "string" },
                interventions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string" },
                      timeline_weeks: { type: "number" },
                      resources_needed: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                neuroplasticity_insight: { type: "string" }
              }
            },
            social: {
              type: "object",
              properties: {
                gap_analysis: { type: "string" },
                interventions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string" },
                      timeline_weeks: { type: "number" },
                      resources_needed: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                neuroplasticity_insight: { type: "string" }
              }
            },
            community: {
              type: "object",
              properties: {
                gap_analysis: { type: "string" },
                interventions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string" },
                      timeline_weeks: { type: "number" },
                      resources_needed: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                neuroplasticity_insight: { type: "string" }
              }
            }
          }
        }
      });

      setOptimizations(response);
    } catch (error) {
      console.error('Failed to generate optimizations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (latestAssessment) {
      generateOptimizations();
    }
  }, [latestAssessment?.id]);

  if (loading) {
    return (
      <GraceCard className="text-center py-8">
        <Loader2 className="w-12 h-12 mx-auto text-teal-600 animate-spin mb-4" />
        <p className="text-gray-600">Analyzing your recovery capital and generating optimizations...</p>
      </GraceCard>
    );
  }

  if (!optimizations) return null;

  const dimensions = [
    { key: 'personal', label: 'Personal', icon: User, color: 'teal', score: latestAssessment.dimension_scores?.personal || 0, max: 30 },
    { key: 'social', label: 'Social', icon: Users, color: 'purple', score: latestAssessment.dimension_scores?.social || 0, max: 10 },
    { key: 'community', label: 'Community', icon: MapPin, color: 'blue', score: latestAssessment.dimension_scores?.community || 0, max: 10 }
  ];

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-teal-600" />
          AI Recovery Capital Optimizer
        </h3>
        <p className="text-gray-700">
          Personalized interventions to strengthen your recovery foundation across all dimensions
        </p>
      </GraceCard>

      {dimensions.map((dim, idx) => {
        const data = optimizations[dim.key];
        if (!data) return null;

        const Icon = dim.icon;
        const percentage = Math.round((dim.score / dim.max) * 100);

        return (
          <motion.div
            key={dim.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <GraceCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-${dim.color}-100 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${dim.color}-600`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{dim.label} Recovery Capital</h4>
                    <p className="text-sm text-gray-600">{dim.score}/{dim.max} ({percentage}%)</p>
                  </div>
                </div>
                <Progress value={percentage} className="w-24 h-2" />
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong className={`text-${dim.color}-700`}>Gap Analysis:</strong> {data.gap_analysis}
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Recommended Interventions
                </h5>
                {data.interventions?.map((intervention, i) => (
                  <div key={i} className={`p-4 bg-${dim.color}-50 border border-${dim.color}-200 rounded-lg`}>
                    <div className="flex items-start justify-between mb-2">
                      <h6 className={`font-semibold text-${dim.color}-900`}>{intervention.title}</h6>
                      <span className={`text-xs px-2 py-1 bg-${dim.color}-100 text-${dim.color}-700 rounded-full`}>
                        {intervention.impact} impact
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{intervention.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>⏱️ {intervention.timeline_weeks} weeks</span>
                      <span>📋 {intervention.resources_needed?.length || 0} resources needed</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-900">
                  <Zap className="w-4 h-4 inline mr-1 text-yellow-500" />
                  <strong>Brain Science:</strong> {data.neuroplasticity_insight}
                </p>
              </div>
            </GraceCard>
          </motion.div>
        );
      })}
    </div>
  );
}