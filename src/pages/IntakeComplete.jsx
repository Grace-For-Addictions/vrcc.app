import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function IntakeComplete() {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [user, setUser] = useState(null);

  useEffect(() => {
    const completeIntake = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        // Mark intake as completed
        await base44.auth.updateMe({ 
          intake_completed: true,
          intake_date: new Date().toISOString()
        });
        
        setUser(currentUser);
        setStatus('success');
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          window.location.href = createPageUrl('Home');
        }, 3000);
      } catch (error) {
        console.error('Intake completion error:', error);
        setStatus('error');
      }
    };
    
    completeIntake();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6"
      >
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">Processing Your Information...</h2>
            <p className="text-gray-600">Thank you for completing the intake form.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-gray-900">Welcome to Grace For Addictions! 💚</h2>
            
            <p className="text-lg text-gray-700">
              Your intake is complete. Let's begin your recovery journey.
            </p>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-teal-100">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <p className="font-semibold text-gray-900 text-left">What's Next?</p>
              </div>
              <ul className="text-sm text-gray-700 space-y-2 text-left">
                <li>• Complete your first daily check-in</li>
                <li>• Take the BARC-10 Recovery Assessment</li>
                <li>• Explore community chat rooms</li>
                <li>• Connect with peer recovery coaches</li>
              </ul>
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-2"
            >
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
            </motion.div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-24 h-24 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900">Something Went Wrong</h2>
            
            <p className="text-gray-700">
              We had trouble saving your intake information. Please try again or contact support.
            </p>
            
            <Button 
              onClick={() => window.location.href = createPageUrl('Home')}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Return to Home
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}