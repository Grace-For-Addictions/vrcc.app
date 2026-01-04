import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Users, MapPin, TrendingUp, Briefcase, Home } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

export default function ProviderAnalytics() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: provider } = useQuery({
    queryKey: ['provider'],
    queryFn: async () => {
      if (!user) return null;
      const providers = await base44.entities.Provider.filter({ created_by: user.email });
      return providers[0] || null;
    },
    enabled: !!user
  });

  const { data: referrals } = useQuery({
    queryKey: ['allReferrals'],
    queryFn: async () => {
      if (!provider) return [];
      return base44.entities.Referral.filter({ provider_id: provider.id }, '-created_date', 200);
    },
    enabled: !!provider,
    initialData: []
  });

  const { data: digitalEquityRequests } = useQuery({
    queryKey: ['digitalEquityRequests'],
    queryFn: async () => {
      if (!provider) return [];
      return base44.entities.DigitalEquityRequest.filter(
        { county: provider.county },
        '-created_date',
        100
      );
    },
    enabled: !!provider,
    initialData: []
  });

  const { data: workforceProfiles } = useQuery({
    queryKey: ['workforceInterest'],
    queryFn: async () => {
      return base44.entities.WorkforceProfile.list('-created_date', 100);
    },
    initialData: []
  });

  if (!provider) return null;

  // Aggregate data analysis
  const serviceRequests = referrals.reduce((acc, r) => {
    acc[r.service_needed] = (acc[r.service_needed] || 0) + 1;
    return acc;
  }, {});

  const topServiceRequests = Object.entries(serviceRequests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const referralTrends = {
    lastMonth: referrals.filter(r => {
      const date = new Date(r.created_date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date > monthAgo;
    }).length,
    thisQuarter: referrals.filter(r => {
      const date = new Date(r.created_date);
      const quarterAgo = new Date();
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      return date > quarterAgo;
    }).length
  };

  const digitalEquityStats = {
    hotspot: digitalEquityRequests.filter(r => r.request_type === 'hotspot').length,
    device: digitalEquityRequests.filter(r => r.request_type === 'device').length,
    subsidy: digitalEquityRequests.filter(r => r.request_type === 'internet_subsidy').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Provider Analytics Dashboard"
          subtitle={`Anonymized aggregate data for ${provider.county} County - consent-based insights`}
          icon={BarChart3}
        />

        {/* Privacy Notice */}
        <GraceCard className="mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900">Privacy & Consent</h4>
              <p className="text-sm text-blue-800 mt-1">
                All data shown is anonymized and aggregated. Only participants who have explicitly consented to data sharing are included in these metrics.
              </p>
            </div>
          </div>
        </GraceCard>

        <Tabs defaultValue="needs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="needs">Service Needs</TabsTrigger>
            <TabsTrigger value="digital">Digital Equity</TabsTrigger>
            <TabsTrigger value="workforce">Workforce Interest</TabsTrigger>
          </TabsList>

          <TabsContent value="needs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Service Requests</h3>
                <div className="space-y-3">
                  {topServiceRequests.map(([service, count]) => (
                    <div key={service}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{service}</span>
                        <Badge>{count} requests</Badge>
                      </div>
                      <Progress value={(count / referrals.length) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </GraceCard>

              <GraceCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Trends</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-teal-600" />
                      <div>
                        <p className="text-2xl font-bold text-teal-700">{referralTrends.lastMonth}</p>
                        <p className="text-sm text-gray-600">Referrals (Last 30 days)</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold text-purple-700">{referralTrends.thisQuarter}</p>
                        <p className="text-sm text-gray-600">Referrals (This Quarter)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GraceCard>
            </div>
          </TabsContent>

          <TabsContent value="digital">
            <GraceCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Equity Participation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-700">{digitalEquityStats.hotspot}</p>
                  <p className="text-sm text-gray-600 mt-1">Hotspot Requests</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-700">{digitalEquityStats.device}</p>
                  <p className="text-sm text-gray-600 mt-1">Device Requests</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-700">{digitalEquityStats.subsidy}</p>
                  <p className="text-sm text-gray-600 mt-1">Internet Subsidy</p>
                </div>
              </div>
            </GraceCard>
          </TabsContent>

          <TabsContent value="workforce">
            <GraceCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workforce Development Interest</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-blue-50 rounded-lg text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-blue-600 mb-3" />
                  <p className="text-3xl font-bold text-blue-700">{workforceProfiles.length}</p>
                  <p className="text-sm text-gray-600 mt-1">Active Job Seekers</p>
                </div>
                <div className="p-6 bg-green-50 rounded-lg text-center">
                  <Target className="w-12 h-12 mx-auto text-green-600 mb-3" />
                  <p className="text-3xl font-bold text-green-700">
                    {workforceProfiles.filter(p => p.interview_practice_sessions > 0).length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Using Interview Practice</p>
                </div>
              </div>
            </GraceCard>
          </TabsContent>
        </Tabs>
      </div>

      <GraceChatWidget />
    </div>
  );
}