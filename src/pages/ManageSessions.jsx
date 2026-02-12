import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, Save, Trash2, Video, BookOpen, X, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import GraceHeader from '@/components/common/GraceHeader';
import VirtualMeetingLinks from '@/components/events/VirtualMeetingLinks';
import { toast } from 'sonner';

export default function ManageSessions() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'support_group',
    start_time: '',
    end_time: '',
    meeting_link: '',
    max_attendees: '',
    session_topics: [],
    related_video_ids: [],
    related_resource_ids: [],
    moderator_emails: [],
    registration_required: false
  });
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentModerator, setCurrentModerator] = useState('');
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        // Check if user has permission to create sessions
        const canCreate = 
          currentUser.role === 'admin' ||
          ['peer_coach', 'navigator', 'moderator', 'administrator'].includes(currentUser.user_role);
        
        if (!canCreate) {
          toast.error('You do not have permission to create sessions');
          window.location.href = createPageUrl('GroupSessions');
          return;
        }
        
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: videos = [] } = useQuery({
    queryKey: ['videos'],
    queryFn: () => base44.entities.VideoContent.list(),
    enabled: !!user
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list(),
    enabled: !!user
  });

  const createSessionMutation = useMutation({
    mutationFn: (sessionData) => base44.entities.Event.create({
      ...sessionData,
      host_email: user.email,
      host_name: user.full_name,
      is_virtual: true,
      session_status: 'scheduled',
      attendee_count: 0,
      attendee_ids: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupSessions']);
      toast.success('Session created successfully!');
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'support_group',
      start_time: '',
      end_time: '',
      meeting_link: '',
      max_attendees: '',
      session_topics: [],
      related_video_ids: [],
      related_resource_ids: [],
      moderator_emails: [],
      registration_required: false
    });
    setSelectedVideos([]);
    setSelectedResources([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start_time) {
      toast.error('Please fill in required fields');
      return;
    }

    createSessionMutation.mutate({
      ...formData,
      max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null
    });
  };

  const addTopic = () => {
    if (currentTopic.trim()) {
      setFormData(prev => ({
        ...prev,
        session_topics: [...prev.session_topics, currentTopic.trim()]
      }));
      setCurrentTopic('');
    }
  };

  const removeTopic = (topic) => {
    setFormData(prev => ({
      ...prev,
      session_topics: prev.session_topics.filter(t => t !== topic)
    }));
  };

  const addModerator = () => {
    if (currentModerator.trim() && currentModerator.includes('@')) {
      setFormData(prev => ({
        ...prev,
        moderator_emails: [...prev.moderator_emails, currentModerator.trim()]
      }));
      setCurrentModerator('');
    }
  };

  const removeModerator = (email) => {
    setFormData(prev => ({
      ...prev,
      moderator_emails: prev.moderator_emails.filter(e => e !== email)
    }));
  };

  const toggleVideo = (videoId) => {
    setSelectedVideos(prev => {
      const updated = prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId];
      setFormData(f => ({ ...f, related_video_ids: updated }));
      return updated;
    });
  };

  const toggleResource = (resourceId) => {
    setSelectedResources(prev => {
      const updated = prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId];
      setFormData(f => ({ ...f, related_resource_ids: updated }));
      return updated;
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <GraceHeader
          title="Create Group Session"
          subtitle="Schedule a peer support circle or recovery group"
          icon={Plus}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Virtual Meeting Resources */}
                <VirtualMeetingLinks />
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label>Session Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g., Morning Recovery Circle"
                      required
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="What will participants experience in this session?"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Session Type *</Label>
                      <Select 
                        value={formData.event_type}
                        onValueChange={(value) => setFormData({...formData, event_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="support_group">Support Group</SelectItem>
                          <SelectItem value="peer_circle">Peer Circle</SelectItem>
                          <SelectItem value="recovery_group">Recovery Group</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Max Attendees</Label>
                      <Input
                        type="number"
                        value={formData.max_attendees}
                        onChange={(e) => setFormData({...formData, max_attendees: e.target.value})}
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Time *</Label>
                      <Input
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="datetime-local"
                        value={formData.end_time}
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Video Conference Link</Label>
                    <Input
                      type="url"
                      value={formData.meeting_link}
                      onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.registration_required}
                      onCheckedChange={(checked) => setFormData({...formData, registration_required: checked})}
                    />
                    <Label>Registration required to join</Label>
                  </div>
                </div>

                {/* Topics */}
                <div>
                  <Label>Session Topics</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={currentTopic}
                      onChange={(e) => setCurrentTopic(e.target.value)}
                      placeholder="Add a topic"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                    />
                    <Button type="button" onClick={addTopic} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.session_topics.map((topic, idx) => (
                      <Badge key={idx} className="bg-purple-600">
                        {topic}
                        <button
                          type="button"
                          onClick={() => removeTopic(topic)}
                          className="ml-2 hover:text-red-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Moderators */}
                <div>
                  <Label>Additional Moderators</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="email"
                      value={currentModerator}
                      onChange={(e) => setCurrentModerator(e.target.value)}
                      placeholder="moderator@email.com"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addModerator())}
                    />
                    <Button type="button" onClick={addModerator} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.moderator_emails.map((email, idx) => (
                      <Badge key={idx} variant="outline">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeModerator(email)}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Related Videos */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Video className="w-4 h-4 text-purple-600" />
                    Related Videos
                  </Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                    {videos.slice(0, 20).map(video => (
                      <div key={video.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedVideos.includes(video.id)}
                          onCheckedChange={() => toggleVideo(video.id)}
                        />
                        <label className="text-sm truncate">{video.title}</label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {selectedVideos.length}
                  </p>
                </div>

                {/* Related Resources */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    Related Resources
                  </Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                    {resources.slice(0, 20).map(resource => (
                      <div key={resource.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedResources.includes(resource.id)}
                          onCheckedChange={() => toggleResource(resource.id)}
                        />
                        <label className="text-sm truncate">{resource.name}</label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {selectedResources.length}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                    disabled={createSessionMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}