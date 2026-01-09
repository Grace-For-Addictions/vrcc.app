import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, Shield, Heart, Share2, CheckCircle, 
  Clock, MessageCircle, Sparkles, Eye, FileText, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function SponsorConnection({ user }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [checkInNote, setCheckInNote] = useState('');
  const queryClient = useQueryClient();

  // Fetch my connections where I'm the mentee
  const { data: mySponsors } = useQuery({
    queryKey: ['mySponsors', user?.email],
    queryFn: () => base44.entities.SponsorConnection.filter({ 
      mentee_email: user.email,
      status: 'active'
    }),
    enabled: !!user,
    initialData: []
  });

  // Fetch my connections where I'm the sponsor
  const { data: myMentees } = useQuery({
    queryKey: ['myMentees', user?.email],
    queryFn: () => base44.entities.SponsorConnection.filter({ 
      sponsor_email: user.email,
      status: 'active'
    }),
    enabled: !!user,
    initialData: []
  });

  // Fetch AI-suggested matches
  const { data: suggestedMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['suggestedMatches', user?.email],
    queryFn: async () => {
      // Get all users willing to be sponsors (using UserProfile)
      const profiles = await base44.entities.UserProfile.list('-created_date', 100);
      const myProfile = profiles.find(p => p.created_by === user.email);
      
      if (!myProfile) return [];

      // Use AI to match
      const matches = await base44.integrations.Core.InvokeLLM({
        prompt: `Match this user with potential sponsors/mentors based on shared interests and recovery pathways.

MY PROFILE:
- Stage: ${myProfile.stage}
- Pathways: ${myProfile.pathways?.join(', ') || 'Not specified'}
- My Why: ${myProfile.my_why || 'Not specified'}
- County: ${myProfile.county || 'Not specified'}

AVAILABLE SPONSORS (sample):
${profiles.slice(0, 20).filter(p => p.created_by !== user.email).map(p => 
  `- Email: ${p.created_by}, Stage: ${p.stage}, Pathways: ${p.pathways?.join(', ')}`
).join('\n')}

Return top 3 matches with compatibility scores and shared interests.`,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  match_score: { type: "number" },
                  shared_interests: { type: "array", items: { type: "string" } },
                  why_good_match: { type: "string" }
                }
              }
            }
          }
        }
      });

      return matches.matches || [];
    },
    enabled: !!user,
    initialData: []
  });

  const requestConnectionMutation = useMutation({
    mutationFn: (sponsorEmail) => base44.entities.SponsorConnection.create({
      mentee_email: user.email,
      sponsor_email: sponsorEmail,
      connection_type: 'sponsor',
      status: 'pending',
      connection_date: new Date().toISOString(),
      ai_match_score: selectedMatch?.match_score || 0,
      shared_interests: selectedMatch?.shared_interests || []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['mySponsors']);
      toast.success('Connection request sent!');
      setSelectedMatch(null);
    }
  });

  const addCheckInNoteMutation = useMutation({
    mutationFn: ({ connectionId, note }) => {
      return base44.entities.SponsorConnection.update(connectionId, {
        check_in_notes: [
          ...(myMentees.find(m => m.id === connectionId)?.check_in_notes || []),
          {
            date: new Date().toISOString(),
            note,
            sponsor_email: user.email
          }
        ],
        last_check_in: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myMentees']);
      toast.success('Check-in note added');
      setCheckInNote('');
    }
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ connectionId, permissions }) => 
      base44.entities.SponsorConnection.update(connectionId, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries(['mySponsors']);
      toast.success('Permissions updated');
    }
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Sponsor & Mentor Connections
            </h3>
            <p className="text-gray-600">
              Build accountability partnerships with AI-matched support
            </p>
          </div>
        </div>
      </GraceCard>

      <Tabs defaultValue="my-sponsors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-sponsors">My Sponsors</TabsTrigger>
          <TabsTrigger value="my-mentees">People I Support</TabsTrigger>
          <TabsTrigger value="find-match">
            <Sparkles className="w-4 h-4 mr-2" />
            Find Match
          </TabsTrigger>
        </TabsList>

        {/* My Sponsors */}
        <TabsContent value="my-sponsors">
          <div className="space-y-4">
            {mySponsors.length === 0 ? (
              <GraceCard className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No sponsor connections yet</h3>
                <p className="text-gray-500 mt-1">Find an AI-matched sponsor to support your journey</p>
              </GraceCard>
            ) : (
              mySponsors.map((connection) => (
                <GraceCard key={connection.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{connection.sponsor_email}</h4>
                        <Badge>{connection.connection_type}</Badge>
                        {connection.ai_match_score > 80 && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Great Match
                          </Badge>
                        )}
                      </div>
                      {connection.shared_interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {connection.shared_interests.map((interest, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{interest}</Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-500">
                        Connected since {new Date(connection.connection_date).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Permissions
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>What can your sponsor see?</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={connection.permissions?.view_progress}
                              onCheckedChange={(checked) => 
                                updatePermissionsMutation.mutate({
                                  connectionId: connection.id,
                                  permissions: { ...connection.permissions, view_progress: checked }
                                })
                              }
                            />
                            <Label>View my progress dashboard</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={connection.permissions?.view_assessments}
                              onCheckedChange={(checked) =>
                                updatePermissionsMutation.mutate({
                                  connectionId: connection.id,
                                  permissions: { ...connection.permissions, view_assessments: checked }
                                })
                              }
                            />
                            <Label>View my BARC-10 assessments</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={connection.permissions?.view_check_ins}
                              onCheckedChange={(checked) =>
                                updatePermissionsMutation.mutate({
                                  connectionId: connection.id,
                                  permissions: { ...connection.permissions, view_check_ins: checked }
                                })
                              }
                            />
                            <Label>View my daily check-ins</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={connection.permissions?.view_goals}
                              onCheckedChange={(checked) =>
                                updatePermissionsMutation.mutate({
                                  connectionId: connection.id,
                                  permissions: { ...connection.permissions, view_goals: checked }
                                })
                              }
                            />
                            <Label>View my recovery goals</Label>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </GraceCard>
              ))
            )}
          </div>
        </TabsContent>

        {/* My Mentees */}
        <TabsContent value="my-mentees">
          <div className="space-y-4">
            {myMentees.length === 0 ? (
              <GraceCard className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">Not sponsoring anyone yet</h3>
                <p className="text-gray-500 mt-1">Share your experience by becoming a sponsor</p>
              </GraceCard>
            ) : (
              myMentees.map((connection) => (
                <GraceCard key={connection.id}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{connection.mentee_email}</h4>
                        <p className="text-sm text-gray-500">
                          Last check-in: {connection.last_check_in 
                            ? new Date(connection.last_check_in).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        Mentee
                      </Badge>
                    </div>

                    {/* Quick Check-in Note */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">Add Quick Check-in Note</Label>
                      <Textarea
                        placeholder="Brief note about today's check-in..."
                        rows={2}
                        value={checkInNote}
                        onChange={(e) => setCheckInNote(e.target.value)}
                        className="mb-2"
                      />
                      <Button
                        size="sm"
                        onClick={() => addCheckInNoteMutation.mutate({
                          connectionId: connection.id,
                          note: checkInNote
                        })}
                        disabled={!checkInNote.trim()}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Save Note
                      </Button>
                    </div>

                    {/* Recent Notes */}
                    {connection.check_in_notes?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Notes</h5>
                        <div className="space-y-2">
                          {connection.check_in_notes.slice(-3).reverse().map((note, idx) => (
                            <div key={idx} className="text-xs p-2 bg-gray-50 rounded">
                              <p className="text-gray-600">{note.note}</p>
                              <p className="text-gray-400 mt-1">
                                {new Date(note.date).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </GraceCard>
              ))
            )}
          </div>
        </TabsContent>

        {/* Find Match */}
        <TabsContent value="find-match">
          <div className="space-y-4">
            {matchesLoading ? (
              <GraceCard className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto text-purple-400 mb-4 animate-pulse" />
                <p className="text-gray-600">Finding your perfect matches...</p>
              </GraceCard>
            ) : suggestedMatches.length === 0 ? (
              <GraceCard className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No matches found</h3>
                <p className="text-gray-500 mt-1">Complete your profile to get AI-matched sponsors</p>
              </GraceCard>
            ) : (
              suggestedMatches.map((match, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <GraceCard className="border-2 border-purple-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{match.email}</h4>
                          <Badge className="bg-purple-100 text-purple-800">
                            {match.match_score}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{match.why_good_match}</p>
                        {match.shared_interests?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {match.shared_interests.map((interest, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedMatch(match);
                          requestConnectionMutation.mutate(match.email);
                        }}
                        disabled={requestConnectionMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Request Connection
                      </Button>
                    </div>
                  </GraceCard>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}