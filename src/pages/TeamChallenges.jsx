import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, Trophy, TrendingUp, Target, 
  MessageCircle, Share2, Award, Flame,
  Plus, ChevronRight, Crown, Medal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';
import confetti from 'canvas-confetti';

const challengeTypes = {
  community_participation: {
    icon: MessageCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Community Participation'
  },
  resource_sharing: {
    icon: Share2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Resource Sharing'
  },
  milestone_celebration: {
    icon: Award,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Milestone Celebration'
  }
};

function Leaderboard({ teams }) {
  const sortedTeams = [...teams].sort((a, b) => b.current_progress - a.current_progress);

  return (
    <GraceCard>
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-amber-500" />
        Team Leaderboard
      </h3>

      <div className="space-y-3">
        {sortedTeams.map((team, idx) => {
          const Icon = idx === 0 ? Crown : idx === 1 ? Trophy : idx === 2 ? Medal : Users;
          const rankColor = idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-600' : 'text-gray-500';
          
          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-lg border-2 ${
                idx === 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  idx === 0 ? 'bg-amber-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${rankColor}`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">Team {idx + 1}</h4>
                    <Badge className="bg-teal-100 text-teal-700">
                      {team.team_members?.length || 0} members
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress 
                      value={(team.current_progress / team.goal_target) * 100} 
                      className="flex-1 h-2" 
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {team.current_progress}/{team.goal_target}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GraceCard>
  );
}

function ChallengeCard({ challenge, onJoin, userTeams }) {
  const typeConfig = challengeTypes[challenge.challenge_type];
  const Icon = typeConfig?.icon || Target;
  const isActive = challenge.is_active && !challenge.is_completed;
  const progressPercent = (challenge.current_progress / challenge.goal_target) * 100;
  const isUserInChallenge = userTeams?.some(teamId => 
    challenge.team_members?.includes(teamId)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <GraceCard hover className="relative overflow-hidden">
        {challenge.is_completed && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-green-100 text-green-700">Completed</Badge>
          </div>
        )}

        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl ${typeConfig?.bgColor} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${typeConfig?.color}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{challenge.title}</h3>
            <p className="text-sm text-gray-600">{challenge.description}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Team Progress</span>
              <span className="font-medium text-gray-900">
                {challenge.current_progress}/{challenge.goal_target}
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {challenge.team_members?.length || 0} / {challenge.team_size_max} members
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">
                +{challenge.points_reward_per_member} pts each
              </span>
            </div>
          </div>

          {isActive && !isUserInChallenge && (
            <Button 
              onClick={() => onJoin(challenge)}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Join Team Challenge
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {isUserInChallenge && (
            <Badge className="w-full justify-center py-2 bg-teal-100 text-teal-700">
              You're in this challenge!
            </Badge>
          )}
        </div>

        {/* Date Range */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
        </div>
      </GraceCard>
    </motion.div>
  );
}

export default function TeamChallenges() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: challenges } = useQuery({
    queryKey: ['teamChallenges'],
    queryFn: () => base44.entities.TeamChallenge.list('-created_date', 50),
    initialData: []
  });

  const joinChallenge = useMutation({
    mutationFn: async (challenge) => {
      const updatedMembers = [...(challenge.team_members || []), user.email];
      return base44.entities.TeamChallenge.update(challenge.id, {
        team_members: updatedMembers
      });
    },
    onSuccess: () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      queryClient.invalidateQueries(['teamChallenges']);
    }
  });

  const activeChallenges = challenges.filter(c => c.is_active && !c.is_completed);
  const completedChallenges = challenges.filter(c => c.is_completed);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Team Challenges"
          subtitle="Join forces with your community to achieve goals together and earn rewards"
          icon={Users}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Flame className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{activeChallenges.length}</p>
                <p className="text-sm text-gray-600">Active Challenges</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-700">{completedChallenges.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {challenges.reduce((sum, c) => sum + (c.team_members?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Participants</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="active">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="active">
                  Active Challenges ({activeChallenges.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedChallenges.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <div className="grid grid-cols-1 gap-4">
                  {activeChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onJoin={(c) => joinChallenge.mutate(c)}
                      userTeams={[user?.email]}
                    />
                  ))}

                  {activeChallenges.length === 0 && (
                    <GraceCard className="text-center py-12">
                      <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700">No active challenges</h3>
                      <p className="text-gray-500 mt-1">Check back soon for new team challenges!</p>
                    </GraceCard>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="completed">
                <div className="grid grid-cols-1 gap-4">
                  {completedChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onJoin={() => {}}
                      userTeams={[user?.email]}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard teams={activeChallenges} />

            <GraceCard className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Challenge Types</h4>
              <div className="space-y-3">
                {Object.entries(challengeTypes).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <span className="text-sm text-gray-700">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </GraceCard>
          </div>
        </div>
      </div>

      <GraceChatWidget />
    </div>
  );
}