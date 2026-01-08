import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function ConflictResolutionSimulator({ user }) {
  const [scenario, setScenario] = useState('');
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState(0);
  const [choices, setChoices] = useState([]);
  const [userChoices, setUserChoices] = useState([]);
  const [scenarioData, setScenarioData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const SCENARIOS = [
    { value: 'roommate', label: 'Recovery Housing Roommate Conflict' },
    { value: 'family', label: 'Family Boundary Setting' },
    { value: 'workplace', label: 'Workplace Misunderstanding' },
    { value: 'sponsor', label: 'Disagreement with Sponsor/Coach' },
    { value: 'peer', label: 'Peer Group Tension' }
  ];

  const startSimulation = async () => {
    if (!scenario) return;

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an interactive conflict resolution scenario for someone in recovery: ${SCENARIOS.find(s => s.value === scenario)?.label}

Generate:
1. Detailed scenario setup (realistic, trauma-informed)
2. 3 decision points with 3 response options each (healthy, avoidant, aggressive)
3. Consequences for each choice
4. Final outcome based on choices made

Format with clear stages, realistic dialogue, and recovery-relevant context.`,
        response_json_schema: {
          type: "object",
          properties: {
            setup: { type: "string" },
            stages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  situation: { type: "string" },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        type: { type: "string" },
                        consequence: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setScenarioData(response);
      setStarted(true);
    } catch (error) {
      toast.error('Failed to start simulation');
    } finally {
      setLoading(false);
    }
  };

  const makeChoice = (optionIndex) => {
    const choice = scenarioData.stages[stage].options[optionIndex];
    setUserChoices([...userChoices, { stage, choice }]);
    
    if (stage < scenarioData.stages.length - 1) {
      setStage(stage + 1);
    } else {
      generateFeedback();
    }
  };

  const generateFeedback = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze conflict resolution choices for ${scenario} scenario.

Choices made: ${userChoices.map((c, i) => `Stage ${i + 1}: ${c.choice.text} (${c.choice.type})`).join('\n')}

Provide:
1. Overall approach score (1-10)
2. Communication effectiveness
3. Healthy strategies used
4. Patterns to be aware of
5. Alternative approaches for stages with avoidant/aggressive choices
6. Neuroplasticity insight (how practicing healthy conflict builds new pathways)

Be specific, empowering, and recovery-focused.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            communication_quality: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            patterns: { type: "string" },
            alternatives: { type: "array", items: { type: "string" } },
            neuroplasticity_insight: { type: "string" }
          }
        }
      });

      setFeedback(response);
      
      // Log VR session
      await base44.entities.VRCollaborativeSession.create({
        session_type: 'conflict_resolution',
        participants: [user.email],
        scenario_details: { scenario_type: scenario, score: response.overall_score },
        duration_minutes: 10,
        outcome_notes: `Completed ${scenario} conflict simulation with ${response.overall_score}/10 score`
      });
    } catch (error) {
      toast.error('Failed to generate feedback');
    } finally {
      setLoading(false);
    }
  };

  if (feedback) {
    return (
      <GraceCard>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          Simulation Complete
        </h3>

        <div className="space-y-4">
          <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="text-5xl font-bold text-purple-700 mb-2">{feedback.overall_score}/10</div>
            <p className="text-sm text-gray-600">Conflict Resolution Score</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">💬 Communication Quality</h4>
            <p className="text-sm text-gray-700">{feedback.communication_quality}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">✨ Strengths</h4>
            <ul className="list-disc list-inside space-y-1">
              {feedback.strengths?.map((s, i) => (
                <li key={i} className="text-sm text-gray-700">{s}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600 mb-2" />
            <h4 className="font-semibold text-orange-900 mb-2">Patterns to Watch</h4>
            <p className="text-sm text-orange-800">{feedback.patterns}</p>
          </div>

          {feedback.alternatives?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🎯 Alternative Approaches</h4>
              <ul className="list-disc list-inside space-y-1">
                {feedback.alternatives.map((alt, i) => (
                  <li key={i} className="text-sm text-gray-700">{alt}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>🧠 Brain Science:</strong> {feedback.neuroplasticity_insight}
            </p>
          </div>

          <Button onClick={() => { setStarted(false); setStage(0); setUserChoices([]); setFeedback(null); }} className="w-full">
            Practice Another Scenario
          </Button>
        </div>
      </GraceCard>
    );
  }

  if (!started) {
    return (
      <GraceCard>
        <div className="text-center mb-6">
          <Users className="w-12 h-12 mx-auto text-purple-600 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">VR Conflict Resolution Simulator</h3>
          <p className="text-gray-600">Practice healthy communication in challenging situations</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Scenario</label>
            <Select value={scenario} onValueChange={setScenario}>
              <SelectTrigger>
                <SelectValue placeholder="Choose scenario..." />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={startSimulation} disabled={!scenario || loading} className="w-full bg-purple-600 hover:bg-purple-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Simulation
              </>
            )}
          </Button>
        </div>
      </GraceCard>
    );
  }

  const currentStage = scenarioData.stages[stage];

  return (
    <GraceCard>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Stage {stage + 1} of {scenarioData.stages.length}</h3>
        </div>
        <div className="flex gap-1 mb-4">
          {scenarioData.stages.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded ${i <= stage ? 'bg-purple-600' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      {stage === 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-6">
          <p className="text-sm text-purple-900">{scenarioData.setup}</p>
        </div>
      )}

      <motion.div
        key={stage}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="font-medium text-gray-900">{currentStage.situation}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">How do you respond?</p>
          {currentStage.options.map((option, i) => (
            <Button
              key={i}
              onClick={() => makeChoice(i)}
              variant="outline"
              className="w-full text-left justify-start h-auto py-4 px-4 hover:bg-purple-50"
              disabled={loading}
            >
              <div>
                <p className="font-medium">{option.text}</p>
                <p className="text-xs text-gray-600 mt-1">{option.type}</p>
              </div>
            </Button>
          ))}
        </div>
      </motion.div>
    </GraceCard>
  );
}