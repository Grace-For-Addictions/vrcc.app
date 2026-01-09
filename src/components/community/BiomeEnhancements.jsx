import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Sparkles, MessageCircle, TrendingUp, Lightbulb, 
  Brain, Users, Target, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function BiomeEnhancements({ biomeId, user }) {
  const [discussionSummary, setDiscussionSummary] = useState(null);
  const [communityNeeds, setCommunityNeeds] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch recent messages from this biome
  const { data: recentMessages } = useQuery({
    queryKey: ['biomeMessages', biomeId],
    queryFn: () => base44.entities.Message.filter({ 
      topic: biomeId,
      message_type: 'forum_post'
    }, '-created_date', 50),
    enabled: !!biomeId,
    initialData: []
  });

  const generateDiscussionSummary = async () => {
    if (recentMessages.length === 0) {
      toast.error('No recent discussions to summarize');
      return;
    }

    setIsAnalyzing(true);
    try {
      const summary = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these community forum messages and provide a comprehensive discussion summary.

RECENT MESSAGES:
${recentMessages.slice(0, 30).map(m => 
  `[${m.sender_name}]: ${m.content}`
).join('\n')}

Provide:
1. Key themes and topics being discussed
2. Common questions or concerns raised
3. Positive moments and wins shared
4. Emerging patterns or trends
5. Suggested conversation starters to keep engagement high

Use warm, community-focused language.`,
        response_json_schema: {
          type: "object",
          properties: {
            key_themes: { type: "array", items: { type: "string" } },
            common_questions: { type: "array", items: { type: "string" } },
            wins_celebrated: { type: "array", items: { type: "string" } },
            emerging_trends: { type: "array", items: { type: "string" } },
            conversation_starters: { type: "array", items: { type: "string" } },
            summary_text: { type: "string" }
          }
        }
      });

      setDiscussionSummary(summary);
      toast.success('Discussion summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const identifyCommunityNeeds = async () => {
    if (recentMessages.length === 0) {
      toast.error('Need more discussion data');
      return;
    }

    setIsAnalyzing(true);
    try {
      const needs = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these community discussions to identify unmet needs and opportunities for new resources.

DISCUSSION CONTENT:
${recentMessages.slice(0, 40).map(m => 
  `[${m.sender_name}]: ${m.content}`
).join('\n')}

Identify:
1. Resource gaps - what resources are people asking for?
2. Service needs - what types of support would help?
3. Educational topics - what do people want to learn about?
4. Feature requests - what would improve their experience?
5. Actionable recommendations for program development

Be specific and evidence-based.`,
        response_json_schema: {
          type: "object",
          properties: {
            resource_gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  need: { type: "string" },
                  frequency: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            service_needs: { type: "array", items: { type: "string" } },
            educational_topics: { type: "array", items: { type: "string" } },
            feature_requests: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setCommunityNeeds(needs);
      toast.success('Community needs analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze needs');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Actions */}
      <GraceCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Community Insights
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateDiscussionSummary}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
              Summarize Discussions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={identifyCommunityNeeds}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Identify Needs
            </Button>
          </div>
        </div>
      </GraceCard>

      {/* Discussion Summary */}
      {discussionSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GraceCard className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Discussion Summary
            </h4>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-blue-800 mb-2">Overview</p>
                <p className="text-gray-700">{discussionSummary.summary_text}</p>
              </div>

              {discussionSummary.key_themes?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-2">🎯 Key Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {discussionSummary.key_themes.map((theme, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-800">{theme}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {discussionSummary.wins_celebrated?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-800 mb-2">🎉 Wins Celebrated</p>
                  <ul className="space-y-1">
                    {discussionSummary.wins_celebrated.map((win, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {win}</li>
                    ))}
                  </ul>
                </div>
              )}

              {discussionSummary.conversation_starters?.length > 0 && (
                <div className="p-3 bg-white/60 rounded-lg">
                  <p className="text-sm font-medium text-purple-800 mb-2">💡 Suggested Conversation Starters</p>
                  <div className="space-y-1">
                    {discussionSummary.conversation_starters.map((starter, idx) => (
                      <p key={idx} className="text-sm text-gray-700 italic">"{ starter}"</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GraceCard>
        </motion.div>
      )}

      {/* Community Needs */}
      {communityNeeds && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GraceCard className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <h4 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Community Needs Analysis
            </h4>

            <div className="space-y-4">
              {communityNeeds.resource_gaps?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-800 mb-2">📊 Resource Gaps</p>
                  <div className="space-y-2">
                    {communityNeeds.resource_gaps.map((gap, idx) => (
                      <div key={idx} className="p-2 bg-white/60 rounded">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{gap.need}</p>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">{gap.frequency}</Badge>
                            <Badge className={`text-xs ${
                              gap.priority === 'High' ? 'bg-red-100 text-red-800' :
                              gap.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {gap.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {communityNeeds.educational_topics?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-800 mb-2">📚 Requested Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {communityNeeds.educational_topics.map((topic, idx) => (
                      <Badge key={idx} variant="outline">{topic}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {communityNeeds.recommendations?.length > 0 && (
                <div className="p-3 bg-white/60 rounded-lg">
                  <p className="text-sm font-medium text-orange-900 mb-2">🎯 Actionable Recommendations</p>
                  <ul className="space-y-1">
                    {communityNeeds.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{idx + 1}. {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </GraceCard>
        </motion.div>
      )}
    </div>
  );
}