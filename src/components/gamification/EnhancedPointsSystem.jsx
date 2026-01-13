import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, TrendingUp, Award, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

const POINT_SYSTEM = {
  daily_check_in: { points: 10, icon: Star, label: 'Daily Check-in' },
  coaching_session: { points: 50, icon: Target, label: 'Coaching Session' },
  goal_completed: { points: 100, icon: Trophy, label: 'Goal Completed' },
  assessment_completed: { points: 75, icon: TrendingUp, label: 'Assessment' },
  event_attended: { points: 25, icon: Award, label: 'Event Attendance' },
  quiz_completed: { points: 20, icon: Zap, label: 'Quiz Completed' },
  video_watched: { points: 15, icon: Star, label: 'Educational Video' },
  week_streak: { points: 50, icon: Trophy, label: '7-Day Streak Bonus' },
  month_streak: { points: 200, icon: Trophy, label: '30-Day Streak Bonus' }
};

const BADGE_TIERS = [
  { name: 'First Steps', threshold: 0, icon: '🌱', color: 'bg-green-100 text-green-700' },
  { name: 'Growing Strong', threshold: 100, icon: '🌿', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Blooming', threshold: 500, icon: '🌸', color: 'bg-pink-100 text-pink-700' },
  { name: 'Flourishing', threshold: 1000, icon: '🌺', color: 'bg-purple-100 text-purple-700' },
  { name: 'Radiant', threshold: 2500, icon: '✨', color: 'bg-amber-100 text-amber-700' },
  { name: 'Lighthouse', threshold: 5000, icon: '🏆', color: 'bg-yellow-100 text-yellow-700' }
];

export default function EnhancedPointsSystem({ userEmail }) {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['user-profile', userEmail],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: userEmail });
      return profiles[0];
    }
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['recent-activity', userEmail],
    queryFn: async () => {
      const checkIns = await base44.entities.DailyCheckIn.filter({ created_by: userEmail });
      const sessions = await base44.entities.CoachingSessionLog.filter({ client_email: userEmail });
      return [...checkIns, ...sessions].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      ).slice(0, 10);
    }
  });

  const awardPointsMutation = useMutation({
    mutationFn: async ({ activity, points }) => {
      const currentPoints = profile?.points || 0;
      const newPoints = currentPoints + points;
      
      await base44.entities.UserProfile.update(profile.id, {
        points: newPoints
      });

      // Check for badge unlock
      const currentTier = BADGE_TIERS.filter(t => currentPoints >= t.threshold).pop();
      const newTier = BADGE_TIERS.filter(t => newPoints >= t.threshold).pop();
      
      if (newTier && newTier.threshold > (currentTier?.threshold || 0)) {
        // New badge unlocked!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        await base44.entities.Badge.create({
          user_email: userEmail,
          badge_name: newTier.name,
          badge_description: `Earned by reaching ${newTier.threshold} points`,
          badge_icon: newTier.icon,
          earned_date: new Date().toISOString()
        });
      }

      return newPoints;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile', userEmail]);
    }
  });

  const currentTier = BADGE_TIERS.filter(t => (profile?.points || 0) >= t.threshold).pop() || BADGE_TIERS[0];
  const nextTier = BADGE_TIERS.find(t => t.threshold > (profile?.points || 0));
  const progressToNext = nextTier ? 
    ((profile?.points || 0) - currentTier.threshold) / (nextTier.threshold - currentTier.threshold) * 100 : 100;

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-teal-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-3xl">{currentTier.icon}</span>
                {currentTier.name}
              </CardTitle>
              <CardDescription>
                {profile.points.toLocaleString()} total points
              </CardDescription>
            </div>
            <Badge className={currentTier.color}>
              Current Tier
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {nextTier && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress to {nextTier.name} {nextTier.icon}</span>
                <span className="font-medium">
                  {profile.points} / {nextTier.threshold}
                </span>
              </div>
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-gray-500">
                {nextTier.threshold - profile.points} points to go!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ways to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(POINT_SYSTEM).map(([key, { points, icon: Icon, label }]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <Badge variant="outline">+{points}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity. Start your journey today!
              </p>
            ) : (
              recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border-l-2 border-teal-200 pl-3">
                  <span className="text-sm text-gray-700">
                    {activity.session_type || 'Daily check-in'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.created_date).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}