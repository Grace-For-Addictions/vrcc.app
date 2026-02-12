import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Video, Calendar, Clock, Users, MapPin, ExternalLink,
  UserPlus, UserMinus, Tag, BookOpen, Loader2, Plus, Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceHeader from '@/components/common/GraceHeader';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GroupSessions() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['groupSessions'],
    queryFn: () => base44.entities.Event.list('-start_time'),
    enabled: !!user
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (eventId) => {
      const event = events.find(e => e.id === eventId);
      const updatedAttendees = [...(event.attendee_ids || [])];
      if (!updatedAttendees.includes(user.email)) {
        updatedAttendees.push(user.email);
      }
      return base44.entities.Event.update(eventId, {
        attendee_ids: updatedAttendees,
        attendee_count: updatedAttendees.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupSessions']);
      toast.success('You\'ve joined the session!');
    }
  });

  const leaveSessionMutation = useMutation({
    mutationFn: async (eventId) => {
      const event = events.find(e => e.id === eventId);
      const updatedAttendees = (event.attendee_ids || []).filter(id => id !== user.email);
      return base44.entities.Event.update(eventId, {
        attendee_ids: updatedAttendees,
        attendee_count: updatedAttendees.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupSessions']);
      toast.success('You\'ve left the session');
    }
  });

  const now = new Date();
  const allGroupSessions = events.filter(e => 
    e.session_status !== 'cancelled' &&
    (e.event_type === 'support_group' || e.event_type === 'peer_circle' || e.event_type === 'recovery_group' || e.event_type === 'meeting')
  );

  // Get all unique topics for filter
  const allTopics = [...new Set(allGroupSessions.flatMap(e => e.session_topics || []))];

  // Apply filters
  let filteredSessions = allGroupSessions;

  // Search filter
  if (searchQuery) {
    filteredSessions = filteredSessions.filter(e =>
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.session_topics?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Type filter
  if (filterType !== 'all') {
    filteredSessions = filteredSessions.filter(e => e.event_type === filterType);
  }

  // Topic filter
  if (filterTopic !== 'all') {
    filteredSessions = filteredSessions.filter(e => 
      e.session_topics?.includes(filterTopic)
    );
  }

  // Date filter
  if (filterDate === 'today') {
    filteredSessions = filteredSessions.filter(e => {
      const sessionDate = new Date(e.start_time);
      return sessionDate.toDateString() === now.toDateString();
    });
  } else if (filterDate === 'this_week') {
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    filteredSessions = filteredSessions.filter(e => {
      const sessionDate = new Date(e.start_time);
      return sessionDate >= now && sessionDate <= weekFromNow;
    });
  } else if (filterDate === 'upcoming') {
    filteredSessions = filteredSessions.filter(e => new Date(e.start_time) > now);
  } else if (filterDate === 'past') {
    filteredSessions = filteredSessions.filter(e => new Date(e.start_time) <= now);
  }

  const upcomingSessions = filteredSessions.filter(e => new Date(e.start_time) > now);
  const mySessions = upcomingSessions.filter(e => e.attendee_ids?.includes(user?.email));

  const canModerate = (event) => {
    return user && (
      event.created_by === user.email ||
      event.host_email === user.email ||
      event.moderator_emails?.includes(user.email) ||
      user.role === 'admin'
    );
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="flex items-center justify-between mb-8">
          <GraceHeader
            title="Group Sessions"
            subtitle="Join peer support circles and recovery groups"
            icon={Users}
          />
          {(user?.role === 'admin' || ['peer_coach', 'navigator', 'moderator', 'administrator'].includes(user?.user_role)) && (
            <Link to={createPageUrl('ManageSessions')}>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Session
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search sessions, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Session Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="support_group">Support Group</SelectItem>
                  <SelectItem value="peer_circle">Peer Circle</SelectItem>
                  <SelectItem value="recovery_group">Recovery Group</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTopic} onValueChange={setFilterTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {allTopics.map(topic => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger>
                  <SelectValue placeholder="When" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past Sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || filterType !== 'all' || filterTopic !== 'all' || filterDate !== 'all') && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline">
                  {filteredSessions.length} results
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterTopic('all');
                    setFilterDate('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">
              All Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="my-sessions">
              My Sessions ({mySessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingSessions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming sessions scheduled yet</p>
                </CardContent>
              </Card>
            ) : (
              upcomingSessions.map((event, idx) => (
                <SessionCard
                  key={event.id}
                  event={event}
                  user={user}
                  canModerate={canModerate(event)}
                  onJoin={() => joinSessionMutation.mutate(event.id)}
                  onLeave={() => leaveSessionMutation.mutate(event.id)}
                  delay={idx * 0.1}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="my-sessions" className="space-y-4">
            {mySessions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">You haven't joined any sessions yet</p>
                  <Button onClick={() => document.querySelector('[value="upcoming"]').click()}>
                    Browse Sessions
                  </Button>
                </CardContent>
              </Card>
            ) : (
              mySessions.map((event, idx) => (
                <SessionCard
                  key={event.id}
                  event={event}
                  user={user}
                  canModerate={canModerate(event)}
                  onJoin={() => joinSessionMutation.mutate(event.id)}
                  onLeave={() => leaveSessionMutation.mutate(event.id)}
                  delay={idx * 0.1}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}

function SessionCard({ event, user, canModerate, onJoin, onLeave, delay }) {
  const isJoined = event.attendee_ids?.includes(user.email);
  const isFull = event.max_attendees && event.attendee_count >= event.max_attendees;
  const sessionTime = new Date(event.start_time);
  const isToday = sessionTime.toDateString() === new Date().toDateString();
  const isLive = new Date() >= sessionTime && new Date() <= new Date(event.end_time);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={`hover:shadow-lg transition-all ${isLive ? 'border-2 border-green-500' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isLive && (
                  <Badge className="bg-green-600 animate-pulse">
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    LIVE NOW
                  </Badge>
                )}
                <Badge variant="outline">{event.event_type.replace(/_/g, ' ')}</Badge>
                {isJoined && <Badge className="bg-teal-600">Registered</Badge>}
              </div>
              <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
              <CardDescription>{event.description}</CardDescription>
            </div>
            {event.image_url && (
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          
          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              {format(sessionTime, 'MMM d, yyyy')}
              {isToday && <span className="text-teal-600 font-medium ml-1">Today</span>}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              {format(sessionTime, 'h:mm a')}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              {event.attendee_count || 0} registered
              {event.max_attendees && ` / ${event.max_attendees} max`}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              {event.is_virtual ? 'Virtual' : event.location}
            </div>
          </div>

          {/* Topics */}
          {event.session_topics && event.session_topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.session_topics.map((topic, idx) => (
                <Badge key={idx} variant="outline" className="bg-purple-50">
                  <Tag className="w-3 h-3 mr-1" />
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          {/* Related Content */}
          {(event.related_video_ids?.length > 0 || event.related_resource_ids?.length > 0) && (
            <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {event.related_video_ids?.length > 0 && (
                <div className="flex items-center gap-1">
                  <Video className="w-4 h-4 text-purple-600" />
                  {event.related_video_ids.length} videos
                </div>
              )}
              {event.related_resource_ids?.length > 0 && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  {event.related_resource_ids.length} resources
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {isJoined ? (
              <>
                {event.meeting_link && (
                  <a 
                    href={event.meeting_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {isLive ? 'Join Now' : 'Get Link'}
                    </Button>
                  </a>
                )}
                <Button 
                  variant="outline"
                  onClick={onLeave}
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Leave
                </Button>
              </>
            ) : (
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={onJoin}
                disabled={isFull}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isFull ? 'Session Full' : 'Register'}
              </Button>
            )}
            
            {canModerate && (
              <Link to={createPageUrl(`ManageSessions?session=${event.id}`)}>
                <Button variant="outline">
                  Manage
                </Button>
              </Link>
            )}
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}