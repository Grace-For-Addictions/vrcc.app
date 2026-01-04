import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageCircle, Coffee, Moon, Sun, Gamepad2, 
  Heart, Shield, Sparkles, Send, Smile, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';
import AIIcebreakers from '@/components/community/AIIcebreakers';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const roomIcons = {
  general: Users,
  morning_coffee: Coffee,
  evening_reflection: Moon,
  newcomers: Sun,
  games: Gamepad2,
  gratitude: Heart,
  crisis_support: Shield,
  family: Users,
  youth: Sparkles
};

const roomColors = {
  general: 'from-blue-400 to-blue-600',
  morning_coffee: 'from-amber-400 to-orange-500',
  evening_reflection: 'from-indigo-400 to-purple-600',
  newcomers: 'from-green-400 to-emerald-600',
  games: 'from-pink-400 to-rose-600',
  gratitude: 'from-rose-400 to-red-500',
  crisis_support: 'from-teal-400 to-teal-600',
  family: 'from-purple-400 to-purple-600',
  youth: 'from-cyan-400 to-blue-500'
};

function ChatRoomCard({ room, onJoin }) {
  const Icon = roomIcons[room.theme] || Users;
  const colorClass = roomColors[room.theme] || 'from-gray-400 to-gray-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => onJoin(room)}
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-md`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{room.name}</h3>
            {room.current_members > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {room.current_members} online
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{room.description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
}

function ActiveChatRoom({ room, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: roomMessages } = useQuery({
    queryKey: ['messages', room.id],
    queryFn: () => base44.entities.Message.filter({ room_id: room.id }, '-created_date', 50),
    refetchInterval: 3000
  });

  useEffect(() => {
    if (roomMessages) setMessages(roomMessages.reverse());
  }, [roomMessages]);

  const sendMessage = useMutation({
    mutationFn: (content) => base44.entities.Message.create({
      room_id: room.id,
      content,
      sender_name: user?.full_name || 'Anonymous',
      message_type: 'text'
    }),
    onSuccess: (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
      setInput('');
    }
  });

  const Icon = roomIcons[room.theme] || Users;
  const colorClass = roomColors[room.theme] || 'from-gray-400 to-gray-600';

  return (
    <div className="h-[600px] flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colorClass} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{room.name}</h3>
              <p className="text-xs opacity-80">{room.current_members || 0} members online</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLeave} className="text-white hover:bg-white/20">
            Leave
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* AI Icebreaker */}
        <AIIcebreakers roomTheme={room.theme} />

        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-teal-400" />
            <p>Be the first to say hello! 👋</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender_name === (user?.full_name || 'Anonymous') ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${
              msg.sender_name === (user?.full_name || 'Anonymous')
                ? 'bg-teal-600 text-white rounded-2xl rounded-br-md'
                : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border'
            } px-4 py-2.5`}>
              {msg.sender_name !== (user?.full_name || 'Anonymous') && (
                <p className="text-xs font-medium text-teal-600 mb-1">{msg.sender_name}</p>
              )}
              <p className="text-sm">{msg.content}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) sendMessage.mutate(input); }} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full"
          />
          <Button type="submit" size="icon" className="rounded-full bg-teal-600 hover:bg-teal-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Community() {
  const [activeRoom, setActiveRoom] = useState(null);
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: () => base44.entities.ChatRoom.filter({ is_active: true }),
    initialData: []
  });

  const handleJoinRoom = (room) => {
    setActiveRoom(room);
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Community Spaces"
          subtitle="Safe chat rooms for connection, support, and fun. Every conversation helps rewire your brain for recovery."
          icon={Users}
        />

        {/* Community Garden Link */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link to={createPageUrl('RecoveryGarden')}>
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">🌱 Your Community Garden</h3>
                  <p className="text-green-100 text-sm">
                    Every connection you make plants seeds of growth. Watch your recovery garden flourish!
                  </p>
                </div>
                <ChevronRight className="w-8 h-8 text-white/80" />
              </div>
            </div>
          </Link>
        </motion.div>

        {activeRoom ? (
          <ActiveChatRoom room={activeRoom} onLeave={handleLeaveRoom} />
        ) : (
          <>
            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="bg-white border">
                <TabsTrigger value="all">All Rooms</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room, idx) => (
                <ChatRoomCard 
                  key={room.id} 
                  room={room} 
                  onJoin={handleJoinRoom}
                />
              ))}
            </div>

            {rooms.length === 0 && !isLoading && (
              <GraceCard className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No rooms available yet</h3>
                <p className="text-gray-500 mt-1">Check back soon for community chat rooms!</p>
              </GraceCard>
            )}
          </>
        )}
      </div>

      <GraceChatWidget />
    </div>
  );
}