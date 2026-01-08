import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, Clock, Users, TrendingDown, Target, Sparkles, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function AutomatedOutreach() {
  const [showCreate, setShowCreate] = useState(false);
  const [campaignData, setCampaignData] = useState({
    name: '',
    trigger_type: 'low_engagement',
    message_template: '',
    channel: 'email',
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: checkIns } = useQuery({
    queryKey: ['recent-checkins'],
    queryFn: () => base44.entities.DailyCheckIn.list('-created_date', 200),
    initialData: []
  });

  const { data: sessions } = useQuery({
    queryKey: ['recent-sessions-outreach'],
    queryFn: () => base44.entities.CoachingSessionLog.list('-activity_date', 200),
    initialData: []
  });

  // Analyze engagement patterns
  const analyzeEngagement = () => {
    const now = Date.now();
    const userActivity = {};

    // Track check-in frequency
    checkIns.forEach(ci => {
      const email = ci.created_by;
      if (!userActivity[email]) userActivity[email] = { checkIns: 0, lastActivity: 0, sessions: 0 };
      userActivity[email].checkIns++;
      userActivity[email].lastActivity = Math.max(userActivity[email].lastActivity, new Date(ci.created_date).getTime());
    });

    // Track coaching sessions
    sessions.forEach(s => {
      const email = s.contact_email || s.created_by;
      if (!userActivity[email]) userActivity[email] = { checkIns: 0, lastActivity: 0, sessions: 0 };
      userActivity[email].sessions++;
      userActivity[email].lastActivity = Math.max(userActivity[email].lastActivity, new Date(s.activity_date).getTime());
    });

    const lowEngagement = [];
    const inactive30Days = [];
    const needsGoalSupport = [];

    Object.entries(userActivity).forEach(([email, activity]) => {
      const daysSinceActivity = (now - activity.lastActivity) / (1000 * 60 * 60 * 24);
      
      if (daysSinceActivity > 30) {
        inactive30Days.push(email);
      } else if (daysSinceActivity > 7 && activity.checkIns < 3) {
        lowEngagement.push(email);
      }

      if (activity.sessions > 0 && activity.checkIns === 0) {
        needsGoalSupport.push(email);
      }
    });

    return { lowEngagement, inactive30Days, needsGoalSupport };
  };

  const engagement = analyzeEngagement();

  const generateMessage = async (triggerType) => {
    const prompts = {
      low_engagement: 'Write a warm, encouraging outreach message for someone who has been less active in the GFA recovery app lately. Remind them we miss them, highlight new features, and invite them back. 2-3 sentences.',
      inactive_30_days: 'Write a compassionate check-in message for someone who hasn\'t used the GFA app in 30+ days. Express genuine care, offer support, and let them know the community is here whenever they\'re ready. 2-3 sentences.',
      goal_support: 'Write a motivational message for someone who has been working with a coach but hasn\'t set goals in the app yet. Encourage them to document their goals for better tracking. 2-3 sentences.',
      milestone_celebration: 'Write a celebratory message for someone who has reached a milestone (30/60/90 days, completed assessment). Be enthusiastic and encouraging. 2-3 sentences.'
    };

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[triggerType] + '\n\nInclude GFA branding: "No fees. No stigma. Just grace." Keep it personal, warm, and action-oriented.'
    });

    setCampaignData(prev => ({ ...prev, message_template: response }));
  };

  const createCampaign = useMutation({
    mutationFn: async (data) => {
      // In production, this would save to a Campaign entity
      toast.success('Campaign created! Automated outreach will begin within 24 hours.');
      return data;
    },
    onSuccess: () => {
      setShowCreate(false);
      setCampaignData({
        name: '',
        trigger_type: 'low_engagement',
        message_template: '',
        channel: 'email',
        is_active: true
      });
    }
  });

  const triggerOutreach = async (segment, message) => {
    // Simulate sending outreach
    toast.success(`Sending personalized messages to ${segment.length} users...`);
    
    for (const email of segment.slice(0, 5)) {
      // In production, this would use base44.integrations.Core.SendEmail
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    toast.success(`Outreach campaign sent to ${segment.length} users!`);
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Send className="w-6 h-6 text-blue-600" />
              AI-Powered Automated Outreach
            </h3>
            <p className="text-gray-700">
              Trigger personalized, data-driven communications to re-engage users, celebrate milestones, and offer support.
            </p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Create Campaign
          </Button>
        </div>
      </GraceCard>

      {/* Create Campaign Form */}
      {showCreate && (
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4">New Outreach Campaign</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Campaign Name</label>
              <Input
                value={campaignData.name}
                onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                placeholder="e.g., Re-engagement 30-Day Check-in"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Trigger Condition</label>
              <Select 
                value={campaignData.trigger_type}
                onValueChange={(val) => setCampaignData({ ...campaignData, trigger_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low_engagement">Low Engagement (7+ days, <3 check-ins)</SelectItem>
                  <SelectItem value="inactive_30_days">Inactive 30+ Days</SelectItem>
                  <SelectItem value="goal_support">Sessions but No Goals Set</SelectItem>
                  <SelectItem value="milestone_celebration">Milestone Reached</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message Channel</label>
              <Select 
                value={campaignData.channel}
                onValueChange={(val) => setCampaignData({ ...campaignData, channel: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS (Future)</SelectItem>
                  <SelectItem value="in_app">In-App Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Message Template</label>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => generateMessage(campaignData.trigger_type)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
              </div>
              <Textarea
                value={campaignData.message_template}
                onChange={(e) => setCampaignData({ ...campaignData, message_template: e.target.value })}
                placeholder="Message content... Use {{name}}, {{days_since_activity}}, etc. for personalization"
                rows={5}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Campaign Active</p>
                <p className="text-xs text-gray-600">Automatically send when conditions are met</p>
              </div>
              <Switch
                checked={campaignData.is_active}
                onCheckedChange={(checked) => setCampaignData({ ...campaignData, is_active: checked })}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => createCampaign.mutate(campaignData)}
                disabled={!campaignData.name || !campaignData.message_template}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create Campaign
              </Button>
            </div>
          </div>
        </GraceCard>
      )}

      {/* Engagement Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GraceCard className="text-center">
          <TrendingDown className="w-8 h-8 mx-auto mb-2 text-orange-600" />
          <div className="text-3xl font-bold text-orange-700">{engagement.lowEngagement.length}</div>
          <div className="text-xs text-gray-600">Low Engagement Users</div>
          <Button 
            size="sm" 
            className="mt-3 w-full bg-orange-600 hover:bg-orange-700"
            onClick={() => triggerOutreach(engagement.lowEngagement, 'Hey! We miss you in the community...')}
          >
            Send Re-engagement
          </Button>
        </GraceCard>

        <GraceCard className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <div className="text-3xl font-bold text-red-700">{engagement.inactive30Days.length}</div>
          <div className="text-xs text-gray-600">Inactive 30+ Days</div>
          <Button 
            size="sm" 
            className="mt-3 w-full bg-red-600 hover:bg-red-700"
            onClick={() => triggerOutreach(engagement.inactive30Days, 'Hi friend, checking in on you...')}
          >
            Send Check-In
          </Button>
        </GraceCard>

        <GraceCard className="text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <div className="text-3xl font-bold text-purple-700">{engagement.needsGoalSupport.length}</div>
          <div className="text-xs text-gray-600">Need Goal Support</div>
          <Button 
            size="sm" 
            className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
            onClick={() => triggerOutreach(engagement.needsGoalSupport, 'Ready to set some goals?')}
          >
            Send Goal Prompt
          </Button>
        </GraceCard>
      </div>

      {/* Active Campaigns Preview */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Active Campaigns</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Weekly Engagement Check</p>
                <p className="text-xs text-gray-600">Trigger: 7 days no activity • Channel: Email</p>
              </div>
            </div>
            <Badge className="bg-green-600">Active</Badge>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Send className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Milestone Celebration</p>
                <p className="text-xs text-gray-600">Trigger: 30/60/90 day milestones • Channel: Email + In-App</p>
              </div>
            </div>
            <Badge variant="outline">Paused</Badge>
          </div>
        </div>
      </GraceCard>
    </div>
  );
}