import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function PostRegistrationNudge({ user }) {
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeType, setNudgeType] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const checkNudgeNeeded = async () => {
      try {
        // Check if assessment exists
        const assessments = await base44.entities.Assessment.filter(
          { created_by: user.email },
          '-created_date',
          1
        );

        // Check if "My Why" is set
        const profile = await base44.entities.UserProfile.filter({ created_by: user.email });
        const hasWhy = profile[0]?.my_why;

        // Check if user has joined a chat
        const messages = await base44.entities.Message.filter(
          { sender_email: user.email },
          '-created_date',
          1
        );

        // Registration → Assessment nudge
        if (assessments.length === 0) {
          const registrationNudgeShown = localStorage.getItem('assessment_nudge_shown');
          if (!registrationNudgeShown) {
            setNudgeType('assessment');
            setShowNudge(true);
            localStorage.setItem('assessment_nudge_shown', 'true');
          }
        }
        // Set Why → Join Chat nudge
        else if (hasWhy && messages.length === 0) {
          const chatNudgeShown = localStorage.getItem('chat_nudge_shown');
          if (!chatNudgeShown) {
            setNudgeType('chat');
            setShowNudge(true);
            localStorage.setItem('chat_nudge_shown', 'true');
          }
        }
      } catch (error) {
        console.error('Nudge check error:', error);
      }
    };

    // Show nudge after 30 seconds on the page
    const timer = setTimeout(checkNudgeNeeded, 30000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleAction = () => {
    if (nudgeType === 'assessment') {
      navigate(createPageUrl('Assessment'));
      toast.success('Let\'s discover your recovery strengths! 💚');
    } else if (nudgeType === 'chat') {
      navigate(createPageUrl('Community'));
      toast.success('Time to connect with your peers! 🤝');
    }
    setShowNudge(false);
  };

  const handleDismiss = () => {
    setShowNudge(false);
    // Show again in 2 hours
    const dismissTime = new Date().getTime() + (2 * 60 * 60 * 1000);
    localStorage.setItem(`${nudgeType}_nudge_dismissed`, dismissTime.toString());
  };

  if (!showNudge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm"
      >
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl p-6 border-2 border-white/20">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              {nudgeType === 'assessment' ? (
                <Brain className="w-6 h-6" />
              ) : (
                <MessageCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">
                {nudgeType === 'assessment' 
                  ? '✨ Ready for Your First Step?'
                  : '💬 Your Community Awaits!'}
              </h3>
              <p className="text-sm text-white/90">
                {nudgeType === 'assessment'
                  ? 'The BARC-10 assessment takes just 2 minutes and helps us understand how to best support you. Your recovery capital score is your roadmap.'
                  : 'You\'ve set your "why" - now connect with others who understand. Join a chat room and share, listen, or just be present. Community rewires the brain.'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAction}
              className="flex-1 bg-white text-purple-600 hover:bg-white/90"
            >
              {nudgeType === 'assessment' ? 'Take Assessment' : 'Join Community'}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              Later
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}