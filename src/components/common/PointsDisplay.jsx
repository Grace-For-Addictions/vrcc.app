import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function PointsDisplay({ points = 0, showAnimation = true }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200"
    >
      <motion.div
        animate={showAnimation ? {
          rotate: [0, 15, -15, 0],
          scale: [1, 1.1, 1]
        } : {}}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        <Sparkles className="w-5 h-5 text-teal-500" />
      </motion.div>
      <span className="font-bold text-lg text-teal-700">
        {points.toLocaleString()}
      </span>
      <span className="text-sm text-teal-600">
        points
      </span>
    </motion.div>
  );
}