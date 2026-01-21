import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, Phone, Loader2, Heart, 
  MapPin, Calendar, Users, Brain, RefreshCw, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GraceCard from '@/components/common/GraceCard';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedGraceCapabilities from '@/components/chat/EnhancedGraceCapabilities';

const quickPrompts = [
  { icon: Heart, text: "I need encouragement today", color: "bg-rose-100 text-rose-700" },
  { icon: MapPin, text: "Find resources near me", color: "bg-emerald-100 text-emerald-700" },
  { icon: Brain, text: "Tell me about neuroplasticity", color: "bg-purple-100 text-purple-700" },
  { icon: Users, text: "How can I connect with peers?", color: "bg-blue-100 text-blue-700" },
  { icon: Calendar, text: "What events are coming up?", color: "bg-amber-100 text-amber-700" }
];

export default function GraceChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initConversation = async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: 'grace_companion',
          metadata: { name: 'Grace Chat Session' }
        });
        setConversation(conv);
        setMessages(conv.messages || []);
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      }
    };
    initConversation();
  }, []);

  useEffect(() => {
    if (!conversation) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages);
    });
    return () => unsubscribe();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText) => {
    const userMessage = messageText || input.trim();
    if (!userMessage || isLoading || !conversation) return;

    setInput('');
    setIsLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (error) {
      console.error('Failed to send message:', error);
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
          <p className="text-gray-600 mt-2">
            Your 24/7 AI Recovery Companion • Enhanced with therapeutic frameworks & 10,000+ knowledge entries
          </p>
        </div>

        <Tabs defaultValue="chat" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Grace
            </TabsTrigger>
            <TabsTrigger value="capabilities">
              <Brain className="w-4 h-4 mr-2" />
              Grace's Capabilities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="capabilities" className="mt-6">
            <EnhancedGraceCapabilities />
          </TabsContent>

          <TabsContent value="chat" className="mt-0">

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
                  {msg.role === 'user' ? (
                    <p className="text-white">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm max-w-none prose-p:text-gray-700 prose-strong:text-gray-900">
                      {msg.content}
                    </ReactMarkdown>
                  )}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}