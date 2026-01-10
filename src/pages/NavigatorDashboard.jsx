import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, AlertTriangle, Target, Send, 
  TrendingUp, MapPin, Sparkles, Eye, Plus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function NavigatorDashboard() {
  const [user, setUser] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = '/';
      }
    };
    loadUser();
  }, []);

  // Fetch all clients with critical insights
  const { data: prioritizedClients } = useQuery({
    queryKey: ['prioritizedClients'],
    queryFn: async () => {
      const insights = await base44.entities.ProgressInsight.filter({
        severity: { $in: ['critical', 'high'] }
      }, '-insight_date', 50);
      
      const clientEmails = [...new Set(insights.map(i => i.user_email))];
      const clientData = await Promise.all(
        clientEmails.map(async (email) => {
          const clientInsights = insights.filter(i => i.user_email === email);
          const profile = await base44.entities.UserProfile.filter({ created_by: email });
          return {
            email,
            profile: profile[0],
            criticalCount: clientInsights.filter(i => i.severity === 'critical').length,
            highCount: clientInsights.filter(i => i.severity === 'high').length,
            insights: clientInsights.slice(0, 3)
          };
        })
      );
      
      return clientData.sort((a, b) => 
        (b.criticalCount * 10 + b.highCount) - (a.criticalCount * 10 + a.highCount)
      );
    },
    enabled: !!user,
    initialData: []
  });

  const { data: allReferrals } = useQuery({
    queryKey: ['allReferrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 100),
    enabled: !!user,
    initialData: []
  });

  const { data: resources } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list('name', 200),
    initialData: []
  });

  const createReferral = useMutation({
    mutationFn: async (referralData) => {
      const referral = await base44.entities.Referral.create(referralData);
      
      // Sync to BeePurple
      await base44.functions.invoke('syncToBeepurple', {
        endpoint: '/referrals',
        data: {
          client_email: referralData.client_email,
          resource_name: referralData.resource_name,
          barrier_type: referralData.barrier_type,
          status: referralData.status,
          created_date: new Date().toISOString()
        }
      });
      
      return referral;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allReferrals']);
      setShowReferralDialog(false);
      toast.success('Referral created & synced to BeePurple! 🔗');
    }
  });

  const generateAISummary = async (clientEmail) => {
    setAiGenerating(true);
    try {
      const insights = await base44.entities.ProgressInsight.filter({ 
        user_email: clientEmail 
      }, '-insight_date', 5);
      
      const checkIns = await base44.entities.DailyCheckIn.filter({ 
        created_by: clientEmail 
      }, '-created_date', 7);

      const summary = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a concise care team summary for a recovery community member:

Recent Insights: ${JSON.stringify(insights.map(i => ({ type: i.insight_type, severity: i.severity, title: i.title })))}
Recent Check-ins: ${checkIns.length} in past 7 days, avg mood: ${(checkIns.reduce((s, c) => s + c.mood_score, 0) / checkIns.length).toFixed(1)}

Provide:
1. Current status (2 sentences)
2. Primary barriers identified
3. Recommended actions for navigator
4. Urgency level (low/medium/high/critical)

Use trauma-informed, strengths-based language.`,
        response_json_schema: {
          type: "object",
          properties: {
            status: { type: "string" },
            barriers: { type: "array", items: { type: "string" } },
            actions: { type: "array", items: { type: "string" } },
            urgency: { type: "string" }
          }
        }
      });

      setAiSummary(summary);
    } catch (error) {
      toast.error('AI summary failed');
    } finally {
      setAiGenerating(false);
    }
  };

  if (!user) return null;

  const pendingReferrals = allReferrals.filter(r => r.status === 'pending');
  const activeReferrals = allReferrals.filter(r => r.status === 'active');

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader
          title="Navigator Dashboard"
          subtitle="Prioritize caseloads, coordinate care teams, streamline referrals"
          icon={MapPin}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GraceCard>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{prioritizedClients.length}</p>
                <p className="text-sm text-gray-600">Needs Attention</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{pendingReferrals.length}</p>
                <p className="text-sm text-gray-600">Pending Referrals</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{activeReferrals.length}</p>
                <p className="text-sm text-gray-600">Active Referrals</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{resources.length}</p>
                <p className="text-sm text-gray-600">Resources Available</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <Tabs defaultValue="caseload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="caseload">Prioritized Caseload</TabsTrigger>
            <TabsTrigger value="referrals">Referral Management</TabsTrigger>
            <TabsTrigger value="resources">Resource Navigator</TabsTrigger>
          </TabsList>

          {/* Prioritized Caseload */}
          <TabsContent value="caseload">
            <div className="space-y-4">
              {prioritizedClients.length === 0 ? (
                <GraceCard className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">All clients stable</h3>
                  <p className="text-gray-500 mt-1">No urgent interventions needed</p>
                </GraceCard>
              ) : (
                prioritizedClients.map((client, idx) => (
                  <GraceCard key={idx} className={
                    client.criticalCount > 0 ? 'border-2 border-red-300' : 'border-2 border-orange-300'
                  }>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{client.email}</h3>
                          {client.criticalCount > 0 && (
                            <Badge className="bg-red-600 text-white">
                              {client.criticalCount} Critical
                            </Badge>
                          )}
                          {client.highCount > 0 && (
                            <Badge className="bg-orange-600 text-white">
                              {client.highCount} High
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2 mt-3">
                          {client.insights.map((insight, i) => (
                            <div key={i} className="p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">{insight.insight_type}</Badge>
                              </div>
                              <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                              <p className="text-xs text-gray-600">{insight.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedClient(client);
                            generateAISummary(client.email);
                          }}
                          disabled={aiGenerating}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          AI Summary
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client);
                            setShowReferralDialog(true);
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Refer
                        </Button>
                      </div>
                    </div>

                    {selectedClient?.email === client.email && aiSummary && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200"
                      >
                        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          AI Care Team Summary
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">{aiSummary.status}</p>
                        
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Barriers:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {aiSummary.barriers.map((b, i) => (
                              <li key={i} className="text-xs text-gray-600">{b}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Recommended Actions:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {aiSummary.actions.map((a, i) => (
                              <li key={i} className="text-xs text-gray-600">{a}</li>
                            ))}
                          </ul>
                        </div>

                        <Badge className={`mt-3 ${
                          aiSummary.urgency === 'critical' ? 'bg-red-600' :
                          aiSummary.urgency === 'high' ? 'bg-orange-600' :
                          aiSummary.urgency === 'medium' ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`}>
                          Urgency: {aiSummary.urgency}
                        </Badge>
                      </motion.div>
                    )}
                  </GraceCard>
                ))
              )}
            </div>
          </TabsContent>

          {/* Referral Management */}
          <TabsContent value="referrals">
            <GraceCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Referrals</h3>
                <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Referral
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Referral</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Client email..."
                        value={selectedClient?.email || ''}
                        readOnly
                      />
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select resource..." />
                        </SelectTrigger>
                        <SelectContent>
                          {resources.slice(0, 20).map((r) => (
                            <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Barrier type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="housing">Housing</SelectItem>
                          <SelectItem value="employment">Employment</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="transportation">Transportation</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea placeholder="Referral notes..." rows={3} />
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Create & Sync to BeePurple
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {allReferrals.slice(0, 10).map((referral) => (
                  <div key={referral.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{referral.client_email}</p>
                        <p className="text-sm text-gray-600">{referral.resource_name}</p>
                        <Badge className="mt-2" variant="outline">{referral.status}</Badge>
                      </div>
                      <Button size="sm" variant="outline">Update Status</Button>
                    </div>
                  </div>
                ))}
              </div>
            </GraceCard>
          </TabsContent>

          {/* Resource Navigator */}
          <TabsContent value="resources">
            <GraceCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Suggested Resources</h3>
              <p className="text-gray-600 text-sm mb-4">
                Based on current client needs and barriers
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.slice(0, 6).map((resource) => (
                  <div key={resource.id} className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 transition-colors">
                    <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                    <Badge variant="outline" className="mt-2">{resource.category}</Badge>
                    <p className="text-sm text-gray-600 mt-2">{resource.description}</p>
                    {resource.phone && (
                      <p className="text-sm text-teal-600 mt-2">📞 {resource.phone}</p>
                    )}
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