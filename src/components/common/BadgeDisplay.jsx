import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Flame, Heart, Star, Users, Zap, Trophy, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const badgeIcons = {
  connection: Users,
  milestone: Trophy,
  learning: Sparkles,
  giving: Heart,
  streak: Flame,
  special: Star,
  default: Award
};

const badgeColors = {
  connection: 'from-blue-400 to-blue-600',
  milestone: 'from-amber-400 to-amber-600',
  learning: 'from-purple-400 to-purple-600',
  giving: 'from-rose-400 to-rose-600',
  streak: 'from-orange-400 to-red-500',
  special: 'from-teal-400 to-teal-600'
};

export default function BadgeDisplay({ badges = [], size = 'md', showCount = true }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  const displayBadges = badges.slice(0, 5);
  const remainingCount = badges.length - 5;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <AnimatePresence>
          {displayBadges.map((badge, index) => {
            const Icon = badgeIcons[badge.category] || badgeIcons.default;
            const colorClass = badgeColors[badge.category] || 'from-gray-400 to-gray-600';
            
            return (
              <Tooltip key={badge.id || index}>
                <TooltipTrigger>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform`}
                  >
                    <Icon className={`${iconSizes[size]} text-white`} />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{badge.name}</p>
                  {badge.description && <p className="text-xs text-gray-500">{badge.description}</p>}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </AnimatePresence>
        
        {showCount && remainingCount > 0 && (
          <div className={`${sizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600`}>
            +{remainingCount}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}