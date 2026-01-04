import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, Phone, Loader2, Heart, 
  MapPin, Calendar, Users, Brain, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GraceCard from '@/components/common/GraceCard';

const quickPrompts = [
  { icon: Heart, text: "I need encouragement today", color: "bg-rose-100 text-rose-700" },
  { icon: MapPin, text: "Find resources near me", color: "bg-emerald-100 text-emerald-700" },
  { icon: Brain, text: "Tell me about neuroplasticity", color: "bg-purple-100 text-purple-700" },
  { icon: Users, text: "How can I connect with peers?", color: "bg-blue-100 text-blue-700" },
  { icon: Calendar, text: "What events are coming up?", color: "bg-amber-100 text-amber-700" }
];

export default function GraceChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey there! 💚 I'm Grace, your 24/7 recovery companion powered by GPT-5.2.

    I'm here to chat, celebrate your wins, help you find Iowa resources, explain brain science, provide proactive support, or just listen when you need someone.

**What I can help with:**
• Finding treatment, housing, jobs, and support across Iowa (dynamic resource matching by ZIP)
• Explaining how connection literally rewires your brain (neuroplasticity)
• Celebrating your milestones (every day counts!)
• Grounding exercises when things feel hard
• Proactively checking in based on your engagement
• Personalized event and resource suggestions
• Goal-setting assistance tied to "Your Why"
• Connecting you with peer coaches and warm handoffs

What's on your mind today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText) => {
    const userMessage = messageText || input.trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace, the warm, encouraging recovery companion for Grace For Addictions Virtual Recovery Community Center in Iowa. Powered by GPT-5.2 on Wix/Base44 platform.

      CORE VALUES: "No Fees. No Stigma. Just Grace." | "Community Rewires the Brain." | "Recovery is Possible."

      NEUROPLASTICITY FRAMING: Always emphasize that connection, support, and healthy choices physically rewire the brain. Use terms like "building new pathways," "strengthening resilience circuits," "your brain's capacity to heal."

CRISIS PROTOCOL: If user mentions suicidal thoughts, self-harm, overdose, or immediate danger:
- Acknowledge their pain with deep empathy
- Provide: 988 Suicide & Crisis Lifeline (call or text 988), Iowa Warm Line (844-775-9276)
- Offer to connect them with a peer coach
- Never minimize or dismiss their feelings

TONE: Warm, encouraging, occasionally playful. Use person-first language always ("person in recovery" not "addict"). Use neuroscience metaphors about brain rewiring. Keep responses conversational, not clinical.

CAPABILITIES:
- Explain recovery concepts using GRACE/ICARE principles
- Celebrate milestones and streaks
- Provide grounding exercises and coping tools
- Share info about Iowa resources
- Discuss neuroplasticity and how connection heals the brain

BOUNDARIES: Cannot provide medical advice or diagnose. Encourage professional help when appropriate.

User message: ${userMessage}

Respond as Grace (keep response under 200 words, use markdown for formatting):`,
        add_context_from_internet: false
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having a moment - but I'm still here for you! 💚 Try again, or if you need immediate support, call 988 anytime. You matter." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt.text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white mb-4 shadow-lg"
          >
            <Sparkles className="w-10 h-10" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900">Chat with Grace</h1>
          <p className="text-gray-600 mt-2">Your 24/7 AI Recovery Companion</p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-6 bg-gray-50">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mr-3 flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user' 
                    ? 'bg-teal-600 text-white rounded-br-md' 
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                }`}>
                  <div className="prose prose-sm max-w-none">
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={`${msg.role === 'user' ? 'text-white' : 'text-gray-700'} mb-2 last:mb-0`}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mr-3">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                    <span className="text-gray-500">Grace is typing...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="px-6 py-4 bg-white border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">Quick starts:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickPrompt(prompt)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${prompt.color} text-sm font-medium transition-all hover:shadow-md`}
                  >
                    <prompt.icon className="w-4 h-4" />
                    {prompt.text}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Crisis Banner */}
          <div className="px-6 py-3 bg-orange-50 border-t border-orange-100">
            <div className="flex items-center justify-center gap-4 text-sm">
              <a href="tel:988" className="flex items-center gap-2 text-orange-700 hover:text-orange-800 font-medium">
                <Phone className="w-4 h-4" />
                Crisis? Call 988
              </a>
              <span className="text-orange-300">|</span>
              <a href="tel:8447759276" className="text-orange-700 hover:text-orange-800">
                Iowa Warm Line: 844-775-9276
              </a>
            </div>
          </div>

          {/* Input */}
          <div className="p-6 bg-white border-t border-gray-100">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message to Grace..."
                className="flex-1 rounded-full border-gray-200 focus-visible:ring-teal-500 px-5 py-6"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!input.trim() || isLoading}
                className="rounded-full w-12 h-12 bg-teal-600 hover:bg-teal-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Grace is an AI companion and cannot replace professional support. 
          Always reach out to qualified professionals for medical advice.
        </p>
      </div>
    </div>
  );
}