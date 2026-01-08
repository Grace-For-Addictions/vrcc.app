import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function YourWhyGenerator({ user, profile }) {
  const [generating, setGenerating] = useState(false);
  const [narrative, setNarrative] = useState(profile?.my_why || '');
  const queryClient = useQueryClient();

  const saveWhy = useMutation({
    mutationFn: (data) => {
      if (profile) {
        return base44.entities.UserProfile.update(profile.id, data);
      } else {
        return base44.entities.UserProfile.create({ ...data, created_by: user.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      toast.success('Your Why has been saved! 💚');
    }
  });

  const generateWhy = async () => {
    setGenerating(true);
    try {
      const [assessments, checkIns, journey] = await Promise.all([
        base44.entities.Assessment.filter({ created_by: user.email }, '-created_date', 1),
        base44.entities.DailyCheckIn.filter({ created_by: user.email }, '-created_date', 10),
        base44.entities.RecoveryJourney.filter({ user_email: user.email })
      ]);

      const latestAssessment = assessments[0];
      const recentMoods = checkIns.map(c => c.mood_score).filter(Boolean);
      const avgMood = recentMoods.length > 0 ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length : 0;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a deeply personal "Your Why" narrative for someone in recovery. This should be their North Star - their reason for persisting in recovery.

USER CONTEXT:
- Pathways: ${profile?.pathways?.join(', ') || 'Not specified'}
- Recovery stage: ${profile?.stage || 'exploring'}
- Days in recovery: ${profile?.recovery_date ? Math.floor((new Date() - new Date(profile.recovery_date)) / (1000 * 60 * 60 * 24)) : 'Just starting'}
- Recovery capital (BARC-10): ${latestAssessment?.total_score || 0}/50
- Recent mood average: ${avgMood.toFixed(1)}/10
- Journey phase: ${journey[0]?.journey_phase || 'onboarding'}
- Bio: ${profile?.bio || 'Not provided'}

GUIDELINES:
1. Use first-person, present-tense language ("I am recovering because...")
2. Connect to their values, relationships, hopes, and dreams
3. Acknowledge pain and struggle without dwelling on it
4. Emphasize future-focused, aspirational language
5. Include neuroplasticity framing (building new pathways)
6. Be authentic, warm, and empowering
7. 150-250 words, written as if they're declaring it to themselves

This is their personal manifesto - make it powerful, specific, and uniquely theirs.`,
        add_context_from_internet: false
      });

      setNarrative(response);
    } catch (error) {
      toast.error('Failed to generate narrative');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <GraceCard gradient>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Your Why</h3>
          <p className="text-sm text-gray-600">AI-powered personal recovery manifesto</p>
        </div>
      </div>

      <p className="text-gray-700 mb-4">
        Your "Why" is your North Star - the reason you keep going when things get hard. Let Grace help you articulate it.
      </p>

      <div className="space-y-4">
        <Textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder="Your personal recovery manifesto will appear here..."
          rows={8}
          className="font-medium"
        />

        <div className="flex gap-3">
          <Button
            onClick={generateWhy}
            disabled={generating}
            className="flex-1 bg-pink-600 hover:bg-pink-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Your Why...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate My Why
              </>
            )}
          </Button>

          <Button
            onClick={() => saveWhy.mutate({ my_why: narrative })}
            disabled={!narrative || saveWhy.isPending}
            variant="outline"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </GraceCard>
  );
}