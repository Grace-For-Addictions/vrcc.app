import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, CheckCircle, Clock, Users, Sparkles, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function ChallengeHub({ user }) {
  const queryClient = useQueryClient();

  const { data: availableChallenges } = useQuery({
    queryKey: ['availableChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ is_active: true }),
    initialData: []
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ['myEnrollments', user?.email],
    queryFn: () => base44.entities.ChallengeEnrollment.filter({ user_email: user.email }),
    enabled: !!user,
    initialData: []
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  const enrollMutation = useMutation({
    mutationFn: (challengeId) => base44.entities.ChallengeEnrollment.create({
      user_email: user.email,
      challenge_id: challengeId,
      enrolled_date: new Date().toISOString(),
      completion_status: 'in_progress'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myEnrollments']);
      toast.success('Challenge accepted! 💪');
    }
  });

  const getSuggestedChallenges = async () => {
    const aiSuggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `Suggest 3 personalized challenges for this user based on their profile.

USER PROFILE:
- Stage: ${profile?.stage || 'exploring'}
- Current Points: ${profile?.points || 0}
- Current Streak: ${profile?.current_streak || 0}

AVAILABLE CHALLENGES:
${availableChallenges.map(c => `- ${c.title}: ${c.description} (Type: ${c.challenge_type})`).join('\n')}

Return the challenge IDs that would best support their recovery journey right now.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_challenges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                challenge_id: { type: "string" },
                why_recommended: { type: "string" }
              }
            }
          }
        }
      }
    });

    return aiSuggestions;
  };

  const enrolledChallengeIds = myEnrollments.map(e => e.challenge_id);
  const activeChallenges = myEnrollments.filter(e => e.completion_status === 'in_progress');
  const completedChallenges = myEnrollments.filter(e => e.completion_status === 'completed');

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GraceCard className="bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <Trophy className="w-10 h-10 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedChallenges.length}</p>
              <p className="text-sm text-gray-600">Challenges Completed</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="flex items-center gap-3">
            <Target className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeChallenges.length}</p>
              <p className="text-sm text-gray-600">Active Challenges</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard className="bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <Award className="w-10 h-10 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{profile?.points || 0}</p>
              <p className="text-sm text-gray-600">Total Points</p>
            </div>
          </div>
        </GraceCard>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* Active Challenges */}
        <TabsContent value="active">
          {activeChallenges.length === 0 ? (
            <GraceCard className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No active challenges</h3>
              <p className="text-gray-500 mt-1">Browse available challenges to get started!</p>
            </GraceCard>
          ) : (
            <div className="space-y-4">
              {activeChallenges.map((enrollment) => {
                const challenge = availableChallenges.find(c => c.id === enrollment.challenge_id);
                if (!challenge) return null;

                const progress = (enrollment.progress_count / challenge.target_count) * 100;

                return (
                  <motion.div key={enrollment.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <GraceCard>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{challenge.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {challenge.points_reward} pts
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{enrollment.progress_count} / {challenge.target_count}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </GraceCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Available Challenges */}
        <TabsContent value="available">
          <div className="space-y-4">
            {availableChallenges
              .filter(c => !enrolledChallengeIds.includes(c.id))
              .map((challenge, idx) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GraceCard>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{challenge.title}</h3>
                          <Badge variant="outline">{challenge.challenge_type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {challenge.points_reward} points
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {challenge.target_count} actions
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => enrollMutation.mutate(challenge.id)}
                        disabled={enrollMutation.isPending}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                    </div>
                  </GraceCard>
                </motion.div>
              ))}
          </div>
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed">
          {completedChallenges.length === 0 ? (
            <GraceCard className="text-center py-12">
              <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No completed challenges yet</h3>
              <p className="text-gray-500 mt-1">Complete your first challenge to earn points!</p>
            </GraceCard>
          ) : (
            <div className="space-y-4">
              {completedChallenges.map((enrollment) => {
                const challenge = availableChallenges.find(c => c.id === enrollment.challenge_id);
                if (!challenge) return null;

                return (
                  <GraceCard key={enrollment.id} className="bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                          <p className="text-sm text-gray-600">
                            Completed {new Date(enrollment.completion_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        +{enrollment.points_awarded} pts
                      </Badge>
                    </div>
                  </GraceCard>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}