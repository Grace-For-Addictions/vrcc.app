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
          title="JUST GRACE Data & Policy Portal"
          subtitle="Advanced AI-Driven Analytics, Grant Writing & Outcome Tracking System"
          icon={Shield}
        />

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

        <Tabs defaultValue="outcomes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white">
            <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
            <TabsTrigger value="grants">Grant Writer</TabsTrigger>
            <TabsTrigger value="policy">Policy Tracker</TabsTrigger>
            <TabsTrigger value="beepurple">Beepurple Sync</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="funding">Funding Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="outcomes">
            <OutcomeTracker sessions={sessions} outcomes={outcomes} />
          </TabsContent>

          <TabsContent value="grants">
            <GrantProposalGenerator user={user} sessions={sessions} outcomes={outcomes} />
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