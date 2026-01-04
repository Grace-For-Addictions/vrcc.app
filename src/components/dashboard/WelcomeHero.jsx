import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import StreakCounter from '../common/StreakCounter';
import PointsDisplay from '../common/PointsDisplay';

export default function WelcomeHero({ profile, greeting }) {
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile?.display_name || 'Friend';
  const timeGreeting = getTimeGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 p-8 md:p-10 text-white shadow-xl"
    >
      {/* Animated lighthouse beam effect */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
        <motion.div
          animate={{ 
            rotate: [0, 30, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-full h-full bg-gradient-to-b from-white to-transparent"
          style={{ 
            transformOrigin: 'bottom center',
            clipPath: 'polygon(50% 0%, 30% 100%, 70% 100%)'
          }}
        />
      </div>

      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4"
        >
          <Sparkles className="w-4 h-4" />
          {greeting || "No Fees. No Stigma. Just Grace."}
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {timeGreeting}, {displayName}! 👋
        </h1>
        
        <p className="text-teal-100 text-lg max-w-xl">
          Welcome back to your recovery community. Every connection rewires your brain for healing.
        </p>

        {profile && (
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <StreakCounter streak={profile.current_streak || 0} />
            <PointsDisplay points={profile.points || 0} />
          </div>
        )}
      </div>

      {/* Decorative circles */}
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -top-5 -right-5 w-24 h-24 bg-white/5 rounded-full" />
    </motion.div>
  );
}