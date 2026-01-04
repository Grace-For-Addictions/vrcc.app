import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Video, Calendar, Users, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

export default function MeetingsHub() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: summaries } = useQuery({
    queryKey: ['meetingSummaries'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.MeetingSummary.filter(
        { attendee_emails: { $in: [user.email] } },
        '-meeting_date',
        20
      );
    },
    enabled: !!user,
    initialData: []
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Virtual Meetings Hub"
          subtitle="Zoom, RingCentral, Meet, Teams integration - AI summaries & insights tied to Your Why"
          icon={Video}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <GraceCard>
            <h3 className="font-semibold text-gray-900 mb-4">Start a Meeting</h3>
            <div className="space-y-3">
              <Button className="w-full bg-blue-600">
                <Video className="w-4 h-4 mr-2" />
                Start Zoom Meeting
              </Button>
              <Button variant="outline" className="w-full">
                Schedule Meeting
              </Button>
            </div>
          </GraceCard>

          <GraceCard>
            <h3 className="font-semibold text-gray-900 mb-4">Meeting Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Meetings Attended</span>
                <span className="font-semibold">{summaries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Hours</span>
                <span className="font-semibold">
                  {Math.round(summaries.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60)}h
                </span>
              </div>
            </div>
          </GraceCard>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Meetings</h3>
        <div className="space-y-4">
          {summaries.map((meeting) => (
            <GraceCard key={meeting.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Video className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{meeting.meeting_title}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge>{meeting.meeting_platform}</Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(meeting.meeting_date).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {meeting.duration_minutes} min • {meeting.attendee_count} attendees
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Summary
                </Button>
              </div>

              {meeting.ai_summary && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-sm text-indigo-900">
                    <strong>AI Summary:</strong> {meeting.ai_summary}
                  </p>
                </div>
              )}

              {meeting.neuroplasticity_themes?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {meeting.neuroplasticity_themes.map((theme, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      🧠 {theme}
                    </Badge>
                  ))}
                </div>
              )}
            </GraceCard>
          ))}
        </div>
      </div>

      <GraceChatWidget />
    </div>
  );
}