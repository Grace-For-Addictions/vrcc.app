import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Heart, Calendar, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProactiveOutreach({ user, profile }) {
  const [outreachMessage, setOutreachMessage] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || !profile || dismissed) return;

    const checkEngagement = async () => {
      // Calculate engagement score
      const lastActive = profile.last_active ? new Date(profile.last_active) : new Date();
      const daysSinceActive = Math.floor((new Date() - lastActive) / (1000 * 60 * 60 * 24));

      // Get recent activity
      const recentCheckIns = await base44.entities.DailyCheckIn.filter(
        { created_by: user.email },
        '-created_date',
        7
      );

      const engagementScore = {
        streak: profile.current_streak || 0,
        daysSinceActive,
        checkInsThisWeek: recentCheckIns.length,
        points: profile.points || 0
      };

      // Get additional activity data for better insights
      const [assessments, sessions, communityPosts] = await Promise.all([
        base44.entities.Assessment.filter({ created_by: user.email }, '-created_date', 3).catch(() => []),
        base44.entities.CoachingSession.filter({ client_email: user.email }, '-session_date', 5).catch(() => []),
        base44.entities.Post.filter({ created_by: user.email }, '-created_date', 10).catch(() => [])
      ]);

      const daysSinceAssessment = assessments.length > 0 
        ? Math.floor((new Date() - new Date(assessments[0].created_date)) / (1000 * 60 * 60 * 24))
        : 999;
      
      const daysSinceCommunity = communityPosts.length > 0
        ? Math.floor((new Date() - new Date(communityPosts[0].created_date)) / (1000 * 60 * 60 * 24))
        : 999;

      const recentMoodScores = recentCheckIns.slice(0, 3).map(c => c.mood_score || 3);
      const avgRecentMood = recentMoodScores.length > 0 
        ? recentMoodScores.reduce((a, b) => a + b, 0) / recentMoodScores.length 
        : 3;

      // Generate proactive message based on engagement patterns
      let message = null;

      if (avgRecentMood < 2.5 && recentCheckIns.length >= 2) {
        message = {
          type: 'support',
          icon: Heart,
          color: 'rose',
          title: 'I noticed you might be struggling 💚',
          content: `${profile.display_name}, your recent check-ins show you've been having a tough time. That takes courage to acknowledge. Want to talk about what's going on? I'm here to listen, or I can help you find specific support.`,
          action: { label: 'Chat with Grace', link: 'GraceChat' }
        };
      } else if (daysSinceActive > 3) {
        message = {
          type: 'check-in',
          icon: Heart,
          color: 'rose',
          title: 'We miss you! 💚',
          content: `Hey ${profile.display_name}, it's been ${daysSinceActive} days since we've seen you. Just checking in - how are you doing? Remember, we're here 24/7 whenever you need us.`,
          action: { label: 'Chat with Grace', link: 'GraceChat' }
        };
      } else if (profile.current_streak >= 7 && profile.current_streak % 7 === 0) {
        message = {
          type: 'celebration',
          icon: TrendingUp,
          color: 'green',
          title: `${profile.current_streak} Day Streak! 🎉`,
          content: `Amazing! Your brain is literally rewiring with each day of connection. This is neuroplasticity in action! Want to share your milestone on the Walls of Grace?`,
          action: { label: 'Share Milestone', link: 'CommunityWalls' }
        };
      } else if (daysSinceAssessment > 30 && assessments.length > 0) {
        message = {
          type: 'suggestion',
          icon: Target,
          color: 'purple',
          title: 'Time for a Progress Check?',
          content: `It's been a month since your last BARC-10 assessment. Retaking it helps track your recovery capital growth and shows how far you've come! 🌱`,
          action: { label: 'Take Assessment', link: 'Assessment' }
        };
      } else if (daysSinceCommunity > 7 && communityPosts.length === 0) {
        message = {
          type: 'suggestion',
          icon: Sparkles,
          color: 'blue',
          title: 'Connect with the Community?',
          content: `You haven't jumped into community conversations yet. Connecting with others builds powerful recovery pathways. Want to check out the chat rooms or Grace Porch Gatherings? 👥`,
          action: { label: 'Explore Community', link: 'Community' }
        };
      } else if (recentCheckIns.length === 0 && daysSinceActive < 3) {
        message = {
          type: 'suggestion',
          icon: Target,
          color: 'teal',
          title: 'Quick Check-In?',
          content: 'Haven\'t seen a check-in from you this week. A 2-minute mood check builds recovery capital and strengthens your resilience pathways. 🧠',
          action: { label: 'Daily Check-In', link: 'Home' }
        };
      }

      setOutreachMessage(message);
    };

    checkEngagement();
  }, [user, profile, dismissed]);

  if (!outreachMessage || dismissed) return null;

  const Icon = outreachMessage.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 right-6 z-40 max-w-sm"
      >
        <div className={`bg-white rounded-2xl shadow-2xl border-2 border-${outreachMessage.color}-200 p-6 relative`}>
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-${outreachMessage.color}-400 to-${outreachMessage.color}-600 flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2">{outreachMessage.title}</h4>
              <p className="text-sm text-gray-700 mb-4">{outreachMessage.content}</p>
              
              {outreachMessage.action && (
                <a href={`/${outreachMessage.action.link}`}>
                  <Button className={`bg-${outreachMessage.color}-600 hover:bg-${outreachMessage.color}-700 w-full`}>
                    {outreachMessage.action.label}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}