import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FileText, Sparkles, Loader2, Save, Calendar, Users, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import GraceHeader from '@/components/common/GraceHeader';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

export default function SessionSummary() {
  const [user, setUser] = useState(null);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [sessionNotes, setSessionNotes] = useState('');
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

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const event = await base44.entities.Event.get(sessionId);
      return event;
    },
    enabled: !!sessionId && !!user
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateSessionSummary', {
        sessionId,
        sessionNotes
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['session', sessionId]);
      toast.success('Session summary generated!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate summary');
    }
  });

  if (!user || sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 p-8">
        <Card className="max-w-2xl mx-auto text-center py-12">
          <CardContent>
            <p className="text-gray-600">Session not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canGenerate = 
    session.created_by === user.email ||
    session.host_email === user.email ||
    session.moderator_emails?.includes(user.email) ||
    user.role === 'admin' ||
    user.user_role === 'administrator' ||
    user.user_role === 'moderator';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="mb-6">
          <Link to={createPageUrl('GroupSessions')}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Button>
          </Link>
        </div>

        <GraceHeader
          title={session.title}
          subtitle="Session Summary & Documentation"
          icon={FileText}
        />

        <div className="space-y-6">
          
          {/* Session Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(session.start_time), 'MMM d, yyyy • h:mm a')}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  {session.attendee_count || 0} participants
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Summary */}
          {session.session_summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    Session Summary
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Generated on {format(new Date(session.summary_generated_at), 'MMM d, yyyy • h:mm a')}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{session.session_summary}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Generate Summary */}
          {canGenerate && !session.session_summary && (
            <Card>
              <CardHeader>
                <CardTitle>Generate AI Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Session Notes (Optional)</Label>
                  <Textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Add any additional notes about what was discussed, decisions made, or action items..."
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    These notes will help the AI generate a more accurate summary
                  </p>
                </div>

                <Button
                  onClick={() => generateSummaryMutation.mutate()}
                  disabled={generateSummaryMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  {generateSummaryMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Summary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Summary with AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {!canGenerate && !session.session_summary && (
            <Card className="text-center py-8">
              <CardContent>
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">
                  Session summary will be available after the host generates it
                </p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}