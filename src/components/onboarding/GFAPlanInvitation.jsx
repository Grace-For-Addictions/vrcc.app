import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import GraceCard from '@/components/common/GraceCard';

export default function GFAPlanInvitation({ user, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(`gfa-plan-invitation-${user?.email}`);
    if (isDismissed) {
      setDismissed(true);
    }
  }, [user]);

  const handleDismiss = () => {
    localStorage.setItem(`gfa-plan-invitation-${user?.email}`, 'true');
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <GraceCard gradient className="relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Heart className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create Your GFA Plan Whenever You're Ready
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Many people find it helpful to create a personal Grace-Filled Action Plan—a gentle 
                roadmap rooted in gratitude, resilience, acceptance, connection, and empowerment. 
                No rush, no pressure. Just an invitation when it feels right.
              </p>

              <div className="flex flex-wrap gap-2">
                <Link to={createPageUrl('MyGFAPlan')}>
                  <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
                    Explore My GFA Plan
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleDismiss}>
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute -bottom-2 -right-2 text-4xl"
          >
            💚
          </motion.div>
        </GraceCard>
      </motion.div>
    </AnimatePresence>
  );
}