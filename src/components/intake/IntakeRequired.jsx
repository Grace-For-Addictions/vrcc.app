// ============================================================================
// DOMAIN: 3. Intake & Triage
// PURPOSE: Intake requirement gate component for new participants. Links to
//          external FiveCRM intake form, manages completion status.
// DEPENDENCIES: User entity (intake_completed field)
// ============================================================================

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IntakeRequired({ user, onComplete }) {
  const [loading, setLoading] = useState(false);

  const intakeFormUrl = `https://awsna01.fivecrm.com/273529/user_files/webpage/001/IntakeDemographicsForm.html?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.full_name)}`;

  const handleComplete = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({ 
        intake_completed: true,
        intake_date: new Date().toISOString()
      });
      onComplete();
    } catch (error) {
      console.error('Error updating intake status:', error);
      alert('There was an issue. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border-2 border-teal-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-8 text-white text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Grace For Addictions</h1>
          <p className="text-teal-100">Virtual Recovery Community Center</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">One More Step...</h2>
            <p className="text-gray-700">
              To personalize your recovery journey and connect you with the right resources, 
              we need you to complete a brief intake form.
            </p>
          </div>

          <div className="bg-teal-50 rounded-xl p-6 space-y-3">
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              Your information is:
            </p>
            <ul className="space-y-2 text-sm text-gray-700 ml-7">
              <li>• Private and secure</li>
              <li>• Protected by federal privacy laws</li>
              <li>• Used only to support your recovery</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.open(intakeFormUrl, '_blank')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-lg py-6"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Open Intake Form (New Tab)
            </Button>

            <Button
              onClick={handleComplete}
              disabled={loading}
              variant="outline"
              className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50 py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  I've Completed the Intake Form
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Takes 5-10 minutes • You can save and continue later
          </p>
        </div>
      </motion.div>
    </div>
  );
}