import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Loader2, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function AISessionSummarizer() {
  const [processing, setProcessing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const queryClient = useQueryClient();

  const { data: recentSessions } = useQuery({
    queryKey: ['sessions-no-summary'],
    queryFn: async () => {
      const sessions = await base44.entities.CoachingSessionLog.list('-activity_date', 100);
      return sessions.filter(s => !s.ai_generated_summary && s.activity_notes);
    },
    initialData: []
  });

  const generateSummary = useMutation({
    mutationFn: async (session) => {
      setProcessing(true);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI case note specialist for Grace For Addictions. Analyze this peer coaching session and generate a professional summary.

SESSION DETAILS:
Date: ${session.activity_date}
Participant: ${session.contact_name}
Coach: ${session.coach_name}
Activity Type: ${session.activity_type}
Program: ${session.operating_program}
Notes: ${session.activity_notes}

Generate:
1. Concise Summary (2-3 sentences, clinical but warm)
2. Key Themes (3-5 bullet points - substance use, mental health, housing, employment, relationships, etc.)
3. Progress Towards Goals (based on session content)
4. Strengths Identified (person-first, recovery capital focus)
5. Areas for Follow-Up (specific, actionable)
6. Recommended Next Steps (2-3 concrete actions)
7. Risk Flags (if any - safety, relapse indicators, crisis) 

Use person-first, trauma-informed language. Be concise but comprehensive.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_themes: { type: "array", items: { type: "string" } },
            progress_notes: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            follow_up_areas: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
            risk_flags: { type: "array", items: { type: "string" } }
          }
        }
      });

      await base44.entities.CoachingSessionLog.update(session.id, {
        ai_generated_summary: JSON.stringify(response)
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions-no-summary']);
      toast.success('Session summary generated!');
      setProcessing(false);
    },
    onError: () => {
      toast.error('Failed to generate summary');
      setProcessing(false);
    }
  });

  const batchGenerateSummaries = async () => {
    setProcessing(true);
    let processed = 0;
    
    for (const session of recentSessions.slice(0, 20)) {
      try {
        await generateSummary.mutateAsync(session);
        processed++;
      } catch (error) {
        console.error('Batch error:', error);
      }
    }
    
    toast.success(`Generated ${processed} summaries`);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          AI Session Note Summarizer
        </h3>
        <p className="text-gray-700 mb-4">
          Automatically generate professional case notes from coaching sessions. AI identifies themes, progress, strengths, and follow-up needs.
        </p>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-purple-700 bg-purple-50">
            {recentSessions.length} sessions pending
          </Badge>
          <Button
            onClick={batchGenerateSummaries}
            disabled={processing || recentSessions.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate All Summaries
              </>
            )}
          </Button>
        </div>
      </GraceCard>

      {/* Recent Sessions */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Sessions Needing Summary</h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentSessions.slice(0, 20).map((session, idx) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{session.contact_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {session.activity_type}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  {new Date(session.activity_date).toLocaleDateString()} • {session.coach_name}
                </p>
                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {session.activity_notes}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => generateSummary.mutate(session)}
                disabled={processing}
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Summarize
              </Button>
            </motion.div>
          ))}
        </div>
      </GraceCard>

      {/* Summary Preview */}
      {selectedSession && (
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-4">Generated Summary Preview</h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Summary</h5>
              <p className="text-sm text-gray-700">{selectedSession.summary}</p>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Key Themes</h5>
              <div className="flex flex-wrap gap-2">
                {selectedSession.key_themes?.map((theme, i) => (
                  <Badge key={i} variant="outline">{theme}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Strengths Identified</h5>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {selectedSession.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Follow-Up Areas</h5>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {selectedSession.follow_up_areas?.map((area, i) => (
                  <li key={i}>{area}</li>
                ))}
              </ul>
            </div>
          </div>
        </GraceCard>
      )}
    </div>
  );
}