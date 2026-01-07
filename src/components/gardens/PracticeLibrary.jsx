import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Wind, Compass, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import GraceCard from '@/components/common/GraceCard';

const practices = [
  {
    type: 'self_compassion',
    title: 'Self-Compassion Practice',
    description: 'Offer yourself the same kindness you would give a dear friend',
    icon: Heart,
    color: 'from-pink-400 to-rose-500',
    duration: 10
  },
  {
    type: 'loving_kindness',
    title: 'Loving-Kindness Meditation',
    description: 'Extend wishes of peace and well-being to yourself and others',
    icon: Sparkles,
    color: 'from-purple-400 to-pink-500',
    duration: 15
  },
  {
    type: 'grounding',
    title: 'Grounding Exercise',
    description: 'Connect to the present moment through your senses',
    icon: Compass,
    color: 'from-teal-400 to-green-500',
    duration: 5
  },
  {
    type: 'breath_work',
    title: 'Breath Awareness',
    description: 'Focus on your breath to calm your nervous system',
    icon: Wind,
    color: 'from-blue-400 to-cyan-500',
    duration: 8
  },
  {
    type: 'reflection',
    title: 'Gentle Reflection',
    description: 'Explore your thoughts and feelings with curiosity',
    icon: BookOpen,
    color: 'from-amber-400 to-orange-500',
    duration: 12
  }
];

export default function PracticeLibrary({ user, garden }) {
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [practiceNotes, setPracticeNotes] = useState('');
  const [emotionBefore, setEmotionBefore] = useState('neutral');
  const [emotionAfter, setEmotionAfter] = useState('');
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const completePractice = useMutation({
    mutationFn: async (data) => {
      setGenerating(true);

      // Generate neuroplastic insight
      const insight = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a brief, warm neuroplastic insight for someone who just completed a ${data.practice_type} practice for ${data.duration_minutes} minutes. Their emotional state shifted from ${data.emotional_state_before} to ${data.emotional_state_after}.

        Notes: ${data.practice_notes || 'No notes provided'}

        Provide a 1-2 sentence insight connecting this practice to brain rewiring, using person-first language and emphasizing growth. Be gentle, encouraging, and scientifically grounded.`,
        add_context_from_internet: false
      });

      // Create session
      const session = await base44.entities.PracticeSession.create({
        ...data,
        neuroplastic_insight: insight
      });

      // Update garden stats
      const newStreak = garden.last_practice_date && 
        (new Date() - new Date(garden.last_practice_date)) < 48 * 60 * 60 * 1000
        ? garden.current_streak_days + 1
        : 1;

      const newPlant = {
        plant_id: Math.random().toString(36).substring(7),
        plant_type: ['flower', 'tree', 'sprout'][Math.floor(Math.random() * 3)],
        growth_stage: 1,
        planted_date: new Date().toISOString()
      };

      await base44.entities.PersonalGarden.update(garden.id, {
        total_practice_minutes: garden.total_practice_minutes + data.duration_minutes,
        current_streak_days: newStreak,
        longest_streak_days: Math.max(garden.longest_streak_days, newStreak),
        plants_grown: [...(garden.plants_grown || []), newPlant],
        neuroplastic_insights_count: garden.neuroplastic_insights_count + 1,
        last_practice_date: new Date().toISOString()
      });

      return { session, insight };
    },
    onSuccess: ({ insight }) => {
      queryClient.invalidateQueries(['personalGarden']);
      queryClient.invalidateQueries(['recentPractices']);
      setGenerating(false);
      alert(`🌱 Practice Complete!\n\nNeuroplastic Insight: ${insight}\n\nA new plant has been added to your garden!`);
      setSelectedPractice(null);
      setPracticeNotes('');
      setEmotionAfter('');
    }
  });

  const handleComplete = () => {
    if (!emotionAfter) {
      alert('Please select how you feel after the practice');
      return;
    }

    completePractice.mutate({
      user_email: user.email,
      practice_type: selectedPractice.type,
      duration_minutes: selectedPractice.duration,
      completion_method: 'tap',
      emotional_state_before: emotionBefore,
      emotional_state_after: emotionAfter,
      practice_notes: practiceNotes,
      reality_level: 'real_world'
    });
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Daily Grace Practices</h3>
        <p className="text-gray-700">
          Choose a 5-15 minute practice to nurture your garden and strengthen your neuroplastic pathways
        </p>
      </GraceCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {practices.map((practice, idx) => {
          const Icon = practice.icon;
          return (
            <motion.div
              key={practice.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GraceCard hover>
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${practice.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{practice.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{practice.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{practice.duration} minutes</span>
                  <Button
                    size="sm"
                    onClick={() => setSelectedPractice(practice)}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Begin
                  </Button>
                </div>
              </GraceCard>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={!!selectedPractice} onOpenChange={() => setSelectedPractice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPractice?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">How do you feel right now?</label>
              <Select value={emotionBefore} onValueChange={setEmotionBefore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="struggling">😔 Struggling</SelectItem>
                  <SelectItem value="neutral">😐 Neutral</SelectItem>
                  <SelectItem value="hopeful">🙂 Hopeful</SelectItem>
                  <SelectItem value="peaceful">😌 Peaceful</SelectItem>
                  <SelectItem value="joyful">😊 Joyful</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-sm text-gray-700 italic">
                Take {selectedPractice?.duration} minutes for this practice. When you return, share how you feel.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">After completing the practice, how do you feel?</label>
              <Select value={emotionAfter} onValueChange={setEmotionAfter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="struggling">😔 Struggling</SelectItem>
                  <SelectItem value="neutral">😐 Neutral</SelectItem>
                  <SelectItem value="hopeful">🙂 Hopeful</SelectItem>
                  <SelectItem value="peaceful">😌 Peaceful</SelectItem>
                  <SelectItem value="joyful">😊 Joyful</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Any reflections or insights? (optional)"
              value={practiceNotes}
              onChange={(e) => setPracticeNotes(e.target.value)}
              rows={3}
            />

            <Button
              onClick={handleComplete}
              disabled={generating}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Growing your garden...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Complete Practice
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}