import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, Heart, Send, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';

export default function GFARCMeetingTrackerDashboard() {
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const queryClient = useQueryClient();

  const { data: meetings = [] } = useQuery({
    queryKey: ['gfarcMeetings'],
    queryFn: () => base44.entities.GFARCMeetingTracker.list('-meeting_date', 50)
  });

  const sendSurveyMutation = useMutation({
    mutationFn: async (meetingId) => {
      const response = await base44.functions.invoke('autoSendMeetingSurvey', {
        meeting_id: meetingId
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Surveys sent to ${data.surveys_sent} participants! 📊`);
    }
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentMeetings = meetings.filter(m => new Date(m.meeting_date) > thirtyDaysAgo);

  const totalParticipants = recentMeetings.reduce((sum, m) => sum + (m.participant_count || 0), 0);
  const avgConnectedness = meetings.length > 0
    ? (meetings.reduce((sum, m) => sum + (m.avg_connectedness_score || 0), 0) / meetings.length).toFixed(1)
    : 0;

  const meetingFrequencyDistribution = meetings.reduce((acc, m) => {
    acc[m.meeting_frequency] = (acc[m.meeting_frequency] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{recentMeetings.length}</p>
              <p className="text-xs text-gray-600">Meetings (30d)</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{totalParticipants}</p>
              <p className="text-xs text-gray-600">Participants (30d)</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-700">{avgConnectedness}/5</p>
              <p className="text-xs text-gray-600">Avg Connectedness</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {meetings.filter(m => m.quality_of_life_focus).length}
              </p>
              <p className="text-xs text-gray-600">QOL-Focused</p>
            </div>
          </div>
        </GraceCard>
      </div>

      <GraceCard>
        <CardHeader>
          <CardTitle>Agent 3: GFARC Meeting Tracker</CardTitle>
          <CardDescription>
            Track participant counts, meeting frequency, and social connectedness scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Meeting Frequency Distribution</h4>
              <div className="space-y-2">
                {Object.entries(meetingFrequencyDistribution).map(([freq, count]) => (
                  <div key={freq}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize">{freq}</span>
                      <span>{count} meetings</span>
                    </div>
                    <Progress value={(count / meetings.length) * 100} />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Meetings</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">
                          {meeting.meeting_type.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {meeting.participant_count} participants
                        </Badge>
                        {meeting.avg_connectedness_score && (
                          <Badge className="bg-teal-100 text-teal-700 text-xs">
                            {meeting.avg_connectedness_score.toFixed(1)}/5 connectedness
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendSurveyMutation.mutate(meeting.id)}
                      disabled={sendSurveyMutation.isPending}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Survey
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </GraceCard>

      <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-800">
          <strong>Healthy Community Impact:</strong> GFARC meetings demonstrate measurable increases in social connectedness (avg {avgConnectedness}/5), a key protective factor against substance use and a Quality of Life metric aligned with Polk County strategic priorities.
        </p>
      </div>
    </div>
  );
}