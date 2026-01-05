import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Compass, Heart, Users, Brain, MapPin, Calendar, 
  Award, MessageCircle, BookOpen, Shield, Home as HomeIcon,
  Sparkles, ArrowRight, GraduationCap, BarChart3, Building2,
  Video, Coffee, Briefcase, Headphones, Database, Flower2
} from 'lucide-react';

import WelcomeHero from '@/components/dashboard/WelcomeHero';
import QuickActions from '@/components/dashboard/QuickActions';
import DailyChallenge from '@/components/dashboard/DailyChallenge';
import LighthouseBeacon from '@/components/dashboard/LighthouseBeacon';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';
import ProactiveOutreach from '@/components/ai/ProactiveOutreach';
import GoalSettingAssistant from '@/components/ai/GoalSettingAssistant';
import SessionAnalyzer from '@/components/ai/SessionAnalyzer';
import GoalProgressNudges from '@/components/ai/GoalProgressNudges';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  const { data: todayChallenge } = useQuery({
    queryKey: ['dailyChallenge'],
    queryFn: async () => {
      const challenges = await base44.entities.Challenge.filter({ 
        challenge_type: 'daily',
        is_active: true 
      });
      return challenges[0] || null;
    }
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: () => base44.entities.Event.list('-start_time', 3),
    initialData: []
  });

  const beacons = [
    {
      title: 'Community Spaces',
      description: 'Join safe chat rooms, play games, and connect with peers in real-time',
      icon: Users,
      href: 'Community',
      color: 'blue',
      badge: '5 rooms active'
    },
    {
      title: 'Resource Hub',
      description: 'Find treatment, housing, jobs, and support across all 99 Iowa counties',
      icon: MapPin,
      href: 'Resources',
      color: 'emerald',
      badge: '200+ resources'
    },
    {
      title: 'Walls of Grace',
      description: 'Celebrate milestones, send kudos, and honor those we\'ve lost',
      icon: Heart,
      href: 'CommunityWalls',
      color: 'rose'
    },
    {
      title: 'Recovery Assessment',
      description: 'Track your recovery capital with the BARC-10 and watch your garden grow',
      icon: Compass,
      href: 'Assessment',
      color: 'purple'
    },
    {
      title: 'Brain Science',
      description: 'Learn how connection literally rewires your brain for healing',
      icon: Brain,
      href: 'Neuroplasticity',
      color: 'amber'
    },
    {
      title: 'Events & Meetings',
      description: 'Virtual recovery meetings, workshops, game nights, and more',
      icon: Calendar,
      href: 'Events',
      color: 'teal'
    },
    {
      title: 'Knowledge Quizzes',
      description: 'Test your knowledge on recovery topics and earn points',
      icon: Brain,
      href: 'Quizzes',
      color: 'purple',
      isNew: true
    },
    {
      title: 'Recovery Garden',
      description: 'Watch your virtual garden grow as you engage and heal',
      icon: Sparkles,
      href: 'RecoveryGarden',
      color: 'emerald',
      isNew: true
    },
    {
      title: 'Community Garden Hub',
      description: 'Gift seeds, celebrate growth, and view collective milestones',
      icon: Flower2,
      href: 'CommunityGardenHub',
      color: 'green',
      isNew: true
    },
    {
      title: 'Grant Writing Station',
      description: 'Expert AI grant writer with strategic planning and 12+ grantmakers',
      icon: Award,
      href: 'GrantWriter',
      color: 'purple',
      isNew: true
    },
    {
      title: 'Digital Equity',
      description: 'Find free WiFi and internet assistance programs',
      icon: Sparkles,
      href: 'DigitalEquity',
      color: 'blue'
    },
    {
      title: 'Team Challenges',
      description: 'Join team-based community challenges and earn rewards together',
      icon: Users,
      href: 'TeamChallenges',
      color: 'purple',
      isNew: true
    },
    {
      title: 'Peer Coach Training',
      description: 'AI-powered training with VR scenarios and expert feedback',
      icon: GraduationCap,
      href: 'PeerCoachTraining',
      color: 'indigo',
      isNew: true
    },
    {
      title: 'Coach Analytics',
      description: 'Track your performance and get personalized recommendations',
      icon: BarChart3,
      href: 'PeerCoachAnalytics',
      color: 'purple'
    },
    {
      title: 'Provider Hub',
      description: 'Partner portal for warm handoffs and referral tracking',
      icon: Building2,
      href: 'ProviderHub',
      color: 'blue'
    },
    {
      title: 'Video Library',
      description: 'Coach workshops, meditations, and skills - AI safety screened',
      icon: Video,
      href: 'VideoLibrary',
      color: 'purple',
      isNew: true
    },
    {
      title: 'Recovery Café ☕',
      description: 'Your virtual third place - drop in anytime for connection',
      icon: Coffee,
      href: 'RecoveryCapitalCafe',
      color: 'amber',
      isNew: true
    },
    {
      title: 'Narcan Tracker',
      description: 'Track distribution, training, reversals - GPRA ready',
      icon: Shield,
      href: 'NarcanTracker',
      color: 'orange',
      isNew: true
    },
    {
      title: 'Workforce Center',
      description: 'AI resume builder, interview practice, job matching',
      icon: Briefcase,
      href: 'WorkforceDevelopment',
      color: 'blue',
      isNew: true
    },
    {
      title: 'School Prevention',
      description: 'Youth neuroplasticity education and campaigns',
      icon: GraduationCap,
      href: 'SchoolPrevention',
      color: 'green',
      isNew: true
    },
    {
      title: 'Meetings Hub',
      description: 'Virtual meetings with AI summaries and insights',
      icon: Video,
      href: 'MeetingsHub',
      color: 'indigo',
      isNew: true
    },
    {
      title: 'Provider Analytics',
      description: 'Anonymized aggregate data and referral trends',
      icon: BarChart3,
      href: 'ProviderAnalytics',
      color: 'indigo'
    },
    {
      title: 'VR Checkout Hub',
      description: 'VR headset checkout for youth prevention and recovery',
      icon: Headphones,
      href: 'VRCheckoutHub',
      color: 'purple',
      isNew: true
    },
    {
      title: 'IBHRS Reporting',
      description: 'Iowa Behavioral Health Reporting System compliance',
      icon: Database,
      href: 'IBHRSReporting',
      color: 'blue',
      adminOnly: true
    },
    {
      title: 'Admin Dashboard',
      description: 'Real-time analytics and engagement insights',
      icon: Shield,
      href: 'AdminDashboard',
      color: 'red',
      adminOnly: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Welcome Hero */}
        <WelcomeHero profile={profile} />

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <QuickActions />
        </section>

        {/* Daily Challenge */}
        {todayChallenge && (
          <section>
            <DailyChallenge 
              challenge={todayChallenge} 
              progress={0}
              onComplete={() => {}}
            />
          </section>
        )}

        {/* Goal Setting Assistant */}
        {user && profile && (
          <section>
            <GoalSettingAssistant 
              profile={profile}
              onGoalSet={(goal) => {
                // Save goal to profile or separate entity
                base44.auth.updateMe({ 
                  current_goal: goal.goal_statement 
                });
              }}
            />
          </section>
        )}

        {/* Main Beacons Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Explore Your Recovery Community</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {beacons.map((beacon, index) => (
              <LighthouseBeacon
                key={beacon.title}
                {...beacon}
                delay={index * 0.05}
              />
            ))}
          </div>
        </section>

        {/* Upcoming Events Preview */}
        {upcomingEvents.length > 0 && (
          <section>
            <GraceCard gradient>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  Upcoming Events
                </h3>
                <a href="/Events" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100">
                    <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(event.start_time).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GraceCard>
          </section>
        )}

        {/* Tagline Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <p className="text-gray-500 text-sm">
            No Fees. No Stigma. Just Grace. 💚
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Community Rewires the Brain • Recovery is Possible
          </p>
        </motion.div>
      </div>

      {/* AI Grace Chat Widget */}
      <GraceChatWidget />

      {/* AI Features */}
      <ProactiveOutreach user={user} profile={profile} />
      <SessionAnalyzer user={user} profile={profile} />
      <GoalProgressNudges user={user} profile={profile} />
    </div>
  );
}