import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GraceCard from '@/components/common/GraceCard';

export default function WelcomeCard({ onStartCheckIn, onStartAssessment, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full"
      >
        <GraceCard className="relative bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 border-2 border-teal-300">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Remind me later"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 mb-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Welcome to Your Grace Space
              </h3>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>
                  I'm Grace, here to walk alongside you on this journey.
                </p>
                <p>
                  Every recovery story begins with a single, courageous step—and yours can start whenever you're ready.
                </p>
                <p>
                  A quick daily check-in or the BARC-10 assessment will help me gently understand what matters most to you right now and begin offering personalized reflections and suggestions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onStartCheckIn}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              <Heart className="w-4 h-4 mr-2" />
              Start with Today's Check-In
            </Button>
            <Button
              onClick={onStartAssessment}
              variant="outline"
              className="flex-1 border-teal-600 text-teal-700 hover:bg-teal-50"
            >
              Take BARC-10 Assessment
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="text-gray-600"
            >
              Remind Me Later
            </Button>
          </div>
        </GraceCard>
      </motion.div>
    </AnimatePresence>
  );
}