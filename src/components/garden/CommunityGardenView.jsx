import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Flower2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import GraceCard from '@/components/common/GraceCard';

export default function CommunityGardenView({ allProfiles }) {
  const totalCommunityPoints = allProfiles.reduce((sum, p) => sum + (p.points || 0), 0);
  const avgPoints = Math.round(totalCommunityPoints / (allProfiles.length || 1));
  const communityLevel = Math.floor(totalCommunityPoints / 10000);

  const milestones = [
    { points: 10000, label: 'Community Seedling', achieved: totalCommunityPoints >= 10000 },
    { points: 50000, label: 'Flourishing Community', achieved: totalCommunityPoints >= 50000 },
    { points: 100000, label: 'Recovery Forest', achieved: totalCommunityPoints >= 100000 },
    { points: 250000, label: 'Resilience Ecosystem', achieved: totalCommunityPoints >= 250000 }
  ];

  const nextMilestone = milestones.find(m => !m.achieved) || milestones[milestones.length - 1];
  const progressToNext = ((totalCommunityPoints % nextMilestone.points) / nextMilestone.points) * 100;

  return (
    <GraceCard gradient>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
          <Flower2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Our Collective Garden</h3>
          <p className="text-sm text-gray-600">Growing together, healing together</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-white rounded-xl border border-teal-200">
          <Users className="w-6 h-6 mx-auto text-teal-600 mb-2" />
          <p className="text-2xl font-bold text-teal-700">{allProfiles.length}</p>
          <p className="text-xs text-gray-600">Gardeners</p>
        </div>

        <div className="text-center p-4 bg-white rounded-xl border border-green-200">
          <Flower2 className="w-6 h-6 mx-auto text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-700">{totalCommunityPoints.toLocaleString()}</p>
          <p className="text-xs text-gray-600">Total Growth</p>
        </div>

        <div className="text-center p-4 bg-white rounded-xl border border-purple-200">
          <TrendingUp className="w-6 h-6 mx-auto text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-purple-700">{avgPoints}</p>
          <p className="text-xs text-gray-600">Avg Points</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">
            Next Community Milestone: {nextMilestone.label}
          </span>
          <span className="text-sm text-gray-600">
            {totalCommunityPoints.toLocaleString()} / {nextMilestone.points.toLocaleString()}
          </span>
        </div>
        <Progress value={progressToNext} className="h-3 mb-2" />
        <p className="text-xs text-gray-500 italic">
          🧠 Every connection strengthens our collective resilience pathways. Community literally rewires the brain!
        </p>
      </div>

      {/* Milestones Achieved */}
      <div className="mt-6 flex flex-wrap gap-2">
        {milestones.map((milestone, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              milestone.achieved
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}
          >
            {milestone.achieved ? '✓' : '🔒'} {milestone.label}
          </motion.div>
        ))}
      </div>
    </GraceCard>
  );
}