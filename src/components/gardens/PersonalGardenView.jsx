import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sprout, Flower, TreePine, Cloud, Sun, Droplets, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import GraceCard from '@/components/common/GraceCard';

const gardenThemes = {
  meadow: { bg: 'from-green-200 to-yellow-100', sky: 'from-blue-300 to-blue-100' },
  forest: { bg: 'from-green-600 to-green-400', sky: 'from-gray-600 to-gray-400' },
  coastal: { bg: 'from-blue-300 to-sand-200', sky: 'from-blue-400 to-cyan-200' },
  desert: { bg: 'from-yellow-200 to-orange-200', sky: 'from-orange-300 to-yellow-200' },
  mountain: { bg: 'from-gray-300 to-white', sky: 'from-blue-500 to-purple-300' }
};

export default function PersonalGardenView({ garden, user }) {
  const [selectedTheme, setSelectedTheme] = useState(garden.garden_type);
  const queryClient = useQueryClient();

  const updateGarden = useMutation({
    mutationFn: (data) => base44.entities.PersonalGarden.update(garden.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['personalGarden']);
    }
  });

  const theme = gardenThemes[selectedTheme] || gardenThemes.meadow;

  return (
    <div className="space-y-6">
      <GraceCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{garden.garden_name}</h3>
          <Select 
            value={selectedTheme} 
            onValueChange={(v) => {
              setSelectedTheme(v);
              updateGarden.mutate({ garden_type: v });
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meadow">🌻 Meadow</SelectItem>
              <SelectItem value="forest">🌲 Forest</SelectItem>
              <SelectItem value="coastal">🌊 Coastal</SelectItem>
              <SelectItem value="desert">🌵 Desert</SelectItem>
              <SelectItem value="mountain">⛰️ Mountain</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Visual Garden Scene */}
        <div className={`relative h-96 rounded-xl overflow-hidden bg-gradient-to-b ${theme.sky}`}>
          {/* Sun/Moon */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-8 right-8"
          >
            <Sun className="w-16 h-16 text-yellow-300 drop-shadow-lg" />
          </motion.div>

          {/* Clouds */}
          <motion.div
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-12 left-1/4"
          >
            <Cloud className="w-12 h-12 text-white/70" />
          </motion.div>

          {/* Ground */}
          <div className={`absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t ${theme.bg}`}>
            {/* Plants */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-8 pb-4">
              {garden.plants_grown?.map((plant, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.2, type: "spring" }}
                  className="relative"
                >
                  {plant.plant_type === 'flower' && (
                    <Flower className={`w-${8 + plant.growth_stage * 2} h-${8 + plant.growth_stage * 2} text-pink-500`} />
                  )}
                  {plant.plant_type === 'tree' && (
                    <TreePine className={`w-${10 + plant.growth_stage * 2} h-${10 + plant.growth_stage * 2} text-green-600`} />
                  )}
                  {plant.plant_type === 'sprout' && (
                    <Sprout className={`w-${6 + plant.growth_stage * 2} h-${6 + plant.growth_stage * 2} text-green-500`} />
                  )}
                </motion.div>
              ))}

              {/* Empty slots */}
              {[...Array(Math.max(0, 5 - (garden.plants_grown?.length || 0)))].map((_, idx) => (
                <div key={`empty-${idx}`} className="w-12 h-12 border-2 border-dashed border-gray-400/30 rounded-full flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-gray-400/50" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </GraceCard>

      <GraceCard gradient>
        <h4 className="font-semibold text-gray-900 mb-3">🌱 Your Garden Journey</h4>
        <p className="text-gray-700 mb-4">
          Each practice session nurtures your garden. Plants grow as your neuroplastic pathways strengthen through 
          self-compassion, grounding, and reflection. Your longest streak: <strong>{garden.longest_streak_days} days</strong>.
        </p>
        <div className="flex items-center gap-2 text-sm text-teal-700">
          <Sparkles className="w-4 h-4" />
          <span>Practice daily to unlock new plant varieties and insights</span>
        </div>
      </GraceCard>
    </div>
  );
}