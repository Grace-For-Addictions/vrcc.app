import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Calendar, Target, TrendingUp, Heart, MessageCircle, 
  Award, Flame, CheckCircle2, Book, Users, Sparkles 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GraceHeader from '@/components/common/GraceHeader';

export default function ParticipantDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user
  });

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['my-upcoming-events'],
    queryFn: async () => {
      const allEvents = await base44.entities.Event.list();
      return allEvents.filter(e => new Date(e.start_time) > new Date()).slice(0, 3);
    }
  });

  const { data: myGoals = [] } = useQuery({
    queryKey: ['my-goals', user?.email],
    queryFn: () => base44.entities.MenteeGoal.filter({ mentee_email: user.email }),
    enabled: !!user
  });

  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ['my-recent-checkins', user?.email],
    queryFn: () => base44.entities.DailyCheckIn.filter({ created_by: user.email }),
    enabled: !!user
  });

  const { data: mySessions = [] } = useQuery({
    queryKey: ['my-sessions', user?.email],
    queryFn: () => base44.entities.CoachingSessionLog.filter({ client_email: user.email }),
    enabled: !!user
  });

  const { data: myReferrals = [] } = useQuery({
    queryKey: ['my-referrals', user?.email],
    queryFn: () => base44.entities.ClosedLoopReferral.filter({ participant_email: user.email }),
    enabled: !!user
  });

  const activeGoals = myGoals.filter(g => g.status === 'in_progress');
  const completedGoals = myGoals.filter(g => g.status === 'achieved');
  const activeReferrals = myReferrals.filter(r => !['completed', 'closed', 'declined'].includes(r.status));
  
  const last7DaysCheckIns = recentCheckIns.slice(0, 7).reverse();
  const moodData = last7DaysCheckIns.map((c, idx) => ({
    day: `Day ${idx + 1}`,
    mood: c.mood || 3
  }));

  const nextSession = mySessions.find(s => new Date(s.session_date) > new Date());

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <GraceHeader
          title={`Welcome back, ${profile?.first_name || user.full_name}! 💚`}
          subtitle="Your personalized recovery dashboard"
          icon={Sparkles}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-teal-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-orange-600">{profile?.current_streak || 0}</p>
                <p className="text-xs text-gray-600">Day Streak</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-600">{profile?.points || 0}</p>
                <p className="text-xs text-gray-600">Points Earned</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">{activeGoals.length}</p>
                <p className="text-xs text-gray-600">Active Goals</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-600">{completedGoals.length}</p>
                <p className="text-xs text-gray-600">Goals Achieved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Why in Recovery */}
            {profile?.my_why && (
              <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Heart className="w-5 h-5" />
                    My Why in Recovery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 italic">"{profile.my_why}"</p>
                </CardContent>
              </Card>
            )}

            {/* Mood Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>7-Day Mood Tracker</CardTitle>
                <CardDescription>Track your emotional journey</CardDescription>
              </CardHeader>
              <CardContent>
                {moodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={moodData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[1, 5]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="mood" stroke="#14b8a6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Start tracking your mood with daily check-ins
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Active Goals */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Active Goals</CardTitle>
                  <Link to={createPageUrl('Assessment')}>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Goal
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {activeGoals.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No active goals yet</p>
                ) : (
                  <div className="space-y-3">
                    {activeGoals.map(goal => (
                      <div key={goal.id} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium">{goal.goal_description}</p>
                          <Badge variant="outline">{goal.progress_percentage || 0}%</Badge>
                        </div>
                        <Progress value={goal.progress_percentage || 0} className="h-2 mb-2" />
                        {goal.target_date && (
                          <p className="text-xs text-gray-500">
                            Target: {new Date(goal.target_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl('GraceChat')}>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with Grace
                  </Button>
                </Link>
                <Link to={createPageUrl('Assessment')}>
                  <Button variant="outline" className="w-full">
                    <Target className="w-4 h-4 mr-2" />
                    Daily Check-in
                  </Button>
                </Link>
                <Link to={createPageUrl('Resources')}>
                  <Button variant="outline" className="w-full">
                    <Book className="w-4 h-4 mr-2" />
                    Find Resources
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Next Session */}
            {nextSession && (
              <Card className="border-purple-200 bg-purple-50/30">
                <CardHeader>
                  <CardTitle className="text-lg">Next Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {nextSession.session_type?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Coach: {nextSession.coach_email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(nextSession.session_date).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming events</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="p-3 bg-gray-50 rounded-lg border">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.start_time).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <Link to={createPageUrl('Events')}>
                  <Button variant="link" className="w-full mt-2 p-0">
                    View All Events →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Milestones */}
            {profile?.badges && profile.badges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profile.badges.slice(0, 3).map((badge, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium">{badge.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(badge.earned_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}