import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, Flame, Heart, Zap, Target, Gift, Users, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

const BADGE_ICONS = {
  connection: Users,
  milestone: Trophy,
  learning: Star,
  giving: Heart,
  streak: Flame,
  special: Sparkles
};

export default function PointsBadgesSystem({ user, profile }) {
  const { data: earnedBadges } = useQuery({
    queryKey: ['badges', user.email],
    queryFn: async () => {
      // Get user's earned badges from profile
      return profile?.badges || [];
    },
    enabled: !!profile,
    initialData: []
  });

  const { data: availableBadges } = useQuery({
    queryKey: ['availableBadges'],
    queryFn: () => base44.entities.Badge.filter({ is_active: true }),
    initialData: []
  });

  const points = profile?.points || 0;
  const currentStreak = profile?.current_streak || 0;
  const longestStreak = profile?.longest_streak || 0;

  // Level calculation
  const level = Math.floor(points / 100) + 1;
  const pointsToNextLevel = (level * 100) - points;

  return (
    <div className="space-y-6">
      {/* Points & Level */}
      <GraceCard gradient>
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{points} Points</h3>
          <p className="text-lg text-teal-700 font-semibold mb-4">Level {level}</p>
          
          <div className="max-w-xs mx-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress to Level {level + 1}</span>
              <span className="font-semibold text-teal-700">{pointsToNextLevel} pts to go</span>
            </div>
            <Progress value={(points % 100)} className="h-2" />
          </div>
        </div>
      </GraceCard>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4">
        <GraceCard className="text-center">
          <Flame className="w-10 h-10 mx-auto mb-2 text-orange-500" />
          <div className="text-2xl font-bold text-orange-700">{currentStreak}</div>
          <div className="text-xs text-gray-600">Current Streak</div>
        </GraceCard>
        <GraceCard className="text-center">
          <Award className="w-10 h-10 mx-auto mb-2 text-purple-500" />
          <div className="text-2xl font-bold text-purple-700">{longestStreak}</div>
          <div className="text-xs text-gray-600">Longest Streak</div>
        </GraceCard>
      </div>

      {/* Earned Badges */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-teal-600" />
          Your Badges ({earnedBadges.length})
        </h4>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {earnedBadges.map((badge, idx) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="text-center p-3 bg-gradient-to-br from-teal-50 to-purple-50 rounded-xl"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white flex items-center justify-center">
                <span className="text-2xl">{badge.icon || '🏆'}</span>
              </div>
              <p className="text-xs font-semibold text-gray-900">{badge.name}</p>
            </motion.div>
          ))}
        </div>
      </GraceCard>

      {/* Available Badges to Earn */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Badges to Earn</h4>
        <div className="space-y-3">
          {availableBadges.slice(0, 5).map((badge, idx) => {
            const earned = earnedBadges.some(b => b.id === badge.id);
            
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  earned ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  <span className="text-xl">{badge.icon || '🏅'}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{badge.name}</p>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                </div>
                {earned ? (
                  <Badge className="bg-green-600">Earned</Badge>
                ) : (
                  <Badge variant="outline">{badge.points_value} pts</Badge>
                )}
              </motion.div>
            );
          })}
        </div>
      </GraceCard>

      {/* Points Earning Guide */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          How to Earn Points
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
            <span className="text-gray-700">Daily check-in</span>
            <span className="font-semibold text-purple-700">+5 pts</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
            <span className="text-gray-700">Attend meeting/event</span>
            <span className="font-semibold text-blue-700">+10 pts</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-green-50 rounded">
            <span className="text-gray-700">Complete practice session</span>
            <span className="font-semibold text-green-700">+15 pts</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-pink-50 rounded">
            <span className="text-gray-700">Share milestone</span>
            <span className="font-semibold text-pink-700">+20 pts</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-amber-50 rounded">
            <span className="text-gray-700">Complete quiz</span>
            <span className="font-semibold text-amber-700">+30 pts</span>
          </div>
        </div>
      </GraceCard>
    </div>
  );
}