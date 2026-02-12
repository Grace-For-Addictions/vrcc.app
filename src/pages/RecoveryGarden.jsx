// ============================================================================
// DOMAIN: 8. Gamification & Engagement
// PURPOSE: Visual recovery garden that grows with user engagement. Plants unlock
//          at point milestones, includes gifting, leaderboards, and AI suggestions.
// DEPENDENCIES: RecoveryGarden entity, UserProfile entity, GardenGift entity
// ============================================================================

// ============================================================================
// DOMAIN: 8. Gamification & Engagement
// PURPOSE: Visual recovery garden that grows with user engagement. Plants unlock
//          at point milestones, includes gifting, leaderboards, and AI suggestions.
// DEPENDENCIES: RecoveryGarden entity, UserProfile entity, GardenGift entity
// ============================================================================

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Sprout, Flower2, Trees, Sparkles, 
  Award, TrendingUp, Sun, Droplets, Gift
} from 'lucide-react';
import AIPlantSuggestions from '@/components/garden/AIPlantSuggestions';
import PlantGifting from '@/components/garden/PlantGifting';
import CommunityGardenView from '@/components/garden/CommunityGardenView';
import GardenLeaderboards from '@/components/garden/GardenLeaderboards';
import UnlockableDecorations from '@/components/garden/UnlockableDecorations';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';
import GrowingGroups from '@/components/garden/GrowingGroups';

const plantTypes = {
  seed: { icon: Sprout, label: 'Seed', color: 'text-amber-600', points: 0 },
  sprout: { icon: Sprout, label: 'Sprout', color: 'text-green-500', points: 100 },
  flower: { icon: Flower2, label: 'Flower', color: 'text-pink-500', points: 300 },
  tree: { icon: Trees, label: 'Tree', color: 'text-emerald-600', points: 600 },
  special: { icon: Sparkles, label: 'Special Plant', color: 'text-purple-500', points: 1000 }
};

const milestoneRewards = [
  { points: 50, plant: { plant_id: 'hope_seed', plant_type: 'seed', name: 'Seed of Hope', growth_stage: 1 }},
  { points: 100, plant: { plant_id: 'connection_sprout', plant_type: 'sprout', name: 'Connection Sprout', growth_stage: 2 }},
  { points: 250, plant: { plant_id: 'courage_flower', plant_type: 'flower', name: 'Courage Flower', growth_stage: 3 }},
  { points: 500, plant: { plant_id: 'strength_tree', plant_type: 'tree', name: 'Strength Tree', growth_stage: 4 }},
  { points: 1000, plant: { plant_id: 'grace_blossom', plant_type: 'special', name: 'Grace Blossom', growth_stage: 5 }}
];

function PlantCard({ plant, isLocked = false }) {
  const plantConfig = plantTypes[plant.plant_type] || plantTypes.seed;
  const Icon = plantConfig.icon;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={!isLocked ? { scale: 1.05 } : {}}
      className={`relative p-6 rounded-2xl border-2 ${
        isLocked 
          ? 'border-gray-200 bg-gray-50 opacity-60' 
          : 'border-teal-200 bg-gradient-to-br from-white to-teal-50'
      } transition-all`}
    >
      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
        isLocked ? 'bg-gray-200' : 'bg-white shadow-md'
      }`}>
        <Icon className={`w-8 h-8 ${isLocked ? 'text-gray-400' : plantConfig.color}`} />
      </div>
      
      <h4 className={`font-semibold text-center ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
        {plant.name}
      </h4>
      
      <p className={`text-xs text-center mt-1 ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
        {plantConfig.label}
      </p>

      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm border">
            <p className="text-xs font-medium text-gray-600">
              🔒 Unlock at {plantConfig.points} pts
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function RecoveryGarden() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: garden } = useQuery({
    queryKey: ['recoveryGarden'],
    queryFn: async () => {
      if (!user) return null;
      const gardens = await base44.entities.RecoveryGarden.filter({ created_by: user.email });
      return gardens[0] || null;
    },
    enabled: !!user
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  const { data: allProfiles } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-points', 100),
    initialData: []
  });

  useEffect(() => {
    if (userProfile) setProfile(userProfile);
  }, [userProfile]);

  const createGarden = useMutation({
    mutationFn: () => base44.entities.RecoveryGarden.create({
      garden_level: 1,
      total_growth_points: 0,
      plants: [],
      milestones_achieved: [],
      garden_theme: 'hope'
    }),
    onSuccess: () => queryClient.invalidateQueries(['recoveryGarden'])
  });

  const userPoints = profile?.points || 0;
  const gardenLevel = Math.floor(userPoints / 500) + 1;
  const pointsToNextLevel = ((gardenLevel * 500) - userPoints);

  const unlockedPlants = milestoneRewards.filter(m => userPoints >= m.points);
  const lockedPlants = milestoneRewards.filter(m => userPoints < m.points);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Your Recovery Garden"
          subtitle="Watch your garden grow as you engage, connect, and heal. Every action plants seeds of hope."
          icon={Flower2}
        />

        {/* AI Plant Suggestions */}
        {user && profile && (
          <AIPlantSuggestions profile={profile} currentPoints={userPoints} />
        )}

        {/* Collective Community Garden */}
        {allProfiles.length > 0 && (
          <CommunityGardenView allProfiles={allProfiles} />
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-teal-700">{userPoints}</p>
                <p className="text-sm text-gray-500">Growth Points</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Trees className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-700">{unlockedPlants.length}</p>
                <p className="text-sm text-gray-500">Plants Unlocked</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Sun className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-700">Level {gardenLevel}</p>
                <p className="text-sm text-gray-500">Garden Level</p>
              </div>
            </div>
          </GraceCard>
        </div>

        {/* Level Progress */}
        <GraceCard className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Progress to Level {gardenLevel + 1}</h3>
            <span className="text-sm text-gray-600">{pointsToNextLevel} points to go</span>
          </div>
          <Progress value={((userPoints % 500) / 500) * 100} className="h-3" />
        </GraceCard>

        {/* Garden Display */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Garden</h3>
          
          {unlockedPlants.length === 0 ? (
            <GraceCard gradient className="text-center py-12">
              <Sprout className="w-16 h-16 mx-auto text-teal-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Plant Your First Seed!</h3>
              <p className="text-gray-600 mb-6">
                Earn points by connecting with others, completing challenges, and engaging in recovery activities.
                Your first plant unlocks at 50 points!
              </p>
              <div className="flex items-center justify-center gap-2 text-teal-600">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">{userPoints}/50 points</span>
              </div>
            </GraceCard>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {unlockedPlants.map((milestone, idx) => (
                <PlantCard key={idx} plant={milestone.plant} />
              ))}
            </div>
          )}
        </div>

        {/* Locked Plants Preview */}
        {lockedPlants.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Coming Soon to Your Garden</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {lockedPlants.map((milestone, idx) => (
                <PlantCard key={idx} plant={milestone.plant} isLocked />
              ))}
            </div>
          </div>
        )}

        {/* Plant Gifting */}
        {user && profile && (
          <div className="mb-8">
            <PlantGifting currentUser={user} userPoints={userPoints} />
          </div>
        )}

        {/* Leaderboards */}
        <div className="mb-8">
          <GardenLeaderboards />
        </div>

        {/* Unlockable Decorations */}
        <div className="mb-8">
          <UnlockableDecorations 
            totalGifts={0} 
            totalCommunityPoints={allProfiles.reduce((sum, p) => sum + (p.points || 0), 0)} 
          />
        </div>

        {/* Growing Groups Tab */}
        <div className="mb-8">
          <GrowingGroups user={user} />
        </div>

        {/* How to Grow */}
        <GraceCard className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-500" />
            How to Grow Your Garden
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <span className="text-teal-700 font-bold text-sm">+10</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Daily Check-ins</p>
                <p className="text-sm text-gray-600">Share your mood and gratitude</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <span className="text-teal-700 font-bold text-sm">+15</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Community Connections</p>
                <p className="text-sm text-gray-600">Join chat rooms, send kudos</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <span className="text-teal-700 font-bold text-sm">+25</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Complete Assessments</p>
                <p className="text-sm text-gray-600">Track your recovery capital</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <span className="text-teal-700 font-bold text-sm">+30</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Pass Quizzes</p>
                <p className="text-sm text-gray-600">Learn and grow your knowledge</p>
              </div>
            </div>
          </div>
        </GraceCard>
      </div>

      <GraceChatWidget />
    </div>
  );
}