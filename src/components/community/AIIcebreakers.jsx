import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const neuroplasticityPrompts = [
  "🧠 What's one new connection you've made recently that made you feel more hopeful?",
  "💪 Share a moment when you chose resilience over old patterns. Your brain literally rewired in that moment!",
  "🌱 What healthy habit are you building that's strengthening new neural pathways?",
  "✨ Describe a time when community support helped you see things differently.",
  "🔄 What's one way you're actively rewiring your brain for recovery today?",
  "💚 Share your 'why' - what motivates your recovery journey?",
  "🎯 What small win today is building your recovery capital?",
  "🤝 How has connection with others changed your perspective on recovery?"
];

export default function AIIcebreakers({ roomTheme }) {
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generatePrompt();
  }, [roomTheme]);

  const generatePrompt = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AI Grace powered by GPT-5.2 on Wix/Base44. Generate ONE warm, engaging discussion prompt for a ${roomTheme} recovery chat room.

REQUIREMENTS:
- Incorporate neuroplasticity concepts (brain rewiring, new pathways, resilience circuits)
- Trauma-informed and non-judgmental
- Encourage sharing without pressure
- Person-first language
- Connection-focused
- Under 25 words

Return only the prompt text, no quotes or formatting.`,
        add_context_from_internet: false
      });

      setCurrentPrompt(response);
    } catch (error) {
      // Fallback to static prompts
      const randomPrompt = neuroplasticityPrompts[Math.floor(Math.random() * neuroplasticityPrompts.length)];
      setCurrentPrompt(randomPrompt);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-purple-900 mb-1">AI Icebreaker</p>
          {isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating new prompt...
            </div>
          ) : (
            <p className="text-sm text-purple-800">{currentPrompt}</p>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={generatePrompt}
          disabled={isGenerating}
          className="flex-shrink-0 hover:bg-purple-100"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </motion.div>
  );
}