import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Plus, Video, CheckCircle, MessageSquare, 
  Heart, Sparkles, BookOpen, Clock, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

const GFARC_PRINCIPLES = [
  "Grace is unearned favor",
  "Recovery is possible for everyone",
  "Community connection rewires the brain",
  "Progress over perfection",
  "Honesty, openness, and willingness",
  "Service to others strengthens recovery",
  "Every person has inherent worth",
  "Trauma-informed, stigma-free space"
];

const GFARC_VALUES = [
  "Unconditional acceptance",
  "Peer-led support",
  "Neuroplasticity-informed",
  "Justice involvement welcomed",
  "All pathways honored",
  "Free and accessible"
];

export default function MeetingManagement() {
  const [user, setUser] = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logFormData, setLogFormData] = useState({
    meeting_date: new Date().toISOString(),
    meeting_type: 'GFARC',
    meeting_format: 'virtual',
    did_share: false,
    meeting_topic: '',
    meeting_notes: '',
    is_favorite: false,
    meeting_duration_minutes: 60,
    location: '',
    virtual_link: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = '/';
      }
    };
    loadUser();
  }, []);

  const { data: upcomingMeetings } = useQuery({
    queryKey: ['upcomingMeetings'],
    queryFn: () => base44.entities.Event.filter({ 
      event_type: 'meeting' 
    }, '-start_time', 20),
    enabled: !!user,
    initialData: []
  });

  const { data: myMeetingLogs } = useQuery({
    queryKey: ['myMeetingLogs', user?.email],
    queryFn: () => base44.entities.MeetingLog.filter({ 
      user_email: user.email 
    }, '-meeting_date', 50),
    enabled: !!user,
    initialData: []
  });

  const logMeetingMutation = useMutation({
    mutationFn: (data) => base44.entities.MeetingLog.create({
      ...data,
      user_email: user.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myMeetingLogs']);
      toast.success('Meeting logged successfully!');
      setShowLogForm(false);
      setLogFormData({
        meeting_date: new Date().toISOString(),
        meeting_type: 'GFARC',
        meeting_format: 'virtual',
        did_share: false,
        meeting_topic: '',
        meeting_notes: '',
        is_favorite: false,
        meeting_duration_minutes: 60,
        location: '',
        virtual_link: ''
      });
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => base44.entities.MeetingLog.update(id, { is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myMeetingLogs']);
    }
  });

  if (!user) return null;

  const favoriteMeetings = myMeetingLogs.filter(m => m.is_favorite);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Meeting Management"
          subtitle="Lead meetings, track attendance, and access GFARC principles—all in one place"
          icon={Users}
        />

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
            <TabsTrigger value="log">Quick Log</TabsTrigger>
            <TabsTrigger value="history">My History</TabsTrigger>
            <TabsTrigger value="gfarc">GFARC Principles</TabsTrigger>
          </TabsList>

          {/* Upcoming Meetings */}
          <TabsContent value="upcoming">
            <div className="space-y-4">
              {upcomingMeetings.length === 0 ? (
                <GraceCard className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No upcoming meetings</h3>
                  <p className="text-gray-500 mt-1">Check the Events page for scheduled meetings</p>
                </GraceCard>
              ) : (
                upcomingMeetings.map((meeting) => (
                  <GraceCard key={meeting.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                          {meeting.format === 'virtual' && <Badge variant="outline">Virtual</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(meeting.start_time).toLocaleDateString('en-US', { 
                              weekday: 'short', month: 'short', day: 'numeric' 
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(meeting.start_time).toLocaleTimeString('en-US', { 
                              hour: 'numeric', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {meeting.virtual_link && (
                          <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700">
                            <a href={meeting.virtual_link} target="_blank" rel="noopener noreferrer">
                              <Video className="w-4 h-4 mr-2" />
                              Join
                            </a>
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setLogFormData({
                              ...logFormData,
                              meeting_date: meeting.start_time,
                              meeting_type: meeting.title.includes('GFARC') ? 'GFARC' : 'Other',
                              meeting_topic: meeting.title
                            });
                            setShowLogForm(true);
                          }}
                        >
                          Quick Log
                        </Button>
                      </div>
                    </div>
                  </GraceCard>
                ))
              )}
            </div>
          </TabsContent>

          {/* Quick Log */}
          <TabsContent value="log">
            <GraceCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Meeting Attendance</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Meeting Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={logFormData.meeting_date.slice(0, 16)}
                      onChange={(e) => setLogFormData({
                        ...logFormData,
                        meeting_date: new Date(e.target.value).toISOString()
                      })}
                    />
                  </div>

                  <div>
                    <Label>Meeting Type</Label>
                    <Select 
                      value={logFormData.meeting_type} 
                      onValueChange={(v) => setLogFormData({...logFormData, meeting_type: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GFARC">GFARC</SelectItem>
                        <SelectItem value="AA">AA</SelectItem>
                        <SelectItem value="NA">NA</SelectItem>
                        <SelectItem value="SMART Recovery">SMART Recovery</SelectItem>
                        <SelectItem value="Celebrate Recovery">Celebrate Recovery</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Format</Label>
                    <Select 
                      value={logFormData.meeting_format} 
                      onValueChange={(v) => setLogFormData({...logFormData, meeting_format: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="in_person">In-Person</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={logFormData.meeting_duration_minutes}
                      onChange={(e) => setLogFormData({
                        ...logFormData,
                        meeting_duration_minutes: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Meeting Topic</Label>
                  <Input
                    placeholder="e.g., Step 4, Gratitude, Resilience"
                    value={logFormData.meeting_topic}
                    onChange={(e) => setLogFormData({...logFormData, meeting_topic: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Notes & Takeaways</Label>
                  <Textarea
                    rows={4}
                    placeholder="What resonated with you? Key insights? Connections made?"
                    value={logFormData.meeting_notes}
                    onChange={(e) => setLogFormData({...logFormData, meeting_notes: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={logFormData.did_share}
                      onCheckedChange={(checked) => setLogFormData({...logFormData, did_share: checked})}
                    />
                    <Label>I shared/spoke at this meeting</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={logFormData.is_favorite}
                      onCheckedChange={(checked) => setLogFormData({...logFormData, is_favorite: checked})}
                    />
                    <Label className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" />
                      Favorite meeting
                    </Label>
                  </div>
                </div>

                <Button 
                  onClick={() => logMeetingMutation.mutate(logFormData)}
                  disabled={logMeetingMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {logMeetingMutation.isPending ? 'Logging...' : 'Log Meeting'}
                </Button>
              </div>
            </GraceCard>
          </TabsContent>

          {/* Meeting History */}
          <TabsContent value="history">
            <div className="space-y-4">
              {favoriteMeetings.length > 0 && (
                <GraceCard>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Favorite Meetings
                  </h3>
                  <div className="space-y-2">
                    {favoriteMeetings.map((meeting) => (
                      <div key={meeting.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{meeting.meeting_type}</p>
                            <p className="text-sm text-gray-600">{meeting.meeting_topic}</p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-800">Favorite</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </GraceCard>
              )}

              {myMeetingLogs.length === 0 ? (
                <GraceCard className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No meetings logged yet</h3>
                  <p className="text-gray-500 mt-1">Start tracking your meeting attendance</p>
                </GraceCard>
              ) : (
                myMeetingLogs.map((meeting) => (
                  <GraceCard key={meeting.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{meeting.meeting_type}</h3>
                          <Badge variant="outline">{meeting.meeting_format}</Badge>
                          {meeting.did_share && <Badge className="bg-green-100 text-green-700">Shared</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{meeting.meeting_topic}</p>
                        {meeting.meeting_notes && (
                          <p className="text-sm text-gray-500 mt-2">{meeting.meeting_notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(meeting.meeting_date).toLocaleDateString('en-US', { 
                            month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavoriteMutation.mutate({
                          id: meeting.id,
                          is_favorite: !meeting.is_favorite
                        })}
                      >
                        <Star className={`w-4 h-4 ${meeting.is_favorite ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                  </GraceCard>
                ))
              )}
            </div>
          </TabsContent>

          {/* GFARC Principles */}
          <TabsContent value="gfarc">
            <div className="space-y-6">
              <GraceCard gradient>
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-teal-600" />
                  <h3 className="text-xl font-bold text-gray-900">GFARC Core Principles</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {GFARC_PRINCIPLES.map((principle, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 bg-white rounded-lg border border-teal-100 shadow-sm"
                    >
                      <p className="text-gray-800">{principle}</p>
                    </motion.div>
                  ))}
                </div>
              </GraceCard>

              <GraceCard>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900">GFARC Values</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {GFARC_VALUES.map((value, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                    >
                      <p className="text-sm font-medium text-purple-900">{value}</p>
                    </motion.div>
                  ))}
                </div>
              </GraceCard>

              <GraceCard>
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Meeting Guidelines</h3>
                </div>
                <div className="prose prose-sm">
                  <ul className="text-gray-700 space-y-2">
                    <li>Create a safe, non-judgmental space for all participants</li>
                    <li>Honor confidentiality—what's shared here stays here</li>
                    <li>Practice active listening without cross-talk or advice-giving</li>
                    <li>Allow each person to share without interruption</li>
                    <li>Respect diverse recovery pathways and belief systems</li>
                    <li>Use person-first, stigma-free language</li>
                    <li>Acknowledge that recovery looks different for everyone</li>
                    <li>Celebrate progress and show up with compassion</li>
                  </ul>
                </div>
              </GraceCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}