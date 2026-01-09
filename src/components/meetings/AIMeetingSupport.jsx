import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mic, Users, FileText, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function AIMeetingSupport({ meetingId, meetingType = 'GFARC' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [summary, setSummary] = useState(null);
  const [attendees, setAttendees] = useState([]);

  const generateSummary = useMutation({
    mutationFn: async () => {
      const aiSummary = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a compassionate meeting summary from this ${meetingType} recovery meeting transcript.

TRANSCRIPT:
${transcriptText}

ATTENDEES:
${attendees.join(', ')}

Provide:
1. Key themes discussed
2. Wins and milestones shared
3. Support needs identified
4. Action items or follow-ups
5. Neuroplasticity insights based on discussions
6. Resources mentioned or needed

Use warm, recovery-focused, stigma-free language.`,
        response_json_schema: {
          type: "object",
          properties: {
            key_themes: { type: "array", items: { type: "string" } },
            wins_shared: { type: "array", items: { type: "string" } },
            support_needs: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } },
            neuroplasticity_moments: { type: "string" },
            resources_needed: { type: "array", items: { type: "string" } },
            overall_summary: { type: "string" }
          }
        }
      });

      return aiSummary;
    },
    onSuccess: (data) => {
      setSummary(data);
      toast.success('Meeting summary generated!');
    }
  });

  const identifySpeakers = useMutation({
    mutationFn: async () => {
      const speakerAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this meeting transcript and identify distinct speakers by their speech patterns. DO NOT use real names - use pseudonyms like "Speaker A", "Speaker B", etc.

TRANSCRIPT:
${transcriptText}

Return a list of speaker identifiers and the number of times they spoke.`,
        response_json_schema: {
          type: "object",
          properties: {
            speakers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  speaker_id: { type: "string" },
                  participation_count: { type: "number" },
                  key_contributions: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      return speakerAnalysis;
    },
    onSuccess: (data) => {
      toast.success('Speaker analysis complete!');
    }
  });

  return (
    <div className="space-y-6">
      {/* AI Transcription */}
      <GraceCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Mic className="w-5 h-5 text-purple-600" />
            Live AI Transcription
          </h3>
          <Badge className={isRecording ? "bg-red-500" : "bg-gray-300"}>
            {isRecording ? 'Recording' : 'Stopped'}
          </Badge>
        </div>

        <div className="space-y-4">
          <Textarea
            rows={8}
            placeholder="Paste meeting transcript here, or use live transcription..."
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            className="font-mono text-sm"
          />

          <div className="flex gap-2">
            <Button
              onClick={() => setIsRecording(!isRecording)}
              variant={isRecording ? "destructive" : "default"}
              className={!isRecording && "bg-green-600 hover:bg-green-700"}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>

            <Button
              onClick={() => generateSummary.mutate()}
              disabled={!transcriptText.trim() || generateSummary.isPending}
              variant="outline"
            >
              {generateSummary.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Summary
            </Button>

            <Button
              onClick={() => identifySpeakers.mutate()}
              disabled={!transcriptText.trim() || identifySpeakers.isPending}
              variant="outline"
            >
              {identifySpeakers.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              Identify Speakers
            </Button>
          </div>
        </div>
      </GraceCard>

      {/* Attendance Tracking */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" />
          AI-Assisted Attendance
        </h3>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add attendee name..."
              className="flex-1 px-3 py-2 border rounded-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  setAttendees([...attendees, e.target.value.trim()]);
                  e.target.value = '';
                }
              }}
            />
            <Button
              onClick={() => {
                const input = document.querySelector('input[placeholder="Add attendee name..."]');
                if (input.value.trim()) {
                  setAttendees([...attendees, input.value.trim()]);
                  input.value = '';
                }
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {attendees.map((name, idx) => (
              <Badge key={idx} variant="outline" className="flex items-center gap-1">
                {name}
                <button
                  onClick={() => setAttendees(attendees.filter((_, i) => i !== idx))}
                  className="ml-1 text-gray-500 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>

          <p className="text-sm text-gray-500">
            {attendees.length} attendee{attendees.length !== 1 && 's'} tracked
          </p>
        </div>
      </GraceCard>

      {/* AI Summary Display */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GraceCard className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Meeting Summary</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-800 leading-relaxed">{summary.overall_summary}</p>
              </div>

              {summary.key_themes?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-900 mb-2">🎯 Key Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.key_themes.map((theme, idx) => (
                      <Badge key={idx} className="bg-purple-100 text-purple-800">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {summary.wins_shared?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-800 mb-2">🎉 Wins Celebrated</h4>
                  <ul className="space-y-1">
                    {summary.wins_shared.map((win, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {win}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.support_needs?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-800 mb-2">💬 Support Needs</h4>
                  <ul className="space-y-1">
                    {summary.support_needs.map((need, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {need}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.neuroplasticity_moments && (
                <div className="p-3 bg-white/60 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">🧠 Brain Science Moment</h4>
                  <p className="text-sm text-gray-700">{summary.neuroplasticity_moments}</p>
                </div>
              )}

              {summary.resources_needed?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-teal-800 mb-2">📚 Resources Needed</h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.resources_needed.map((resource, idx) => (
                      <Badge key={idx} variant="outline">{resource}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GraceCard>
        </motion.div>
      )}
    </div>
  );
}