import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Target, TrendingUp, Video, Users, Gift, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GraceCard from '@/components/common/GraceCard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIRecoveryJourney({ user }) {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: journey } = useQuery({
    queryKey: ['recovery-journey', user.email],
    queryFn: async () => {
      const journeys = await base44.entities.RecoveryJourney.filter({ user_email: user.email });
      return journeys[0] || null;
    },
    initialData: null
  });

  const generateJourney = useMutation({
    mutationFn: async () => {
      setGenerating(true);

      // Fetch user data
      const [assessments, profile, checkIns, gifts, sessions] = await Promise.all([
        base44.entities.Assessment.filter({ created_by: user.email }, '-created_date', 1),
        base44.entities.UserProfile.filter({ created_by: user.email }).then(p => p[0]),
        base44.entities.DailyCheckIn.filter({ created_by: user.email }, '-created_date', 7),
        base44.entities.GardenGift.filter({ recipient_email: user.email }, '-created_date', 10),
        base44.entities.CoachingSession.filter({ created_by: user.email }, '-created_date', 5)
      ]);

      const latestAssessment = assessments[0];
      const engagementScore = checkIns.length * 10 + sessions.length * 5;

      // Generate AI recommendations
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate personalized recovery journey recommendations for a user with:

Recovery Capital (BARC-10): ${latestAssessment?.total_score || 0}/50
- Personal: ${latestAssessment?.dimension_scores?.personal || 0}/30
- Social: ${latestAssessment?.dimension_scores?.social || 0}/10  
- Community: ${latestAssessment?.dimension_scores?.community || 0}/10

Pathways: ${profile?.pathways?.join(', ') || 'Not specified'}
Recent engagement: ${checkIns.length} check-ins, ${sessions.length} coaching sessions
Days in recovery: ${profile?.days_in_recovery || 0}

Recommend:
1. 3 specific videos/content (recovery_videos, peer_stories, neuroplasticity_education)
2. 2 peer coach profiles to connect with
3. 2 community garden actions (send hope_seed to someone, unlock courage_boost)
4. Next milestone to celebrate
5. Journey phase (onboarding, early_engagement, active_participation, sustained_recovery, peer_leader)

Be specific, warm, and neuroplasticity-focused. Use person-first language.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_content: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  content_type: { type: "string" },
                  title: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            peer_coach_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  specialty: { type: "string" },
                  why_match: { type: "string" }
                }
              }
            },
            garden_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            },
            next_milestone: { type: "string" },
            journey_phase: { type: "string" },
            encouragement: { type: "string" }
          }
        }
      });

      // Determine phase from scores
      let phase = 'onboarding';
      if (engagementScore >= 80) phase = 'peer_leader';
      else if (engagementScore >= 50) phase = 'sustained_recovery';
      else if (engagementScore >= 25) phase = 'active_participation';
      else if (engagementScore > 0) phase = 'early_engagement';

      const journeyData = {
        user_email: user.email,
        assessment_data: latestAssessment,
        recovery_goals: profile?.pathways || [],
        recommended_content: aiResponse.recommended_content || [],
        recommended_peer_coaches: aiResponse.peer_coach_suggestions || [],
        garden_suggestions: aiResponse.garden_suggestions || [],
        engagement_score: engagementScore,
        journey_phase: phase,
        next_milestone: aiResponse.next_milestone,
        last_ai_update: new Date().toISOString()
      };

      if (journey) {
        return base44.entities.RecoveryJourney.update(journey.id, journeyData);
      } else {
        return base44.entities.RecoveryJourney.create(journeyData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recovery-journey']);
      setGenerating(false);
    }
  });

  // Remove auto-generation on mount - let user trigger it manually

  const { data: hasData } = useQuery({
    queryKey: ['user-has-data', user.email],
    queryFn: async () => {
      const [checkIns, assessments] = await Promise.all([
        base44.entities.DailyCheckIn.filter({ created_by: user.email }, '-created_date', 1),
        base44.entities.Assessment.filter({ created_by: user.email }, '-created_date', 1)
      ]);
      return checkIns.length > 0 || assessments.length > 0;
    },
    enabled: !!user,
    initialData: false
  });

  if (!journey && generating) {
    return (
      <GraceCard className="text-center py-8">
        <Loader2 className="w-12 h-12 mx-auto text-teal-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalizing Your Journey...</h3>
        <p className="text-gray-600">Grace is analyzing your recovery capital and creating custom recommendations</p>
      </GraceCard>
    );
  }

  if (!journey && !generating && hasData) {
    return (
      <GraceCard className="text-center py-8">
        <Sparkles className="w-12 h-12 mx-auto text-teal-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Personalize Your Journey?</h3>
        <p className="text-gray-600 mb-6">Let Grace analyze your progress and create custom recommendations</p>
        <Button onClick={() => generateJourney.mutate()} className="bg-teal-600 hover:bg-teal-700">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate My Journey
        </Button>
      </GraceCard>
    );
  }

  if (!journey && !generating && !hasData) {
    return (
      <GraceCard className="text-center py-8">
        <div className="max-w-md mx-auto">
          <Target className="w-12 h-12 mx-auto text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Let's Start Your Journey Together</h3>
          <p className="text-gray-600 mb-6">
            Complete a quick check-in or assessment so Grace can begin personalizing your experience
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl('Assessment')}>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Take BARC-10
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => {
                const checkInCard = document.querySelector('[data-checkin-card]');
                if (checkInCard) {
                  checkInCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  checkInCard.querySelector('button')?.click();
                }
              }}
            >
              Start Check-In
            </Button>
          </div>
        </div>
      </GraceCard>
    );
  }

  if (!journey) return null;

  const phaseInfo = {
    onboarding: { color: 'bg-blue-100 text-blue-700', label: 'Getting Started 🌱' },
    early_engagement: { color: 'bg-green-100 text-green-700', label: 'Building Momentum 🌿' },
    active_participation: { color: 'bg-teal-100 text-teal-700', label: 'Growing Strong 🌳' },
    sustained_recovery: { color: 'bg-purple-100 text-purple-700', label: 'Thriving 🌸' },
    peer_leader: { color: 'bg-amber-100 text-amber-700', label: 'Community Leader 🏆' }
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-teal-600" />
              Your Personalized Recovery Journey
            </h2>
            <Badge className={phaseInfo[journey.journey_phase]?.color || 'bg-gray-100 text-gray-700'}>
              {phaseInfo[journey.journey_phase]?.label || journey.journey_phase}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => generateJourney.mutate()} disabled={generating}>
            <Sparkles className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Engagement Score</span>
            <span className="text-sm font-bold text-teal-600">{journey.engagement_score}/100</span>
          </div>
          <Progress value={journey.engagement_score} className="h-2" />
        </div>

        {journey.next_milestone && (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-900">
              <Target className="w-4 h-4 inline mr-2" />
              <strong>Next Milestone:</strong> {journey.next_milestone}
            </p>
          </div>
        )}
      </GraceCard>

      {/* Recommended Content */}
      {journey.recommended_content?.length > 0 && (
        <GraceCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            Recommended for You
          </h3>
          <div className="space-y-3">
            {journey.recommended_content.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
              >
                <Video className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{rec.title}</p>
                  <p className="text-sm text-gray-600">{rec.reason}</p>
                </div>
                <Link to={createPageUrl('VideoLibrary')}>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </GraceCard>
      )}

      {/* Peer Coach Suggestions */}
      {journey.recommended_peer_coaches?.length > 0 && (
        <GraceCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Connect with Peer Coaches
          </h3>
          <div className="space-y-3">
            {journey.recommended_peer_coaches.map((coach, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200"
              >
                <Users className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{coach.specialty}</p>
                  <p className="text-sm text-gray-600">{coach.why_match}</p>
                </div>
                <Link to={createPageUrl('PeerMatching')}>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </GraceCard>
      )}

      {/* Garden Suggestions */}
      {journey.garden_suggestions?.length > 0 && (
        <GraceCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-600" />
            Grow Your Garden
          </h3>
          <div className="space-y-3">
            {journey.garden_suggestions.map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
              >
                <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{suggestion.action}</p>
                  <p className="text-sm text-gray-600">{suggestion.rationale}</p>
                </div>
                <Link to={createPageUrl('CommunityGardenHub')}>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </GraceCard>
      )}
    </div>
  );
}