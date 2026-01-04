import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Users, Sparkles, Send, Heart, Smile, Music, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

export default function RecoveryCapitalCafe() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [activeActivity, setActiveActivity] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  // Poll for new messages
  const { data: messages } = useQuery({
    queryKey: ['cafeMessages'],
    queryFn: async () => {
      const msgs = await base44.entities.Message.filter(
        { room_id: 'recovery_cafe' },
        '-created_date',
        50
      );
      return msgs;
    },
    refetchInterval: 5000,
    initialData: []
  });

  const { data: onlineUsers } = useQuery({
    queryKey: ['cafeOnline'],
    queryFn: async () => {
      // Mock for now - would track active sessions
      return Math.floor(Math.random() * 20) + 5;
    },
    refetchInterval: 30000
  });

  const sendMessage = useMutation({
    mutationFn: (content) => base44.entities.Message.create({
      room_id: 'recovery_cafe',
      sender_name: user?.full_name || 'Anonymous',
      content,
      message_type: 'text'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cafeMessages']);
      setMessage('');
    }
  });

  const activities = [
    { id: 'music', icon: Music, title: 'Music Circle', description: 'Share songs that inspire you' },
    { id: 'gratitude', icon: Heart, title: 'Gratitude Round', description: 'What are you grateful for today?' },
    { id: 'stories', icon: BookOpen, title: 'Story Time', description: 'Share your recovery journey' },
    { id: 'icebreaker', icon: Smile, title: 'Icebreaker', description: 'Get to know each other' }
  ];

  const startActivity = async (activity) => {
    setActiveActivity(activity);
    const prompt = {
      music: "Suggest 3 uplifting songs about hope, resilience, and recovery. Format as a friendly list.",
      gratitude: "Share a heartwarming gratitude prompt for people in recovery. Keep it warm and peer-led.",
      stories: "Provide 3 gentle story prompts for people to share their recovery journey. Trauma-informed.",
      icebreaker: "Give 3 fun, lighthearted icebreaker questions for a recovery community. Keep it playful."
    };

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompt[activity.id]
    });

    sendMessage.mutate(`🎉 AI Grace started ${activity.title}!\n\n${aiResponse}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Recovery Capital Café ☕"
          subtitle="Your virtual third place - drop in anytime for connection, activities, and grace"
          icon={Coffee}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <GraceCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">
                  {onlineUsers} online now
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Connection strengthens recovery capital 🧠💚
              </p>
            </GraceCard>

            <GraceCard>
              <h4 className="font-semibold text-gray-900 mb-3">Start an Activity</h4>
              <div className="space-y-2">
                {activities.map((activity) => (
                  <Button
                    key={activity.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => startActivity(activity)}
                  >
                    <activity.icon className="w-4 h-4 mr-2" />
                    {activity.title}
                  </Button>
                ))}
              </div>
            </GraceCard>
          </div>

          {/* Main Chat */}
          <div className="lg:col-span-3">
            <GraceCard className="h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-teal-700">
                        {msg.sender_name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{msg.sender_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-gray-200 p-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (message.trim()) sendMessage.mutate(message);
                }} className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share something with the café..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!message.trim() || sendMessage.isPending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </GraceCard>
          </div>
        </div>
      </div>

      <GraceChatWidget />
    </div>
  );
}