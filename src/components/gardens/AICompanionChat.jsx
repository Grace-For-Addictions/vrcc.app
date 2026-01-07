import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Send, Loader2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import GraceCard from '@/components/common/GraceCard';

export default function AICompanionChat({ user, garden, sessions }) {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [dailyMessage, setDailyMessage] = useState(null);

  useEffect(() => {
    const generateProactiveMessage = async () => {
      const recentMoods = sessions.slice(0, 5).map(s => s.emotional_state_after).filter(Boolean);
      const lastPractice = sessions[0];
      
      const message = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a personalized daily message for a Grace Garden user. Consider:
- Streak: ${garden.current_streak_days} days
- Plants: ${garden.plants_grown?.length || 0}
- Recent practices: ${sessions.length}
- Recent moods: ${recentMoods.join(', ') || 'Not yet tracked'}
- Last practice notes: ${lastPractice?.practice_notes || 'None'}

Provide:
1. A warm greeting with personalized affirmation
2. Practice suggestion based on their patterns
3. Focus for today

Keep it 2-3 sentences, warm, and actionable.`,
        response_json_schema: {
          type: "object",
          properties: {
            greeting: { type: "string" },
            practice_suggestion: { type: "string" },
            focus: { type: "string" }
          }
        }
      });

      setDailyMessage(message);
      setConversation([{
        role: 'companion',
        content: `${message.greeting}\n\n💡 ${message.practice_suggestion}\n\n🎯 Today's Focus: ${message.focus}`
      }]);
    };

    if (sessions.length > 0) {
      generateProactiveMessage();
    } else {
      setConversation([{
        role: 'companion',
        content: `Hello! 🌱 I'm your Grace Garden companion. I've noticed you've completed ${sessions.length} practices and grown ${garden.plants_grown?.length || 0} plants. How can I support your journey today?`
      }]);
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: async (userMessage) => {
      setLoading(true);
      setConversation(prev => [...prev, { role: 'user', content: userMessage }]);

      // Analyze pattern and generate response
      const recentMoods = sessions.slice(0, 5).map(s => s.emotional_state_after).filter(Boolean);
      const avgPracticeFrequency = sessions.length > 1
        ? Math.round(sessions.length / Math.max(1, (new Date() - new Date(garden.created_date)) / (1000 * 60 * 60 * 24)))
        : 0;

      // Check for recovery challenges in notes
      const recentNotes = sessions.slice(0, 5).map(s => s.practice_notes).filter(Boolean);
      const challengeContext = recentNotes.length > 0 
        ? `Recent practice notes suggest: ${recentNotes.join('; ')}` 
        : '';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a compassionate AI companion for Grace Community Gardens, supporting recovery through neuroplasticity-informed guidance. 

User context:
- Garden streak: ${garden.current_streak_days} days
- Recent emotional states: ${recentMoods.join(', ') || 'Not yet recorded'}
- Practice frequency: ${avgPracticeFrequency} times per week
- Total practices: ${sessions.length}
${challengeContext ? `- Challenge indicators: ${challengeContext}` : ''}

User message: "${userMessage}"

Analyze for common recovery challenges (isolation, cravings, anxiety, motivation) and provide:
1. Empathetic acknowledgment
2. Brief actionable advice specific to the challenge
3. Practice or resource suggestion
4. If concerning patterns emerge (harm, crisis, substance triggers), escalate by suggesting peer support or 988

Keep responses 3-4 sentences, person-first, trauma-aware, and actionable.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            pattern_detected: { type: "string" },
            escalation_needed: { type: "boolean" }
          }
        }
      });

      // Log interaction
      await base44.entities.AICompanionInteraction.create({
        user_email: user.email,
        interaction_type: response.escalation_needed ? 'escalation_flag' : 'gentle_nudge',
        pattern_detected: response.pattern_detected,
        companion_message: response.response,
        user_response: userMessage,
        escalation_level: response.escalation_needed ? 'peer_alert' : 'none'
      });

      return response.response;
    },
    onSuccess: (response) => {
      setConversation(prev => [...prev, { role: 'companion', content: response }]);
      setLoading(false);
      setMessage('');
    }
  });

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Your AI Garden Guide</h3>
            <p className="text-sm text-gray-600">Supportive, non-clinical companion</p>
          </div>
        </div>
        <p className="text-sm text-gray-700">
          I notice patterns in your practice, offer gentle reframing, and escalate to peers or staff when needed. 
          You're always in control.
        </p>
      </GraceCard>

      <GraceCard>
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {conversation.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex gap-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share what's on your mind..."
            rows={2}
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage.mutate(message)}
            disabled={!message.trim() || loading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </GraceCard>
    </div>
  );
}