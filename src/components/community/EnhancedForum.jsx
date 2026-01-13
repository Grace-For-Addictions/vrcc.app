import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Heart, Send, Users, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EnhancedForum({ chatRoomId, chatRoomName }) {
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [reactions, setReactions] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['forumMessages', chatRoomId],
    queryFn: () => base44.entities.Message.filter({ chat_room_id: chatRoomId }),
    refetchInterval: 5000
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['forumParticipants', chatRoomId],
    queryFn: async () => {
      const uniqueEmails = [...new Set(messages.map(m => m.created_by))];
      return Promise.all(
        uniqueEmails.map(email => 
          base44.entities.UserProfile.filter({ created_by: email })
            .then(profiles => profiles[0])
        )
      );
    },
    enabled: messages.length > 0
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['forumMessages', chatRoomId]);
      setNewMessage('');
      
      // Track engagement
      base44.analytics.track({
        eventName: 'forum_message_sent',
        properties: { chat_room_id: chatRoomId, chat_room_name: chatRoomName }
      });
    }
  });

  const addReactionMutation = useMutation({
    mutationFn: ({ messageId, reaction }) => {
      const currentReactions = reactions[messageId] || [];
      const newReactions = [...currentReactions, { user: user.email, type: reaction }];
      return base44.entities.Message.update(messageId, { reactions: newReactions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forumMessages', chatRoomId]);
    }
  });

  const handleSend = () => {
    if (newMessage.trim() && user) {
      sendMessageMutation.mutate({
        chat_room_id: chatRoomId,
        content: newMessage,
        message_type: 'text'
      });
    }
  };

  const handleReaction = (messageId, reactionType) => {
    addReactionMutation.mutate({ messageId, reaction: reactionType });
    
    base44.analytics.track({
      eventName: 'forum_reaction_added',
      properties: { message_id: messageId, reaction_type: reactionType }
    });
  };

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  return (
    <div className="space-y-6">
      {/* Forum Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-teal-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{participants.length}</p>
                <p className="text-sm text-gray-600">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                <p className="text-sm text-gray-600">Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {messages.filter(m => 
                    new Date(m.created_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post New Message */}
      <Card>
        <CardHeader>
          <CardTitle>Share Your Thoughts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              placeholder="What's on your mind? Your experiences can help others..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSend}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Post Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Feed */}
      <div className="space-y-4">
        {sortedMessages.map((message) => {
          const author = participants.find(p => p?.created_by === message.created_by);
          const messageReactions = message.reactions || [];
          const heartCount = messageReactions.filter(r => r.type === 'heart').length;
          
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {author?.display_name?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {author?.display_name || 'Community Member'}
                        </span>
                        {author?.stage && (
                          <Badge variant="outline" className="text-xs">
                            {author.stage}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(message.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 whitespace-pre-wrap mb-3">
                        {message.content}
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleReaction(message.id, 'heart')}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500 transition"
                        >
                          <Heart className="w-4 h-4" />
                          <span>{heartCount > 0 && heartCount}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}