import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ACTIVITY_TYPES = [
  { value: 'coaching', label: 'Peer Coaching Session', icon: '🤝' },
  { value: 'meeting', label: 'Recovery Circle Meeting', icon: '👥' },
  { value: 'navigation', label: 'Resource Navigation', icon: '🗺️' },
  { value: 'checkin', label: 'Daily Check-In', icon: '✓' },
  { value: 'milestone', label: 'Milestone Celebration', icon: '🎉' },
  { value: 'reflection', label: 'Recovery Reflection', icon: '📝' },
  { value: 'garden', label: 'Community Garden Activity', icon: '🌱' },
  { value: 'volunteer', label: 'Volunteer Service', icon: '💚' },
  { value: 'narcan', label: 'Narcan Distribution/Training', icon: '🛡️' }
];

export default function UniversalActivityForm({ isOpen, onClose, preselectedType = null, user }) {
  const [activityType, setActivityType] = useState(preselectedType);
  const [submitted, setSubmitted] = useState(false);

  const outcomeFormUrl = 'https://awsna01.fivecrm.com/273529/user_files/webpage/002/ProgramActivitiesOutcomesForm.html';

  useEffect(() => {
    // Listen for form submission from iframe
    const handleMessage = (event) => {
      if (event.origin !== 'https://awsna01.fivecrm.com') return;
      
      const { type, data } = event.data;
      
      if (type === 'activity_submitted') {
        handleActivitySubmit(data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activityType]);

  const handleActivitySubmit = async (data) => {
    try {
      setSubmitted(true);
      
      // Route to appropriate entity based on activity type
      switch (activityType) {
        case 'coaching':
        case 'navigation':
          await base44.entities.CoachingSessionLog.create(data);
          break;
        case 'meeting':
          // Could create MeetingAttendance entity or use existing
          break;
        case 'checkin':
          await base44.entities.DailyCheckIn.create(data);
          break;
        case 'milestone':
          await base44.entities.Post.create({
            wall_type: 'milestone',
            ...data
          });
          break;
        case 'narcan':
          await base44.entities.NarcanLog.create(data);
          break;
        case 'garden':
          await base44.entities.PracticeSession.create(data);
          break;
      }
      
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 1500);
    } catch (error) {
      console.error('Activity submission error:', error);
      alert('There was an issue logging your activity. Please try again.');
      setSubmitted(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        {!activityType ? (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl mb-2">Log Activity</DialogTitle>
              <p className="text-gray-600">What type of activity would you like to log?</p>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              {ACTIVITY_TYPES.map((type) => (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActivityType(type.value)}
                  className="p-4 text-left rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all"
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="font-semibold text-gray-900">{type.label}</div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : !submitted ? (
          <div className="h-[80vh] flex flex-col">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {ACTIVITY_TYPES.find(t => t.value === activityType)?.label}
                </h3>
                <p className="text-xs text-teal-100">Complete the form below to log this activity</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <iframe
              src={`${outcomeFormUrl}?type=${activityType}&user_email=${encodeURIComponent(user?.email)}`}
              className="flex-1 w-full border-0"
              title="Activity Form"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </div>
        ) : (
          <div className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Activity Logged!</h3>
            <p className="text-gray-600">Thank you for staying connected to your recovery.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}