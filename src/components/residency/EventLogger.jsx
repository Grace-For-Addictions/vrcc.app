import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, CheckCircle, Users, Home, Heart, FileText,
  Upload, Loader2, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function EventLogger({ residentProfile, house }) {
  const [eventType, setEventType] = useState('chore');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [moodScore, setMoodScore] = useState(5);
  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ['residentEvents', residentProfile.user_email],
    queryFn: () => base44.entities.ResidencyEventLog.filter({ 
      resident_email: residentProfile.user_email 
    }, '-event_date', 50),
    initialData: []
  });

  const createEvent = useMutation({
    mutationFn: async (eventData) => {
      const timestamp = Date.now().toString(36);
      return base44.entities.ResidencyEventLog.create({
        ...eventData,
        blockchain_timestamp: `0x${timestamp}`, // Simple hash for demo
        synced_to_vrcc: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['residentEvents']);
      setTitle('');
      setDescription('');
      setMoodScore(5);
    }
  });

  const handleSubmit = () => {
    if (!title.trim()) return;

    const baseData = {
      resident_email: residentProfile.user_email,
      house_id: residentProfile.house_id,
      event_type: eventType,
      title: title,
      description: description,
      event_date: new Date().toISOString()
    };

    if (eventType === 'chore') {
      baseData.chore_data = { chore_name: title, completed: true };
    } else if (eventType === 'meeting') {
      baseData.meeting_data = { meeting_type: 'NA/AA', location: 'Virtual' };
    } else if (eventType === 'mood_log') {
      baseData.mood_data = { 
        mood_score: moodScore, 
        mood_emoji: moodScore >= 8 ? '😊' : moodScore >= 5 ? '🙂' : '😔',
        notes: description
      };
    } else if (eventType === 'check_in') {
      baseData.check_in_data = { 
        check_in_time: new Date().toISOString(),
        geofence_verified: true
      };
    }

    createEvent.mutate(baseData);
  };

  const eventIcons = {
    chore: <CheckCircle className="w-5 h-5" />,
    meeting: <Users className="w-5 h-5" />,
    check_in: <Home className="w-5 h-5" />,
    mood_log: <Heart className="w-5 h-5" />,
    note: <FileText className="w-5 h-5" />
  };

  const eventColors = {
    chore: 'bg-green-100 text-green-700 border-green-200',
    meeting: 'bg-blue-100 text-blue-700 border-blue-200',
    check_in: 'bg-purple-100 text-purple-700 border-purple-200',
    mood_log: 'bg-pink-100 text-pink-700 border-pink-200',
    note: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <div className="space-y-6">
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-teal-600" />
          Log New Event
        </h3>

        <div className="space-y-4">
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chore">Chore</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="check_in">House Check-In</SelectItem>
              <SelectItem value="mood_log">Mood Log</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Title (e.g., Kitchen Cleanup, NA Meeting)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {eventType === 'mood_log' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood Score: {moodScore}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={moodScore}
                onChange={(e) => setMoodScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>😔 Low</span>
                <span>🙂 Okay</span>
                <span>😊 Great</span>
              </div>
            </div>
          )}

          <Textarea
            placeholder="Add notes or details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || createEvent.isPending}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {createEvent.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Log Event
              </>
            )}
          </Button>
        </div>
      </GraceCard>

      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Logs</h3>
        <div className="space-y-3">
          {events.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-xl border ${eventColors[event.event_type]} flex items-start gap-3`}
            >
              <div className="flex-shrink-0 mt-1">
                {eventIcons[event.event_type]}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm mt-1">{event.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Badge>
                </div>
                {event.mood_data && (
                  <div className="mt-2 text-sm">
                    Mood: {event.mood_data.mood_emoji} {event.mood_data.mood_score}/10
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </GraceCard>
    </div>
  );
}