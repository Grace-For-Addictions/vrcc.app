import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Target, Plus, TrendingUp, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GraceCard from '@/components/common/GraceCard';

export default function ResidentGoals({ residentEmail, houseId, events }) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'meetings',
    goal_description: '',
    target_value: 5,
    time_period: 'weekly'
  });
  const queryClient = useQueryClient();

  const { data: goals } = useQuery({
    queryKey: ['residentGoals', residentEmail],
    queryFn: () => base44.entities.ResidentGoal.filter({ resident_email: residentEmail }),
    initialData: []
  });

  const createGoal = useMutation({
    mutationFn: (data) => base44.entities.ResidentGoal.create({
      ...data,
      resident_email: residentEmail,
      house_id: houseId,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + (data.time_period === 'daily' ? 1 : data.time_period === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['residentGoals']);
      setShowAddGoal(false);
      setNewGoal({ goal_type: 'meetings', goal_description: '', target_value: 5, time_period: 'weekly' });
    }
  });

  const suggestGoals = useMutation({
    mutationFn: async () => {
      const meetings = events.filter(e => e.event_type === 'meeting').length;
      const chores = events.filter(e => e.event_type === 'chore' && e.chore_data?.completed).length;
      const moodLogs = events.filter(e => e.event_type === 'mood_log');
      const avgMood = moodLogs.length > 0 
        ? (moodLogs.reduce((sum, e) => sum + (e.mood_data?.mood_score || 0), 0) / moodLogs.length).toFixed(1)
        : 0;

      const suggestions = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on a resident's recent activity, suggest 2-3 SMART recovery goals:

Recent activity (last 2 weeks):
- Meetings attended: ${meetings}
- Chores completed: ${chores}
- Average mood: ${avgMood}/10

Suggest goals that are:
1. Specific and measurable
2. Achievable but stretching
3. Recovery-focused
4. Time-bound (weekly or monthly)

Examples: "Attend 5 recovery meetings this week", "Complete 8 house chores this week", "Maintain mood score above 7/10"`,
        response_json_schema: {
          type: "object",
          properties: {
            goals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  goal_type: { type: "string" },
                  description: { type: "string" },
                  target: { type: "number" },
                  period: { type: "string" }
                }
              }
            }
          }
        }
      });

      return suggestions.goals;
    },
    onSuccess: (suggestions) => {
      alert(`AI-Suggested Goals:\n\n${suggestions.map((g, i) => `${i + 1}. ${g.description}`).join('\n')}\n\nAdd these manually to track progress!`);
    }
  });

  // Calculate current progress
  const calculateProgress = (goal) => {
    const now = new Date();
    const start = new Date(goal.start_date);
    const cutoff = new Date(start);
    
    if (goal.time_period === 'daily') cutoff.setDate(cutoff.getDate() + 1);
    else if (goal.time_period === 'weekly') cutoff.setDate(cutoff.getDate() + 7);
    else cutoff.setMonth(cutoff.getMonth() + 1);

    const relevantEvents = events.filter(e => new Date(e.event_date) >= start && new Date(e.event_date) <= cutoff);

    if (goal.goal_type === 'meetings') {
      return relevantEvents.filter(e => e.event_type === 'meeting').length;
    } else if (goal.goal_type === 'chores') {
      return relevantEvents.filter(e => e.event_type === 'chore' && e.chore_data?.completed).length;
    } else if (goal.goal_type === 'check_ins') {
      return relevantEvents.filter(e => e.event_type === 'check_in').length;
    } else if (goal.goal_type === 'mood') {
      const moods = relevantEvents.filter(e => e.event_type === 'mood_log');
      return moods.length > 0 
        ? (moods.reduce((sum, e) => sum + (e.mood_data?.mood_score || 0), 0) / moods.length).toFixed(1)
        : 0;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">My Recovery Goals</h3>
              <p className="text-sm text-gray-600">Track progress toward your personal milestones</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => suggestGoals.mutate()}
              disabled={suggestGoals.isPending}
            >
              {suggestGoals.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Suggest
                </>
              )}
            </Button>
            <Button size="sm" onClick={() => setShowAddGoal(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-16 h-16 mx-auto text-gray-400 mb-3 opacity-50" />
            <p className="text-gray-600 mb-4">Set your first recovery goal</p>
            <Button onClick={() => suggestGoals.mutate()} variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              Get AI Suggestions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal, idx) => {
              const progress = calculateProgress(goal);
              const percentage = (progress / goal.target_value) * 100;
              const isCompleted = progress >= goal.target_value;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{goal.goal_description}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize">{goal.time_period}</Badge>
                        {goal.ai_suggested && (
                          <Badge className="bg-purple-100 text-purple-700">AI Suggested</Badge>
                        )}
                      </div>
                    </div>
                    {isCompleted && <CheckCircle className="w-6 h-6 text-green-600" />}
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className={`font-semibold ${isCompleted ? 'text-green-700' : 'text-purple-700'}`}>
                        {progress}/{goal.target_value}
                      </span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GraceCard>

      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recovery Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Select value={newGoal.goal_type} onValueChange={(v) => setNewGoal({ ...newGoal, goal_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meetings">Recovery Meetings</SelectItem>
                <SelectItem value="chores">House Chores</SelectItem>
                <SelectItem value="check_ins">Check-ins</SelectItem>
                <SelectItem value="mood">Mood Score</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Goal description (e.g., 'Attend 5 meetings this week')"
              value={newGoal.goal_description}
              onChange={(e) => setNewGoal({ ...newGoal, goal_description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Target value"
              value={newGoal.target_value}
              onChange={(e) => setNewGoal({ ...newGoal, target_value: parseInt(e.target.value) })}
            />
            <Select value={newGoal.time_period} onValueChange={(v) => setNewGoal({ ...newGoal, time_period: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => createGoal.mutate(newGoal)}
              disabled={!newGoal.goal_description || createGoal.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {createGoal.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Goal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}