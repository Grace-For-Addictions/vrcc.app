import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIEventRecommendations({ user, profile, allEvents }) {
  const [recommendations, setRecommendations] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (user && profile && allEvents.length > 0) {
      analyzeAndRecommend();
    }
  }, [user, profile, allEvents]);

  const analyzeAndRecommend = async () => {
    setIsAnalyzing(true);
    try {
      const recentAssessments = await base44.entities.Assessment.filter(
        { created_by: user.email },
        '-created_date',
        1
      );

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace (GPT-5.2 on Wix/Base44) recommending events for a recovery community member.

USER PROFILE:
- Recovery Stage: ${profile.stage}
- Their Why: ${profile.my_why || 'Not set'}
- Recovery Capital Score: ${recentAssessments[0]?.overall_score || 'Not assessed'}
- Current Goal: ${profile.current_goal || 'Not set'}
- Pathways: ${profile.pathways?.join(', ') || 'None'}

AVAILABLE EVENTS:
${allEvents.slice(0, 10).map(e => `- ${e.title} (${e.event_type}) on ${new Date(e.start_time).toLocaleDateString()}`).join('\n')}

Select 2-3 most relevant events and explain:
1. Why this event fits their stage/goals
2. How it builds new brain pathways (neuroplasticity)
3. Connection to their "why"

Return as JSON:`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event_title: { type: "string" },
                  relevance_reason: { type: "string" },
                  neuroplasticity_benefit: { type: "string" },
                  why_connection: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(response.recommended_events || []);
    } catch (error) {
      console.error('Event recommendation failed', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6" />
          <div>
            <h3 className="text-xl font-bold">Events Picked Just for You</h3>
            <Badge className="mt-1 bg-white/20 text-white border-white/30">
              AI-Powered • Based on Your Journey
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec, idx) => {
            const matchingEvent = allEvents.find(e => e.title === rec.event_title);
            
            return (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-200 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">{rec.event_title}</h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-200 font-medium">Why for you:</span>
                        <p className="text-purple-100">{rec.relevance_reason}</p>
                      </div>

                      <div className="flex items-start gap-2">
                        <Brain className="w-4 h-4 text-purple-200 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-purple-200 italic">{rec.neuroplasticity_benefit}</p>
                      </div>

                      {rec.why_connection && (
                        <div className="p-2 bg-white/10 rounded-lg">
                          <p className="text-xs text-purple-100">
                            💚 <strong>Connected to your why:</strong> {rec.why_connection}
                          </p>
                        </div>
                      )}
                    </div>

                    {matchingEvent && (
                      <div className="mt-3">
                        <Link to={createPageUrl('Events')}>
                          <Button size="sm" variant="secondary" className="w-full">
                            View Event Details
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}