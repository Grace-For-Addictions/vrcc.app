import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Gift, Heart, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceCard from '@/components/common/GraceCard';

export default function GardenLeaderboards() {
  const { data: allGifts } = useQuery({
    queryKey: ['all-garden-gifts'],
    queryFn: () => base44.entities.GardenGift.list('-created_date', 500),
    initialData: []
  });

  // Calculate gifter leaderboard
  const gifterStats = allGifts.reduce((acc, gift) => {
    if (!acc[gift.sender_email]) {
      acc[gift.sender_email] = {
        name: gift.sender_name,
        email: gift.sender_email,
        gifts_sent: 0,
        total_points_given: 0
      };
    }
    acc[gift.sender_email].gifts_sent += 1;
    acc[gift.sender_email].total_points_given += gift.points_value;
    return acc;
  }, {});

  const topGifters = Object.values(gifterStats)
    .sort((a, b) => b.gifts_sent - a.gifts_sent)
    .slice(0, 10);

  // Calculate receiver leaderboard
  const receiverStats = allGifts.reduce((acc, gift) => {
    if (!acc[gift.recipient_email]) {
      acc[gift.recipient_email] = {
        name: gift.recipient_name,
        email: gift.recipient_email,
        gifts_received: 0,
        total_points_received: 0,
        total_reactions: 0
      };
    }
    acc[gift.recipient_email].gifts_received += 1;
    acc[gift.recipient_email].total_points_received += gift.points_value;
    acc[gift.recipient_email].total_reactions += (gift.reactions?.hearts || 0) + (gift.reactions?.thanks || 0);
    return acc;
  }, {});

  const topReceivers = Object.values(receiverStats)
    .sort((a, b) => b.total_reactions - a.total_reactions)
    .slice(0, 10);

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '🥇', color: 'bg-yellow-100 text-yellow-800' };
    if (rank === 2) return { icon: '🥈', color: 'bg-gray-100 text-gray-800' };
    if (rank === 3) return { icon: '🥉', color: 'bg-orange-100 text-orange-800' };
    return { icon: `#${rank}`, color: 'bg-blue-100 text-blue-800' };
  };

  return (
    <GraceCard>
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-amber-600" />
        Community Leaderboards
      </h3>

      <Tabs defaultValue="gifters">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gifters">Most Generous 🎁</TabsTrigger>
          <TabsTrigger value="receivers">Most Appreciated 💚</TabsTrigger>
        </TabsList>

        <TabsContent value="gifters" className="space-y-3 mt-4">
          {topGifters.map((gifter, idx) => {
            const badge = getRankBadge(idx + 1);
            return (
              <motion.div
                key={gifter.email}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-xl border border-teal-200"
              >
                <Badge className={`${badge.color} text-lg px-3 py-1`}>
                  {badge.icon}
                </Badge>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{gifter.name}</p>
                  <p className="text-sm text-gray-600">
                    {gifter.gifts_sent} gifts sent • {gifter.total_points_given} points given
                  </p>
                </div>
                <Gift className="w-5 h-5 text-teal-600" />
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="receivers" className="space-y-3 mt-4">
          {topReceivers.map((receiver, idx) => {
            const badge = getRankBadge(idx + 1);
            return (
              <motion.div
                key={receiver.email}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200"
              >
                <Badge className={`${badge.color} text-lg px-3 py-1`}>
                  {badge.icon}
                </Badge>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{receiver.name}</p>
                  <p className="text-sm text-gray-600">
                    {receiver.gifts_received} gifts • {receiver.total_reactions} reactions
                  </p>
                </div>
                <Heart className="w-5 h-5 text-pink-600" />
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </GraceCard>
  );
}