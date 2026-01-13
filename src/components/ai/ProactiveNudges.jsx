import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Heart, MessageCircle, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProactiveNudges({ userEmail }) {
  const [activeNudges, setActiveNudges] = useState([]);
  const [dismissedNudges, setDismissedNudges] = useState([]);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['userProfile', userEmail],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: userEmail }),
    select: (data) => data[0]
  });

  const { data: checkIns } = useQuery({
    queryKey: ['recentCheckIns', userEmail],
    queryFn: () => base44.entities.DailyCheckIn.filter({ user_email: userEmail }),
    initialData: []
  });

  const { data: sessions } = useQuery({
    queryKey: ['coachingSessions', userEmail],
    queryFn: () => base44.entities.CoachingSession.filter({ client_email: userEmail }),
    initialData: []
  });

  useEffect(() => {
    if (profile) {
      analyzeEngagementPatterns();
    }
  }, [profile, checkIns, sessions]);

  const analyzeEngagementPatterns = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentCheckIns = checkIns.filter(c => new Date(c.created_date) > sevenDaysAgo);
    const lastActivity = profile?.last_active ? new Date(profile.last_active) : new Date(0);
    const daysSinceActivity = Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000));
    
    const newNudges = [];

    // Disengagement Risk (3+ days inactive)
    if (daysSinceActivity >= 3 && daysSinceActivity < 7) {
      newNudges.push({
        id: 'disengagement_3d',
        type: 'warning',
        title: 'We miss you!',
        message: `It's been ${daysSinceActivity} days since your last check-in. How are you doing today?`,
        action: {
          label: 'Check In Now',
          link: createPageUrl('Home')
        },
        icon: Heart,
        color: 'amber'
      });
    }

    // High Disengagement Risk (7+ days)
    if (daysSinceActivity >= 7) {
      newNudges.push({
        id: 'disengagement_7d',
        type: 'urgent',
        title: 'Your community is here for you',
        message: 'We noticed you\'ve been away for a week. Reach out - you\'re not alone in this journey.',
        action: {
          label: 'Chat with Grace',
          link: createPageUrl('GraceChat')
        },
        icon: MessageCircle,
        color: 'red'
      });
    }

    // Low Mood Pattern
    const recentMood = recentCheckIns.reduce((sum, c) => sum + (c.mood_score || 3), 0) / (recentCheckIns.length || 1);
    if (recentMood < 2.5 && recentCheckIns.length > 2) {
      newNudges.push({
        id: 'low_mood',
        type: 'support',
        title: 'Extra support available',
        message: 'We noticed your recent mood scores. Would talking to someone help?',
        action: {
          label: 'Find Support',
          link: createPageUrl('Crisis')
        },
        icon: Heart,
        color: 'purple'
      });
    }

    // No Coaching Sessions
    if (sessions.length === 0 && daysSinceActivity > 7) {
      newNudges.push({
        id: 'no_coaching',
        type: 'suggestion',
        title: 'Connect with a peer coach',
        message: 'One-on-one support can make a huge difference. Ready to try?',
        action: {
          label: 'Learn More',
          link: createPageUrl('PeerMatching')
        },
        icon: MessageCircle,
        color: 'teal'
      });
    }

    // Incomplete Onboarding
    if (!profile?.onboarding_complete && daysSinceActivity < 3) {
      newNudges.push({
        id: 'incomplete_onboarding',
        type: 'info',
        title: 'Complete your journey setup',
        message: 'Finishing your profile helps us personalize your experience.',
        action: {
          label: 'Complete Profile',
          link: createPageUrl('Assessment')
        },
        icon: CheckCircle,
        color: 'blue'
      });
    }

    // Filter out dismissed nudges
    const filtered = newNudges.filter(n => !dismissedNudges.includes(n.id));
    setActiveNudges(filtered.slice(0, 2)); // Show max 2 at once
  };

  const dismissNudge = (nudgeId) => {
    setDismissedNudges([...dismissedNudges, nudgeId]);
    setActiveNudges(activeNudges.filter(n => n.id !== nudgeId));
    
    // Track dismissal
    base44.analytics.track({
      eventName: 'nudge_dismissed',
      properties: { nudge_id: nudgeId }
    });
  };

  const handleAction = (nudgeId) => {
    base44.analytics.track({
      eventName: 'nudge_action_taken',
      properties: { nudge_id: nudgeId }
    });
  };

  const colorClasses = {
    amber: 'bg-amber-50 border-amber-300',
    red: 'bg-red-50 border-red-300',
    purple: 'bg-purple-50 border-purple-300',
    teal: 'bg-teal-50 border-teal-300',
    blue: 'bg-blue-50 border-blue-300'
  };

  const iconColors = {
    amber: 'text-amber-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
    blue: 'text-blue-600'
  };

  return (
    <AnimatePresence>
      {activeNudges.map((nudge) => {
        const Icon = nudge.icon;
        return (
          <motion.div
            key={nudge.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border-2 ${colorClasses[nudge.color]} mb-4`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 ${iconColors[nudge.color]} mt-0.5 flex-shrink-0`} />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{nudge.title}</h4>
                <p className="text-sm text-gray-700 mt-1">{nudge.message}</p>
                {nudge.action && (
                  <Link to={nudge.action.link}>
                    <Button 
                      size="sm" 
                      className="mt-3"
                      onClick={() => handleAction(nudge.id)}
                    >
                      {nudge.action.label}
                    </Button>
                  </Link>
                )}
              </div>
              <button
                onClick={() => dismissNudge(nudge.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}