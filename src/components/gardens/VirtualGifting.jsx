import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Gift, Send, Flower2, Sparkles, Heart, Sun, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

const GIFT_TYPES = [
  { type: 'seed', icon: '🌱', name: 'Hope Seed', description: 'Plant hope in someone\'s garden', points: 5 },
  { type: 'fertilizer', icon: '💚', name: 'Grace Fertilizer', description: 'Nourish growth and resilience', points: 10 },
  { type: 'sunshine', icon: '☀️', name: 'Sunshine Boost', description: 'Brighten someone\'s day', points: 8 },
  { type: 'water', icon: '💧', name: 'Living Water', description: 'Refresh and renew', points: 8 },
  { type: 'flower', icon: '🌸', name: 'Gratitude Flower', description: 'Express appreciation', points: 15 }
];

export default function VirtualGifting({ user, profile }) {
  const [selectedGift, setSelectedGift] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: receivedGifts } = useQuery({
    queryKey: ['receivedGifts', user.email],
    queryFn: () => base44.entities.GardenGift.filter({ 
      recipient_email: user.email 
    }, '-sent_date', 20),
    initialData: []
  });

  const { data: sentGifts } = useQuery({
    queryKey: ['sentGifts', user.email],
    queryFn: () => base44.entities.GardenGift.filter({ 
      sender_email: user.email 
    }, '-sent_date', 20),
    initialData: []
  });

  const { data: communityMembers } = useQuery({
    queryKey: ['communityMembers'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 50),
    initialData: []
  });

  const sendGift = useMutation({
    mutationFn: async (giftData) => {
      // Deduct points from sender
      const senderPoints = profile?.points || 0;
      if (senderPoints < selectedGift.points) {
        throw new Error('Not enough points');
      }

      await base44.entities.UserProfile.update(profile.id, {
        points: senderPoints - selectedGift.points
      });

      // Create gift record
      return base44.entities.GardenGift.create({
        sender_email: user.email,
        recipient_email: giftData.recipientEmail,
        gift_type: selectedGift.type,
        message: giftData.message,
        sent_date: new Date().toISOString(),
        points_value: selectedGift.points
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['receivedGifts']);
      queryClient.invalidateQueries(['sentGifts']);
      queryClient.invalidateQueries(['userProfile']);
      toast.success('Gift sent! 💚');
      setRecipientEmail('');
      setGiftMessage('');
      setSelectedGift(null);
    },
    onError: (error) => {
      if (error.message.includes('points')) {
        toast.error('Not enough points to send this gift');
      } else {
        toast.error('Failed to send gift');
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Send Gift */}
      <GraceCard gradient>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-teal-600" />
          Send a Virtual Gift
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          Encourage fellow community members by gifting virtual items to their gardens
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {GIFT_TYPES.map((gift) => (
            <button
              key={gift.type}
              onClick={() => setSelectedGift(gift)}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                selectedGift?.type === gift.type
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <div className="text-3xl mb-1">{gift.icon}</div>
              <div className="text-xs font-semibold text-gray-900">{gift.name}</div>
              <div className="text-xs text-gray-600">{gift.points} pts</div>
            </button>
          ))}
        </div>

        {selectedGift && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 p-4 bg-white rounded-xl border border-teal-200"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Send to:</label>
              <Select value={recipientEmail} onValueChange={setRecipientEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Select community member" />
                </SelectTrigger>
                <SelectContent>
                  {communityMembers
                    .filter(m => m.created_by !== user.email)
                    .map(member => (
                      <SelectItem key={member.created_by} value={member.created_by}>
                        {member.display_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Add a message:</label>
              <Textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Write an encouraging message..."
                rows={3}
              />
            </div>

            <Button
              onClick={() => sendGift.mutate({ recipientEmail, message: giftMessage })}
              disabled={!recipientEmail || sendGift.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send {selectedGift.name} ({selectedGift.points} pts)
            </Button>
          </motion.div>
        )}
      </GraceCard>

      {/* Received Gifts */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Gifts You've Received</h4>
        <div className="space-y-3">
          {receivedGifts.map((gift, idx) => (
            <motion.div
              key={gift.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-start gap-3 p-3 bg-gradient-to-r from-teal-50 to-purple-50 rounded-lg border border-teal-200"
            >
              <div className="text-3xl">{GIFT_TYPES.find(g => g.type === gift.gift_type)?.icon || '🎁'}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  From: {gift.sender_email.split('@')[0]}
                </p>
                <p className="text-sm text-gray-700 italic mt-1">"{gift.message}"</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(gift.sent_date).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
          {receivedGifts.length === 0 && (
            <p className="text-center text-gray-500 py-8">No gifts yet. Start by engaging with the community!</p>
          )}
        </div>
      </GraceCard>

      {/* Sent Gifts */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Gifts You've Sent</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sentGifts.slice(0, 6).map((gift, idx) => (
            <div key={gift.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-xl">{GIFT_TYPES.find(g => g.type === gift.gift_type)?.icon || '🎁'}</span>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">To: {gift.recipient_email.split('@')[0]}</p>
                <p className="text-xs text-gray-600">
                  {new Date(gift.sent_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GraceCard>
    </div>
  );
}