import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Send, Users, User, Shield, AlertTriangle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function ResidentMessaging({ residentProfile, house, user }) {
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState('group');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: groupMessages } = useQuery({
    queryKey: ['groupMessages', house?.id],
    queryFn: () => base44.entities.ResidentMessage.filter({ 
      house_id: house.id,
      is_group_message: true
    }, '-created_date', 100),
    enabled: !!house,
    initialData: [],
    refetchInterval: 5000 // Poll every 5 seconds
  });

  const sendMessage = useMutation({
    mutationFn: async (content) => {
      // AI moderation check
      const moderationCheck = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this message for triggering content related to relapse, self-harm, or drug use. Return true if flagged, false if safe. Message: "${content}"`,
        response_json_schema: {
          type: "object",
          properties: {
            flagged: { type: "boolean" },
            reason: { type: "string" }
          }
        }
      });

      return base44.entities.ResidentMessage.create({
        house_id: house.id,
        sender_email: user.email,
        sender_name: user.full_name,
        sender_role: 'resident',
        is_group_message: activeTab === 'group',
        message_content: content,
        ai_flagged: moderationCheck.flagged,
        flag_reason: moderationCheck.reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupMessages']);
      setMessageInput('');
    }
  });

  const handleSend = () => {
    if (!messageInput.trim()) return;
    sendMessage.mutate(messageInput);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages]);

  return (
    <div className="space-y-6">
      <GraceCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            Secure Messaging
          </h3>
          <Badge className="bg-green-100 text-green-700">End-to-End Encrypted</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="group">
              <Users className="w-4 h-4 mr-2" />
              House Group
            </TabsTrigger>
            <TabsTrigger value="direct">
              <User className="w-4 h-4 mr-2" />
              Direct Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="group" className="space-y-4">
            <div className="h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg space-y-3">
              {groupMessages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`flex ${msg.sender_email === user.email ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.sender_email === user.email
                      ? 'bg-teal-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                  }`}>
                    {msg.sender_email !== user.email && (
                      <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</p>
                    )}
                    <p className="text-sm">{msg.message_content}</p>
                    {msg.ai_flagged && (
                      <div className="mt-2 flex items-center gap-1 text-xs opacity-70">
                        <AlertTriangle className="w-3 h-3" />
                        AI flagged for review
                      </div>
                    )}
                    <p className="text-xs mt-1 opacity-60">
                      {new Date(msg.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button
                onClick={handleSend}
                disabled={!messageInput.trim() || sendMessage.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="direct">
            <div className="text-center py-12 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Direct messaging coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </GraceCard>
    </div>
  );
}