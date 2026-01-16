import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Heart, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GraceCard from '@/components/common/GraceCard';

export default function GFAPlanCard({ user }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      if (!user) return;
      try {
        const plans = await base44.entities.GFAPlan.filter({ user_email: user.email });
        if (plans.length > 0) {
          setPlan(plans[0]);
        }
      } catch (error) {
        console.error('Error loading GFA Plan:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, [user]);

  if (loading) {
    return (
      <GraceCard className="animate-pulse">
        <div className="h-32 bg-gray-100 rounded-lg"></div>
      </GraceCard>
    );
  }

  const hasPlan = !!plan;
  const sectionsCompleted = plan?.sections_completed || 0;

  return (
    <GraceCard gradient hover>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">My GFA Plan</h3>
            <p className="text-sm text-gray-600">Your Gentle Path Forward</p>
          </div>
        </div>
        {hasPlan && (
          <div className="flex items-center gap-1 text-teal-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">{sectionsCompleted}/5</span>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {hasPlan
          ? "Continue nurturing your grace-filled journey. Every touch helps your garden grow."
          : "Create a personal plan rooted in the GRACE framework—at your own pace, in your own way."}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full">
          Gratitude
        </span>
        <span className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full">
          Resilience
        </span>
        <span className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full">
          Acceptance
        </span>
        <span className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full">
          Connection
        </span>
        <span className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full">
          Empowerment
        </span>
      </div>

      <Link to={createPageUrl('MyGFAPlan')}>
        <Button className="w-full bg-teal-600 hover:bg-teal-700 group">
          {hasPlan ? 'Continue My Plan' : 'Start My GFA Plan'}
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>

      {!hasPlan && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-gray-500 mt-3 text-center"
        >
          No rush, no pressure—whenever you're ready 💚
        </motion.p>
      )}
    </GraceCard>
  );
}