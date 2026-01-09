import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Loader2, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function PersonalizedRecommendations({ user }) {
  const [recommendations, setRecommendations] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  const { data: journey } = useQuery({
    queryKey: ['recoveryJourney', user?.email],
    queryFn: async () => {
      const journeys = await base44.entities.RecoveryJourney.filter({ user_email: user.email });
      return journeys[0] || null;
    },
    enabled: !!user
  });

  const { data: preferences } = useQuery({
    queryKey: ['userPreferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user
  });

  const generateRecommendations = async () => {
    setIsGenerating(true);
    try {
      const [emergencyResources, regularResources] = await Promise.all([
        base44.entities.EmergencyResource.list('-created_date', 50),
        base44.entities.Resource.list('-created_date', 200)
      ]);

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace providing personalized resource recommendations for recovery.

USER CONTEXT:
- Stage: ${profile?.stage || 'exploring'}
- Recovery Goals: ${journey?.recovery_goals?.join(', ') || 'Not set'}
- Assessment Data: Personal=${journey?.assessment_data?.dimension_scores?.personal || 0}, Social=${journey?.assessment_data?.dimension_scores?.social || 0}, Community=${journey?.assessment_data?.dimension_scores?.community || 0}
- Why: ${profile?.my_why || 'Not specified'}
- Pathways: ${profile?.pathways?.join(', ') || 'Not specified'}
- County: ${profile?.county || 'Not specified'}

AVAILABLE EMERGENCY RESOURCES:
${emergencyResources.map(r => `- ${r.title} (${r.resource_type}): ${r.description}`).join('\n')}

AVAILABLE REGULAR RESOURCES (sample):
${regularResources.slice(0, 30).map(r => `- ${r.name} (${r.category}, ${r.county || 'Statewide'}): ${r.description || ''}`).join('\n')}

Provide personalized recommendations:
1. Match 3-5 resources to their EXACT needs based on stage, goals, and assessment
2. Prioritize resources in their county when available
3. Connect recommendations to their "why" and recovery goals
4. Suggest emergency resources if assessment shows crisis indicators
5. Explain neuroplasticity benefits of each resource

Return structured recommendations with rationale.`,
        response_json_schema: {
          type: "object",
          properties: {
            priority_resources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  resource_name: { type: "string" },
                  resource_type: { type: "string" },
                  why_recommended: { type: "string" },
                  connection_to_why: { type: "string" },
                  brain_benefit: { type: "string" }
                }
              }
            },
            emergency_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  resource_name: { type: "string" },
                  urgency: { type: "string" },
                  why_now: { type: "string" }
                }
              }
            },
            next_steps: { type: "array", items: { type: "string" } }
          }
        }
      });

      setRecommendations(aiResponse);
      toast.success('Personalized recommendations ready!');
    } catch (error) {
      toast.error('Failed to generate recommendations');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user || !profile) {
    return (
      <GraceCard className="text-center py-8">
        <Sparkles className="w-12 h-12 mx-auto text-teal-400 mb-4" />
        <p className="text-gray-600">Complete your profile to get personalized recommendations</p>
      </GraceCard>
    );
  }

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Your Personalized Resource Recommendations
            </h3>
            <p className="text-sm text-gray-600">
              Based on your stage ({profile.stage}), goals, and recovery journey
            </p>
          </div>
          <Button 
            onClick={generateRecommendations}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Recommendations
              </>
            )}
          </Button>
        </div>
      </GraceCard>

      {recommendations && (
        <>
          {/* Priority Resources */}
          {recommendations.priority_resources?.length > 0 && (
            <GraceCard>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                🎯 Top Recommendations for You
              </h4>
              <div className="space-y-4">
                {recommendations.priority_resources.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{rec.resource_name}</h5>
                        <Badge variant="outline" className="mt-1">{rec.resource_type}</Badge>
                      </div>
                      <Star className="w-5 h-5 text-amber-500" />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-purple-900">Why recommended: </span>
                        <span className="text-gray-700">{rec.why_recommended}</span>
                      </div>
                      
                      {rec.connection_to_why && (
                        <div>
                          <span className="font-medium text-pink-900">💚 Your "Why": </span>
                          <span className="text-gray-700">{rec.connection_to_why}</span>
                        </div>
                      )}
                      
                      {rec.brain_benefit && (
                        <div className="mt-2 p-2 bg-white/60 rounded-lg">
                          <span className="font-medium text-purple-900">🧠 Brain Science: </span>
                          <span className="text-gray-700">{rec.brain_benefit}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GraceCard>
          )}

          {/* Emergency Recommendations */}
          {recommendations.emergency_recommendations?.length > 0 && (
            <GraceCard>
              <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                ⚠️ Crisis Support Resources
              </h4>
              <div className="space-y-3">
                {recommendations.emergency_recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <h5 className="font-semibold text-red-900">{rec.resource_name}</h5>
                    <Badge className="bg-red-100 text-red-800 mt-1">{rec.urgency}</Badge>
                    <p className="text-sm text-red-800 mt-2">{rec.why_now}</p>
                  </div>
                ))}
              </div>
            </GraceCard>
          )}

          {/* Next Steps */}
          {recommendations.next_steps?.length > 0 && (
            <GraceCard>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Suggested Next Steps
              </h4>
              <ul className="space-y-2">
                {recommendations.next_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">{idx + 1}.</span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </GraceCard>
          )}
        </>
      )}
    </div>
  );
}