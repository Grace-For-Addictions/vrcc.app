// ============================================================================
// DOMAIN: 2. Peer Support & Community
// PURPOSE: Community walls for celebrating wins (kudos, milestones, gratitude,
//          memorial posts). Includes reactions and anonymous posting.
// DEPENDENCIES: Post entity, Message entity
// ============================================================================

// ============================================================================
// DOMAIN: 2. Peer Support & Community
// PURPOSE: Community walls for celebrating wins (kudos, milestones, gratitude,
//          memorial posts). Includes reactions and anonymous posting.
// DEPENDENCIES: Post entity, Message entity
// ============================================================================

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Star, Award, Flame, Users, Plus, 
  Sparkles, MessageCircle, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';
import confetti from 'canvas-confetti';

const wallTypes = {
  kudos: { icon: Heart, color: 'from-rose-400 to-rose-600', label: 'Kudos', emoji: '💝' },
  honor: { icon: Award, color: 'from-amber-400 to-amber-600', label: 'Honor Wall', emoji: '🏆' },
  milestone: { icon: Star, color: 'from-purple-400 to-purple-600', label: 'Milestones', emoji: '⭐' },
  gratitude: { icon: Sparkles, color: 'from-teal-400 to-teal-600', label: 'Gratitude', emoji: '🙏' },
  memorial: { icon: Flame, color: 'from-gray-400 to-gray-600', label: 'Memorial', emoji: '🕯️' }
};

const reactionTypes = [
  { key: 'hearts', emoji: '❤️', label: 'Love' },
  { key: 'stars', emoji: '⭐', label: 'Amazing' },
  { key: 'flames', emoji: '🔥', label: 'Inspiring' },
  { key: 'prayers', emoji: '🙏', label: 'Prayers' }
];

function PostCard({ post, onReact }) {
  const wallConfig = wallTypes[post.wall_type] || wallTypes.kudos;
  const reactions = post.reactions || { hearts: 0, stars: 0, flames: 0, prayers: 0 };

  const handleReaction = (type) => {
    onReact(post.id, type);
    // Mini confetti for reactions
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#ec4899', '#f59e0b', '#ef4444', '#8b5cf6']
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      layout
      className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${wallConfig.color} flex items-center justify-center text-white text-lg`}>
          {wallConfig.emoji}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {post.is_anonymous ? 'Anonymous' : post.author_name}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(post.created_date).toLocaleDateString('en-US', { 
              month: 'short', day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>

      {/* Recipient (for kudos) */}
      {post.recipient_name && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-sm mb-4">
          <Heart className="w-4 h-4" />
          To: {post.recipient_name}
        </div>
      )}

      {/* Milestone badge */}
      {post.milestone_type && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm mb-4">
          <Star className="w-4 h-4" />
          {post.milestone_days || '30'} Days! 🎉
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        {reactionTypes.map(({ key, emoji, label }) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleReaction(key)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span>{emoji}</span>
            <span className="text-sm text-gray-600">{reactions[key] || 0}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function CreatePostDialog({ onSubmit }) {
  const [open, setOpen] = useState(false);
  const [wallType, setWallType] = useState('kudos');
  const [content, setContent] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    
    await onSubmit({
      wall_type: wallType,
      content,
      recipient_name: recipientName || null,
      is_anonymous: isAnonymous,
      reactions: { hearts: 0, stars: 0, flames: 0, prayers: 0 }
    });

    // Celebrate!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setContent('');
    setRecipientName('');
    setIsSubmitting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
          <Plus className="w-5 h-5 mr-2" />
          Share on the Wall
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share with the Community</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Wall Type</label>
            <Select value={wallType} onValueChange={setWallType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(wallTypes).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.emoji} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {wallType === 'kudos' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Who are you celebrating?</label>
              <Input
                placeholder="Their name..."
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Your message</label>
            <Textarea
              placeholder={
                wallType === 'kudos' ? "Share what makes them special..." :
                wallType === 'gratitude' ? "What are you grateful for today?" :
                wallType === 'milestone' ? "Celebrate your achievement!" :
                "Share your thoughts..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-600">Post anonymously</span>
          </label>

          <Button 
            onClick={handleSubmit} 
            disabled={!content.trim() || isSubmitting}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Posting...' : 'Post to Wall'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CommunityWalls() {
  const [activeWall, setActiveWall] = useState('all');
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 50),
    initialData: []
  });

  const createPost = useMutation({
    mutationFn: async (postData) => {
      const user = await base44.auth.me();
      return base44.entities.Post.create({
        ...postData,
        author_name: user?.full_name || 'Community Member'
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['posts'])
  });

  const reactToPost = useMutation({
    mutationFn: async ({ postId, reactionType }) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const newReactions = { ...post.reactions };
      newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
      
      return base44.entities.Post.update(postId, { reactions: newReactions });
    },
    onSuccess: () => queryClient.invalidateQueries(['posts'])
  });

  const filteredPosts = activeWall === 'all' 
    ? posts 
    : posts.filter(p => p.wall_type === activeWall);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Walls of Grace"
          subtitle="Celebrate wins, send kudos, share gratitude, and honor those we've lost. Your words uplift the whole community."
          icon={Heart}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <Tabs value={activeWall} onValueChange={setActiveWall}>
            <TabsList className="bg-white border flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              {Object.entries(wallTypes).map(([key, config]) => (
                <TabsTrigger key={key} value={key}>
                  {config.emoji} {config.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <CreatePostDialog onSubmit={createPost.mutateAsync} />
        </div>

        {/* Masonry-style grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          <AnimatePresence>
            {filteredPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                onReact={(postId, type) => reactToPost.mutate({ postId, reactionType: type })}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredPosts.length === 0 && !isLoading && (
          <GraceCard className="text-center py-12">
            <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No posts yet</h3>
            <p className="text-gray-500 mt-1">Be the first to share on the wall!</p>
          </GraceCard>
        )}
      </div>

      <GraceChatWidget />
    </div>
  );
}