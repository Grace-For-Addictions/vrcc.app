import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flower2, Trees, Sun } from 'lucide-react';
import GraceCard from '@/components/common/GraceCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function CommunityGardenVisual({ profile, garden }) {
  const recoveryCapital = profile?.recovery_capital_score || 0;
  const checkInStreak = profile?.current_streak || 0;
  
  const gardenStage = recoveryCapital < 30 ? 'seedling' : recoveryCapital < 60 ? 'growing' : 'flourishing';
  
  const plants = [
    { id: 1, size: Math.min(checkInStreak * 2, 100), color: 'text-green-500', emoji: '🌱' },
    { id: 2, size: Math.min(recoveryCapital, 100), color: 'text-teal-500', emoji: '🌿' },
    { id: 3, size: Math.min(profile?.total_points / 10 || 0, 100), color: 'text-blue-500', emoji: '🌺' }
  ];

  return (
    <GraceCard className="bg-gradient-to-br from-green-50 via-teal-50 to-blue-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Flower2 className="w-6 h-6 text-green-600" />
            Your Recovery Garden
          </h3>
          <p className="text-sm text-gray-600 mt-1">Growing with each step you take 🌱</p>
        </div>
        <Badge className="bg-green-600 text-white capitalize">{gardenStage}</Badge>
      </div>

      {/* Garden Visualization */}
      <div className="relative h-64 bg-gradient-to-b from-blue-100 to-green-200 rounded-xl overflow-hidden mb-6">
        {/* Sun */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-4 right-4"
        >
          <Sun className="w-12 h-12 text-yellow-400" />
        </motion.div>

        {/* Ground */}
        <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-green-800 to-green-600" />

        {/* Plants */}
        <div className="absolute bottom-20 w-full flex justify-around items-end px-8">
          {plants.map((plant, idx) => (
            <motion.div
              key={plant.id}
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: idx * 0.2, type: 'spring' }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                style={{ fontSize: `${plant.size}px` }}
              >
                {plant.emoji}
              </motion.div>
              <div className={`text-xs font-medium ${plant.color} mt-2`}>
                {plant.size}%
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sparkles Effect */}
        {gardenStage === 'flourishing' && (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
          >
            <Sparkles className="w-16 h-16 text-yellow-300" />
          </motion.div>
        )}
      </div>

      {/* Growth Metrics */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Recovery Capital</span>
            <span className="text-sm font-bold text-green-600">{recoveryCapital}/100</span>
          </div>
          <Progress value={recoveryCapital} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Check-in Streak</span>
            <span className="text-sm font-bold text-teal-600">{checkInStreak} days 🔥</span>
          </div>
          <Progress value={Math.min(checkInStreak * 5, 100)} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Engagement Points</span>
            <span className="text-sm font-bold text-blue-600">{profile?.total_points || 0}</span>
          </div>
          <Progress value={Math.min((profile?.total_points || 0) / 10, 100)} className="h-2" />
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-300">
        <p className="text-sm text-green-900 italic">
          "Every connection, every check-in, every brave step grows new neural pathways. 
          Your brain is literally rewiring for resilience. Keep nurturing your garden! 🧠💚"
        </p>
      </div>
    </GraceCard>
  );
}