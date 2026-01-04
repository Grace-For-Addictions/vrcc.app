import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Check, Sparkles, Users, MessageCircle, Heart, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import confetti from 'canvas-confetti';

const challengeIcons = {
  chat_peers: MessageCircle,
  post_kudos: Heart,
  complete_assessment: Target,
  join_room: Users,
  share_milestone: Award,
  default: Sparkles
};

export default function DailyChallenge({ challenge, progress = 0, onComplete }) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const Icon = challengeIcons[challenge?.action_type] || challengeIcons.default;
  const targetCount = challenge?.target_count || 1;
  const progressPercent = Math.min((progress / targetCount) * 100, 100);
  const isFullyComplete = progress >= targetCount;

  const handleComplete = async () => {
    if (isFullyComplete) {
      setIsCompleting(true);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#14b8a6', '#10b981', '#f59e0b', '#ec4899']
      });

      setTimeout(() => {
        setCompleted(true);
        setIsCompleting(false);
        onComplete?.(challenge);
      }, 500);
    }
  };

  if (!challenge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <motion.div
          animate={{ 
            rotate: completed ? [0, 360] : 0,
            scale: completed ? [1, 1.2, 1] : 1
          }}
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
            completed 
              ? 'bg-gradient-to-br from-green-400 to-green-600' 
              : 'bg-gradient-to-br from-amber-400 to-orange-500'
          }`}
        >
          {completed ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <Icon className="w-6 h-6 text-white" />
          )}
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              Today's Challenge
            </span>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-bold rounded-full">
              +{challenge.points_reward || 10} pts
            </span>
          </div>
          
          <h3 className={`font-semibold text-gray-900 ${completed ? 'line-through text-gray-500' : ''}`}>
            {challenge.title}
          </h3>
          
          <p className="text-sm text-gray-600 mt-1">
            {challenge.description}
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-amber-700">
                {progress}/{targetCount}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-amber-100" />
          </div>

          <AnimatePresence>
            {isFullyComplete && !completed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4"
              >
                <Button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {isCompleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Award className="w-5 h-5 mr-2" />
                      Claim Reward!
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}