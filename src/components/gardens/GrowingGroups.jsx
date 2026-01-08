import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, Plus, Send, Trophy, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import GraceCard from '@/components/common/GraceCard';

export default function GrowingGroups({ user, biomeId }) {
  const [newGroupName, setNewGroupName] = useState('');
  const [encouragementText, setEncouragementText] = useState('');
  const queryClient = useQueryClient();

  const { data: groups } = useQuery({
    queryKey: ['growingGroups', biomeId],
    queryFn: () => base44.entities.TeamChallenge.filter({ 
      challenge_type: 'community_participation'
    }),
    initialData: []
  });

  const createGroup = useMutation({
    mutationFn: (groupData) => base44.entities.TeamChallenge.create(groupData),
    onSuccess: () => {
      queryClient.invalidateQueries(['growingGroups']);
      setNewGroupName('');
    }
  });

  const joinGroup = useMutation({
    mutationFn: async ({ groupId, group }) => {
      const updatedMembers = [...(group.team_members || []), user.email];
      return base44.entities.TeamChallenge.update(groupId, {
        team_members: updatedMembers,
        current_members: updatedMembers.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['growingGroups']);
    }
  });

  const sendEncouragement = useMutation({
    mutationFn: async (recipientEmail) => {
      return base44.entities.GardenGift.create({
        sender_email: user.email,
        recipient_email: recipientEmail,
        gift_type: 'encouragement',
        message: encouragementText,
        sent_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setEncouragementText('');
      alert('Encouragement sent! 💚');
    }
  });

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Growing Groups</h3>
            <p className="text-sm text-gray-600">Collaborate with peers on recovery challenges</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Growing Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Group Name</Label>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Serenity Seekers"
                  />
                </div>
                <Button
                  onClick={() => {
                    createGroup.mutate({
                      title: newGroupName,
                      challenge_type: 'community_participation',
                      goal_type: 'attendance',
                      goal_target: 21,
                      team_members: [user.email],
                      start_date: new Date().toISOString(),
                      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    });
                  }}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={!newGroupName || createGroup.isPending}
                >
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </GraceCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group, idx) => {
          const isMember = group.team_members?.includes(user.email);
          const progressPercent = (group.current_progress / group.goal_target) * 100;

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GraceCard hover>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-600" />
                      {group.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                  </div>
                  {isMember && (
                    <Badge className="bg-teal-100 text-teal-700">Member</Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Challenge Progress</span>
                      <span className="font-semibold text-teal-700">
                        {group.current_progress}/{group.goal_target}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{group.team_members?.length || 0} members</span>
                    <span className="text-purple-700 font-medium">
                      🎁 {group.points_reward_per_member} pts reward
                    </span>
                  </div>

                  {!isMember && (
                    <Button
                      onClick={() => joinGroup.mutate({ groupId: group.id, group })}
                      disabled={joinGroup.isPending}
                      variant="outline"
                      className="w-full border-teal-300 text-teal-700 hover:bg-teal-50"
                    >
                      Join Group
                    </Button>
                  )}

                  {isMember && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Send className="w-4 h-4 mr-2" />
                          Send Encouragement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Send Encouragement to {group.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <Textarea
                            value={encouragementText}
                            onChange={(e) => setEncouragementText(e.target.value)}
                            placeholder="Write an encouraging message..."
                            rows={4}
                          />
                          <Button
                            onClick={() => {
                              // Send to all group members
                              group.team_members?.forEach(email => {
                                if (email !== user.email) {
                                  sendEncouragement.mutate(email);
                                }
                              });
                            }}
                            className="w-full bg-teal-600 hover:bg-teal-700"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Send to All Members
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </GraceCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}