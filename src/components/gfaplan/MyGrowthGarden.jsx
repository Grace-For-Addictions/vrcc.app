import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flower2, Calendar, TrendingUp, Heart, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';

const outcomeOptions = [
  { value: 'felt_hopeful', label: 'Felt Hopeful', emoji: '🌟' },
  { value: 'took_small_action', label: 'Took a Small Action', emoji: '👣' },
  { value: 'connected_with_someone', label: 'Connected with Someone', emoji: '🤝' },
  { value: 'practiced_self_compassion', label: 'Practiced Self-Compassion', emoji: '💚' },
  { value: 'reached_out_for_support', label: 'Reached Out for Support', emoji: '🆘' },
  { value: 'celebrated_progress', label: 'Celebrated Progress', emoji: '🎉' },
  { value: 'noticed_strength', label: 'Noticed a Strength', emoji: '💪' },
  { value: 'took_a_breath', label: 'Took a Breath', emoji: '🌬️' }
];

export default function MyGrowthGarden({ plan, user }) {
  const [showAddOutcome, setShowAddOutcome] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [reflection, setReflection] = useState('');
  
  const queryClient = useQueryClient();

  const addOutcomeMutation = useMutation({
    mutationFn: async () => {
      const newOutcome = {
        date: new Date().toISOString(),
        tag: selectedTag,
        reflection: reflection
      };

      const updatedOutcomes = [...(plan.self_reported_outcomes || []), newOutcome];

      return await base44.entities.GFAPlan.update(plan.id, {
        self_reported_outcomes: updatedOutcomes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gfaplan']);
      toast.success('Growth moment recorded! 🌱');
      setShowAddOutcome(false);
      setSelectedTag('');
      setReflection('');
    }
  });

  const touchDates = plan.section_touch_dates || {};
  const allTouches = Object.entries(touchDates).flatMap(([section, dates]) =>
    (dates || []).map(date => ({ section, date }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const outcomes = plan.self_reported_outcomes || [];
  const recentOutcomes = outcomes.slice(-10).reverse();

  const sectionColors = {
    gratitude: 'teal',
    resilience: 'blue',
    acceptance: 'rose',
    connection: 'purple',
    empowerment: 'amber'
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{allTouches.length}</div>
              <div className="text-sm text-gray-600">Garden Touches</div>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{outcomes.length}</div>
              <div className="text-sm text-gray-600">Growth Moments</div>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{plan.sections_completed}</div>
              <div className="text-sm text-gray-600">Sections Nurtured</div>
            </div>
          </div>
        </GraceCard>
      </div>

      {/* Add Growth Moment */}
      <GraceCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Record a Growth Moment</h3>
          {!showAddOutcome && (
            <Button onClick={() => setShowAddOutcome(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>

        {showAddOutcome ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                What did you notice or experience?
              </label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tag..." />
                </SelectTrigger>
                <SelectContent>
                  {outcomeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Reflection (Optional)
              </label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What does this mean for you right now?"
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => addOutcomeMutation.mutate()}
                disabled={!selectedTag || addOutcomeMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Save Growth Moment
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddOutcome(false);
                  setSelectedTag('');
                  setReflection('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Celebrate small wins, notice strengths, and track your gentle progress.
          </p>
        )}
      </GraceCard>

      {/* Timeline */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Growth Timeline</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {recentOutcomes.length === 0 && allTouches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Flower2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Your growth garden is just beginning to bloom 🌱</p>
            </div>
          ) : (
            <>
              {recentOutcomes.map((outcome, idx) => {
                const option = outcomeOptions.find(o => o.value === outcome.tag);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                  >
                    <div className="text-2xl">{option?.emoji || '🌟'}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{option?.label}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(outcome.date).toLocaleDateString()}
                        </span>
                      </div>
                      {outcome.reflection && (
                        <p className="text-sm text-gray-600">{outcome.reflection}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {allTouches.slice(0, 10).map((touch, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (recentOutcomes.length + idx) * 0.05 }}
                  className={`flex gap-3 p-3 bg-${sectionColors[touch.section]}-50 rounded-lg border border-${sectionColors[touch.section]}-100`}
                >
                  <Calendar className={`w-5 h-5 text-${sectionColors[touch.section]}-600`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {touch.section} Section
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(touch.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Nurtured this part of your plan</p>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </GraceCard>

      {/* Encouragement */}
      <GraceCard gradient>
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">You're Growing 💚</h4>
            <p className="text-sm text-gray-600">
              Every time you return to your plan, you're rewiring your brain for hope and healing. 
              This is neuroplasticity in action. Keep going—you're doing beautifully.
            </p>
          </div>
        </div>
      </GraceCard>
    </div>
  );
}