import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Loader2, Download, Send, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

const GRANT_TYPES = [
  { value: 'dallas_county', label: 'Dallas County Foundation', max: 20000 },
  { value: 'opioid_settlement', label: 'Iowa Opioid Settlement', max: 1000000 },
  { value: 'samhsa', label: 'SAMHSA Grant', max: 500000 },
  { value: 'state_behavioral_health', label: 'Iowa Behavioral Health', max: 250000 },
  { value: 'foundation', label: 'General Foundation Grant', max: 50000 }
];

export default function GrantProposalGenerator({ user, sessions, outcomes }) {
  const [grantType, setGrantType] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [amountRequested, setAmountRequested] = useState('');
  const [focusAreas, setFocusAreas] = useState([]);
  const [generatedProposal, setGeneratedProposal] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const saveProposal = useMutation({
    mutationFn: (data) => base44.entities.GrantProposal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['grantProposals']);
      toast.success('Proposal saved!');
    }
  });

  const generateProposal = async () => {
    if (!grantType || !projectTitle || !amountRequested) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      // Gather comprehensive context
      const recentOutcomes = outcomes.slice(0, 50);
      const recentSessions = sessions.slice(0, 100);
      
      const uniqueParticipants = new Set(recentSessions.map(s => s.contact_email || s.contact_name)).size;
      const referralSuccessRate = (recentSessions.filter(s => s.referral_status === 'Completed').length / 
        recentSessions.filter(s => s.referral_made).length * 100) || 0;
      const avgDaysRecovery = recentSessions.filter(s => s.days_in_recovery)
        .reduce((sum, s) => sum + s.days_in_recovery, 0) / 
        recentSessions.filter(s => s.days_in_recovery).length || 0;

      const costAvoidance = recentOutcomes.reduce((sum, o) => sum + (o.cost_avoidance_estimate || 0), 0);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert grant writer for Grace For Addictions (GFA), a peer-led, non-clinical Recovery Community Organization serving all 99 Iowa counties. Generate a COMPREHENSIVE, professional grant proposal.

GRANT TYPE: ${GRANT_TYPES.find(g => g.value === grantType)?.label}
PROJECT TITLE: ${projectTitle}
AMOUNT REQUESTED: $${amountRequested}
FOCUS AREAS: ${focusAreas.join(', ')}

GFA MISSION: Peer-based recovery support services (PRSS), trauma-informed, grace-based, stigma-free support for substance use disorder, mental health, and justice involvement. "No fees. No stigma. Just grace."

CURRENT IMPACT DATA:
- Total participants served: ${uniqueParticipants}
- Total service events: ${recentSessions.length}
- Referral success rate: ${Math.round(referralSuccessRate)}%
- Average days in recovery: ${Math.round(avgDaysRecovery)}
- Verified outcomes: ${recentOutcomes.length}
- Estimated cost avoidance: $${costAvoidance.toLocaleString()}
- Housing stability outcomes: ${recentOutcomes.filter(o => o.outcome_type === 'housing_stability').length}
- Crisis diversions: ${recentOutcomes.filter(o => o.outcome_type === 'crisis_diversion').length}
- Employment placements: ${recentOutcomes.filter(o => o.outcome_type === 'employment_gained').length}

KEY PROGRAMS:
- Virtual Recovery Community Center (VRCC)
- Mobile Recovery Community Center (MRCC)
- JUST GRACE Initiative (justice-involved/underserved focus)
- Community Gardens (neuroplasticity-informed)
- Peer Coach Training & Certification

ALIGNMENT WITH 2026 IOWA PRIORITIES:
- HF 1038 behavioral health funding
- Opioid abatement strategies (MAT/MOUD, naloxone, recovery housing)
- Rural/underserved access expansion
- Justice-involved reentry support
- Harm reduction and overdose prevention

Generate a complete proposal with:
1. Executive Summary (compelling, data-driven, 300 words)
2. Organization Background (GFA's mission, peer-led model, trauma-informed approach)
3. Statement of Need (Iowa opioid crisis, gaps in care continuum, justice-involved women's barriers)
4. Project Description (detailed activities, timeline, deliverables)
5. Goals & Objectives (SMART, measurable, aligned with funder priorities)
6. Target Population (demographics, geographic reach, vulnerability factors)
7. Outcomes & Impact (quantifiable metrics, cost avoidance, long-term sustainability)
8. Evaluation Plan (data tracking, success indicators, continuous improvement)
9. Budget Narrative (justify costs, show matching funds strategy)
10. Sustainability Plan (diversified funding, volunteer capacity, partnerships)
11. Key Personnel (roles, qualifications, lived experience integration)
12. Letters of Support Summary (community partnerships, collaboration)

Use person-first, stigma-free language. Emphasize peer-led, non-clinical model. Include specific Iowa counties, behavioral health districts, recovery-ready communities. Reference CCAR principles, SAMHSA standards, NARR compliance where relevant.

Be professional, compelling, and data-rich. This proposal should win funding.`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            organization_background: { type: "string" },
            statement_of_need: { type: "string" },
            project_description: { type: "string" },
            goals_objectives: { type: "array", items: { type: "string" } },
            target_population: { type: "string" },
            outcomes_impact: { type: "string" },
            evaluation_plan: { type: "string" },
            budget_narrative: { type: "string" },
            sustainability_plan: { type: "string" },
            key_personnel: { type: "string" },
            letters_of_support: { type: "string" }
          }
        }
      });

      setGeneratedProposal(response);
      
      // Auto-save
      saveProposal.mutate({
        grant_type: grantType,
        project_title: projectTitle,
        amount_requested: parseInt(amountRequested),
        focus_areas: focusAreas,
        proposal_content: JSON.stringify(response),
        status: 'draft',
        generated_date: new Date().toISOString()
      });

    } catch (error) {
      toast.error('Failed to generate proposal');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-teal-600" />
          AI-Powered Grant Proposal Generator
        </h3>
        <p className="text-gray-700 mb-6">
          Advanced AI analyzes your impact data and generates professional, winning grant proposals aligned with 2026 Iowa policy priorities and funder requirements.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Grant Type *</label>
            <Select value={grantType} onValueChange={setGrantType}>
              <SelectTrigger>
                <SelectValue placeholder="Select grant type" />
              </SelectTrigger>
              <SelectContent>
                {GRANT_TYPES.map(gt => (
                  <SelectItem key={gt.value} value={gt.value}>
                    {gt.label} (Max: ${gt.max.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount Requested *</label>
            <Input
              type="number"
              value={amountRequested}
              onChange={(e) => setAmountRequested(e.target.value)}
              placeholder="e.g., 20000"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Project Title *</label>
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g., Grace House: Expanding Recovery Housing Capacity in Polk County"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {['Health', 'Human Services', 'Public/Society Benefits', 'Justice', 'Education'].map(area => (
                <button
                  key={area}
                  onClick={() => {
                    if (focusAreas.includes(area)) {
                      setFocusAreas(focusAreas.filter(a => a !== area));
                    } else {
                      setFocusAreas([...focusAreas, area]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    focusAreas.includes(area)
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={generateProposal}
          disabled={isGenerating || !grantType || !projectTitle || !amountRequested}
          className="w-full mt-6 bg-teal-600 hover:bg-teal-700 py-6 text-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Advanced AI Proposal...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Complete Grant Proposal
            </>
          )}
        </Button>
      </GraceCard>

      {/* Generated Proposal */}
      {generatedProposal && (
        <GraceCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Generated Proposal</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                <Send className="w-4 h-4 mr-2" />
                Submit
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-600" />
                Executive Summary
              </h4>
              <p className="text-gray-700 whitespace-pre-wrap">{generatedProposal.executive_summary}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Organization Background</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{generatedProposal.organization_background}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Statement of Need</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{generatedProposal.statement_of_need}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Project Description</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{generatedProposal.project_description}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Goals & Objectives</h4>
              <ul className="list-disc list-inside space-y-1">
                {generatedProposal.goals_objectives.map((goal, idx) => (
                  <li key={idx} className="text-gray-700">{goal}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Outcomes & Impact</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{generatedProposal.outcomes_impact}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Evaluation Plan</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{generatedProposal.evaluation_plan}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Budget Narrative</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{generatedProposal.budget_narrative}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Sustainability Plan</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{generatedProposal.sustainability_plan}</p>
            </div>
          </div>
        </GraceCard>
      )}
    </div>
  );
}