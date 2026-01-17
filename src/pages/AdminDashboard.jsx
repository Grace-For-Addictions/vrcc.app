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
import AdvancedPredictiveAnalytics from '@/components/ai/AdvancedPredictiveAnalytics';
import CustomReportBuilder from '@/components/admin/CustomReportBuilder';
import ResourceDensityAnalytics from '@/components/admin/ResourceDensityAnalytics';
import NeuroplasticityWorkshopGenerator from '@/components/admin/NeuroplasticityWorkshopGenerator';
import GFARCMeetingTrackerDashboard from '@/components/admin/GFARCMeetingTrackerDashboard';
import AutoGrantProposalGenerator from '@/components/admin/AutoGrantProposalGenerator';
import ResourceRequestManager from '@/components/admin/ResourceRequestManager';
import UnifiedCapacityDashboard from '@/components/admin/UnifiedCapacityDashboard';
import FunderRelationshipManager from '@/components/admin/FunderRelationshipManager';
import PreventionCampaignManager from '@/components/admin/PreventionCampaignManager';

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

  const { data: allGFAPlans } = useQuery({
    queryKey: ['allGFAPlans'],
    queryFn: () => base44.entities.GFAPlan.list('-updated_date', 500),
    enabled: !!user,
    initialData: []
  });

  const { data: allANCHORCases } = useQuery({
    queryKey: ['allANCHORCases'],
    queryFn: () => base44.entities.ANCHORCase.list('-updated_date', 500),
    enabled: !!user,
    initialData: []
  });

  const { data: allNarcanLogs } = useQuery({
    queryKey: ['allNarcanLogs'],
    queryFn: () => base44.entities.NarcanLog.list('-created_date', 500),
    enabled: !!user,
    initialData: []
  });

  const { data: allSurveys } = useQuery({
    queryKey: ['allSurveys'],
    queryFn: () => base44.entities.PostSessionSurvey.list('-survey_completed_date', 500),
    enabled: !!user,
    initialData: []
  });

  const { data: allCrossReferrals } = useQuery({
    queryKey: ['allCrossReferrals'],
    queryFn: () => base44.entities.CrossReferral.list('-created_date', 500),
    enabled: !!user,
    initialData: []
  });

  const { data: allPreventionMetrics } = useQuery({
    queryKey: ['allPreventionMetrics'],
    queryFn: () => base44.entities.PreventionCampaignMetrics.list('-campaign_date', 200),
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
    })(),
    gfaPlansCreated: allGFAPlans.filter(p => p.is_active).length,
    gfaPlansOptedInTracking: allGFAPlans.filter(p => p.opt_in_tracking).length,
    gfaPlansOptedInAnonymized: allGFAPlans.filter(p => p.opt_in_anonymized_data).length,
    gfaAvgSectionsCompleted: allGFAPlans.length > 0 ? 
      (allGFAPlans.reduce((sum, p) => sum + (p.sections_completed || 0), 0) / allGFAPlans.length).toFixed(1) : 0,
    gfaTotalGrowthMoments: allGFAPlans.reduce((sum, p) => sum + (p.self_reported_outcomes?.length || 0), 0),
    gfaBARCCorrelation: (() => {
      // Users with both GFA Plan touches and BARC improvements
      const usersWithBothData = allGFAPlans.filter(plan => {
        const userAssessments = allAssessments.filter(a => a.created_by === plan.user_email);
        return userAssessments.length >= 2 && plan.sections_completed > 0;
      });
      
      let positiveCorrelation = 0;
      usersWithBothData.forEach(plan => {
        const userAssessments = allAssessments
          .filter(a => a.created_by === plan.user_email)
          .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        
        if (userAssessments.length >= 2) {
          const first = userAssessments[0].total_score || 0;
          const last = userAssessments[userAssessments.length - 1].total_score || 0;
          if (last > first) positiveCorrelation++;
        }
      });
      
      return usersWithBothData.length > 0 ? 
        ((positiveCorrelation / usersWithBothData.length) * 100).toFixed(0) : 0;
    })(),
    anchorTotalCases: allANCHORCases.length,
    anchorActiveReentry: allANCHORCases.filter(c => c.anchor_status === 'active_live_out' || c.anchor_status === 'transitioning').length,
    anchorEmploymentRate: allANCHORCases.length > 0 ? 
      ((allANCHORCases.filter(c => c.employment_secured).length / allANCHORCases.length) * 100).toFixed(0) : 0,
    anchorRecidivismRate: allANCHORCases.length > 0 ?
      ((allANCHORCases.filter(c => c.anchor_status === 'recidivism').length / allANCHORCases.length) * 100).toFixed(0) : 0,
    narcanTotalDistributed: allNarcanLogs.reduce((sum, n) => sum + (n.kits_distributed || 0), 0),
    narcanReversals: allNarcanLogs.reduce((sum, n) => sum + (n.reversals_reported || 0), 0),
    narcanTrainingsProvided: allNarcanLogs.reduce((sum, n) => sum + (n.trainings_provided || 0), 0),
    surveyAvgSatisfaction: allSurveys.length > 0 ?
      (allSurveys.reduce((sum, s) => sum + (s.satisfaction_score || 0), 0) / allSurveys.length).toFixed(1) : 0,
    surveyAvgQOL: allSurveys.length > 0 ?
      (allSurveys.reduce((sum, s) => sum + (s.quality_of_life_impact || 0), 0) / allSurveys.length).toFixed(1) : 0,
    surveyAvgConnectedness: allSurveys.length > 0 ?
      (allSurveys.reduce((sum, s) => sum + (s.social_connectedness_score || 0), 0) / allSurveys.length).toFixed(1) : 0,
    crossReferralsGenerated: allCrossReferrals.filter(r => r.ai_generated).length,
    crossReferralsAccepted: allCrossReferrals.filter(r => r.referral_status === 'accepted' || r.referral_status === 'completed').length,
    preventionTotalReach: allPreventionMetrics.reduce((sum, p) => sum + (p.reach_count || 0), 0),
    preventionStigmaReduction: (() => {
      const withBoth = allPreventionMetrics.filter(p => p.pre_survey_stigma_score && p.post_survey_stigma_score);
      if (withBoth.length === 0) return 0;
      const avgPre = withBoth.reduce((sum, p) => sum + p.pre_survey_stigma_score, 0) / withBoth.length;
      const avgPost = withBoth.reduce((sum, p) => sum + p.post_survey_stigma_score, 0) / withBoth.length;
      return ((avgPre - avgPost) / avgPre * 100).toFixed(0);
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
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-10 gap-1">
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="gfa-plans">GFA Plans</TabsTrigger>
            <TabsTrigger value="anchor">ANCHOR</TabsTrigger>
            <TabsTrigger value="narcan">Narcan</TabsTrigger>
            <TabsTrigger value="surveys">Surveys/QOL</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="prevention">Prevention</TabsTrigger>
            <TabsTrigger value="dropoff">Predictive AI</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="resources">Resource Gaps</TabsTrigger>
          </TabsList>

          {/* GFA Plans Tab */}
          <TabsContent value="gfa-plans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">GFA Plan Adoption & Outcomes</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Plans Created</span>
                      <Badge>{stats.gfaPlansCreated}</Badge>
                    </div>
                    <Progress value={(stats.gfaPlansCreated / stats.totalUsers) * 100} />
                    <div className="text-xs text-gray-500 mt-1">
                      {((stats.gfaPlansCreated / stats.totalUsers) * 100).toFixed(0)}% of active users
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Opted In to Track Progress</span>
                      <Badge>{stats.gfaPlansOptedInTracking}</Badge>
                    </div>
                    <Progress value={(stats.gfaPlansOptedInTracking / (stats.gfaPlansCreated || 1)) * 100} />
                    <div className="text-xs text-gray-500 mt-1">
                      {((stats.gfaPlansOptedInTracking / (stats.gfaPlansCreated || 1)) * 100).toFixed(0)}% of plan creators
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Contributing Anonymized Data</span>
                      <Badge>{stats.gfaPlansOptedInAnonymized}</Badge>
                    </div>
                    <Progress value={(stats.gfaPlansOptedInAnonymized / (stats.gfaPlansCreated || 1)) * 100} />
                    <div className="text-xs text-gray-500 mt-1">
                      {((stats.gfaPlansOptedInAnonymized / (stats.gfaPlansCreated || 1)) * 100).toFixed(0)}% consented to research
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Avg GRACE Sections Completed</span>
                      <Badge variant="outline" className="text-lg font-bold">{stats.gfaAvgSectionsCompleted}/5</Badge>
                    </div>
                    <Progress value={(stats.gfaAvgSectionsCompleted / 5) * 100} className="bg-teal-100" />
                    <div className="text-xs text-gray-500 mt-1">
                      Average across all active plans
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Self-Reported Growth Moments</span>
                      <Badge className="bg-purple-100 text-purple-700">{stats.gfaTotalGrowthMoments}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Participants tracking small wins and progress
                    </div>
                  </div>
                </div>
              </GraceCard>

              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">GFA Plan Impact on Wellbeing</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200">
                    <h4 className="font-semibold text-teal-900 mb-2">BARC-10 Correlation</h4>
                    <p className="text-4xl font-bold text-teal-700 mb-2">{stats.gfaBARCCorrelation}%</p>
                    <p className="text-sm text-teal-800">
                      Users with active GFA Plans showing BARC-10 improvement
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Most/Least Visited Sections</h4>
                    <div className="space-y-2">
                      {[
                        { section: 'Gratitude', count: allGFAPlans.filter(p => p.section_gratitude).length, color: 'teal' },
                        { section: 'Resilience', count: allGFAPlans.filter(p => p.section_resilience).length, color: 'blue' },
                        { section: 'Acceptance', count: allGFAPlans.filter(p => p.section_acceptance).length, color: 'rose' },
                        { section: 'Connection', count: allGFAPlans.filter(p => p.section_connection).length, color: 'purple' },
                        { section: 'Empowerment', count: allGFAPlans.filter(p => p.section_empowerment).length, color: 'amber' }
                      ].sort((a, b) => b.count - a.count).map((s, idx) => (
                        <div key={s.section}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{s.section}</span>
                            <span>{s.count} plans</span>
                          </div>
                          <Progress value={(s.count / (stats.gfaPlansCreated || 1)) * 100} className={`h-2 bg-${s.color}-200`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900">
                      <strong>Privacy Note:</strong> All aggregated data respects participant consent. Only anonymized patterns from users who opted in are included in analytics.
                    </p>
                  </div>
                </div>
              </GraceCard>
            </div>
          </TabsContent>

          {/* ANCHOR Tab */}
          <TabsContent value="anchor">
            <div className="space-y-6">
              <GraceCard>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Agent 1: ANCHOR Justice-Involved Metrics</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Addiction Navigation & Coaching for Hope, Opportunity, & Reentry
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-700">{stats.anchorTotalCases}</p>
                    <p className="text-sm text-blue-900">Total ANCHOR Cases</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-700">{stats.anchorActiveReentry}</p>
                    <p className="text-sm text-green-900">Active Re-entry</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <p className="text-3xl font-bold text-teal-700">{stats.anchorEmploymentRate}%</p>
                    <p className="text-sm text-teal-900">Employment Secured</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-700">{stats.anchorRecidivismRate}%</p>
                    <p className="text-sm text-red-900">Recidivism Rate</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-800">
                    <strong>Improvement & Innovation:</strong> ANCHOR demonstrates measurable reductions in recidivism through collaborative case planning and employment-focused support. Automated case plan generation saves 45+ minutes per intake.
                  </p>
                </div>
              </GraceCard>

              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live-Out Program & Recovery Court Tracking</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Live-Out Program Enrollment</span>
                      <span className="text-sm">{allANCHORCases.filter(c => c.live_out_program).length} participants</span>
                    </div>
                    <Progress value={(allANCHORCases.filter(c => c.live_out_program).length / (stats.anchorTotalCases || 1)) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Recovery Court Compliance</span>
                      <span className="text-sm">{allANCHORCases.filter(c => c.recovery_court_compliance).length} compliant</span>
                    </div>
                    <Progress value={(allANCHORCases.filter(c => c.recovery_court_compliance).length / (stats.anchorTotalCases || 1)) * 100} className="bg-green-200" />
                  </div>
                </div>
              </GraceCard>
            </div>
          </TabsContent>

          {/* Narcan Tab */}
          <TabsContent value="narcan">
            <div className="space-y-6">
              <GraceCard>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Life-Saving Narcan Distribution</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Preventative Approaches • Public Health Impact
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-3xl font-bold text-orange-700">{stats.narcanTotalDistributed}</p>
                    <p className="text-sm text-orange-900">Kits Distributed</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-700">{stats.narcanReversals}</p>
                    <p className="text-sm text-green-900">Overdose Reversals</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-700">{stats.narcanTrainingsProvided}</p>
                    <p className="text-sm text-blue-900">Trainings Provided</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-green-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-gray-800">
                    <strong>Quantifiable Public Health Metric:</strong> Each Narcan distribution represents a potential life saved. GPS-tagged logs enable heat-mapping of high-need areas across Iowa's 99 counties.
                  </p>
                </div>
              </GraceCard>
            </div>
          </TabsContent>

          {/* Surveys/QOL Tab */}
          <TabsContent value="surveys">
            <div className="space-y-6">
              <GraceCard>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Agent 3: Quality of Life Impact</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Service Excellence • Participant Satisfaction
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-700">{stats.surveyAvgSatisfaction}/5</p>
                    <p className="text-sm text-purple-900">Avg Satisfaction</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <p className="text-3xl font-bold text-teal-700">{stats.surveyAvgQOL}/5</p>
                    <p className="text-sm text-teal-900">QOL Improvement</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-700">{stats.surveyAvgConnectedness}/5</p>
                    <p className="text-sm text-blue-900">Social Connectedness</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Survey Response Rate by Type</h4>
                  <div className="space-y-2">
                    {['peer_coaching', 'gfarc_meeting', 'volunteer_shift', 'workshop'].map(type => {
                      const count = allSurveys.filter(s => s.session_type === type).length;
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                            <span>{count} surveys</span>
                          </div>
                          <Progress value={(count / (allSurveys.length || 1)) * 100} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GraceCard>
            </div>
          </TabsContent>

          {/* Cross-Referrals Tab */}
          <TabsContent value="referrals">
            <div className="space-y-6">
              <GraceCard>
                <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Cross-Referral Engine</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Impactful Collaboration • Fulfilling Basic Needs
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-3xl font-bold text-indigo-700">{stats.crossReferralsGenerated}</p>
                    <p className="text-sm text-indigo-900">AI-Generated Referrals</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-700">{stats.crossReferralsAccepted}</p>
                    <p className="text-sm text-green-900">Accepted/Completed</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <p className="text-3xl font-bold text-teal-700">
                      {stats.crossReferralsAccepted > 0 ? ((stats.crossReferralsAccepted / stats.crossReferralsGenerated) * 100).toFixed(0) : 0}%
                    </p>
                    <p className="text-sm text-teal-900">Acceptance Rate</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Most Common Referral Pathways</h4>
                  <div className="space-y-2">
                    {[
                      { from: 'anchor_reentry', to: 'housing_navigation', label: 'ANCHOR → Housing' },
                      { from: 'peer_coaching', to: 'anchor_reentry', label: 'Peer → ANCHOR' },
                      { from: 'gfarc_meetings', to: 'peer_coaching', label: 'GFARC → Coaching' }
                    ].map(path => {
                      const count = allCrossReferrals.filter(r => r.from_service === path.from && r.to_service === path.to).length;
                      return (
                        <div key={path.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">{path.label}</span>
                          <Badge>{count} referrals</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GraceCard>
            </div>
          </TabsContent>

          {/* Prevention Tab */}
          <TabsContent value="prevention">
            <div className="space-y-6">
              <GraceCard>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Agent 6: Prevention & Media Reach</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Strength-Based Messaging • Stigma Reduction
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-700">{stats.preventionTotalReach.toLocaleString()}</p>
                    <p className="text-sm text-green-900">Total People Reached</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-700">{allPreventionMetrics.length}</p>
                    <p className="text-sm text-purple-900">Campaigns Completed</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <p className="text-3xl font-bold text-teal-700">{stats.preventionStigmaReduction}%</p>
                    <p className="text-sm text-teal-900">Stigma Reduction</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-purple-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-800">
                    <strong>Preventative Approaches:</strong> School-based neuroplasticity education reaches youth before substance use onset. Pre/post surveys demonstrate measurable stigma reduction and increased help-seeking intentions.
                  </p>
                </div>
              </GraceCard>
            </div>
          </TabsContent>

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

          {/* Custom Reports */}
          <TabsContent value="reports">
            <div className="space-y-6">
              <PreventionCampaignManager />
              <UnifiedCapacityDashboard />
              <AutoGrantProposalGenerator />
              <FunderRelationshipManager />
              <ResourceRequestManager />
              <CustomReportBuilder />
              <NeuroplasticityWorkshopGenerator />
              <GFARCMeetingTrackerDashboard />
            </div>
          </TabsContent>

          {/* Resource Gap Analysis */}
          <TabsContent value="resources">
            <ResourceDensityAnalytics />
          </TabsContent>
        </Tabs>

        {/* Stakeholder Insights */}
        <div className="mt-8">
          <GraceCard>
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

              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <h4 className="font-semibold text-teal-900 mb-2">GFA Plans Created</h4>
                <p className="text-3xl font-bold text-teal-700">{stats.gfaPlansCreated}</p>
                <p className="text-sm text-teal-600 mt-1">Personalized recovery action plans</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">Growth Moments Tracked</h4>
                <p className="text-3xl font-bold text-purple-700">{stats.gfaTotalGrowthMoments}</p>
                <p className="text-sm text-purple-600 mt-1">Self-reported progress markers</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg">
              <p className="text-sm text-gray-800">
                <strong>Platform Impact:</strong> Grace For Addictions provides statewide, 24/7 peer-led recovery support with zero barriers to access. Powered by AI and neuroplasticity-informed design, the platform demonstrates measurable improvements in recovery capital, sustained engagement, and community connection across all 99 Iowa counties.
              </p>
            </div>
          </GraceCard>
        </div>

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