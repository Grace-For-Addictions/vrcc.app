import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Heart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function MandatoryIntakeModal({ user, onComplete }) {
  const [isOpen, setIsOpen] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Listen for form submission from iframe
    const handleMessage = (event) => {
      // Verify origin for security
      if (event.origin !== 'https://awsna01.fivecrm.com') return;

      if (event.data.type === 'form_progress') {
        setProgress(event.data.progress);
      }

      if (event.data.type === 'form_submitted') {
        setFormSubmitted(true);
        // Trigger webhook to sync to Beepurple 5CRM
        syncToBeepurple(event.data.formData);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const syncToBeepurple = async (formData) => {
    try {
      // Update user record with intake completion
      await base44.auth.updateMe({
        intake_completed: true,
        intake_completion_date: new Date().toISOString(),
        intake_data: formData
      });

      // Create initial profile
      await base44.entities.UserProfile.create({
        display_name: formData.preferred_name || user.full_name?.split(' ')[0] || 'Friend',
        avatar_style: 'lighthouse',
        stage: 'exploring',
        points: 0,
        current_streak: 0,
        onboarding_complete: true
      });

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  // Pre-fill iframe with known data
  const getIframeUrl = () => {
    const baseUrl = 'https://awsna01.fivecrm.com/273529/user_files/webpage/001/IntakeDemographicsForm.html';
    const params = new URLSearchParams({
      email: user.email,
      full_name: user.full_name || '',
      timestamp: new Date().toISOString()
    });
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={() => {}}>
          <DialogContent 
            className="max-w-5xl h-[90vh] p-0 overflow-hidden"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
              {!formSubmitted ? (
                <>
                  {/* Header */}
                  <div className="p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Welcome to Grace Community! 💚</h2>
                          <p className="text-sm text-gray-600">Let's start your recovery journey together</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Intake Progress</span>
                        <span className="text-sm font-medium text-teal-600">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>

                  {/* Motivational Banner */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="px-6 py-4 bg-teal-100 border-b border-teal-200"
                  >
                    <p className="text-center text-teal-900 font-medium">
                      🌱 <strong>Discover Your Why:</strong> Understanding your motivation is the first step toward lasting recovery
                    </p>
                  </motion.div>

                  {/* Iframe */}
                  <div className="flex-1 overflow-hidden p-6">
                    <iframe
                      src={getIframeUrl()}
                      className="w-full h-full rounded-xl border-2 border-gray-200 shadow-lg bg-white"
                      title="Intake Form"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                    />
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
                    <p className="text-center text-sm text-gray-600">
                      Your information is secure and confidential. We use it to personalize your recovery journey.
                    </p>
                  </div>
                </>
              ) : (
                /* Success Screen */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"
                  >
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Recovery Journey! 🎉</h2>
                  <p className="text-lg text-gray-600 mb-6 max-w-md">
                    Your intake is complete. We're setting up your personalized dashboard...
                  </p>

                  <div className="flex items-center gap-2 text-teal-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Preparing your experience...</span>
                  </div>

                  <div className="mt-8 p-4 bg-teal-50 rounded-lg max-w-md">
                    <p className="text-sm text-teal-900">
                      💡 <strong>Remember:</strong> Recovery is a journey, not a destination. 
                      You're exactly where you need to be, and we're here to walk alongside you every step of the way.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}