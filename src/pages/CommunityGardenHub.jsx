import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flower2, Gift, Heart, Users, TrendingUp, 
  Sparkles, Award, Send, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import CommunityGardenView from '@/components/garden/CommunityGardenView';

const giftOptions = [
  { id: 'hope_seed', name: '🌱 Seed of Hope', points: 10, emoji: '🌱' },
  { id: 'courage_boost', name: '💪 Courage Boost', points: 20, emoji: '💪' },
  { id: 'connection_flower', name: '🌸 Connection Flower', points: 30, emoji: '🌸' },
  { id: 'grace_blossom', name: '✨ Grace Blossom', points: 50, emoji: '✨' }
];

export default function CommunityGardenHub() {
  const [user, setUser] = useState(null);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);
  const [message, setMessage] = useState('');

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: allProfiles } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-points', 200),
    initialData: []
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  const { data: recentGifts } = useQuery({
    queryKey: ['garden-gifts'],
    queryFn: () => base44.entities.GardenGift.list('-created_date', 50),
    initialData: []
  });

  const sendGift = useMutation({
    mutationFn: async ({ gift, recipientEmail, message }) => {
      // Deduct points from sender
      await base44.auth.updateMe({
        points: (userProfile.points || 0) - gift.points
      });

      // Find recipient
      const recipients = await base44.entities.UserProfile.filter({ email: recipientEmail });
      if (recipients.length === 0) throw new Error('Recipient not found');

      const recipient = recipients[0];
      
      // Add points to recipient
      await base44.entities.UserProfile.update(recipient.id, {
        points: (recipient.points || 0) + gift.points
      });

      // Create gift record
      await base44.entities.GardenGift.create({
        sender_email: user.email,
        sender_name: user.full_name,
        recipient_email: recipientEmail,
        recipient_name: recipient.display_name || recipientEmail,
        gift_type: gift.id,
        gift_name: gift.name,
        points_value: gift.points,
        message: message
      });

      // Award badges
      const senderGiftsCount = recentGifts.filter(g => g.sender_email === user.email).length + 1;
      if (senderGiftsCount === 1) {
        await base44.entities.Badge.create({
          badge_id: 'first_gift',
          name: 'Generous Heart',
          description: 'Sent your first garden gift',
          category: 'giving',
          points_value: 10
        });
      }
      if (senderGiftsCount === 10) {
        await base44.entities.Badge.create({
          badge_id: 'gift_master',
          name: 'Gift Master',
          description: 'Sent 10 garden gifts',
          category: 'giving',
          points_value: 50
        });
      }

      // Log to IBHRS
      await base44.entities.IBHRSServiceEvent.create({
        participant_id: user.id,
        service_type: 'peer_support',
        service_date: new Date().toISOString().split('T')[0],
        duration_minutes: 5,
        setting: 'virtual',
        county: 'Dallas',
        outcome_measure: {
          functional_improvement: true,
          recovery_capital_increase: 1
        }
      });

      return true;
    },
    onSuccess: () => {
      setGiftDialogOpen(false);
      setRecipientEmail('');
      setMessage('');
      setSelectedGift(null);
      queryClient.invalidateQueries(['garden-gifts']);
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allProfiles']);
    }
  });

  const reactToGift = useMutation({
    mutationFn: ({ giftId, reactionType }) => {
      return base44.entities.GardenGift.update(giftId, {
        reactions: {
          hearts: reactionType === 'hearts' ? 1 : 0,
          thanks: reactionType === 'thanks' ? 1 : 0
        }
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['garden-gifts'])
  });

  const totalCommunityPoints = allProfiles.reduce((sum, p) => sum + (p.points || 0), 0);
  const totalGifts = recentGifts.length;
  const userPoints = userProfile?.points || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Community Garden Hub"
          subtitle="Our collective recovery ecosystem - growing together, healing together"
          icon={Flower2}
        />

        {/* Community Overview */}
        <CommunityGardenView allProfiles={allProfiles} />

        {/* Gifting Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                <Gift className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-700">{totalGifts}</p>
                <p className="text-sm text-gray-600">Total Gifts Sent</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{userPoints}</p>
                <p className="text-sm text-gray-600">Your Points</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
                  <Gift className="w-5 h-5 mr-2" />
                  Send Gift
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Email
                    </label>
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
                    <div className="grid grid-cols-2 gap-2">
                      {giftOptions.map(gift => (
                        <button
                          key={gift.id}
                          onClick={() => setSelectedGift(gift)}
                          disabled={userPoints < gift.points}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            selectedGift?.id === gift.id
                              ? 'border-teal-500 bg-teal-50'
                              : userPoints >= gift.points
                              ? 'border-gray-200 hover:border-teal-300 bg-white'
                              : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-2xl mb-1">{gift.emoji}</div>
                          <p className="text-xs font-medium text-gray-900">{gift.points} pts</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add a Message
                    </label>
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
          </GraceCard>
        </div>

        {/* Kudos Feed */}
        <GraceCard>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-600" />
            Community Kudos Feed
          </h3>

          <div className="space-y-4">
            <AnimatePresence>
              {recentGifts.map((gift, idx) => (
                <motion.div
                  key={gift.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-xl border border-teal-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-2xl">
                      {giftOptions.find(g => g.id === gift.gift_type)?.emoji || '🎁'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <strong>{gift.sender_name}</strong> sent <strong>{gift.recipient_name}</strong> a{' '}
                        <span className="text-teal-700 font-semibold">{gift.gift_name}</span>
                      </p>
                      {gift.message && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{gift.message}"</p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => reactToGift.mutate({ giftId: gift.id, reactionType: 'hearts' })}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span>{gift.reactions?.hearts || 0}</span>
                        </button>
                        <button
                          onClick={() => reactToGift.mutate({ giftId: gift.id, reactionType: 'thanks' })}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-teal-600 transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{gift.reactions?.thanks || 0}</span>
                        </button>
                        <span className="text-xs text-gray-500">
                          {new Date(gift.created_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {recentGifts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No gifts sent yet. Be the first to spread some growth!</p>
              </div>
            )}
          </div>
        </GraceCard>

        {/* Neuroplasticity Insight */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200">
          <div className="flex items-start gap-4">
            <Award className="w-8 h-8 text-purple-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">
                🧠 Brain Science: Prosocial Behavior & Neural Pathways
              </h4>
              <p className="text-sm text-purple-800">
                When you give to others, your brain releases oxytocin and dopamine—strengthening the neural pathways 
                for connection, empathy, and generosity. Every gift you send literally rewires your brain for resilience 
                and community bonding. This is recovery at the neurological level.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}