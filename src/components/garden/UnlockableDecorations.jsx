import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GraceCard from '@/components/common/GraceCard';

export default function UnlockableDecorations({ totalGifts, totalCommunityPoints }) {
  const decorations = [
    {
      id: 'fountain',
      name: '⛲ Hope Fountain',
      description: 'A beautiful fountain symbolizing endless support',
      requirement: { type: 'total_gifts', threshold: 100 },
      icon: '⛲'
    },
    {
      id: 'gazebo',
      name: '🏛️ Community Gazebo',
      description: 'A gathering place for connection',
      requirement: { type: 'total_points', threshold: 50000 },
      icon: '🏛️'
    },
    {
      id: 'butterfly_garden',
      name: '🦋 Butterfly Garden',
      description: 'Transformation and growth in motion',
      requirement: { type: 'total_gifts', threshold: 250 },
      icon: '🦋'
    },
    {
      id: 'meditation_circle',
      name: '🧘 Meditation Circle',
      description: 'A sacred space for reflection',
      requirement: { type: 'total_points', threshold: 100000 },
      icon: '🧘'
    },
    {
      id: 'rainbow_bridge',
      name: '🌈 Rainbow Bridge',
      description: 'Honoring those we\'ve lost, connecting all',
      requirement: { type: 'total_gifts', threshold: 500 },
      icon: '🌈'
    },
    {
      id: 'wisdom_tree',
      name: '🌳 Ancient Wisdom Tree',
      description: 'Deep roots, strong branches, endless growth',
      requirement: { type: 'total_points', threshold: 250000 },
      icon: '🌳'
    }
  ];

  const checkUnlocked = (decoration) => {
    if (decoration.requirement.type === 'total_gifts') {
      return totalGifts >= decoration.requirement.threshold;
    }
    return totalCommunityPoints >= decoration.requirement.threshold;
  };

  const getProgress = (decoration) => {
    const current = decoration.requirement.type === 'total_gifts' ? totalGifts : totalCommunityPoints;
    return Math.min((current / decoration.requirement.threshold) * 100, 100);
  };

  return (
    <GraceCard>
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-purple-600" />
        Unlockable Garden Features
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decorations.map((decoration, idx) => {
          const unlocked = checkUnlocked(decoration);
          const progress = getProgress(decoration);

          return (
            <motion.div
              key={decoration.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-xl border-2 ${
                unlocked
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{unlocked ? decoration.icon : '🔒'}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{decoration.name}</h4>
                    {unlocked && (
                      <Badge className="bg-green-100 text-green-800">Unlocked!</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{decoration.description}</p>
                  
                  {!unlocked && (
                    <>
                      <Progress value={progress} className="h-2 mb-2" />
                      <p className="text-xs text-gray-500">
                        {decoration.requirement.type === 'total_gifts'
                          ? `${totalGifts} / ${decoration.requirement.threshold} gifts`
                          : `${totalCommunityPoints.toLocaleString()} / ${decoration.requirement.threshold.toLocaleString()} points`}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GraceCard>
  );
}