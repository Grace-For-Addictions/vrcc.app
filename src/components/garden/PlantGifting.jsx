import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Gift, Send, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GraceCard from '@/components/common/GraceCard';

const giftOptions = [
  { id: 'hope_seed', name: '🌱 Seed of Hope', points: 10, description: 'Plant hope in someone\'s garden' },
  { id: 'courage_boost', name: '💪 Courage Boost', points: 20, description: 'Accelerate plant growth' },
  { id: 'connection_flower', name: '🌸 Connection Flower', points: 30, description: 'Celebrate a meaningful connection' },
  { id: 'grace_blossom', name: '✨ Grace Blossom', points: 50, description: 'The ultimate gift of encouragement' }
];

export default function PlantGifting({ currentUser, userPoints }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const sendGift = useMutation({
    mutationFn: async ({ gift, recipientEmail, message }) => {
      // Deduct points from sender
      await base44.auth.updateMe({
        points: (userPoints || 0) - gift.points
      });

      // Find recipient's garden
      const recipientProfiles = await base44.entities.UserProfile.filter({ email: recipientEmail });
      if (recipientProfiles.length === 0) throw new Error('Recipient not found');

      const recipientProfile = recipientProfiles[0];
      
      // Add points to recipient
      await base44.entities.UserProfile.update(recipientProfile.id, {
        points: (recipientProfile.points || 0) + gift.points
      });

      // Create notification/kudos post
      await base44.entities.Post.create({
        wall_type: 'kudos',
        content: `${currentUser.full_name} gifted you a ${gift.name}! 💚\n\n${message}`,
        author_name: currentUser.full_name,
        recipient_name: recipientProfile.display_name || recipientProfile.email
      });

      return true;
    },
    onSuccess: () => {
      setOpen(false);
      setRecipientEmail('');
      setMessage('');
      setSelectedGift(null);
      queryClient.invalidateQueries(['userProfile']);
      alert('Gift sent! 🎁');
    },
    onError: () => {
      alert('Error sending gift. Please check the email and try again.');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-teal-200 hover:bg-teal-50">
          <Gift className="w-4 h-4 mr-2 text-teal-600" />
          Gift Seeds to Others
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            Gift Growth to a Friend
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email</label>
            <Input
              type="email"
              placeholder="friend@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Gift (You have {userPoints} points)
            </label>
            <div className="space-y-2">
              {giftOptions.map(gift => (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift)}
                  disabled={userPoints < gift.points}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    selectedGift?.id === gift.id
                      ? 'border-teal-500 bg-teal-50'
                      : userPoints >= gift.points
                      ? 'border-gray-200 hover:border-teal-300 bg-white'
                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{gift.name}</p>
                      <p className="text-xs text-gray-600">{gift.description}</p>
                    </div>
                    <Badge variant="outline">{gift.points} pts</Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add a Message</label>
            <Textarea
              placeholder="You've got this! 💚"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={() => sendGift.mutate({ gift: selectedGift, recipientEmail, message })}
            disabled={!recipientEmail || !selectedGift || sendGift.isLoading}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendGift.isLoading ? 'Sending...' : 'Send Gift'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}