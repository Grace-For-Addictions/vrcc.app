import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Sparkles, Target, Award, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GraceCard from '@/components/common/GraceCard';

export default function MultiUserVRSimulator({ user }) {
  const [generatingScenario, setGeneratingScenario] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const queryClient = useQueryClient();

  const generateAIScenario = useMutation({
    mutationFn: async ({ prompt, difficulty, participantCount }) => {
      setGeneratingScenario(true);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are generating a VR peer coach training scenario for ${participantCount} participants.

User request: ${prompt}
Difficulty: ${difficulty}

Create a realistic, challenging scenario that requires:
- Collaborative decision-making
- Division of responsibilities
- Crisis management
- Communication skills

Return JSON with:
- scenario_title
- scenario_description (2-3 paragraphs)
- participant_roles (array of ${participantCount} role objects with role_name and responsibilities)
- skills_practiced (array)
- success_criteria (array)
- estimated_duration_minutes`,
        response_json_schema: {
          type: "object",
          properties: {
            scenario_title: { type: "string" },
            scenario_description: { type: "string" },
            participant_roles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role_name: { type: "string" },
                  responsibilities: { type: "string" }
                }
              }
            },
            skills_practiced: { type: "array", items: { type: "string" } },
            success_criteria: { type: "array", items: { type: "string" } },
            estimated_duration_minutes: { type: "number" }
          }
        }
      });

      return response;
    },
    onSuccess: async (scenario) => {
      // Create session
      const session = await base44.entities.VRCollaborativeSession.create({
        session_id: `vr-${Date.now()}`,
        scenario_title: scenario.scenario_title,
        scenario_description: scenario.scenario_description,
        difficulty: 'intermediate',
        participant_ids: [user.id],
        participant_roles: { [user.id]: scenario.participant_roles[0].role_name },
        ai_generated: true,
        generation_prompt: customPrompt,
        skills_practiced: scenario.skills_practiced,
        status: 'scheduled'
      });

      setActiveSession(session);
      setGeneratingScenario(false);
    }
  });

  const completeSession = useMutation({
    mutationFn: async ({ sessionId, teamScore, individualScores }) => {
      // Update session
      await base44.entities.VRCollaborativeSession.update(sessionId, {
        status: 'completed',
        team_score: teamScore,
        individual_scores: individualScores,
        session_duration_minutes: 45
      });

      // Log to IBHRS for each participant
      const session = activeSession;
      for (const participantId of session.participant_ids) {
        await base44.entities.IBHRSServiceEvent.create({
          participant_id: participantId,
          service_type: 'vr_training',
          service_date: new Date().toISOString().split('T')[0],
          duration_minutes: 45,
          setting: 'vr_immersive',
          county: 'Dallas',
          provider_credential: 'CPS',
          outcome_measure: {
            functional_improvement: teamScore >= 70,
            recovery_capital_increase: Math.round(teamScore / 10)
          },
          vr_session_data: {
            scenario_id: sessionId,
            completion_rate: 100,
            skills_practiced: session.skills_practiced,
            cue_exposure_success: teamScore >= 80
          }
        });
      }

      setActiveSession(null);
      queryClient.invalidateQueries(['vr-sessions']);
    }
  });

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          AI Scenario Generator
        </h3>
        <p className="text-gray-600 mb-4">
          Describe a training scenario and our AI will generate a multi-user VR simulation with roles, 
          objectives, and performance metrics.
        </p>

        <Textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Example: Create a scenario where 3 peer coaches must work together to support a participant experiencing a relapse crisis while coordinating with family and treatment providers..."
          rows={4}
          className="mb-4"
        />

        <Button
          onClick={() => generateAIScenario.mutate({
            prompt: customPrompt,
            difficulty: 'intermediate',
            participantCount: 2
          })}
          disabled={!customPrompt.trim() || generatingScenario}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {generatingScenario ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating VR Scenario...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Scenario
            </>
          )}
        </Button>
      </GraceCard>

      {activeSession && (
        <GraceCard>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{activeSession.scenario_title}</h3>
          <Badge className="mb-4">AI-Generated • Multi-User</Badge>
          
          <p className="text-gray-600 mb-4">{activeSession.scenario_description}</p>

          <div className="space-y-3 mb-4">
            <h4 className="font-semibold text-gray-900">Skills Practiced:</h4>
            <div className="flex flex-wrap gap-2">
              {activeSession.skills_practiced?.map((skill, idx) => (
                <Badge key={idx} variant="outline">{skill}</Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => completeSession.mutate({
                sessionId: activeSession.id,
                teamScore: 85,
                individualScores: { [user.id]: 87 }
              })}
              className="bg-green-600 hover:bg-green-700"
            >
              <Award className="w-4 h-4 mr-2" />
              Complete Session (Demo)
            </Button>
          </div>
        </GraceCard>
      )}
    </div>
  );
}