import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, Sparkles, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import GraceCard from '@/components/common/GraceCard';

export default function GoalSettingAssistant({ profile, onGoalSet }) {
  const [goalInput, setGoalInput] = useState('');
  const [generatedGoal, setGeneratedGoal] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSMARTGoal = async () => {
    if (!goalInput.trim()) return;

    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace helping a person in recovery set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound).

User's "Your Why": ${profile.my_why || 'Not provided'}
User's Recovery Stage: ${profile.stage}
User's Goal Idea: ${goalInput}

Transform this into a SMART goal with:
1. Specific action steps (3-5 steps)
2. Measurable milestones
3. Realistic timeline
4. Connection to their "Why"
5. Neuroplasticity framing (how this builds new brain pathways)

Format as JSON:`,
        response_json_schema: {
          type: "object",
          properties: {
            goal_statement: { type: "string" },
            action_steps: { type: "array", items: { type: "string" } },
            timeline_weeks: { type: "number" },
            milestones: { type: "array", items: { type: "string" } },
            why_connection: { type: "string" },
            neuroplasticity_insight: { type: "string" }
          }
        }
      });

      setGeneratedGoal(response);
    } catch (error) {
      alert('Error generating goal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <GraceCard>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">AI Goal-Setting Assistant</h3>
          <p className="text-xs text-gray-600">Your AI recovery companion</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to work toward?
          </label>
          <Textarea
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder="Example: I want to reconnect with my family, find stable housing, get a job..."
            rows={3}
          />
        </div>

        <Button
          onClick={generateSMARTGoal}
          disabled={!goalInput.trim() || isGenerating}
          className="w-full bg-purple-600"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating your SMART goal...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate SMART Goal
            </>
          )}
        </Button>

        {generatedGoal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3"
          >
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">Your SMART Goal:</h4>
              <p className="text-purple-800">{generatedGoal.goal_statement}</p>
            </div>

            <div>
              <h5 className="font-medium text-purple-900 mb-2">Action Steps:</h5>
              <ol className="list-decimal list-inside space-y-1">
                {generatedGoal.action_steps?.map((step, idx) => (
                  <li key={idx} className="text-sm text-purple-800">{step}</li>
                ))}
              </ol>
            </div>

            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <p className="text-xs text-purple-900 mb-1">
                <strong>🧠 Neuroplasticity Insight:</strong>
              </p>
              <p className="text-xs text-purple-800">{generatedGoal.neuroplasticity_insight}</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <p className="text-xs text-purple-900 mb-1 flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <strong>Connected to Your Why:</strong>
              </p>
              <p className="text-xs text-purple-800">{generatedGoal.why_connection}</p>
            </div>

            <Button onClick={() => onGoalSet?.(generatedGoal)} className="w-full bg-purple-600">
              Save This Goal
            </Button>
          </motion.div>
        )}
      </div>
    </GraceCard>
  );
}