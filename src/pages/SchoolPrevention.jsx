import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, Brain, Users, TrendingUp, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

export default function SchoolPrevention() {
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

  const { data: campaigns } = useQuery({
    queryKey: ['preventionCampaigns'],
    queryFn: () => base44.entities.PreventionCampaign.list('-created_date', 20),
    initialData: []
  });

  const modules = [
    {
      title: 'How Your Brain Changes',
      neuroplasticity: 'Understanding neuroplasticity and recovery',
      duration: '30 min',
      grade: 'middle_school',
      description: 'Interactive lesson on how connection and choices rewire the brain'
    },
    {
      title: 'Building Resilience',
      neuroplasticity: 'Stress response and healthy coping',
      duration: '45 min',
      grade: 'high_school',
      description: 'Skills for handling pressure without substances'
    },
    {
      title: 'Community Connection',
      neuroplasticity: 'Social bonds strengthen neural pathways',
      duration: '30 min',
      grade: 'elementary',
      description: 'Age-appropriate lesson on belonging and support'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="School Prevention Campaigns"
          subtitle="Youth-focused neuroplasticity education - animations, workshops, and curriculum"
          icon={GraduationCap}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {campaigns.reduce((sum, c) => sum + (c.participants_reached || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Students Reached</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{campaigns.length}</p>
                <p className="text-sm text-gray-600">Active Campaigns</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">4.8/5</p>
                <p className="text-sm text-gray-600">Avg Feedback</p>
              </div>
            </div>
          </GraceCard>
        </div>

        {/* Curriculum Modules */}
        <h3 className="text-xl font-bold text-gray-900 mb-6">Curriculum Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {modules.map((module, idx) => (
            <GraceCard key={idx}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{module.title}</h4>
                  <Badge variant="outline" className="mt-1 text-xs">{module.grade}</Badge>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{module.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>⏱️ {module.duration}</span>
                <span>🧠 {module.neuroplasticity}</span>
              </div>

              <Button className="w-full bg-green-600">
                <Play className="w-4 h-4 mr-2" />
                Start Module
              </Button>
            </GraceCard>
          ))}
        </div>

        {/* Active Campaigns */}
        <h3 className="text-xl font-bold text-gray-900 mb-6">Active Campaigns</h3>
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <GraceCard key={campaign.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{campaign.campaign_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{campaign.school_name}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge>{campaign.target_audience}</Badge>
                    <span className="text-sm text-gray-500">
                      {campaign.participants_reached} students reached
                    </span>
                  </div>
                </div>
                <Button variant="outline">View Details</Button>
              </div>
              
              {campaign.completion_rate && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-medium">{campaign.completion_rate}%</span>
                  </div>
                  <Progress value={campaign.completion_rate} className="h-2" />
                </div>
              )}
            </GraceCard>
          ))}
        </div>
      </div>

      <GraceChatWidget />
    </div>
  );
}