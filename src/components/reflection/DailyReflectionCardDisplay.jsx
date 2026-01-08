import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

const EMOTION_TAGS = [
  { value: 'grateful', label: '🙏 Grateful', color: 'bg-green-100 text-green-700' },
  { value: 'hopeful', label: '🌅 Hopeful', color: 'bg-blue-100 text-blue-700' },
  { value: 'struggling', label: '💪 Struggling', color: 'bg-orange-100 text-orange-700' },
  { value: 'peaceful', label: '☮️ Peaceful', color: 'bg-teal-100 text-teal-700' },
  { value: 'anxious', label: '😰 Anxious', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'proud', label: '⭐ Proud', color: 'bg-purple-100 text-purple-700' },
  { value: 'motivated', label: '🔥 Motivated', color: 'bg-red-100 text-red-700' },
  { value: 'tired', label: '😴 Tired', color: 'bg-gray-100 text-gray-700' },
  { value: 'connected', label: '🤝 Connected', color: 'bg-pink-100 text-pink-700' },
  { value: 'lonely', label: '🫂 Lonely', color: 'bg-indigo-100 text-indigo-700' }
];

export default function DailyReflectionCardDisplay({ card, user, existingResponse }) {
  const [responseText, setResponseText] = useState(existingResponse?.response_text || '');
  const [emotionTags, setEmotionTags] = useState(existingResponse?.emotion_tags || []);
  const [completionStatus, setCompletionStatus] = useState(existingResponse?.completion_status || 'viewed');
  const queryClient = useQueryClient();

  const saveResponse = useMutation({
    mutationFn: async (data) => {
      if (existingResponse) {
        return base44.entities.DailyReflectionResponse.update(existingResponse.id, data);
      } else {
        return base44.entities.DailyReflectionResponse.create({
          ...data,
          user_email: user.email,
          card_id: card.id,
          slogan_number: card.slogan_number,
          reflection_date: new Date().toISOString().split('T')[0]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dailyReflectionResponse']);
      toast.success('Reflection saved 💚');
    }
  });

  const toggleEmotion = (emotion) => {
    if (emotionTags.includes(emotion)) {
      setEmotionTags(emotionTags.filter(e => e !== emotion));
    } else {
      setEmotionTags([...emotionTags, emotion]);
    }
  };

  const handleSave = () => {
    saveResponse.mutate({
      response_text: responseText,
      emotion_tags: emotionTags,
      completion_status: responseText.trim() ? 'reflected' : 'viewed'
    });
  };

  const markActed = () => {
    setCompletionStatus('acted');
    saveResponse.mutate({
      response_text: responseText,
      emotion_tags: emotionTags,
      completion_status: 'acted'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <GraceCard gradient className="mb-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white mb-4 shadow-lg">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="text-sm text-teal-600 font-semibold mb-2">
            Reflection #{card.slogan_number}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {card.card_title}
          </h2>
        </div>

        <div className="space-y-6">
          {/* Core Reflection */}
          <div className="p-5 bg-white rounded-xl border-2 border-teal-200">
            <div className="flex items-start gap-3">
              <Heart className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Core Reflection</h3>
                <p className="text-lg text-gray-800 leading-relaxed">{card.core_reflection}</p>
              </div>
            </div>
          </div>

          {/* Pause + Notice */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-teal-100">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">
              ⏸️ Pause + Notice
            </h3>
            <p className="text-gray-800 italic">{card.pause_notice_prompt}</p>
          </div>

          {/* Gentle Inquiry */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">
              💭 Gentle Inquiry
            </h3>
            <p className="text-gray-800">{card.gentle_inquiry}</p>
          </div>

          {/* Small Action */}
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">
              ✨ Small Action (Today Only)
            </h3>
            <p className="text-gray-800">{card.small_action}</p>
            {completionStatus === 'acted' ? (
              <div className="mt-3 flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Action Completed!</span>
              </div>
            ) : (
              <Button
                onClick={markActed}
                size="sm"
                variant="outline"
                className="mt-3 border-green-600 text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I Did This Today
              </Button>
            )}
          </div>
        </div>
      </GraceCard>

      {/* Response Section */}
      <GraceCard>
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-teal-600" />
          <h3 className="text-xl font-bold text-gray-900">Your Reflection</h3>
        </div>

        <p className="text-gray-700 mb-4 font-medium">{card.base44_prompt}</p>

        <Textarea
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder="Write your thoughts, insights, or experiences here..."
          rows={6}
          className="mb-4"
        />

        {/* Emotion Tags */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">How are you feeling today?</p>
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS.map(emotion => (
              <button
                key={emotion.value}
                onClick={() => toggleEmotion(emotion.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  emotionTags.includes(emotion.value)
                    ? emotion.color + ' ring-2 ring-offset-2 ring-teal-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {emotion.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saveResponse.isPending}
          className="w-full bg-teal-600 hover:bg-teal-700"
        >
          {saveResponse.isPending ? 'Saving...' : 'Save Reflection'}
        </Button>
      </GraceCard>
    </motion.div>
  );
}