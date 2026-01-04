import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Video, Play, Upload, Search, Filter, 
  Heart, Eye, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

export default function VideoLibrary() {
  const [user, setUser] = useState(null);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadMode, setUploadMode] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: videos } = useQuery({
    queryKey: ['videos', category],
    queryFn: async () => {
      const query = category === 'all' ? { moderation_status: 'approved' } : { category, moderation_status: 'approved' };
      return base44.entities.VideoContent.filter(query, '-created_date', 50);
    },
    initialData: []
  });

  const uploadVideo = useMutation({
    mutationFn: async (formData) => {
      // Upload video file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.file });
      
      // AI safety screening + transcript generation
      const aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this video title and description for safety concerns. Check for: stigmatizing language, punitive language, triggers, misinformation.
        
Title: ${formData.title}
Description: ${formData.description}

Identify neuroplasticity themes (connection, rewiring, hope, resilience, belonging).

Return JSON with: safety_score (0-100), flagged_content (array), neuroplasticity_tags (array).`,
        response_json_schema: {
          type: "object",
          properties: {
            safety_score: { type: "number" },
            flagged_content: { type: "array", items: { type: "string" } },
            neuroplasticity_tags: { type: "array", items: { type: "string" } }
          }
        }
      });

      return base44.entities.VideoContent.create({
        title: formData.title,
        description: formData.description,
        video_url: file_url,
        category: formData.category,
        coach_name: user?.full_name || 'Anonymous',
        ai_safety_score: aiAnalysis.safety_score,
        flagged_content: aiAnalysis.flagged_content || [],
        neuroplasticity_tags: aiAnalysis.neuroplasticity_tags || [],
        moderation_status: aiAnalysis.safety_score > 80 ? 'approved' : 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['videos']);
      setUploadMode(false);
    }
  });

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Video Library"
          subtitle="Coach-led workshops, meditations, and skills - all screened for grace-based, neuroplasticity-focused content"
          icon={Video}
        />

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="workshop">Workshops</SelectItem>
              <SelectItem value="meditation">Meditations</SelectItem>
              <SelectItem value="prevention">Prevention</SelectItem>
              <SelectItem value="skills">Skills</SelectItem>
              <SelectItem value="testimonial">Testimonials</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setUploadMode(!uploadMode)} className="bg-purple-600">
            <Upload className="w-4 h-4 mr-2" />
            Upload Video
          </Button>
        </div>

        {/* Upload Form */}
        {uploadMode && (
          <GraceCard className="mb-8">
            <h3 className="font-semibold text-lg mb-4">Upload New Video</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = {
                title: e.target.title.value,
                description: e.target.description.value,
                category: e.target.category.value,
                file: e.target.file.files[0]
              };
              uploadVideo.mutate(formData);
            }} className="space-y-4">
              <Input name="title" placeholder="Video Title" required />
              <Textarea name="description" placeholder="Description" rows={3} required />
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="meditation">Meditation</SelectItem>
                  <SelectItem value="prevention">Prevention</SelectItem>
                  <SelectItem value="skills">Skills Training</SelectItem>
                  <SelectItem value="testimonial">Testimonial</SelectItem>
                </SelectContent>
              </Select>
              <Input type="file" name="file" accept="video/*" required />
              <div className="flex gap-2">
                <Button type="submit" disabled={uploadVideo.isPending}>
                  {uploadVideo.isPending ? 'Uploading & Screening...' : 'Upload'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setUploadMode(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </GraceCard>
        )}

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <GraceCard key={video.id}>
              <div className="relative pb-[56.25%] bg-gray-200 rounded-lg mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-80" />
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{video.title}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-purple-100 text-purple-700">{video.category}</Badge>
                {video.neuroplasticity_tags?.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> {video.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" /> {video.likes}
                </span>
              </div>

              <Button className="w-full mt-4 bg-purple-600">
                <Play className="w-4 h-4 mr-2" />
                Watch Video
              </Button>
            </GraceCard>
          ))}
        </div>
      </div>

      <GraceChatWidget />
    </div>
  );
}