import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function IBHRSOutcomeSuggester({ serviceEvent, onApply }) {
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate IBHRS outcome measure suggestions for this service event:

Service Type: ${serviceEvent.service_type}
Duration: ${serviceEvent.duration_minutes} minutes
Setting: ${serviceEvent.setting}
County: ${serviceEvent.county}

Based on Iowa HHS IBHRS reporting standards, suggest appropriate outcome measures:
- functional_improvement (boolean)
- crisis_averted (boolean)
- linkage_to_care (boolean)
- recovery_capital_increase (0-10 scale)

Also provide clinical justification for each suggestion and any relevant VR session data if applicable.`,
        response_json_schema: {
          type: "object",
          properties: {
            outcome_measure: {
              type: "object",
              properties: {
                functional_improvement: { type: "boolean" },
                crisis_averted: { type: "boolean" },
                linkage_to_care: { type: "boolean" },
                recovery_capital_increase: { type: "number" }
              }
            },
            justification: { type: "string" },
            vr_session_data: {
              type: "object",
              properties: {
                scenario_id: { type: "string" },
                completion_rate: { type: "number" },
                skills_practiced: { type: "array", items: { type: "string" } },
                cue_exposure_success: { type: "boolean" }
              }
            }
          }
        }
      });

      setSuggestions(response);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <GraceCard>
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        AI Outcome Suggestions
      </h4>

      {!suggestions && !generating && (
        <Button onClick={generateSuggestions} className="bg-purple-600 hover:bg-purple-700">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Outcome Measures
        </Button>
      )}

      {generating && (
        <div className="text-center py-6">
          <Loader2 className="w-8 h-8 mx-auto text-purple-600 animate-spin mb-2" />
          <p className="text-sm text-gray-600">Analyzing service data...</p>
        </div>
      )}

      {suggestions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h5 className="font-semibold text-purple-900 mb-2">Suggested Outcomes:</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">Functional Improvement: {suggestions.outcome_measure.functional_improvement ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">Crisis Averted: {suggestions.outcome_measure.crisis_averted ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">Linkage to Care: {suggestions.outcome_measure.linkage_to_care ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700">
                  Recovery Capital Increase: +{suggestions.outcome_measure.recovery_capital_increase}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 italic">
            {suggestions.justification}
          </div>

          <Button onClick={() => onApply(suggestions.outcome_measure)} className="w-full bg-green-600 hover:bg-green-700">
            Apply Suggested Outcomes
          </Button>
        </motion.div>
      )}
    </GraceCard>
  );
}