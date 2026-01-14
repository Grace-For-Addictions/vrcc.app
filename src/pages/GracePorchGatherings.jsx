import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Users, Shield, Heart, 
  Plus, Check, Coffee, MessageCircle, Sparkles,
  Video, Lock, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import confetti from 'canvas-confetti';

const topics = [
  { id: 'early_recovery', label: 'Early Recovery (First Year)', emoji: '🌱' },
  { id: 'long_term_recovery', label: 'Long-Term Recovery', emoji: '🌳' },
  { id: 'employment', label: 'Finding Work & Career', emoji: '💼' },
  { id: 'housing', label: 'Housing Challenges', emoji: '🏠' },
  { id: 'relationships', label: 'Rebuilding Relationships', emoji: '💞' },
  { id: 'parenting', label: 'Parenting in Recovery', emoji: '👨‍👩‍👧' },
  { id: 'grief_loss', label: 'Grief & Loss', emoji: '🕊️' },
  { id: 'anxiety_depression', label: 'Anxiety & Depression', emoji: '🌤️' },
  { id: 'trauma_healing', label: 'Trauma & Healing', emoji: '💚' },
  { id: 'spirituality', label: 'Spirituality & Meaning', emoji: '✨' },
  { id: 'lgbtq_support', label: 'LGBTQ+ Support', emoji: '🏳️‍🌈' },
  { id: 'veterans', label: 'Veterans in Recovery', emoji: '🎖️' },
  { id: 'open_discussion', label: 'Open Discussion', emoji: '☕' }
];

function CreateGatheringDialog({ onSuccess }) {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: 'open_discussion',
    scheduled_time: '',
    duration_minutes: 60,
    max_participants: 12,
    is_anonymous: false,
    requires_approval: false,
    pathways: [],
    meeting_link: ''
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const createGathering = useMutation({
    mutationFn: (data) => base44.entities.GracePorchGathering.create({
      ...data,
      host_email: user?.email,
      status: 'scheduled'
    }),
    onSuccess: () => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        topic: 'open_discussion',
        scheduled_time: '',
        duration_minutes: 60,
        max_participants: 12,
        is_anonymous: false,
        requires_approval: false,
        pathways: [],
        meeting_link: ''
      });
      onSuccess?.();
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
          <Plus className="w-5 h-5 mr-2" />
          Host a Gathering
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Host a Grace Porch Gathering</DialogTitle>
          <DialogDescription>
            Create a safe space for peer-to-peer support and connection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label>Gathering Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Morning Coffee & Connection"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will this gathering be about? What can participants expect?"
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Topic</Label>
              <Select value={formData.topic} onValueChange={(v) => setFormData({ ...formData, topic: v })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {topics.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.emoji} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Max Participants</Label>
              <Input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                className="mt-2"
                min={2}
                max={50}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <Select 
                value={String(formData.duration_minutes)} 
                onValueChange={(v) => setFormData({ ...formData, duration_minutes: parseInt(v) })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Meeting Link (Zoom, Teams, etc.)</Label>
            <Input
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              placeholder="https://zoom.us/j/..."
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll share this link only with registered participants
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="anonymous" 
                checked={formData.is_anonymous}
                onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
              />
              <Label htmlFor="anonymous" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Anonymous Gathering</span>
                </div>
                <p className="text-xs text-gray-500 font-normal">Participants can use display names only</p>
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox 
                id="approval" 
                checked={formData.requires_approval}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_approval: checked })}
              />
              <Label htmlFor="approval" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Require Approval</span>
                </div>
                <p className="text-xs text-gray-500 font-normal">You'll approve each registration</p>
              </Label>
            </div>
          </div>

          <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
            <h4 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Community Agreements
            </h4>
            <ul className="text-sm text-teal-800 space-y-1">
              <li>• Respect confidentiality - what's shared here stays here</li>
              <li>• Use person-first, stigma-free language</li>
              <li>• Listen with empathy, share from experience</li>
              <li>• Honor each person's journey and choices</li>
            </ul>
          </div>

          <Button 
            onClick={() => createGathering.mutate(formData)}
            disabled={!formData.title || !formData.scheduled_time || !formData.meeting_link || createGathering.isPending}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {createGathering.isPending ? 'Creating...' : 'Create Gathering'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GatheringCard({ gathering, user, onJoin }) {
  const topic = topics.find(t => t.id === gathering.topic);
  const isHost = user && gathering.host_email === user.email;
  const hasJoined = gathering.participants?.some(p => p.user_email === user?.email);
  const spotsLeft = gathering.max_participants - (gathering.participants?.length || 0);
  const isPast = new Date(gathering.scheduled_time) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <GraceCard className="relative overflow-hidden">
        {isHost && (
          <Badge className="absolute top-4 right-4 bg-purple-100 text-purple-700">
            You're Hosting
          </Badge>
        )}

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-3xl flex-shrink-0">
            {topic?.emoji || '☕'}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{gathering.title}</h3>
                <p className="text-sm text-gray-600">{topic?.label}</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4 line-clamp-2">{gathering.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(gathering.scheduled_time).toLocaleDateString('en-US', { 
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                })}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {gathering.duration_minutes} min
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {spotsLeft} spots left
              </Badge>
              {gathering.is_anonymous && (
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Anonymous
                </Badge>
              )}
            </div>

            {!isPast && (
              <div className="flex gap-2">
                {hasJoined ? (
                  <Button disabled className="flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    You're Registered
                  </Button>
                ) : spotsLeft > 0 ? (
                  <Button onClick={() => onJoin(gathering)} className="flex-1 bg-teal-600 hover:bg-teal-700">
                    <Users className="w-4 h-4 mr-2" />
                    Join Gathering
                  </Button>
                ) : (
                  <Button disabled className="flex-1">
                    Full
                  </Button>
                )}
              </div>
            )}

            {isPast && (
              <Badge variant="outline" className="text-gray-500">Completed</Badge>
            )}
          </div>
        </div>
      </GraceCard>
    </motion.div>
  );
}

export default function GracePorchGatherings() {
  const [user, setUser] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: gatherings = [] } = useQuery({
    queryKey: ['gracePorchGatherings'],
    queryFn: () => base44.entities.GracePorchGathering.list('-scheduled_time', 50),
    refetchInterval: 30000
  });

  const joinGathering = useMutation({
    mutationFn: async (gathering) => {
      const updatedParticipants = [
        ...(gathering.participants || []),
        {
          user_email: user.email,
          joined_at: new Date().toISOString(),
          status: 'registered'
        }
      ];
      return base44.entities.GracePorchGathering.update(gathering.id, {
        participants: updatedParticipants
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gracePorchGatherings']);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  });

  const upcomingGatherings = gatherings.filter(g => 
    new Date(g.scheduled_time) > new Date() &&
    (selectedTopic === 'all' || g.topic === selectedTopic)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <GraceHeader
          title="Grace Porch Gatherings"
          subtitle="Join moderated virtual discussions for peer-to-peer support and connection"
          icon={Coffee}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.emoji} {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {user && (
            <CreateGatheringDialog onSuccess={() => queryClient.invalidateQueries(['gracePorchGatherings'])} />
          )}
        </div>

        {/* Trust Banner */}
        <GraceCard gradient className="mb-8">
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-700">Moderated & Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span className="text-sm font-medium text-gray-700">Peer-Led Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Confidential</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Free & Accessible</span>
            </div>
          </div>
        </GraceCard>

        {/* Gatherings List */}
        {upcomingGatherings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingGatherings.map(gathering => (
              <GatheringCard
                key={gathering.id}
                gathering={gathering}
                user={user}
                onJoin={joinGathering.mutate}
              />
            ))}
          </div>
        ) : (
          <GraceCard className="text-center py-12">
            <Coffee className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Gatherings Scheduled Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to host a Grace Porch Gathering!
            </p>
            {user && (
              <CreateGatheringDialog onSuccess={() => queryClient.invalidateQueries(['gracePorchGatherings'])} />
            )}
          </GraceCard>
        )}
      </div>
    </div>
  );
}