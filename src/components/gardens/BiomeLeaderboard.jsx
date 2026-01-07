import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal, TrendingUp, Target, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GraceCard from '@/components/common/GraceCard';

export default function BiomeLeaderboard({ biomeId }) {
  const { data: sessions } = useQuery({
    queryKey: ['biomeSessions', biomeId],
    queryFn: () => base44.entities.PracticeSession.list('-created_date', 100),
    initialData: []
  });

  const { data: challenges } = useQuery({
    queryKey: ['biomeChallenges', biomeId],
    queryFn: () => base44.entities.BiomeChallenge.filter({ biome_id: biomeId, is_active: true }),
    initialData: []
  });

  // Calculate leaderboard
  const contributorStats = sessions.reduce((acc, session) => {
    const email = session.user_email;
    if (!acc[email]) {
      acc[email] = { email, totalMinutes: 0, practiceCount: 0 };
    }
    acc[email].totalMinutes += session.duration_minutes;
    acc[email].practiceCount += 1;
    return acc;
  }, {});

  const leaderboard = Object.values(contributorStats)
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 10);

  const medals = [
    { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-50' },
    { icon: Award, color: 'text-orange-500', bg: 'bg-orange-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Active Challenges */}
      {challenges.length > 0 && (
        <GraceCard gradient>
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Active Community Challenges
          </h4>
          <div className="space-y-4">
            {challenges.map((challenge, idx) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 bg-white rounded-lg border border-purple-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-900">{challenge.challenge_name}</h5>
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">
                    {challenge.participants.length} joined
                  </Badge>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-purple-700">
                      {challenge.current_progress}/{challenge.target_value}
                    </span>
                  </div>
                  <Progress value={(challenge.current_progress / challenge.target_value) * 100} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Ends {new Date(challenge.end_date).toLocaleDateString()}
                  </span>
                  <span className="text-teal-700 font-medium">🎁 {challenge.reward_description}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </GraceCard>
      )}

      {/* Leaderboard */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          Top Contributors
        </h4>
        <div className="space-y-3">
          {leaderboard.map((contributor, idx) => {
            const Medal = medals[idx]?.icon || Award;
            const colorClass = medals[idx]?.color || 'text-teal-600';
            const bgClass = medals[idx]?.bg || 'bg-teal-50';

            return (
              <motion.div
                key={contributor.email}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg ${bgClass}`}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
                  {idx < 3 ? (
                    <Medal className={`w-6 h-6 ${colorClass}`} />
                  ) : (
                    <span className="font-bold text-gray-600">#{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{contributor.email.split('@')[0]}</p>
                  <p className="text-xs text-gray-600">
                    {contributor.practiceCount} practices • {contributor.totalMinutes} minutes
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {(contributor.totalMinutes / 60).toFixed(1)}h
                </Badge>
              </motion.div>
            );
          })}
        </div>
      </GraceCard>
    </div>
  );
}