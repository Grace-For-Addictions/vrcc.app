import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';

export default function IntakeModal({ user, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const intakeFormUrl = 'https://awsna01.fivecrm.com/273529/user_files/webpage/001/intakedemographicsform.html';

  useEffect(() => {
    // Listen for messages from iframe
    const handleMessage = (event) => {
      if (event.origin !== 'https://awsna01.fivecrm.com') return;
      
      const { type, data } = event.data;
      
      if (type === 'progress') {
        setProgress(data.progress || 0);
      }
      
      if (type === 'submit') {
        handleIntakeSubmit(data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIntakeSubmit = async (formData) => {
    try {
      setSubmitted(true);
      
      // Update user profile with intake completion
      await base44.auth.updateMe({ 
        intake_completed: true,
        intake_date: new Date().toISOString()
      });
      
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Intake submission error:', error);
      alert('There was an issue saving your intake. Please try again.');
      setSubmitted(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <AnimatePresence>
        {!submitted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col"
          >
            {/* Header with Progress */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Welcome to Your Recovery Journey</h1>
                    <p className="text-teal-100 text-sm">Grace For Addictions Virtual Recovery Community Center</p>
                  </div>
                </div>
                
                {progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Section {Math.ceil(progress / 12.5)} of 8</span>
                      <span>{Math.round(progress)}% complete</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-teal-700" />
                    <p className="text-xs text-teal-100 italic">
                      {progress > 75 ? "Almost there!" : progress > 50 ? "You're doing great!" : "Your information is private and secure"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Welcome Message (before form starts) */}
            {progress === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-teal-50 to-white"
              >
                <div className="max-w-2xl text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-900">Welcome to Your Recovery Community</h2>
                  
                  <p className="text-lg text-gray-700">
                    To personalize your experience and connect you with the best resources, 
                    we need to learn a bit about you.
                  </p>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-teal-100 space-y-3 text-left">
                    <p className="font-semibold text-gray-900">Your information is:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                        <span className="text-gray-700">Private and secure with encryption</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                        <span className="text-gray-700">Shared only with your explicit consent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                        <span className="text-gray-700">Protected by federal privacy laws</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setProgress(1)}
                    size="lg"
                    className="bg-teal-600 hover:bg-teal-700 text-lg px-8"
                  >
                    Continue to Intake Form
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <p className="text-xs text-gray-500">
                    This will take about 5-10 minutes. You can save and continue later.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Iframe for Beepurple Form */}
            {progress > 0 && (
              <iframe
                src={`${intakeFormUrl}?user_email=${encodeURIComponent(user.email)}&user_name=${encodeURIComponent(user.full_name)}`}
                className="flex-1 w-full border-0"
                title="Intake Form"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex items-center justify-center bg-gradient-to-b from-teal-50 to-white"
          >
            <div className="text-center space-y-6 max-w-md px-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-900">Thank You for Sharing Your Story</h2>
              
              <p className="text-lg text-gray-700">
                Your journey matters. Let's begin building your recovery community.
              </p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-teal-600" />
                <p className="text-sm text-gray-500 mt-2">Preparing your dashboard...</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}