import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

export default function StreakCounter({ streak = 0, showLabel = true }) {
  const isActive = streak > 0;
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200"
    >
      <motion.div
        animate={isActive ? { 
          scale: [1, 1.2, 1],
          rotate: [0, -10, 10, 0]
        } : {}}
        transition={{ 
          duration: 0.6,
          repeat: isActive ? Infinity : 0,
          repeatDelay: 2
        }}
      >
        <Flame className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
      </motion.div>
      <span className={`font-bold text-lg ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
        {streak}
      </span>
      {showLabel && (
        <span className="text-sm text-gray-600">
          day{streak !== 1 ? 's' : ''}
        </span>
      )}
    </motion.div>
  );
}