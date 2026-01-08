import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Users, FileText, Database, Calendar, Award, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import OutcomeTracker from '@/components/govdash/OutcomeTracker';
import GrantProposalGenerator from '@/components/govdash/GrantProposalGenerator';
import PolicyTracker from '@/components/govdash/PolicyTracker';
import BeepurpleSync from '@/components/govdash/BeepurpleSync';
import ComplianceMonitor from '@/components/govdash/ComplianceMonitor';
import FundingPipeline from '@/components/govdash/FundingPipeline';
import RealTimeAnalytics from '@/components/govdash/RealTimeAnalytics';
import PredictiveAnalytics from '@/components/govdash/PredictiveAnalytics';
import ClientProgressionDashboard from '@/components/govdash/ClientProgressionDashboard';
import AISessionSummarizer from '@/components/govdash/AISessionSummarizer';
import GrantReportGenerator from '@/components/govdash/GrantReportGenerator';
import RecoveryConAssistant from '@/components/govdash/RecoveryConAssistant';
import AutomatedOutreach from '@/components/govdash/AutomatedOutreach';

export default function GovDashPortal() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
        }
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: sessions } = useQuery({
    queryKey: ['allSessions'],
    queryFn: () => base44.entities.CoachingSessionLog.list('-activity_date', 500),
    enabled: !!user,
    initialData: []
  });

  const { data: outcomes } = useQuery({
    queryKey: ['outcomeTracking'],
    queryFn: () => base44.entities.OutcomeTracking.list('-outcome_date', 200),
    enabled: !!user,
    initialData: []
  });

  const { data: grants } = useQuery({
    queryKey: ['grantProposals'],
    queryFn: () => base44.entities.GrantProposal.list('-created_date', 100),
    enabled: !!user,
    initialData: []
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Shield className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <GraceHeader
          title="GFA RecoveryCon Portal"
          subtitle="AI-Powered Recovery Service Management • Win Grants • Track Outcomes • Prove Impact"
          icon={Shield}
        />
        
        <div className="mb-8 p-6 bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl text-white">
          <h2 className="text-2xl font-bold mb-2">Built by Recovery Professionals, For Recovery Organizations</h2>
          <p className="text-teal-100 mb-4">
            Purpose-built for peer recovery services, behavioral health providers, and recovery community organizations. 
            Streamline proposals, track outcomes, automate reporting, and win more funding—all in one platform.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>HIPAA-Aligned</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <span>5CRM Integrated</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Real-Time Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>AI Grant Writer</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-blue-700">{sessions.length}</h3>
            <p className="text-sm text-gray-600">Total Service Events</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-green-700">{outcomes.length}</h3>
            <p className="text-sm text-gray-600">Tracked Outcomes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-purple-700">{grants.length}</h3>
            <p className="text-sm text-gray-600">Grant Proposals</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-amber-700">
              ${grants.reduce((sum, g) => sum + (g.amount_requested || 0), 0).toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600">Total Requested</p>
          </motion.div>
        </div>

        {/* Real-Time Monitor */}
        <RealTimeAnalytics />

        <Tabs defaultValue="outcomes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-12 bg-white text-xs">
            <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
            <TabsTrigger value="grants">Grants</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="sessions">Sessions AI</TabsTrigger>
            <TabsTrigger value="outreach">Outreach</TabsTrigger>
            <TabsTrigger value="predictive">Predictive</TabsTrigger>
            <TabsTrigger value="progression">Clients</TabsTrigger>
            <TabsTrigger value="policy">Policy</TabsTrigger>
            <TabsTrigger value="beepurple">5CRM</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="funding">Pipeline</TabsTrigger>
            <TabsTrigger value="vr">VR Modules</TabsTrigger>
          </TabsList>

          <TabsContent value="outcomes">
            <OutcomeTracker sessions={sessions} outcomes={outcomes} />
          </TabsContent>

          <TabsContent value="grants">
            <GrantProposalGenerator user={user} sessions={sessions} outcomes={outcomes} />
          </TabsContent>

          <TabsContent value="reports">
            <GrantReportGenerator />
          </TabsContent>

          <TabsContent value="sessions">
            <AISessionSummarizer />
          </TabsContent>

          <TabsContent value="outreach">
            <AutomatedOutreach />
          </TabsContent>

          <TabsContent value="vr">
            <div className="space-y-6">
              <GraceCard gradient>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">VR Recovery Skills Modules</h3>
                <p className="text-gray-700 mb-4">
                  AI-powered VR training with adaptive difficulty, realistic role-playing, and personalized feedback.
                </p>
              </GraceCard>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">💰 Financial Management</h4>
                  {React.createElement(require('@/components/vr/BudgetingVRModule').default, { user })}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">❤️ Relationship Building</h4>
                  {React.createElement(require('@/components/vr/RelationshipBuildingVR').default, { user })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="predictive">
            <PredictiveAnalytics sessions={sessions} outcomes={outcomes} grants={grants} />
          </TabsContent>

          <TabsContent value="progression">
            <ClientProgressionDashboard />
          </TabsContent>

          <TabsContent value="policy">
            <PolicyTracker />
          </TabsContent>

          <TabsContent value="beepurple">
            <BeepurpleSync sessions={sessions} />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceMonitor sessions={sessions} />
          </TabsContent>

          <TabsContent value="funding">
            <FundingPipeline grants={grants} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}