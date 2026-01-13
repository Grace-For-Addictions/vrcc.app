import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Calendar, Users } from 'lucide-react';

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState('all-time');

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['leaderboard-profiles'],
    queryFn: () => base44.entities.UserProfile.list()
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['leaderboard-checkins'],
    queryFn: () => base44.entities.DailyCheckIn.list('-created_date', 500)
  });

  // Calculate rankings
  const calculateMonthlyRankings = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return profiles
      .map(profile => {
        const monthlyCheckIns = checkIns.filter(
          c => c.created_by === profile.created_by && 
          new Date(c.created_date) > thirtyDaysAgo
        ).length;

        return {
          ...profile,
          score: monthlyCheckIns
        };
      })
      .filter(p => p.privacy_settings?.show_on_leaderboard !== false)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  };

  const calculateStreakRankings = () => {
    return profiles
      .filter(p => p.privacy_settings?.show_on_leaderboard !== false)
      .sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0))
      .slice(0, 20);
  };

  const allTimeRankings = profiles
    .filter(p => p.privacy_settings?.show_on_leaderboard !== false)
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 20);

  const monthlyRankings = calculateMonthlyRankings();
  const streakRankings = calculateStreakRankings();

  const renderLeaderboardRow = (profile, index, scoreKey, scoreLabel) => {
    const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
    const score = scoreKey === 'points' ? profile.points :
                 scoreKey === 'current_streak' ? profile.current_streak :
                 profile.score;

    return (
      <div
        key={profile.id}
        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
          index < 3 ? 'bg-gradient-to-r from-teal-50 to-white border-teal-200' : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10">
            {index < 3 ? (
              <Trophy className={`w-6 h-6 ${medalColors[index]}`} />
            ) : (
              <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-teal-700 font-semibold">
                  {profile.display_name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium">{profile.display_name}</p>
              {profile.stage && (
                <p className="text-xs text-gray-500 capitalize">{profile.stage}</p>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-teal-600">{score?.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{scoreLabel}</p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div>Loading leaderboard...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-teal-600" />
              Community Leaderboard
            </CardTitle>
            <CardDescription>
              Celebrating recovery milestones together • Privacy-respecting
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Users className="w-3 h-3" />
            {profiles.filter(p => p.privacy_settings?.show_on_leaderboard !== false).length} participants
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all-time">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-time">
              <Trophy className="w-4 h-4 mr-2" />
              All-Time
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <Calendar className="w-4 h-4 mr-2" />
              This Month
            </TabsTrigger>
            <TabsTrigger value="streaks">
              <TrendingUp className="w-4 h-4 mr-2" />
              Streaks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-time" className="space-y-3 mt-6">
            {allTimeRankings.map((profile, index) =>
              renderLeaderboardRow(profile, index, 'points', 'points')
            )}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-3 mt-6">
            {monthlyRankings.map((profile, index) =>
              renderLeaderboardRow(profile, index, 'score', 'check-ins')
            )}
          </TabsContent>

          <TabsContent value="streaks" className="space-y-3 mt-6">
            {streakRankings.map((profile, index) =>
              renderLeaderboardRow(profile, index, 'current_streak', 'day streak')
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
          <p className="text-sm text-teal-800">
            💚 <strong>Grace-Based Leaderboards:</strong> Rankings celebrate engagement and growth, not competition. 
            Opt out anytime in your privacy settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}