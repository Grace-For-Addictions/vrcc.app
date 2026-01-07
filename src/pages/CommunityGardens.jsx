import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Sprout, Heart, Zap, Calendar, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import PersonalGardenView from '@/components/gardens/PersonalGardenView';
import CommunalBiomesView from '@/components/gardens/CommunalBiomesView';
import AICompanionChat from '@/components/gardens/AICompanionChat';
import PracticeLibrary from '@/components/gardens/PracticeLibrary';
import GrowthJournal from '@/components/gardens/GrowthJournal';
import ARGardenView from '@/components/gardens/ARGardenView';
import BiomeLeaderboard from '@/components/gardens/BiomeLeaderboard';

export default function CommunityGardens() {
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

  const { data: garden } = useQuery({
    queryKey: ['personalGarden', user?.email],
    queryFn: async () => {
      const gardens = await base44.entities.PersonalGarden.filter({ user_email: user.email });
      if (gardens.length === 0) {
        return base44.entities.PersonalGarden.create({
          user_email: user.email,
          garden_name: "My Grace Garden"
        });
      }
      return gardens[0];
    },
    enabled: !!user,
    initialData: null
  });

  const { data: recentSessions } = useQuery({
    queryKey: ['recentPractices', user?.email],
    queryFn: () => base44.entities.PracticeSession.filter({ user_email: user.email }, '-created_date', 10),
    enabled: !!user,
    initialData: []
  });

  if (!user || !garden) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-teal-50 flex items-center justify-center">
        <GraceCard>
          <Sparkles className="w-12 h-12 mx-auto text-green-600 animate-pulse mb-4" />
          <p className="text-gray-600">Preparing your garden...</p>
        </GraceCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-teal-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader
          title="Community Gardens"
          subtitle="Cultivating neuroplastic renewal through daily grace practices"
          icon={Sprout}
        />

        {/* Garden Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GraceCard className="text-center">
            <Calendar className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-green-700">{garden.current_streak_days}</div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </GraceCard>
          <GraceCard className="text-center">
            <Sprout className="w-8 h-8 mx-auto text-teal-600 mb-2" />
            <div className="text-2xl font-bold text-teal-700">{garden.plants_grown?.length || 0}</div>
            <div className="text-xs text-gray-600">Plants Grown</div>
          </GraceCard>
          <GraceCard className="text-center">
            <Heart className="w-8 h-8 mx-auto text-pink-600 mb-2" />
            <div className="text-2xl font-bold text-pink-700">{garden.total_practice_minutes}</div>
            <div className="text-xs text-gray-600">Practice Minutes</div>
          </GraceCard>
          <GraceCard className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-purple-700">{garden.neuroplastic_insights_count}</div>
            <div className="text-xs text-gray-600">Insights Gained</div>
          </GraceCard>
        </div>

        <Tabs defaultValue="garden" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="garden">My Garden</TabsTrigger>
            <TabsTrigger value="ar">AR Mode</TabsTrigger>
            <TabsTrigger value="biomes">Biomes</TabsTrigger>
            <TabsTrigger value="practices">Practices</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="companion">AI Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="garden">
            <PersonalGardenView garden={garden} user={user} />
          </TabsContent>

          <TabsContent value="ar">
            <ARGardenView garden={garden} user={user} />
          </TabsContent>

          <TabsContent value="biomes">
            <div className="space-y-6">
              <CommunalBiomesView user={user} />
              <BiomeLeaderboard />
            </div>
          </TabsContent>

          <TabsContent value="practices">
            <PracticeLibrary user={user} garden={garden} />
          </TabsContent>

          <TabsContent value="journal">
            <GrowthJournal sessions={recentSessions} user={user} />
          </TabsContent>

          <TabsContent value="companion">
            <AICompanionChat user={user} garden={garden} sessions={recentSessions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}