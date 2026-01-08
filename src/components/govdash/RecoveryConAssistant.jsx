import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

export default function RecoveryConAssistant({ user, profile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `👋 Hi${user?.full_name ? ' ' + user.full_name.split(' ')[0] : ''}! I'm the RecoveryCon AI Assistant, here 24/7 to help you with:\n\n• **Navigate GFA Services** - Find resources, programs, and features\n• **Answer Questions** - About our mission, peer support model, and recovery capital\n• **Track Your Progress** - Get insights on your recovery journey\n• **Resource Recommendations** - Find housing, employment, treatment options\n• **Grant & Reporting Help** - Guidance on outcomes tracking and reporting\n\nWhat can I help you with today?`
      }]);
    }
  }, [isOpen, messages.length, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Build context about user and GFA
      const contextPrompt = `You are the RecoveryCon AI Assistant for Grace For Addictions (GFA), a peer-led recovery community organization.

GFA MISSION: Provide free, non-clinical peer recovery support services (PRSS) for substance use disorder, mental health challenges, and justice involvement. "No fees. No stigma. Just grace."

KEY SERVICES:
- Virtual Recovery Community Center (24/7 chat rooms, events, peer matching)
- Mobile Recovery Community Center (rural outreach, resource navigation)
- Recovery Housing (sober living, live-outs)
- JUST GRACE Initiative (justice-involved, reentry support)
- Peer Coach Training & Certification
- Community Gardens (neuroplasticity-informed mindfulness)
- Resource Navigation (99 Iowa counties)
- Crisis Support & Warm Line
- BARC-10 Recovery Capital Assessment
- Narcan distribution & overdose prevention
- Workforce development & employment support

APP FEATURES:
- Home Dashboard (check-ins, challenges, AI journey)
- Community Spaces (chat rooms, forums, peer matching)
- Resource Hub (treatment, housing, employment, legal, family support)
- Walls of Grace (milestones, kudos, memorial)
- Events & Meetings (virtual recovery meetings, workshops)
- Brain Science (neuroplasticity education)
- Assessment (BARC-10 tracking)
- RecoveryCon Portal (grant writing, outcome tracking, reporting)

PRINCIPLES:
- Peer-led, trauma-informed, person-first language
- Recovery capital model (SAMHSA, CCAR principles)
- Stigma-free, grace-based approach
- HIPAA-aligned privacy
- Evidence-based practices

${user ? `CURRENT USER: ${user.full_name} (${user.email})` : ''}
${profile ? `Recovery Stage: ${profile.stage}, Points: ${profile.points}, Pathways: ${profile.pathways?.join(', ')}` : ''}

USER QUESTION: ${input}

Provide a helpful, compassionate response. If the question requires human support (crisis, complex case, technical error), suggest escalating to the GFA team. Include specific app navigation if relevant (e.g., "Go to Resources > Housing"). Keep responses concise but warm.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt,
        add_context_from_internet: false
      });

      const assistantMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);

      // Check for escalation keywords
      if (response.toLowerCase().includes('escalate') || response.toLowerCase().includes('human support')) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'system',
            content: '🔔 **Escalation Notice**: This conversation has been flagged for human review. A GFA team member will follow up within 24 hours. For urgent crisis support, call 988 immediately.'
          }]);
        }, 1000);
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I apologize, I encountered an error. Please try again or contact support@graceforaddictions.org for assistance.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 relative"
            >
              <MessageCircle className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full animate-pulse" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">RecoveryCon Assistant</h3>
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                    Online 24/7
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white' 
                      : msg.role === 'system'
                      ? 'bg-orange-50 border border-orange-200 text-orange-900'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    <ReactMarkdown className="text-sm prose prose-sm max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="p-2 bg-white border-t border-gray-200">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => setInput('How do I track my recovery progress?')}
                >
                  Track Progress
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => setInput('Find housing resources near me')}
                >
                  Housing Help
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => setInput('What is the BARC-10 assessment?')}
                >
                  BARC-10
                </Button>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!input.trim() || isTyping} className="bg-purple-600 hover:bg-purple-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}