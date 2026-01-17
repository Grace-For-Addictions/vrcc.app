import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Megaphone, TrendingUp, Target, Calendar, DollarSign,
  Sparkles, BarChart3, Users, Heart
} from 'lucide-react';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';

export default function PreventionCampaignManager() {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    campaign_type: 'social_media',
    target_audience: 'community_general',
    counties_targeted: ['Polk'],
    channels: ['facebook', 'instagram'],
    budget: 0
  });
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['preventionCampaigns'],
    queryFn: () => base44.entities.PreventionCampaign.list('-created_date', 50)
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['preventionMetrics'],
    queryFn: () => base44.entities.PreventionCampaignMetrics.list('-campaign_date', 100)
  });

  const generateContentMutation = useMutation({
    mutationFn: async (campaignData) => {
      const response = await base44.functions.invoke('generateCampaignContent', {
        campaign_type: campaignData.campaign_type,
        target_audience: campaignData.target_audience,
        counties: campaignData.counties_targeted,
        themes: ['neuroplasticity', 'hope', 'stigma reduction']
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Campaign content generated! ✨');
      setNewCampaign(prev => ({ 
        ...prev, 
        ai_generated_content: JSON.stringify(data.content, null, 2)
      }));
    }
  });

  const predictEffectivenessMutation = useMutation({
    mutationFn: async (campaignData) => {
      const response = await base44.functions.invoke('predictCampaignEffectiveness', campaignData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Predicted effectiveness: ${data.prediction.effectiveness_score}%`);
      setNewCampaign(prev => ({
        ...prev,
        effectiveness_prediction: data.prediction.effectiveness_score,
        estimated_reach: data.prediction.estimated_reach
      }));
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData) => {
      return await base44.entities.PreventionCampaign.create(campaignData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['preventionCampaigns']);
      toast.success('Campaign created! 🎉');
      setNewCampaign({
        campaign_name: '',
        campaign_type: 'social_media',
        target_audience: 'community_general',
        counties_targeted: ['Polk'],
        channels: ['facebook', 'instagram'],
        budget: 0
      });
    }
  });

  const activeCampaigns = campaigns.filter(c => c.campaign_status === 'active');
  const totalReach = metrics.reduce((sum, m) => sum + (m.reach_count || 0), 0);
  const avgStigmaReduction = metrics.filter(m => m.pre_survey_stigma_score && m.post_survey_stigma_score)
    .reduce((sum, m, _, arr) => sum + ((m.pre_survey_stigma_score - m.post_survey_stigma_score) / arr.length), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{activeCampaigns.length}</p>
              <p className="text-xs text-gray-600">Active Campaigns</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{totalReach.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Total Reach</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{avgStigmaReduction.toFixed(1)}</p>
              <p className="text-xs text-gray-600">Avg Stigma Reduction</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{campaigns.length}</p>
              <p className="text-xs text-gray-600">Total Campaigns</p>
            </div>
          </div>
        </GraceCard>
      </div>

      <Tabs defaultValue="create">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">
            <Sparkles className="w-4 h-4 mr-2" />
            Create Campaign
          </TabsTrigger>
          <TabsTrigger value="active">Active ({activeCampaigns.length})</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <GraceCard>
            <CardHeader>
              <CardTitle>AI-Powered Campaign Builder</CardTitle>
              <CardDescription>
                Generate content, predict effectiveness, and launch prevention campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Campaign Name</label>
                  <Input 
                    value={newCampaign.campaign_name}
                    onChange={(e) => setNewCampaign({...newCampaign, campaign_name: e.target.value})}
                    placeholder="Brain Science in Schools"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Campaign Type</label>
                  <select 
                    className="w-full p-2 border rounded-lg"
                    value={newCampaign.campaign_type}
                    onChange={(e) => setNewCampaign({...newCampaign, campaign_type: e.target.value})}
                  >
                    <option value="social_media">Social Media</option>
                    <option value="school_assembly">School Assembly</option>
                    <option value="community_event">Community Event</option>
                    <option value="media_outreach">Media Outreach</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Audience</label>
                  <select 
                    className="w-full p-2 border rounded-lg"
                    value={newCampaign.target_audience}
                    onChange={(e) => setNewCampaign({...newCampaign, target_audience: e.target.value})}
                  >
                    <option value="youth_k12">Youth (K-12)</option>
                    <option value="college_students">College Students</option>
                    <option value="parents_families">Parents & Families</option>
                    <option value="community_general">General Community</option>
                    <option value="professionals">Professionals</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Budget</label>
                  <Input 
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({...newCampaign, budget: Number(e.target.value)})}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => generateContentMutation.mutate(newCampaign)}
                  disabled={generateContentMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Content
                </Button>
                <Button 
                  onClick={() => predictEffectivenessMutation.mutate(newCampaign)}
                  disabled={predictEffectivenessMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Predict Effectiveness
                </Button>
              </div>

              {newCampaign.ai_generated_content && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold mb-2">AI-Generated Content</h4>
                  <pre className="text-xs overflow-auto max-h-48">{newCampaign.ai_generated_content}</pre>
                </div>
              )}

              {newCampaign.effectiveness_prediction && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Predicted Effectiveness</h4>
                    <Badge className="bg-green-100 text-green-800">
                      {newCampaign.effectiveness_prediction}%
                    </Badge>
                  </div>
                  <Progress value={newCampaign.effectiveness_prediction} className="h-2" />
                  <p className="text-sm mt-2">Estimated reach: {newCampaign.estimated_reach?.toLocaleString()} people</p>
                </div>
              )}

              <Button 
                onClick={() => createCampaignMutation.mutate(newCampaign)}
                disabled={!newCampaign.campaign_name || createCampaignMutation.isPending}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Launch Campaign
              </Button>
            </CardContent>
          </GraceCard>
        </TabsContent>

        <TabsContent value="active">
          <GraceCard>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {activeCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{campaign.campaign_name}</h4>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="capitalize">
                            {campaign.campaign_type.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {campaign.target_audience.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Reach</p>
                            <p className="font-semibold">{campaign.actual_reach?.toLocaleString() || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Engagement</p>
                            <p className="font-semibold">{campaign.engagement_count || 0}</p>
                          </div>
                        </div>
                      </div>
                      {campaign.effectiveness_prediction && (
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Predicted</p>
                          <p className="text-2xl font-bold text-purple-700">
                            {campaign.effectiveness_prediction}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {activeCampaigns.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No active campaigns</p>
                )}
              </div>
            </CardContent>
          </GraceCard>
        </TabsContent>

        <TabsContent value="analytics">
          <GraceCard>
            <CardHeader>
              <CardTitle>Campaign Impact Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <h4 className="font-semibold mb-2">Stigma Reduction Impact</h4>
                  <div className="space-y-2">
                    {metrics.filter(m => m.pre_survey_stigma_score && m.post_survey_stigma_score)
                      .slice(0, 5)
                      .map((metric, idx) => {
                        const reduction = metric.pre_survey_stigma_score - metric.post_survey_stigma_score;
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                            <span className="text-sm">{metric.campaign_name}</span>
                            <Badge className={reduction > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {reduction > 0 ? '↓' : ''} {Math.abs(reduction).toFixed(1)} points
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-2">Total Prevention Reach</h4>
                  <p className="text-3xl font-bold text-blue-700">{totalReach.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">People reached across all campaigns</p>
                </div>
              </div>
            </CardContent>
          </GraceCard>
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-gray-800">
          <strong>Preventative Approaches (Polk County Priority):</strong> AI-powered campaign generation and effectiveness prediction ensure evidence-based prevention that reduces substance use initiation and shifts community attitudes toward hope and recovery.
        </p>
      </div>
    </div>
  );
}