import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const ACTIVITY_FORM_URL = 'https://awsna01.fivecrm.com/273529/user_files/webpage/002/ProgramActivitiesOutcomesForm.html';

/**
 * BeepurpleActivityLogger - Routes participant interactions through Beepurple 5CRM
 * 
 * Usage:
 * const { logActivity } = useBeepurpleLogger();
 * await logActivity('meeting_attendance', { meeting_type: 'AA', duration: 60 });
 */

export function BeepurpleActivityLogger({ open, onClose, activityType, activityData, user }) {
  const iframeRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://awsna01.fivecrm.com') return;
      
      if (event.data.type === 'formSubmitted') {
        setIsSubmitting(false);
        onClose(true); // Success
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose]);

  // Pre-fill activity form with known data
  useEffect(() => {
    if (!open || !iframeRef.current) return;

    const preFillData = {
      type: 'preFillForm',
      data: {
        participant_id: user?.id,
        participant_email: user?.email,
        participant_name: user?.full_name,
        activity_type: activityType,
        activity_date: new Date().toISOString(),
        ...activityData
      }
    };

    // Wait for iframe to load
    const timer = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(preFillData, 'https://awsna01.fivecrm.com');
    }, 1000);

    return () => clearTimeout(timer);
  }, [open, activityType, activityData, user]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Log Activity - Beepurple 5CRM</DialogTitle>
        </DialogHeader>
        
        {isSubmitting ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="ml-3 text-gray-600">Syncing to Beepurple 5CRM...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <iframe
              ref={iframeRef}
              src={ACTIVITY_FORM_URL}
              className="w-full h-full border-0"
              title="Activity Logging Form"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy activity logging
export function useBeepurpleLogger() {
  const [user, setUser] = useState(null);
  const [loggerState, setLoggerState] = useState({
    open: false,
    activityType: null,
    activityData: {}
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const logActivity = async (activityType, activityData = {}) => {
    return new Promise((resolve) => {
      setLoggerState({
        open: true,
        activityType,
        activityData,
        onComplete: (success) => {
          setLoggerState(prev => ({ ...prev, open: false }));
          resolve(success);
        }
      });
    });
  };

  const LoggerComponent = () => (
    <BeepurpleActivityLogger
      open={loggerState.open}
      onClose={loggerState.onComplete}
      activityType={loggerState.activityType}
      activityData={loggerState.activityData}
      user={user}
    />
  );

  return { logActivity, LoggerComponent };
}

// Activity type constants
export const ACTIVITY_TYPES = {
  MEETING_ATTENDANCE: 'meeting_attendance',
  COACHING_SESSION: 'coaching_session',
  DAILY_CHECK_IN: 'daily_check_in',
  ASSESSMENT: 'assessment_completion',
  COMMUNITY_ENGAGEMENT: 'community_engagement',
  GARDEN_ACTIVITY: 'garden_activity',
  RESOURCE_ACCESS: 'resource_access',
  CRISIS_SUPPORT: 'crisis_support',
  PEER_MATCH: 'peer_match',
  QUIZ_COMPLETION: 'quiz_completion',
  CHALLENGE_PARTICIPATION: 'challenge_participation'
};

export default BeepurpleActivityLogger;