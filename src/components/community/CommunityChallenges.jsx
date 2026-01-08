import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Users, Target, Calendar, Zap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function CommunityChallenges({ user }) {
  const queryClient = useQueryClient();

  const { data: activeChallenges } = useQuery({
    queryKey: ['communityChallenges'],
    queryFn: () => base44.entities.BiomeChallenge.filter({ 
      is_active: true,
      is_completed: false 
    }, '-start_date', 10),
    initialData: []
  });

  const joinChallenge = useMutation({
    mutationFn: async (challenge) => {
      const participants = challenge.participants || [];
      if (participants.includes(user.email)) {
        throw new Error('Already joined');
      }

      return base44.entities.BiomeChallenge.update(challenge.id, {
        participants: [...participants, user.email]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityChallenges']);
      toast.success('You joined the challenge! 🎉');
    },
    onError: (error) => {
      if (error.message.includes('Already')) {
        toast.error('You already joined this challenge');
      }
    }
  });

  const logProgress = useMutation({
    mutationFn: async ({ challengeId, challenge, increment }) => {
      return base44.entities.BiomeChallenge.update(challengeId, {
        current_progress: challenge.current_progress + increment,
        is_completed: (challenge.current_progress + increment) >= challenge.target_value
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['communityChallenges']);
      if (data.is_completed) {
        toast.success('Challenge completed! 🏆');
      } else {
        toast.success('Progress logged!');
      }
    }
  });

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-600" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Community Challenges</h3>
          <p className="text-gray-700">
            Join forces with the community to achieve collective recovery goals
          </p>
        </div>
      </GraceCard>

      {/* Active Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeChallenges.map((challenge, idx) => {
          const isParticipant = challenge.participants?.includes(user.email);
          const progressPercent = (challenge.current_progress / challenge.target_value) * 100;
          const daysRemaining = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GraceCard hover>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{challenge.challenge_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                  </div>
                  {isParticipant && (
                    <Badge className="bg-teal-100 text-teal-700">Joined</Badge>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700">Community Progress</span>
                      <span className="font-bold text-teal-700">
                        {challenge.current_progress}/{challenge.target_value}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      {challenge.participants?.length || 0} participants
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {daysRemaining} days left
                    </div>
                  </div>

                  {challenge.reward_description && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm font-semibold text-amber-900">🎁 Reward:</p>
                      <p className="text-sm text-amber-800">{challenge.reward_description}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!isParticipant ? (
                      <Button
                        onClick={() => joinChallenge.mutate(challenge)}
                        disabled={joinChallenge.isPending}
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                      >
                        Join Challenge
                      </Button>
                    ) : (
                      <Button
                        onClick={() => logProgress.mutate({ 
                          challengeId: challenge.id, 
                          challenge, 
                          increment: 1 
                        })}
                        disabled={logProgress.isPending}
                        variant="outline"
                        className="flex-1 border-teal-300 text-teal-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Log My Progress
                      </Button>
                    )}
                  </div>
                </div>
              </GraceCard>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Gift Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-600" />
            Recent Gifts Received
          </h4>
          <div className="space-y-2">
            {receivedGifts.slice(0, 5).map(gift => (
              <div key={gift.id} className="flex items-center gap-3 p-2 bg-pink-50 rounded-lg">
                <span className="text-2xl">{GIFT_TYPES.find(g => g.type === gift.gift_type)?.icon || '🎁'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {GIFT_TYPES.find(g => g.type === gift.gift_type)?.name}
                  </p>
                  <p className="text-xs text-gray-600">{gift.message}</p>
                </div>
              </div>
            ))}
          </div>
        </GraceCard>

        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Your Giving Impact
          </h4>
          <div className="text-center py-6">
            <div className="text-4xl font-bold text-purple-700 mb-2">{sentGifts.length}</div>
            <p className="text-sm text-gray-600">Gifts sent to community</p>
            <p className="text-xs text-gray-500 mt-4">
              You've spent {sentGifts.reduce((sum, g) => sum + (g.points_value || 0), 0)} points spreading grace 💚
            </p>
          </div>
        </GraceCard>
      </div>
    </div>
  );
}