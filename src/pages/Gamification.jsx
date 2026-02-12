// ============================================================================
// DOMAIN: 8. Gamification & Engagement
// PURPOSE: Points, badges, leaderboards, and challenge tracking. Includes
//          AI-powered personalized challenge recommendations.
// DEPENDENCIES: UserProfile entity, Badge entity, Challenge entity
// ============================================================================

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, Award, Users, Crown, Sparkles, Lock, Unlock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import ChallengeHub from '@/components/gamification/ChallengeHub';
import { toast } from 'sonner';

export default function Gamification() {
  const [user, setUser] = useState(null);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = '/';
      }
    };
    loadUser();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      if (profiles[0]) {
        setShowOnLeaderboard(profiles[0].privacy_settings?.show_on_leaderboard !== false);
      }
      return profiles[0] || null;
    },
    enabled: !!user
  });

  const { data: allProfiles } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list('-points', 50);
      return profiles.filter(p => p.privacy_settings?.show_on_leaderboard !== false);
    },
    enabled: !!user,
    initialData: []
  });

  const { data: badges } = useQuery({
    queryKey: ['allBadges'],
    queryFn: () => base44.entities.Badge.filter({ is_active: true }),
    initialData: []
  });

  const { data: userBadges } = useQuery({
    queryKey: ['userBadges', user?.email],
    queryFn: async () => {
      if (!profile?.badges) return [];
      return profile.badges.map(b => badges.find(badge => badge.id === b.id)).filter(Boolean);
    },
    enabled: !!user && !!profile && badges.length > 0,
    initialData: []
  });

  const toggleLeaderboardVisibility = useMutation({
    mutationFn: async (visible) => {
      await base44.auth.updateMe({
        privacy_settings: {
          ...profile.privacy_settings,
          show_on_leaderboard: visible
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allProfiles']);
      toast.success('Privacy settings updated');
    }
  });

  const suggestChallenges = async () => {
    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `Suggest 3 personalized recovery challenges for this user based on their profile.

USER PROFILE:
- Stage: ${profile?.stage || 'exploring'}
- Points: ${profile?.points || 0}
- Current Streak: ${profile?.current_streak || 0}
- Badges: ${userBadges.length}
- Pathways: ${profile?.pathways?.join(', ') || 'unknown'}

Create challenges that:
1. Match their recovery stage
2. Build on their strengths
3. Address growth areas
4. Are achievable but meaningful

Return challenge titles, descriptions, types, and why each is recommended.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_challenges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                challenge_type: { type: "string" },
                target_count: { type: "number" },
                points_reward: { type: "number" },
                why_recommended: { type: "string" }
              }
            }
          }
        }
      }
    });

    return suggestions.suggested_challenges;
  };

  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const suggestions = await suggestChallenges();
      setAiSuggestions(suggestions);
      toast.success('AI suggestions ready!');
    } catch (error) {
      toast.error('Failed to generate suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const userRank = allProfiles.findIndex(p => p.created_by === user?.email) + 1;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader
          title="Your Recovery Journey"
          subtitle="Track progress, earn rewards, and celebrate milestones"
          icon={Trophy}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GraceCard className="bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <Award className="w-10 h-10 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{profile?.points || 0}</p>
                <p className="text-sm text-gray-600">Total Points</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard className="bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex items-center gap-3">
              <Zap className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{profile?.current_streak || 0}</p>
                <p className="text-sm text-gray-600">Day Streak</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard className="bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{userBadges.length}</p>
                <p className="text-sm text-gray-600">Badges Earned</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard className="bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <Crown className="w-10 h-10 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {showOnLeaderboard ? `#${userRank || '--'}` : 'Hidden'}
                </p>
                <p className="text-sm text-gray-600">Leaderboard Rank</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="ai-suggestions">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Picks
            </TabsTrigger>
          </TabsList>

          {/* Challenges */}
          <TabsContent value="challenges">
            <ChallengeHub user={user} />
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges">
            <div className="space-y-6">
              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Badges</h3>
                {userBadges.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Complete challenges to earn your first badge!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {userBadges.map((badge) => (
                      <div key={badge.id} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
                        <p className="font-medium text-gray-900">{badge.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </GraceCard>

              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Badges</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {badges.filter(b => !userBadges.find(ub => ub.id === b.id)).map((badge) => (
                    <div key={badge.id} className="text-center p-4 bg-gray-100 rounded-lg opacity-60">
                      <div className="text-4xl mb-2 grayscale">{badge.icon || '🔒'}</div>
                      <p className="font-medium text-gray-700">{badge.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                    </div>
                  ))}
                </div>
              </GraceCard>
            </div>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <GraceCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Community Leaderboard</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show me on leaderboard</span>
                  <Switch
                    checked={showOnLeaderboard}
                    onCheckedChange={(checked) => {
                      setShowOnLeaderboard(checked);
                      toggleLeaderboardVisibility.mutate(checked);
                    }}
                  />
                  {showOnLeaderboard ? <Unlock className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              <div className="space-y-2">
                {allProfiles.slice(0, 20).map((p, idx) => {
                  const isCurrentUser = p.created_by === user.email;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        isCurrentUser ? 'bg-teal-50 border-2 border-teal-300' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {idx < 3 ? <Crown className="w-5 h-5" /> : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {p.display_name || 'Anonymous User'}
                          {isCurrentUser && <Badge className="ml-2 bg-teal-600">You</Badge>}
                        </p>
                        <p className="text-sm text-gray-600">{p.stage || 'Exploring'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{p.points || 0}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </GraceCard>
          </TabsContent>

          {/* AI Suggestions */}
          <TabsContent value="ai-suggestions">
            <GraceCard className="bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-center mb-6">
                <Sparkles className="w-12 h-12 mx-auto text-purple-600 mb-3" />
                <h3 className="text-xl font-bold text-gray-900">AI-Powered Challenge Suggestions</h3>
                <p className="text-gray-600 mt-2">
                  Get personalized challenge recommendations based on your recovery stage and goals
                </p>
              </div>

              <div className="flex justify-center mb-6">
                <Button
                  onClick={handleGetSuggestions}
                  disabled={loadingSuggestions}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {loadingSuggestions ? 'Analyzing...' : 'Get AI Suggestions'}
                </Button>
              </div>

              {aiSuggestions && (
                <div className="space-y-4">
                  {aiSuggestions.map((suggestion, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <GraceCard className="bg-white">
                        <div className="flex items-start gap-3">
                          <Target className="w-6 h-6 text-purple-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                            <div className="p-3 bg-purple-50 rounded-lg mb-3">
                              <p className="text-sm text-purple-900">
                                <strong>Why this challenge?</strong> {suggestion.why_recommended}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <Badge>{suggestion.challenge_type}</Badge>
                              <span className="text-gray-600">{suggestion.target_count} actions</span>
                              <span className="text-purple-600 font-medium">+{suggestion.points_reward} pts</span>
                            </div>
                          </div>
                        </div>
                      </GraceCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </GraceCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}