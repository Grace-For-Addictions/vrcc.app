import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIPlantSuggestions({ profile, currentPoints }) {
  const [suggestions, setSuggestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (profile) {
      generateSuggestions();
    }
  }, [profile]);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace (GPT-5.2 on Wix/Base44) providing personalized garden growth suggestions.

USER CONTEXT:
- Their Why: ${profile.my_why || 'Not set'}
- Recovery Stage: ${profile.stage}
- Current Points: ${currentPoints}
- Streak: ${profile.current_streak || 0} days

Suggest 2-3 specific actions they can take TODAY to earn growth points and unlock new plants. Connect each suggestion to:
1. Their "why"
2. Neuroplasticity (building brain pathways)
3. Specific point values

Be warm, encouraging, and actionable.

Return as JSON:`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  points_earned: { type: "number" },
                  why_connection: { type: "string" },
                  brain_insight: { type: "string" }
                }
              }
            },
            next_plant_unlock: { type: "string" },
            encouragement: { type: "string" }
          }
        }
      });

      setSuggestions(response);
    } catch (error) {
      console.error('Failed to generate suggestions', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!suggestions) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-6 h-6" />
          <h3 className="text-xl font-bold">Grace's Growth Tips for You</h3>
        </div>

        {isGenerating ? (
          <div className="flex items-center gap-2 text-purple-100">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing your journey...
          </div>
        ) : (
          <>
            <p className="text-purple-100 text-sm mb-4">{suggestions.encouragement}</p>

            <div className="space-y-3 mb-4">
              {suggestions.suggestions?.map((sug, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-start gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-200 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{sug.action}</p>
                      <p className="text-xs text-purple-200 mt-1">+{sug.points_earned} growth points</p>
                    </div>
                  </div>
                  {sug.why_connection && (
                    <p className="text-xs text-purple-200 mt-2">💚 {sug.why_connection}</p>
                  )}
                  {sug.brain_insight && (
                    <p className="text-xs text-purple-200 mt-1">🧠 {sug.brain_insight}</p>
                  )}
                </div>
              ))}
            </div>

            {suggestions.next_plant_unlock && (
              <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                <p className="text-sm">
                  <strong>Next unlock:</strong> {suggestions.next_plant_unlock}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}