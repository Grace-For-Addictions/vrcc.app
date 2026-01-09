import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Plus, Send, Heart, Search, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function GrowingGroups({ user }) {
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [fertilizerRecipient, setFertilizerRecipient] = useState(null);

  const { data: groups } = useQuery({
    queryKey: ['growingGroups'],
    queryFn: () => base44.entities.GrowingGroup.list('-created_date', 50),
    initialData: []
  });

  const { data: myGroups } = useQuery({
    queryKey: ['myGroups', user?.email],
    queryFn: () => base44.entities.GrowingGroup.filter({
      member_emails: { $in: [user.email] }
    }),
    enabled: !!user,
    initialData: []
  });

  const { data: receivedGifts } = useQuery({
    queryKey: ['receivedGifts', user?.email],
    queryFn: () => base44.entities.GardenGift.filter({
      recipient_email: user.email
    }, '-sent_date', 10),
    enabled: !!user,
    initialData: []
  });

  const createGroup = useMutation({
    mutationFn: (groupData) => base44.entities.GrowingGroup.create({
      ...groupData,
      created_by: user.email,
      member_emails: [user.email]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['growingGroups']);
      queryClient.invalidateQueries(['myGroups']);
      toast.success('Growing Group created! 🌱');
    }
  });

  const joinGroup = useMutation({
    mutationFn: (group) => base44.entities.GrowingGroup.update(group.id, {
      member_emails: [...group.member_emails, user.email]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['growingGroups']);
      queryClient.invalidateQueries(['myGroups']);
      toast.success('Joined group! Welcome! 💚');
    }
  });

  const sendFertilizer = useMutation({
    mutationFn: ({ recipientEmail, giftType, message }) => 
      base44.entities.GardenGift.create({
        sender_email: user.email,
        recipient_email: recipientEmail,
        gift_type: giftType,
        message,
        sent_date: new Date().toISOString()
      }),
    onSuccess: () => {
      toast.success('Gift sent! 🎁');
      setFertilizerRecipient(null);
    }
  });

  const groupTypes = {
    faith_based: { icon: '✝️', color: 'blue' },
    trauma_aware: { icon: '🤝', color: 'purple' },
    family_support: { icon: '👨‍👩‍👧', color: 'pink' },
    reentry_focus: { icon: '🔓', color: 'orange' },
    youth: { icon: '🌟', color: 'yellow' },
    general: { icon: '🌱', color: 'green' }
  };

  const giftTypes = [
    { value: 'sunshine', label: '☀️ Sunshine Boost', color: 'yellow' },
    { value: 'rain', label: '🌧️ Rain of Hope', color: 'blue' },
    { value: 'seeds', label: '🌰 Seeds of Wisdom', color: 'brown' },
    { value: 'fertilizer', label: '💚 Fertilizer of Encouragement', color: 'green' },
    { value: 'flower', label: '🌸 Flower of Celebration', color: 'pink' }
  ];

  const [newGroup, setNewGroup] = useState({
    group_name: '',
    biome_type: 'hope_meadow',
    group_type: 'general',
    description: '',
    is_private: false
  });

  return (
    <div className="space-y-6">
      {/* Received Gifts */}
      {receivedGifts.filter(g => !g.is_read).length > 0 && (
        <GraceCard className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-pink-600" />
            <h3 className="text-lg font-semibold text-gray-900">New Garden Gifts!</h3>
            <Badge className="bg-pink-600">{receivedGifts.filter(g => !g.is_read).length}</Badge>
          </div>
          <div className="space-y-2">
            {receivedGifts.filter(g => !g.is_read).slice(0, 3).map((gift) => {
              const giftType = giftTypes.find(g => g.value === gift.gift_type);
              return (
                <div key={gift.id} className="p-3 bg-white rounded-lg">
                  <p className="font-medium text-gray-900">{giftType?.label}</p>
                  <p className="text-sm text-gray-600 mt-1">"{gift.message}"</p>
                  <p className="text-xs text-gray-400 mt-1">From a fellow grower</p>
                </div>
              );
            })}
          </div>
        </GraceCard>
      )}

      {/* My Groups */}
      <GraceCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            My Growing Groups
          </h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Growing Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Group name..."
                  value={newGroup.group_name}
                  onChange={(e) => setNewGroup({ ...newGroup, group_name: e.target.value })}
                />
                <Select value={newGroup.group_type} onValueChange={(v) => setNewGroup({ ...newGroup, group_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Group type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupTypes).map(([key, { icon }]) => (
                      <SelectItem key={key} value={key}>
                        {icon} {key.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newGroup.biome_type} onValueChange={(v) => setNewGroup({ ...newGroup, biome_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Biome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compassion_grove">🌳 Compassion Grove</SelectItem>
                    <SelectItem value="hope_meadow">🌾 Hope Meadow</SelectItem>
                    <SelectItem value="serenity_spring">💧 Serenity Spring</SelectItem>
                    <SelectItem value="resilience_forest">🌲 Resilience Forest</SelectItem>
                    <SelectItem value="faith_garden">✨ Faith Garden</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Group description..."
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newGroup.is_private}
                    onChange={(e) => setNewGroup({ ...newGroup, is_private: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm text-gray-700">Private group (invite only)</label>
                </div>
                <Button
                  onClick={() => createGroup.mutate(newGroup)}
                  disabled={!newGroup.group_name}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {myGroups.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Join a group to grow together!</p>
        ) : (
          <div className="space-y-3">
            {myGroups.map((group) => {
              const type = groupTypes[group.group_type];
              return (
                <div key={group.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{type.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{group.group_name}</h4>
                        <p className="text-sm text-gray-600">{group.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{group.member_emails?.length || 1} members</Badge>
                          <Badge variant="outline">{group.biome_type.replace(/_/g, ' ')}</Badge>
                          {group.is_private && <Lock className="w-3 h-3 text-gray-400" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GraceCard>

      {/* Browse Groups */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Discover Growing Groups</h3>
        <div className="space-y-3">
          {groups.filter(g => !g.is_private && !myGroups.find(mg => mg.id === g.id)).map((group) => {
            const type = groupTypes[group.group_type];
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-3xl">{type.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{group.group_name}</h4>
                      <p className="text-sm text-gray-600">{group.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{group.member_emails?.length || 0} members</Badge>
                        <Badge variant="outline">{group.biome_type.replace(/_/g, ' ')}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => joinGroup.mutate(group)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Join
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GraceCard>

      {/* Send Fertilizer Dialog */}
      <Dialog open={!!fertilizerRecipient} onOpenChange={() => setFertilizerRecipient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Garden Gift 🎁</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select onValueChange={(v) => setFertilizerRecipient({ ...fertilizerRecipient, giftType: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a gift..." />
              </SelectTrigger>
              <SelectContent>
                {giftTypes.map((gift) => (
                  <SelectItem key={gift.value} value={gift.value}>
                    {gift.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Add an encouraging message..."
              value={fertilizerRecipient?.message || ''}
              onChange={(e) => setFertilizerRecipient({ ...fertilizerRecipient, message: e.target.value })}
              rows={3}
            />
            <Button
              onClick={() => sendFertilizer.mutate(fertilizerRecipient)}
              disabled={!fertilizerRecipient?.giftType || !fertilizerRecipient?.message}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Gift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}