import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Target, X, Smile, Meh, Frown,
  Moon, Sun, MessageCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GraceCard from '@/components/common/GraceCard';

export default function DailyGraceCheckIn({ user, profile, onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: todayCheckIn } = useQuery({
    queryKey: ['today-checkin', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date().toISOString().split('T')[0];
      const checkIns = await base44.entities.DailyCheckIn.filter({ created_by: user.email }, '-created_date', 1);
      const latestCheckIn = checkIns[0];
      if (latestCheckIn && latestCheckIn.created_date.startsWith(today)) {
        return latestCheckIn;
      }
      return null;
    },
    enabled: !!user
  });

  const { data: recentCheckIns } = useQuery({
    queryKey: ['recent-checkins', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.DailyCheckIn.filter({ created_by: user.email }, '-created_date', 30);
    },
    enabled: !!user,
    initialData: []
  });

  const calculateStreak = () => {
    let streak = 0;
    const sortedCheckIns = [...recentCheckIns].sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
    
    let currentDate = new Date();
    for (const checkIn of sortedCheckIns) {
      const checkInDate = new Date(checkIn.created_date);
      const dayDiff = Math.floor((currentDate - checkInDate) / (1000 * 60 * 60 * 24));
      if (dayDiff <= streak + 1) {
        streak++;
        currentDate = checkInDate;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  const getTimeMode = () => {
    const hour = new Date().getHours();
    return hour >= 4 && hour < 17 ? 'morning' : 'evening';
  };

  const timeMode = getTimeMode();

  const [formData, setFormData] = useState({
    mood_score: 3,
    mood_note: '',
    craving_intensity: 0,
    craving_note: '',
    feel_supported: 'yes',
    support_note: '',
    barc_snapshot: {
      self_worth: 3,
      social_connections: 3,
      meaningful_activities: 3
    },
    your_why_touchpoint: '',
    evening_wins: '',
    evening_challenges: '',
    gratitude: '',
    night_intention: ''
  });

  const moodEmojis = [
    { icon: Frown, label: 'Struggling', value: 1, color: 'text-red-500' },
    { icon: Frown, label: 'Not Great', value: 2, color: 'text-orange-500' },
    { icon: Meh, label: 'Okay', value: 3, color: 'text-yellow-500' },
    { icon: Smile, label: 'Good', value: 4, color: 'text-green-500' },
    { icon: Smile, label: 'Great', value: 5, color: 'text-teal-500' }
  ];

  const submitCheckIn = useMutation({
    mutationFn: async () => {
      setGenerating(true);

      const aiPrompt = timeMode === 'morning' 
        ? `Generate a morning affirmation and daily intention for someone with:
          Mood: ${formData.mood_score}/5
          Craving intensity: ${formData.craving_intensity}/10
          Feels supported: ${formData.feel_supported}
          
          Use neuroplasticity language ("Your brain is forming new pathways").
          Be warm, grace-centered, and encouraging.
          Provide 2-3 personalized app suggestions based on their state.`
        : `Generate an evening reflection and tomorrow intention for someone who:
          Today's mood: ${formData.mood_score}/5
          Wins: ${formData.evening_wins}
          Challenges: ${formData.evening_challenges}
          
          Acknowledge their resilience, use neuroplasticity metaphors.
          Be gentle and affirming.`;

      const ai = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            affirmation: { type: "string" },
            daily_intention: { type: "string" },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAiResponse(ai);

      await base44.entities.DailyCheckIn.create({
        time_mode: timeMode,
        mood_score: formData.mood_score,
        mood_note: formData.mood_note,
        craving_intensity: formData.craving_intensity,
        craving_note: formData.craving_note,
        feel_supported: formData.feel_supported,
        support_note: formData.support_note,
        barc_snapshot: formData.barc_snapshot,
        your_why_touchpoint: formData.your_why_touchpoint,
        evening_wins: formData.evening_wins,
        evening_challenges: formData.evening_challenges,
        gratitude: formData.gratitude,
        night_intention: formData.night_intention,
        ai_affirmation: ai.affirmation,
        ai_intention: ai.daily_intention,
        ai_suggestions: ai.suggestions
      });

      setGenerating(false);
      return ai;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['today-checkin']);
      queryClient.invalidateQueries(['recent-checkins']);
      onComplete?.();
    }
  });

  if (!user || isDismissed || todayCheckIn) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full"
      >
        <GraceCard className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-orange-50 border-2 border-teal-200">
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg"
            >
              {timeMode === 'morning' ? (
                <Sun className="w-7 h-7 text-white" />
              ) : (
                <Moon className="w-7 h-7 text-white" />
              )}
            </motion.div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {timeMode === 'morning' ? '☀️ Morning Grace Check-In' : '🌙 Evening Grace Reflection'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {timeMode === 'morning' 
                  ? 'Ready for a quick check-in to start your day with intention? (Takes ~5 minutes)'
                  : 'As the day winds down, ready for a gentle reflection? (Takes ~5 minutes)'
                }
              </p>
              
              {streak > 0 && (
                <Badge className="mt-2 bg-amber-100 text-amber-700">
                  🔥 {streak}-day streak—your brain thanks you!
                </Badge>
              )}
            </div>
          </div>

          {!isOpen && !aiResponse && (
            <motion.div layout>
              <Button 
                onClick={() => setIsOpen(true)}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start {timeMode === 'morning' ? 'Check-In' : 'Reflection'}
              </Button>
            </motion.div>
          )}

          {isOpen && !aiResponse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 mt-6"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  How are you feeling right now?
                </label>
                <div className="flex justify-between gap-2">
                  {moodEmojis.map((mood) => {
                    const Icon = mood.icon;
                    return (
                      <button
                        key={mood.value}
                        onClick={() => setFormData({ ...formData, mood_score: mood.value })}
                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          formData.mood_score === mood.value
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-300'
                        }`}
                      >
                        <Icon className={`w-8 h-8 ${mood.color}`} />
                        <span className="text-xs font-medium">{mood.label}</span>
                      </button>
                    );
                  })}
                </div>
                <Textarea
                  value={formData.mood_note}
                  onChange={(e) => setFormData({ ...formData, mood_note: e.target.value })}
                  placeholder="Optional: What's influencing your mood?"
                  className="mt-3"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Any cravings today? How intense? (0 = None, 10 = Very Strong)
                </label>
                <Slider
                  value={[formData.craving_intensity]}
                  onValueChange={(v) => setFormData({ ...formData, craving_intensity: v[0] })}
                  max={10}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 - None</span>
                  <span className="font-bold text-teal-600">{formData.craving_intensity}</span>
                  <span>10 - Very Strong</span>
                </div>
                {formData.craving_intensity > 0 && (
                  <Textarea
                    value={formData.craving_note}
                    onChange={(e) => setFormData({ ...formData, craving_note: e.target.value })}
                    placeholder="What triggered this? What helps?"
                    className="mt-3"
                    rows={2}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Do you feel supported and safe in this moment?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['yes', 'somewhat', 'no'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData({ ...formData, feel_supported: option })}
                      className={`p-3 rounded-xl border-2 capitalize transition-all ${
                        formData.feel_supported === option
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {timeMode === 'morning' && (
                <>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      🧠 Quick Recovery Capital Check
                    </h4>
                    <p className="text-xs text-purple-700 mb-4">
                      Strong connections help rewire your brain for resilience
                    </p>
                    
                    {['self_worth', 'social_connections', 'meaningful_activities'].map((domain) => (
                      <div key={domain} className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {domain.replace(/_/g, ' ')}
                        </label>
                        <Slider
                          value={[formData.barc_snapshot[domain]]}
                          onValueChange={(v) => setFormData({
                            ...formData,
                            barc_snapshot: { ...formData.barc_snapshot, [domain]: v[0] }
                          })}
                          max={6}
                          step={1}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1 - Low</span>
                          <span className="font-bold text-purple-600">{formData.barc_snapshot[domain]}</span>
                          <span>6 - High</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      💚 What small thing connects to your deeper "why" today?
                    </label>
                    <Textarea
                      value={formData.your_why_touchpoint}
                      onChange={(e) => setFormData({ ...formData, your_why_touchpoint: e.target.value })}
                      placeholder="A person, activity, or goal that matters to you..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {timeMode === 'evening' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      ⭐ What went well today?
                    </label>
                    <Textarea
                      value={formData.evening_wins}
                      onChange={(e) => setFormData({ ...formData, evening_wins: e.target.value })}
                      placeholder="Even small wins count..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      🌱 What challenged you?
                    </label>
                    <Textarea
                      value={formData.evening_challenges}
                      onChange={(e) => setFormData({ ...formData, evening_challenges: e.target.value })}
                      placeholder="You showed resilience just by making it through..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      🙏 What are you grateful for today?
                    </label>
                    <Textarea
                      value={formData.gratitude}
                      onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
                      placeholder="Gratitude rewires your brain toward hope..."
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => submitCheckIn.mutate()}
                  disabled={generating}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Grace...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Complete Check-In
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Skip for Now
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center italic">
                That's okay—check in when it feels right. No pressure, just grace. 💚
              </p>
            </motion.div>
          )}

          {aiResponse && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 mt-6"
            >
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Your Grace Affirmation
                </h4>
                <p className="text-lg text-purple-800 leading-relaxed">
                  {aiResponse.affirmation}
                </p>
              </div>

              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <h4 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {timeMode === 'morning' ? 'Today\'s Intention' : 'Tomorrow\'s Intention'}
                </h4>
                <p className="text-teal-800 italic">"{aiResponse.daily_intention}"</p>
              </div>

              {aiResponse.suggestions?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-teal-600" />
                    Suggested for You Today
                  </h4>
                  <div className="space-y-2">
                    {aiResponse.suggestions.map((sug, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-medium text-blue-900">{sug.action}</p>
                        <p className="text-sm text-blue-700">{sug.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">
                    🌱 Your Brain is Growing
                  </span>
                  <Badge className="bg-green-100 text-green-800">
                    Day {streak + 1}
                  </Badge>
                </div>
                <Progress value={Math.min((streak + 1) * 10, 100)} className="h-2" />
                <p className="text-xs text-green-700 mt-2">
                  Every check-in strengthens new neural pathways. You're rewiring your brain for healing! 🧠✨
                </p>
              </div>

              <Button
                onClick={() => {
                  setIsOpen(false);
                  setAiResponse(null);
                }}
                variant="outline"
                className="w-full"
              >
                Done
              </Button>
            </motion.div>
          )}
        </GraceCard>
      </motion.div>
    </AnimatePresence>
  );
}