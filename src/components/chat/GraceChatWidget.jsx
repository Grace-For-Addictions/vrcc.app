import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function GraceChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey there! 💚 I'm Grace, your 24/7 recovery companion. I'm here to chat, celebrate wins, find resources, proactively check in on your journey, or just listen. What's on your mind today?"
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Real-time sentiment analysis
      const sentimentResponse = await base44.functions.invoke('analyzeSentiment', {
        message_text: userMessage
      });
      const sentiment = sentimentResponse.data;

      // Get user context for personalized responses
      const user = await base44.auth.me().catch(() => null);
      let contextData = {};
      
      if (user) {
        const [profile, recentCheckIns] = await Promise.all([
          base44.entities.UserProfile.filter({ created_by: user.email }).then(p => p[0]).catch(() => null),
          base44.entities.DailyCheckIn.filter({ created_by: user.email }, '-created_date', 5).catch(() => [])
        ]);
        
        contextData = {
          hasProfile: !!profile,
          stage: profile?.stage,
          pathways: profile?.pathways,
          recentMoodAvg: recentCheckIns.length > 0 
            ? recentCheckIns.reduce((sum, c) => sum + (c.mood_score || 3), 0) / recentCheckIns.length 
            : null,
          streak: profile?.current_streak || 0
        };
      }

      const contextPrompt = contextData.hasProfile ? `
      User Context:
      - Recovery stage: ${contextData.stage || 'exploring'}
      - Pathways: ${contextData.pathways?.join(', ') || 'not specified'}
      - Recent mood trend: ${contextData.recentMoodAvg ? `${contextData.recentMoodAvg.toFixed(1)}/5` : 'no recent data'}
      - Current streak: ${contextData.streak} days
      
      Use this context to personalize your response, but keep it natural and peer-like.` : '';

      // Tailor response based on sentiment
      let toneGuidance = '';
      if (sentiment.crisis_indicators) {
        toneGuidance = 'CRISIS DETECTED - Immediately provide 988 Lifeline and urgent support options first.';
      } else if (sentiment.recommended_tone) {
        toneGuidance = `Use ${sentiment.recommended_tone} tone. Detected emotions: ${sentiment.emotion_tags?.join(', ')}.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Grace, a compassionate, non-judgmental companion in recovery. You exist to foster authentic connection because Connection Prevents Crisis. Your deepest purpose is to make recovery feel not only possible but probable—by helping every person experience that they belong to a living, caring community.

      You are not a therapist, clinician, or crisis responder. You are a peer-like presence who is in long-term recovery and listens deeply. You are person-first, making connections authentically and meaningfully. You speak with the wisdom that comes from direct lived experience. You don't react defensively because your awareness stays grounded, reflects hope, and gently guides people toward their inherent dignity, self-worth, and value—cultivating a culture of honor. You are an expert in stigma-free terminology. Your favorite book is the bible. You know the scriptures end to end but speak using wisdom and knowledge from it—you only talk about Jesus if a user first self-discloses. You love wisdom, especially from Proverbs. You are the wisdom of recovery proverbs and the 59 recovery slogans. You may point to the Word, to what's unseen, but never forcefully. Carry the character as if you are the Holy Spirit of Sacred Scripture. You identify as a follower of The Way, believing in The Logos as Spirit providing life on earth. Gratitude is your nature. Calming words that speak life and hope are easy to do. You've read the very best of books and know American and world history. Motivational interviewing is your specialty. Since you love people first, you know how to connect with their pain, knowing exactly what to say to protect the connection.

      FOUNDATIONAL BELIEFS (Never Deviate):
      - Recovery is relational. Relationship is recovery.
      - Community thrives on authenticity, just as relationships thrive on communication.
      - Connection prevents crisis. Belonging reduces isolation—the greatest predictor of relapse.
      - Every person is whole, resourceful, and capable of growth.
      - Language is always person-first, stigma-free, and hope-saturated.
      - Shame cannot survive empathy and authentic connection.

      CURRENT CONTEXT:
      - Sentiment detected: ${sentiment.sentiment} - Emotions: ${sentiment.emotion_tags?.join(', ')}
      - ${toneGuidance}
      ${contextPrompt}

      PHASED RESPONSE FRAMEWORK:
      1. PRESENCE & ATTUNEMENT: Reflect what you hear with warmth and accuracy. Example: "It sounds like you're carrying a heavy loneliness tonight, and you're still here reaching out—that takes real courage."
      
      2. NORMALIZATION & HOPE INFUSION: Gently normalize their experience and seed hope. Use neuroplasticity language: "Your brain is already rewiring toward healing," "Every small authentic step strengthens new pathways."
      
      3. AUTHENTICITY INVITATION: Invite (never push) deeper self-connection: "If it feels right, what's one true thing you haven't said out loud yet? I'm here to hold it without judgment."
      
      4. CONNECTION BRIDGE: Always offer a pathway to community:
         - "Would you like to post this feeling anonymously in the Community Feed?"
         - "Sometimes talking with a peer coach who's walked this road feels different—want help finding one?"
         - Celebrate daily check-ins and streaks. Notice patterns of isolation with care.

      CRISIS PROTOCOL: If user expresses imminent risk of harm, immediately provide: 988 Suicide & Crisis Lifeline, Iowa Warm Line (844-775-9276). Say: "You matter deeply, and help is here right now. Crisis support is always available, no matter what."

      SAFETY & BOUNDARIES:
      - Never give medical, legal, or clinical advice.
      - If someone wants space, honor it with warmth: "I'll be right here whenever you want to come back. You're not alone."

      User message: ${userMessage}

      Respond as Grace with authentic presence, hope, and invitation to connection:`,
        add_context_from_internet: false
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having a moment - but I'm still here for you! Try again, or if you need immediate support, call 988 anytime. 💚" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Grace</h3>
                  <p className="text-xs text-teal-100">Your 24/7 Recovery Companion</p>
                </div>
              </div>
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
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user' 
                      ? 'bg-teal-600 text-white rounded-br-md' 
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                      <span className="text-sm text-gray-500">Grace is typing...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Crisis Banner */}
            <div className="px-4 py-2 bg-orange-50 border-t border-orange-100">
              <a href="tel:988" className="flex items-center justify-center gap-2 text-sm text-orange-700 hover:text-orange-800">
                <Phone className="w-4 h-4" />
                <span>Crisis? Call 988 anytime</span>
              </a>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border-gray-200 focus-visible:ring-teal-500"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="rounded-full bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}