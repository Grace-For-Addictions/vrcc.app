import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Unlock, MessageCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function CommunalBiomesView({ user }) {
  const { data: biomes } = useQuery({
    queryKey: ['communalBiomes'],
    queryFn: () => base44.entities.CommunalBiome.filter({ is_active: true }),
    initialData: []
  });

  const biomeColors = {
    justice_healing: 'from-purple-500 to-indigo-500',
    family_hope: 'from-pink-500 to-rose-500',
    youth_resilience: 'from-blue-500 to-cyan-500',
    substance_freedom: 'from-green-500 to-teal-500',
    mental_wellness: 'from-amber-500 to-orange-500',
    peer_strength: 'from-teal-500 to-emerald-500'
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Communal Biomes</h3>
        <p className="text-gray-700">
          Shared environments that flourish with collective participation. Your practice contributes to the whole community's growth.
        </p>
      </GraceCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {biomes.map((biome, idx) => (
          <motion.div
            key={biome.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <GraceCard hover>
              <div className={`h-32 rounded-xl bg-gradient-to-br ${biomeColors[biome.biome_type]} mb-4 flex items-center justify-center`}>
                <Users className="w-16 h-16 text-white/80" />
              </div>
              
              <h4 className="font-bold text-gray-900 mb-2">{biome.biome_name}</h4>
              <p className="text-sm text-gray-600 mb-4">{biome.description}</p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Flourish Level</span>
                    <span className="font-semibold text-teal-700">{biome.flourish_level}%</span>
                  </div>
                  <Progress value={biome.flourish_level} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{biome.participant_count} participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{biome.total_practice_hours}h</span>
                  </div>
                </div>

                {biome.unlocked_resources?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      {biome.unlocked_resources.length} resources unlocked
                    </span>
                  </div>
                )}

                {biome.pollination_posts?.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <MessageCircle className="w-3 h-3" />
                      <span>Recent Pollination</span>
                    </div>
                    <p className="text-sm italic text-gray-600">
                      "{biome.pollination_posts[biome.pollination_posts.length - 1]?.inspiration_text}"
                    </p>
                  </div>
                )}
              </div>
            </GraceCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}