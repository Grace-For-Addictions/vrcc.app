import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ClipboardList, Sparkles, Save, FileText, TrendingUp, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import SessionEntryForm from '@/components/coaching/SessionEntryForm';
import SessionHistory from '@/components/coaching/SessionHistory';
import CoachingAnalytics from '@/components/coaching/CoachingAnalytics';
import EnhancedCoachingAnalytics from '@/components/coaching/EnhancedCoachingAnalytics';
import AIResourceNavigator from '@/components/resources/AIResourceNavigator';
import RoleGuard from '@/components/navigation/RoleGuard';
import TooltipWrapper from '@/components/rbac/TooltipWrapper';

export default function CoachingLogger() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: recentSessions } = useQuery({
    queryKey: ['coachingSessions', user?.email],
    queryFn: () => base44.entities.CoachingSessionLog.filter({ coach_name: user.full_name }, '-activity_date', 50),
    enabled: !!user,
    initialData: []
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <GraceCard>
          <ClipboardList className="w-12 h-12 mx-auto text-blue-600 animate-pulse mb-4" />
          <p className="text-gray-600">Loading coaching portal...</p>
        </GraceCard>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['peer_support', 'program_staff']} pageName="Coaching Logger">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <TooltipWrapper tooltipKey="session_notes">
            <GraceHeader
              title="Coaching & Resource Navigation Logger"
              subtitle="AI-assisted session logging with 5CRM integration"
              icon={ClipboardList}
            />
          </TooltipWrapper>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{recentSessions.length}</p>
                <p className="text-sm text-gray-600">Total Sessions Logged</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {new Set(recentSessions.map(s => s.contact_name)).size}
                </p>
                <p className="text-sm text-gray-600">Unique Participants</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {recentSessions.filter(s => s.referral_made).length}
                </p>
                <p className="text-sm text-gray-600">Referrals Made</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <Tabs defaultValue="log" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="log">Log Session</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="resources">AI Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="log">
            <SessionEntryForm user={user} />
          </TabsContent>

          <TabsContent value="history">
            <SessionHistory sessions={recentSessions} user={user} />
          </TabsContent>

          <TabsContent value="analytics">
            <EnhancedCoachingAnalytics sessions={recentSessions} user={user} />
          </TabsContent>

          <TabsContent value="resources">
            <AIResourceNavigator 
              user={user} 
              context={{
                sessionNotes: recentSessions.slice(0, 5).map(s => s.activity_notes).join('\n\n')
              }}
            />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}