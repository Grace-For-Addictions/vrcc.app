import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Heart, ThumbsUp, Reply, Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function CommunityForum({ user, biomeType = 'general' }) {
  const [newPost, setNewPost] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();

  const { data: posts } = useQuery({
    queryKey: ['forumPosts', biomeType],
    queryFn: async () => {
      // Use Message entity for forum posts
      const messages = await base44.entities.Message.filter({
        message_type: 'forum_post',
        topic: biomeType
      }, '-created_date', 50);
      return messages;
    },
    initialData: []
  });

  const createPost = useMutation({
    mutationFn: async (content) => {
      // AI safety check
      const safetyCheck = await base44.integrations.Core.InvokeLLM({
        prompt: `Review this message for any crisis language, harmful content, or need for immediate support:

"${content}"

Is this safe for a peer recovery forum? Does it mention self-harm, suicide, or immediate danger?`,
        response_json_schema: {
          type: "object",
          properties: {
            is_safe: { type: "boolean" },
            concern_level: { type: "string" },
            suggested_resources: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (!safetyCheck.is_safe) {
        toast.error('This message may need immediate support. Please contact 988 or your coach.');
        return null;
      }

      return base44.entities.Message.create({
        message_type: 'forum_post',
        topic: biomeType,
        sender_name: user.full_name,
        sender_email: user.email,
        content: content,
        reactions: { hearts: 0, thumbs_up: 0 },
        reacted_by: []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forumPosts']);
      setNewPost('');
      toast.success('Post shared with community!');
    }
  });

  const addReaction = useMutation({
    mutationFn: async ({ postId, post, reactionType }) => {
      const reactions = post.reactions || { hearts: 0, thumbs_up: 0 };
      const reactedBy = post.reacted_by || [];
      
      if (reactedBy.includes(user.email)) {
        toast.error('You already reacted to this post');
        return;
      }

      reactions[reactionType] = (reactions[reactionType] || 0) + 1;
      reactedBy.push(user.email);

      return base44.entities.Message.update(postId, {
        reactions,
        reacted_by: reactedBy
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forumPosts']);
    }
  });

  const replyToPost = useMutation({
    mutationFn: (data) => base44.entities.Message.create({
      message_type: 'forum_reply',
      topic: biomeType,
      sender_name: user.full_name,
      sender_email: user.email,
      content: data.content,
      reply_to: data.parentId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['forumPosts']);
      setReplyTo(null);
      setReplyText('');
      toast.success('Reply posted!');
    }
  });

  return (
    <div className="space-y-6">
      {/* New Post */}
      <GraceCard>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-teal-600" />
          Community Forum
        </h3>
        <div className="space-y-3">
          <Textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your thoughts, experiences, or words of encouragement..."
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              💚 Be kind, supportive, and respectful. Crisis? Call 988.
            </p>
            <Button
              onClick={() => createPost.mutate(newPost)}
              disabled={!newPost.trim() || createPost.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Post
            </Button>
          </div>
        </div>
      </GraceCard>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post, idx) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <GraceCard hover={false}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👤</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{post.sender_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(post.created_date).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => addReaction.mutate({ postId: post.id, post, reactionType: 'hearts' })}
                      disabled={post.reacted_by?.includes(user.email)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{post.reactions?.hearts || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => addReaction.mutate({ postId: post.id, post, reactionType: 'thumbs_up' })}
                      disabled={post.reacted_by?.includes(user.email)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{post.reactions?.thumbs_up || 0}</span>
                    </button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setReplyTo(post)}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-teal-600 transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                          Reply
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reply to {post.sender_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{post.content}</p>
                          </div>
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            rows={3}
                          />
                          <Button
                            onClick={() => replyToPost.mutate({ content: replyText, parentId: post.id })}
                            disabled={!replyText.trim() || replyToPost.isPending}
                            className="w-full bg-teal-600 hover:bg-teal-700"
                          >
                            Post Reply
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </GraceCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}