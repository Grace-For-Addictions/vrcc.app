import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import GraceCard from '@/components/common/GraceCard';

export default function CelebrationCard({ onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full"
    >
      <GraceCard className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 border-2 border-purple-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1 }}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Thank You for Sharing 💚
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Thank you for sharing that with me. I'm beginning to see your unique strengths and resilience. 
              Your journey is now unfolding here—I'll celebrate every step with you.
            </p>
          </div>
        </div>
      </GraceCard>
    </motion.div>
  );
}