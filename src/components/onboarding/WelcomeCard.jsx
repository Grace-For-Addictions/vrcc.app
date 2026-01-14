import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GraceCard from '@/components/common/GraceCard';

export default function WelcomeCard({ onStartCheckIn, onStartAssessment, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal timestamp for 48-hour reminder logic
    localStorage.setItem('welcomeCardDismissed', new Date().toISOString());
    const dismissCount = parseInt(localStorage.getItem('welcomeCardDismissCount') || '0');
    localStorage.setItem('welcomeCardDismissCount', String(dismissCount + 1));
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
                  Everything is open to you right now. Start with a quick daily check-in or the BARC-10 assessment (just 2 minutes), or explore freely—there's no wrong way to begin.
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-teal-700 bg-teal-100/50 rounded-lg px-3 py-2">
                  <Sparkles className="w-4 h-4" />
                  <span>All features, tools, and resources are available to you immediately</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onStartCheckIn}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              <Heart className="w-4 h-4 mr-2" />
              Start Today's Check-In
            </Button>
            <Button
              onClick={onStartAssessment}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Take BARC-10 Assessment
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="text-gray-600"
            >
              Explore for Now
            </Button>
          </div>
        </GraceCard>
      </motion.div>
    </AnimatePresence>
  );
}