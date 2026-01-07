import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, Heart, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { format } from 'date-fns';

export default function GrowthJournal({ sessions, user }) {
  const practiceTypeLabels = {
    self_compassion: 'Self-Compassion',
    loving_kindness: 'Loving-Kindness',
    grounding: 'Grounding',
    reflection: 'Reflection',
    gratitude: 'Gratitude',
    breath_work: 'Breath Work'
  };

  const emotionEmojis = {
    struggling: '😔',
    neutral: '😐',
    hopeful: '🙂',
    peaceful: '😌',
    joyful: '😊'
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">Growth Journal</h3>
        </div>
        <p className="text-gray-700">
          Your practice history and neuroplastic insights—evidence of your rewiring journey
        </p>
      </GraceCard>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <GraceCard className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4 opacity-50" />
            <p className="text-gray-600">Your journey begins with your first practice</p>
          </GraceCard>
        ) : (
          sessions.map((session, idx) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GraceCard hover>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {practiceTypeLabels[session.practice_type]}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {format(new Date(session.created_date), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {session.duration_minutes} min
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Before:</span>
                    <span>{emotionEmojis[session.emotional_state_before]} {session.emotional_state_before}</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">After:</span>
                    <span>{emotionEmojis[session.emotional_state_after]} {session.emotional_state_after}</span>
                  </div>
                </div>

                {session.practice_notes && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 italic">"{session.practice_notes}"</p>
                  </div>
                )}

                {session.neuroplastic_insight && (
                  <div className="p-3 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg border border-teal-200">
                    <div className="flex items-start gap-2">
                      <Brain className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-teal-700 mb-1">Neuroplastic Insight</p>
                        <p className="text-sm text-gray-700">{session.neuroplastic_insight}</p>
                      </div>
                    </div>
                  </div>
                )}
              </GraceCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}