import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  BarChart3, Users, TrendingUp, Activity, 
  MessageCircle, Award, Calendar, Brain,
  AlertCircle, Eye, Zap
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from "@/components/ui/badge";
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import CareAlertMonitor from '@/components/rbac/CareAlertMonitor';
import TooltipWrapper from '@/components/rbac/TooltipWrapper';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        if (u.role !== 'admin') {
          window.location.href = '/';
          return;
        }
        setUser(u);
      } catch (e) {
        window.location.href = '/';
      }
    };
    loadUser();
  }, []);

  // Fetch all relevant data
  const { data: allProfiles } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-updated_date', 500),
    enabled: !!user,
    initialData: []
  });

  const { data: allCheckIns } = useQuery({
    queryKey: ['allCheckIns'],
    queryFn: () => base44.entities.DailyCheckIn.list('-created_date', 1000),
    enabled: !!user,
    initialData: []
  });

  const { data: allMessages } = useQuery({
    queryKey: ['allMessages'],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
    enabled: !!user,
    initialData: []
  });

  const { data: allEvents } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => base44.entities.Event.list('-start_time', 100),
    enabled: !!user,
    initialData: []
  });

  const { data: allQuizResults } = useQuery({
    queryKey: ['allQuizResults'],
    queryFn: () => base44.entities.QuizResult.list('-created_date', 200),
    enabled: !!user,
    initialData: []
  });

  const { data: allCoachingSessions } = useQuery({
    queryKey: ['allCoachingSessions'],
    queryFn: () => base44.entities.CoachingSession.list('-created_date', 500),
    enabled: !!user,
    initialData: []
  });

  const { data: allAssessments } = useQuery({
    queryKey: ['allAssessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 500),
    enabled: !!user,
    initialData: []
  });

  const { data: allMeetings } = useQuery({
    queryKey: ['allMeetings'],
    queryFn: () => base44.entities.MeetingSummary.list('-created_date', 200),
    enabled: !!user,
    initialData: []
  });

  if (!user) return null;

  // Analytics calculations
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats = {
    totalUsers: allProfiles.length,
    activeLastWeek: allProfiles.filter(p => new Date(p.last_active) > sevenDaysAgo).length,
    activeLastMonth: allProfiles.filter(p => new Date(p.last_active) > thirtyDaysAgo).length,
    avgStreak: Math.round(allProfiles.reduce((sum, p) => sum + (p.current_streak || 0), 0) / (allProfiles.length || 1)),
    checkInsLastWeek: allCheckIns.filter(c => new Date(c.created_date) > sevenDaysAgo).length,
    messagesLastWeek: allMessages.filter(m => new Date(m.created_date) > sevenDaysAgo).length,
    eventsAttendance: allEvents.reduce((sum, e) => sum + (e.attendee_count || 0), 0),
    quizCompletions: allQuizResults.length,
    coachingSessionsLastWeek: allCoachingSessions.filter(s => new Date(s.created_date) > sevenDaysAgo).length,
    totalCoachingSessions: allCoachingSessions.length,
    gfarcMeetingAttendance: allMeetings.reduce((sum, m) => sum + (m.participants?.length || 0), 0),
    resourcesNavigated: allProfiles.reduce((sum, p) => sum + (p.resources_accessed?.length || 0), 0),
    avgRCCScore: allAssessments.length > 0 ? 
      (allAssessments.reduce((sum, a) => sum + (a.total_score || 0), 0) / allAssessments.length).toFixed(1) : 0,
    totalRCCAssessments: allAssessments.length,
    rccImprovementRate: (() => {
      const usersWithMultipleAssessments = {};
      allAssessments.forEach(a => {
        if (!usersWithMultipleAssessments[a.created_by]) {
          usersWithMultipleAssessments[a.created_by] = [];
        }
        usersWithMultipleAssessments[a.created_by].push(a);
      });
      let improved = 0;
      Object.values(usersWithMultipleAssessments).forEach(assessments => {
        if (assessments.length >= 2) {
          const sorted = assessments.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
          const first = sorted[0].total_score || 0;
          const last = sorted[sorted.length - 1].total_score || 0;
          if (last > first) improved++;
        }
      });
      const total = Object.keys(usersWithMultipleAssessments).length;
      return total > 0 ? ((improved / total) * 100).toFixed(0) : 0;
    })()
  };

  // Engagement funnel analysis
  const engagementFunnel = {
    registered: allProfiles.length,
    completedAssessment: allProfiles.filter(p => p.recovery_capital_score).length,
    setWhy: allProfiles.filter(p => p.my_why).length,
    joinedChat: allProfiles.filter(p => p.chat_rooms_joined > 0).length,
    weeklyActive: stats.activeLastWeek
  };

  const dropoffPoints = [
    { 
      stage: 'Registration → Assessment', 
      rate: engagementFunnel.registered > 0 ? (1 - engagementFunnel.completedAssessment / engagementFunnel.registered) * 100 : 0 
    },
    { 
      stage: 'Assessment → Set Why', 
      rate: engagementFunnel.completedAssessment > 0 ? (1 - engagementFunnel.setWhy / engagementFunnel.completedAssessment) * 100 : 0 
    },
    { 
      stage: 'Set Why → Join Chat', 
      rate: engagementFunnel.setWhy > 0 ? (1 - engagementFunnel.joinedChat / engagementFunnel.setWhy) * 100 : 0 
    },
    { 
      stage: 'Chat → Weekly Active', 
      rate: engagementFunnel.joinedChat > 0 ? (1 - engagementFunnel.weeklyActive / engagementFunnel.joinedChat) * 100 : 0 
    }
  ].sort((a, b) => b.rate - a.rate);

  // AI Outreach effectiveness
  const aiOutreachMetrics = {
    totalCheckIns: allCheckIns.length,
    avgMoodScore: (allCheckIns.reduce((sum, c) => sum + (c.mood_score || 3), 0) / (allCheckIns.length || 1)).toFixed(1),
    quizPassRate: ((allQuizResults.filter(r => r.passed).length / (allQuizResults.length || 1)) * 100).toFixed(0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Admin Analytics Dashboard"
          subtitle="Real-time insights, engagement tracking, and readiness-based journey analysis"
          icon={BarChart3}
        />

        <CareAlertMonitor userRole={user?.user_role} />

        {/* High-Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <TooltipWrapper tooltipKey="progress">
            <GraceCard>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-600">Total Participants</p>
                </div>
              </div>
            </GraceCard>
          </TooltipWrapper>

          <TooltipWrapper tooltipKey="engagement">
            <GraceCard>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.activeLastWeek}</p>
                  <p className="text-sm text-gray-600">Active (7 days)</p>
                </div>
              </div>
            </GraceCard>
          </TooltipWrapper>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{stats.messagesLastWeek}</p>
                <p className="text-sm text-gray-600">Messages (7d)</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-700">{stats.avgStreak}</p>
                <p className="text-sm text-gray-600">Avg Streak (days)</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <Tabs defaultValue="engagement" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="dropoff">Predictive AI</TabsTrigger>
            <TabsTrigger value="ai-effectiveness">AI Outreach</TabsTrigger>
            <TabsTrigger value="readiness">Readiness Logic</TabsTrigger>
            <TabsTrigger value="reports">Custom Reports</TabsTrigger>
            <TabsTrigger value="resources">Resource Gaps</TabsTrigger>
          </TabsList>

          {/* Engagement Tab */}
          <TabsContent value="engagement">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Engagement (7 days)</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Daily Check-ins</span>
                      <Badge>{stats.checkInsLastWeek}</Badge>
                    </div>
                    <Progress value={(stats.checkInsLastWeek / stats.totalUsers) * 100} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Community Messages</span>
                      <Badge>{stats.messagesLastWeek}</Badge>
                    </div>
                    <Progress value={Math.min((stats.messagesLastWeek / (stats.totalUsers * 5)) * 100, 100)} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Event Attendance</span>
                      <Badge>{stats.eventsAttendance}</Badge>
                    </div>
                    <Progress value={(stats.eventsAttendance / stats.totalUsers) * 100} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Quiz Completions</span>
                      <Badge>{stats.quizCompletions}</Badge>
                    </div>
                    <Progress value={(stats.quizCompletions / stats.totalUsers) * 100} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">GFARC Meeting Attendance</span>
                      <Badge>{stats.gfarcMeetingAttendance}</Badge>
                    </div>
                    <Progress value={(stats.gfarcMeetingAttendance / stats.totalUsers) * 100} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">One-on-One Coaching Sessions</span>
                      <Badge>{stats.coachingSessionsLastWeek}</Badge>
                    </div>
                    <Progress value={(stats.coachingSessionsLastWeek / stats.totalUsers) * 100} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Resources Successfully Navigated</span>
                      <Badge>{stats.resourcesNavigated}</Badge>
                    </div>
                    <Progress value={Math.min((stats.resourcesNavigated / (stats.totalUsers * 3)) * 100, 100)} />
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Avg User Self-ID RCC Rating</span>
                      <Badge variant="outline" className="text-lg font-bold">{stats.avgRCCScore}/50</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Based on {stats.totalRCCAssessments} BARC-10 assessments
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">RCC Improvement Rate</span>
                      <Badge className="bg-green-100 text-green-700">{stats.rccImprovementRate}%</Badge>
                    </div>
                    <Progress value={stats.rccImprovementRate} className="bg-green-100" />
                    <div className="text-xs text-gray-500 mt-1">
                      Users showing improved recovery capital over time
                    </div>
                  </div>
                </div>
              </GraceCard>

              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Journey Funnel</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Registered', count: engagementFunnel.registered, color: 'blue' },
                    { label: 'Completed Assessment', count: engagementFunnel.completedAssessment, color: 'green' },
                    { label: 'Set "Your Why"', count: engagementFunnel.setWhy, color: 'purple' },
                    { label: 'Joined Chat Room', count: engagementFunnel.joinedChat, color: 'teal' },
                    { label: 'Weekly Active', count: engagementFunnel.weeklyActive, color: 'amber' }
                  ].map((stage, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                        <span className="text-sm text-gray-600">{stage.count} users</span>
                      </div>
                      <Progress 
                        value={(stage.count / engagementFunnel.registered) * 100} 
                        className={`h-2 bg-${stage.color}-200`}
                      />
                    </div>
                  ))}
                </div>
              </GraceCard>
            </div>
          </TabsContent>

          {/* Drop-off Analysis */}
          <TabsContent value="dropoff">
            <div className="space-y-6">
              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Drop-off Points (Participant-Led Focus)
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  These metrics identify where users may need additional support or clearer pathways - not pressure to advance.
                </p>
                
                <div className="space-y-4">
                  {dropoffPoints.map((point, idx) => (
                    <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900">{point.stage}</h4>
                          <p className="text-2xl font-bold text-red-700 mt-1">{point.rate.toFixed(0)}% drop-off</p>
                          <p className="text-sm text-red-800 mt-2">
                            Potential intervention: Simplify onboarding, offer guided tour, or add AI nudges
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GraceCard>
              
              <AdvancedPredictiveAnalytics />
            </div>
          </TabsContent>

          {/* AI Effectiveness */}
          <TabsContent value="ai-effectiveness">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Grace Performance</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Total Check-ins Facilitated</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-700">{aiOutreachMetrics.totalCheckIns}</p>
                  </div>

                  <div className="p-4 bg-teal-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-teal-600" />
                      <span className="font-medium text-teal-900">Average Mood Score</span>
                    </div>
                    <p className="text-3xl font-bold text-teal-700">{aiOutreachMetrics.avgMoodScore}/5</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Brain className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Quiz Pass Rate</span>
                    </div>
                    <p className="text-3xl font-bold text-green-700">{aiOutreachMetrics.quizPassRate}%</p>
                  </div>
                </div>
              </GraceCard>

              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Driven Feature Adoption</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Proactive Outreach Engagement</span>
                      <span className="text-sm text-gray-600">
                        {((stats.checkInsLastWeek / stats.totalUsers) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={(stats.checkInsLastWeek / stats.totalUsers) * 100} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Goal-Setting Assistant Usage</span>
                      <span className="text-sm text-gray-600">
                        {allProfiles.filter(p => p.current_goal).length} users
                      </span>
                    </div>
                    <Progress value={(allProfiles.filter(p => p.current_goal).length / stats.totalUsers) * 100} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Resource Match Satisfaction</span>
                      <span className="text-sm text-gray-600">N/A - Coming Soon</span>
                    </div>
                    <Progress value={0} />
                  </div>
                </div>
              </GraceCard>
            </div>
          </TabsContent>

          {/* Readiness Logic */}
          <TabsContent value="readiness">
            <GraceCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Participant-Led Progress Stages</h3>
              <p className="text-sm text-gray-600 mb-6">
                Distribution of users by self-identified recovery stage. No stage is "better" - each is valid and honored.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Exploring', 'Building', 'Thriving'].map(stage => {
                  const count = allProfiles.filter(p => p.stage === stage.toLowerCase()).length;
                  const percentage = ((count / stats.totalUsers) * 100).toFixed(0);
                  
                  return (
                    <div key={stage} className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200">
                      <h4 className="font-semibold text-teal-900 mb-2">{stage}</h4>
                      <p className="text-3xl font-bold text-teal-700">{count}</p>
                      <p className="text-sm text-teal-600">{percentage}% of participants</p>
                      <Progress value={percentage} className="mt-3 h-2" />
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  <strong>Readiness Philosophy:</strong> Users progress at their own pace. The platform adapts to their stage, not the other way around. All data emphasizes participant autonomy and choice.
                </p>
              </div>
            </GraceCard>
          </TabsContent>
        </Tabs>

        {/* Stakeholder Insights */}
        <GraceCard className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            Key Outcomes for Stakeholders
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Critical metrics for grant makers, legislators, state/federal officials, and community partners
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Community Reach</h4>
              <p className="text-3xl font-bold text-blue-700">{stats.totalUsers}</p>
              <p className="text-sm text-blue-600 mt-1">Unique participants served</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Sustained Engagement</h4>
              <p className="text-3xl font-bold text-green-700">{stats.avgStreak} days</p>
              <p className="text-sm text-green-600 mt-1">Average user retention streak</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Recovery Capital Growth</h4>
              <p className="text-3xl font-bold text-purple-700">{stats.rccImprovementRate}%</p>
              <p className="text-sm text-purple-600 mt-1">Users showing RCC improvement</p>
            </div>

            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <h4 className="font-semibold text-teal-900 mb-2">Peer Support Delivered</h4>
              <p className="text-3xl font-bold text-teal-700">{stats.totalCoachingSessions}</p>
              <p className="text-sm text-teal-600 mt-1">One-on-one coaching sessions</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">Crisis Prevention</h4>
              <p className="text-3xl font-bold text-amber-700">24/7</p>
              <p className="text-sm text-amber-600 mt-1">AI Grace availability + peer network</p>
            </div>

            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
              <h4 className="font-semibold text-rose-900 mb-2">Resource Navigation</h4>
              <p className="text-3xl font-bold text-rose-700">{stats.resourcesNavigated}</p>
              <p className="text-sm text-rose-600 mt-1">Resources accessed across Iowa</p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-2">Community Building</h4>
              <p className="text-3xl font-bold text-indigo-700">{stats.messagesLastWeek}</p>
              <p className="text-sm text-indigo-600 mt-1">Peer connections in last 7 days</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <h4 className="font-semibold text-emerald-900 mb-2">Virtual Meeting Reach</h4>
              <p className="text-3xl font-bold text-emerald-700">{stats.gfarcMeetingAttendance}</p>
              <p className="text-sm text-emerald-600 mt-1">Total GFARC participants</p>
            </div>

            <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
              <h4 className="font-semibold text-violet-900 mb-2">Cost Effectiveness</h4>
              <p className="text-3xl font-bold text-violet-700">$0</p>
              <p className="text-sm text-violet-600 mt-1">Participant fees - 100% free</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg">
            <p className="text-sm text-gray-800">
              <strong>Platform Impact:</strong> Grace For Addictions provides statewide, 24/7 peer-led recovery support with zero barriers to access. Powered by AI and neuroplasticity-informed design, the platform demonstrates measurable improvements in recovery capital, sustained engagement, and community connection across all 99 Iowa counties.
            </p>
          </div>
        </GraceCard>

        {/* Custom Reports */}
        <TabsContent value="reports">
          <CustomReportBuilder />
        </TabsContent>

        {/* Resource Gap Analysis */}
        <TabsContent value="resources">
          <ResourceDensityAnalytics />
        </TabsContent>
        </Tabs>

        {/* A/B Testing Section */}
        <GraceCard className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          A/B Testing & Experimentation
        </h3>
        <p className="text-gray-600 mb-4">
          Test new features, content recommendations, and AI prompts to improve participant experience.
        </p>
        <div className="p-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <Eye className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">A/B testing dashboard coming soon</p>
          <p className="text-sm text-gray-500 mt-1">
            Will enable testing of AI prompts, UI variations, and content strategies
          </p>
        </div>
        </GraceCard>
      </div>
    </div>
  );
}