import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Clock, CheckCircle2, Edit3, Loader2 } from 'lucide-react';

export default function AIDocumentationAutomation({ sessionId, participantEmail, coachEmail }) {
  const [manualInput, setManualInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: aiSession } = useQuery({
    queryKey: ['ai-documentation', sessionId],
    queryFn: () => base44.entities.AIDocumentationSession.filter({ session_id: sessionId }),
    enabled: !!sessionId
  });

  const generateNotesMutation = useMutation({
    mutationFn: async (input) => {
      setIsGenerating(true);
      
      const prompt = `You are an AI documentation assistant for Grace For Addictions, a trauma-informed peer recovery program.

Based on the following session summary, generate clinical progress notes that are:
- Factual and objective (HIPAA-compliant)
- Person-first and strength-based
- Non-stigmatizing
- Focus on progress, goals, and next steps
- 150-250 words

Session Summary:
${input}

Generate progress notes in this format:
**Session Date:** [Today's date]
**Topics Discussed:** [Brief list]
**Progress Observed:** [Strength-based observations]
**Goals Addressed:** [Specific goals]
**Action Items:** [Next steps]
**Follow-up Needed:** [Yes/No and when]`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      return result;
    },
    onSuccess: (result) => {
      setGeneratedNotes(result);
      setIsGenerating(false);
    }
  });

  const saveDocumentationMutation = useMutation({
    mutationFn: async ({ notes, aiGenerated }) => {
      const timeSaved = aiGenerated ? 15 : 0; // Estimate 15 minutes saved
      const percentAI = aiGenerated ? 70 : 0;
      
      return base44.entities.AIDocumentationSession.create({
        session_id: sessionId,
        participant_email: participantEmail,
        coach_email: coachEmail,
        session_date: new Date().toISOString(),
        ai_generated_notes: aiGenerated ? generatedNotes : '',
        coach_edited_notes: notes,
        ai_confidence_score: 0.85,
        time_saved_minutes: timeSaved,
        percent_ai_generated: percentAI,
        coach_review_time_minutes: aiGenerated ? 3 : 15
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-documentation']);
      
      // Log ROI metric
      base44.entities.ROIMetric.create({
        metric_date: new Date().toISOString().split('T')[0],
        metric_type: 'documentation_hours_saved',
        time_period: 'daily',
        hours_saved: 0.25, // 15 minutes
        dollar_value_saved: 7.5, // $30/hr * 0.25
        roi_multiplier: 3,
        eleos_style_savings: {
          documentation_hours_reduced: 0.25,
          volunteer_turnover_reduced: 0,
          quality_of_care_improved: 1
        }
      });
    }
  });

  const handleGenerate = () => {
    generateNotesMutation.mutate(manualInput);
  };

  const handleSave = () => {
    saveDocumentationMutation.mutate({ 
      notes: generatedNotes, 
      aiGenerated: true 
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-teal-200 bg-teal-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            AI Documentation Assistant
          </CardTitle>
          <CardDescription>
            Eleos-inspired automation • Saves ~15 minutes per session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Session Summary (bullet points or brief notes)
            </label>
            <Textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="- Discussed employment goals&#10;- Client expressed gratitude for housing support&#10;- Working on transportation barriers&#10;- Follow-up scheduled for next week"
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!manualInput || isGenerating}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate Documentation</>
              )}
            </Button>
            
            {generatedNotes && (
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                ~15 min saved
              </Badge>
            )}
          </div>

          {generatedNotes && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">AI-Generated Notes (70% automated)</p>
                  <Badge className="bg-teal-100 text-teal-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ready for Review
                  </Badge>
                </div>
                <Textarea
                  value={generatedNotes}
                  onChange={(e) => setGeneratedNotes(e.target.value)}
                  rows={12}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  <Edit3 className="w-3 h-3 inline mr-1" />
                  Review and edit as needed before saving
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600">Time Saved</p>
                  <p className="text-lg font-bold text-green-700">15 min</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600">AI Generated</p>
                  <p className="text-lg font-bold text-blue-700">70%</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600">ROI</p>
                  <p className="text-lg font-bold text-purple-700">3-8x</p>
                </div>
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-teal-600 hover:bg-teal-700"
                disabled={saveDocumentationMutation.isPending}
              >
                {saveDocumentationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Save Documentation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {aiSession && aiSession[0] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Session Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aiSession[0].session_insights?.themes_identified && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Themes:</p>
                <div className="flex flex-wrap gap-1">
                  {aiSession[0].session_insights.themes_identified.map((theme, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}