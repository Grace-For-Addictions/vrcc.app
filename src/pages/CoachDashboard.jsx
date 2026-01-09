import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, TrendingUp, AlertTriangle, MessageCircle, Target, Sparkles, Eye, Plus, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function CoachDashboard() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showCareTeamDialog, setShowCareTeamDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_title: '',
    goal_description: '',
    goal_type: 'recovery_capital',
    target_date: ''
  });
  const [careTeamMessage, setCareTeamMessage] = useState({
    subject: '',
    message: '',
    message_type: 'consultation',
    recipient_emails: [],
    shared_insights: []
  });

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

  const { data: myMentees } = useQuery({
    queryKey: ['myMentees', user?.email],
    queryFn: () => base44.entities.SponsorConnection.filter({
      sponsor_email: user.email,
      status: 'active'
    }),
    enabled: !!user,
    initialData: []
  });

  const { data: menteeInsights } = useQuery({
    queryKey: ['menteeInsights', user?.email],
    queryFn: async () => {
      const allInsights = await Promise.all(
        myMentees.map(async (connection) => {
          const insights = await base44.entities.ProgressInsight.filter({
            user_email: connection.mentee_email,
            is_shared_with_sponsor: true
          }, '-insight_date', 5);
          return { mentee_email: connection.mentee_email, insights };
        })
      );
      return allInsights;
    },
    enabled: !!user && myMentees.length > 0,
    initialData: []
  });

  const { data: menteeGoals } = useQuery({
    queryKey: ['menteeGoals', user?.email],
    queryFn: () => base44.entities.MenteeGoal.filter({
      coach_email: user.email
    }),
    enabled: !!user,
    initialData: []
  });

  const createGoal = useMutation({
    mutationFn: (goalData) => base44.entities.MenteeGoal.create(goalData),
    onSuccess: () => {
      queryClient.invalidateQueries(['menteeGoals']);
      setShowGoalDialog(false);
      toast.success('Goal assigned! 🎯');
    }
  });

  const sendCareTeamMessage = useMutation({
    mutationFn: (messageData) => base44.entities.CareTeamMessage.create({
      ...messageData,
      sender_email: user.email,
      sender_role: 'coach'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['careTeamMessages']);
      setShowCareTeamDialog(false);
      toast.success('Message sent to Care Team 📨');
    }
  });

  const { data: menteeActivity } = useQuery({
    queryKey: ['menteeActivity', user?.email],
    queryFn: async () => {
      const activity = await Promise.all(
        myMentees.map(async (connection) => {
          if (!connection.permissions?.view_progress) return null;

          const [checkIns, meetings, assessments] = await Promise.all([
            base44.entities.DailyCheckIn.filter({ created_by: connection.mentee_email }, '-created_date', 7),
            base44.entities.MeetingLog.filter({ user_email: connection.mentee_email }, '-meeting_date', 30),
            base44.entities.Assessment.filter({ created_by: connection.mentee_email }, '-created_date', 2)
          ]);

          return {
            mentee_email: connection.mentee_email,
            recent_check_ins: checkIns.length,
            recent_meetings: meetings.length,
            latest_barc_score: assessments[0]?.total_score || null,
            barc_trend: assessments.length >= 2 
              ? assessments[0].total_score - assessments[1].total_score
              : 0
          };
        })
      );
      return activity.filter(Boolean);
    },
    enabled: !!user && myMentees.length > 0,
    initialData: []
  });

  if (!user) return null;

  const criticalInsights = menteeInsights.flatMap(m => 
    m.insights.filter(i => i.severity === 'critical' || i.severity === 'high')
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader
          title="Coach Dashboard"
          subtitle="Monitor progress, identify needs, and support your mentees"
          icon={Users}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GraceCard>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{myMentees.length}</p>
                <p className="text-sm text-gray-600">Active Mentees</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{criticalInsights.length}</p>
                <p className="text-sm text-gray-600">Needs Attention</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {menteeActivity.filter(m => m.barc_trend > 0).length}
                </p>
                <p className="text-sm text-gray-600">Improving</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {menteeActivity.reduce((sum, m) => sum + m.recent_check_ins, 0)}
                </p>
                <p className="text-sm text-gray-600">Check-ins This Week</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target className="w-4 h-4 mr-2" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="care-team">
              <MessageCircle className="w-4 h-4 mr-2" />
              Care Team
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="space-y-4">
              {myMentees.length === 0 ? (
                <GraceCard className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No mentees yet</h3>
                  <p className="text-gray-500 mt-1">Mentees will appear here once connected</p>
                </GraceCard>
              ) : (
                myMentees.map((connection) => {
                  const activity = menteeActivity.find(a => a.mentee_email === connection.mentee_email);
                  const insights = menteeInsights.find(m => m.mentee_email === connection.mentee_email)?.insights || [];
                  const criticalCount = insights.filter(i => i.severity === 'critical' || i.severity === 'high').length;

                  return (
                    <GraceCard key={connection.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{connection.mentee_email}</h3>
                            {criticalCount > 0 && (
                              <Badge className="bg-red-600 text-white">
                                {criticalCount} Alert{criticalCount !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>

                          {activity && (
                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Check-ins (7d)</p>
                                <p className="text-lg font-semibold">{activity.recent_check_ins}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Meetings (30d)</p>
                                <p className="text-lg font-semibold">{activity.recent_meetings}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">BARC-10</p>
                                <div className="flex items-center gap-1">
                                  <p className="text-lg font-semibold">{activity.latest_barc_score || 'N/A'}</p>
                                  {activity.barc_trend !== 0 && (
                                    <span className={activity.barc_trend > 0 ? 'text-green-600' : 'text-red-600'}>
                                      {activity.barc_trend > 0 ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 mt-4">
                            <Badge variant="outline">
                              Check-ins: {connection.permissions?.view_check_ins ? 'Allowed' : 'Blocked'}
                            </Badge>
                            <Badge variant="outline">
                              Goals: {connection.permissions?.view_goals ? 'Allowed' : 'Blocked'}
                            </Badge>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedMentee(connection)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{connection.mentee_email} - Progress Summary</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {insights.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No insights shared yet</p>
                              ) : (
                                insights.map((insight, idx) => (
                                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline">{insight.insight_type}</Badge>
                                      <Badge className={
                                        insight.severity === 'critical' ? 'bg-red-600 text-white' :
                                        insight.severity === 'high' ? 'bg-orange-600 text-white' :
                                        'bg-gray-200 text-gray-800'
                                      }>
                                        {insight.severity}
                                      </Badge>
                                    </div>
                                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </GraceCard>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* AI Insights */}
          <TabsContent value="insights">
            <div className="space-y-4">
              {criticalInsights.length === 0 ? (
                <GraceCard className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No critical insights</h3>
                  <p className="text-gray-500 mt-1">All mentees appear stable</p>
                </GraceCard>
              ) : (
                criticalInsights.map((insight, idx) => (
                  <GraceCard key={idx} className="border-2 border-orange-300">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                          <Badge className="bg-orange-600 text-white">{insight.severity}</Badge>
                        </div>
                        <p className="text-gray-700 mb-3">{insight.description}</p>
                        {insight.ai_recommendations?.length > 0 && (
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm font-medium text-orange-900 mb-2">Recommended Actions:</p>
                            <ul className="space-y-1">
                              {insight.ai_recommendations.map((rec, i) => (
                                <li key={i} className="text-sm text-gray-700">{i + 1}. {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </GraceCard>
                ))
              )}
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <div className="space-y-4">
              <GraceCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Mentee Goals</h3>
                  <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Assign Goal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Recovery Goal</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select value={selectedMentee?.mentee_email} onValueChange={(v) => setSelectedMentee(myMentees.find(m => m.mentee_email === v))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mentee..." />
                          </SelectTrigger>
                          <SelectContent>
                            {myMentees.map((m) => (
                              <SelectItem key={m.id} value={m.mentee_email}>{m.mentee_email}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Goal title..."
                          value={newGoal.goal_title}
                          onChange={(e) => setNewGoal({ ...newGoal, goal_title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Goal description..."
                          value={newGoal.goal_description}
                          onChange={(e) => setNewGoal({ ...newGoal, goal_description: e.target.value })}
                          rows={3}
                        />
                        <Select value={newGoal.goal_type} onValueChange={(v) => setNewGoal({ ...newGoal, goal_type: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Goal type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="housing">Housing</SelectItem>
                            <SelectItem value="employment">Employment</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="relationships">Relationships</SelectItem>
                            <SelectItem value="recovery_capital">Recovery Capital</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="financial">Financial</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={newGoal.target_date}
                          onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                        />
                        <Button
                          onClick={() => createGoal.mutate({
                            ...newGoal,
                            mentee_email: selectedMentee?.mentee_email,
                            coach_email: user.email
                          })}
                          disabled={!selectedMentee || !newGoal.goal_title}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          Assign Goal
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3">
                  {menteeGoals.map((goal) => (
                    <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{goal.goal_title}</h4>
                          <p className="text-sm text-gray-600">For: {goal.mentee_email}</p>
                        </div>
                        <Badge className={
                          goal.status === 'completed' ? 'bg-green-600' :
                          goal.status === 'active' ? 'bg-blue-600' :
                          'bg-gray-600'
                        }>
                          {goal.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{goal.goal_description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">{goal.goal_type}</Badge>
                        <span className="text-gray-500">Progress: {goal.progress_percentage}%</span>
                        {goal.target_date && (
                          <span className="text-gray-500">Due: {new Date(goal.target_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GraceCard>
            </div>
          </TabsContent>

          {/* Care Team Tab */}
          <TabsContent value="care-team">
            <GraceCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Care Team Collaboration</h3>
                <Dialog open={showCareTeamDialog} onOpenChange={setShowCareTeamDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4 mr-2" />
                      Contact Navigator
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contact Care Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedMentee?.mentee_email} onValueChange={(v) => setSelectedMentee(myMentees.find(m => m.mentee_email === v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mentee..." />
                        </SelectTrigger>
                        <SelectContent>
                          {myMentees.map((m) => (
                            <SelectItem key={m.id} value={m.mentee_email}>{m.mentee_email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={careTeamMessage.message_type} onValueChange={(v) => setCareTeamMessage({ ...careTeamMessage, message_type: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Message type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="referral">Referral Request</SelectItem>
                          <SelectItem value="progress_update">Progress Update</SelectItem>
                          <SelectItem value="concern">Concern</SelectItem>
                          <SelectItem value="celebration">Celebration</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Subject..."
                        value={careTeamMessage.subject}
                        onChange={(e) => setCareTeamMessage({ ...careTeamMessage, subject: e.target.value })}
                      />
                      <Textarea
                        placeholder="Message to care team..."
                        value={careTeamMessage.message}
                        onChange={(e) => setCareTeamMessage({ ...careTeamMessage, message: e.target.value })}
                        rows={4}
                      />
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Checkbox id="consent" />
                          <label htmlFor="consent" className="text-sm text-amber-900">
                            Mentee has given explicit consent to share progress information with navigator
                          </label>
                        </div>
                      </div>
                      <Button
                        onClick={() => sendCareTeamMessage.mutate({
                          ...careTeamMessage,
                          client_email: selectedMentee?.mentee_email,
                          recipient_emails: ['navigator@example.com'], // Replace with actual navigator lookup
                          client_consented: true
                        })}
                        disabled={!selectedMentee || !careTeamMessage.subject || !careTeamMessage.message}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Send to Care Team
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Collaborate with navigators regarding mentee needs, referrals, and progress updates (with consent).
              </p>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Privacy Note:</strong> All shared information requires explicit mentee consent and is encrypted for HIPAA compliance.
                </p>
              </div>
            </GraceCard>
          </TabsContent>

          {/* Activity Feed */}
          <TabsContent value="activity">
            <GraceCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {menteeActivity.map((activity, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{activity.mentee_email}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>{activity.recent_check_ins} check-ins (7d)</span>
                      <span>•</span>
                      <span>{activity.recent_meetings} meetings (30d)</span>
                    </div>
                  </div>
                ))}
              </div>
            </GraceCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}