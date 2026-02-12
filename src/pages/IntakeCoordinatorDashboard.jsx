// ============================================================================
// DOMAIN: 3. Intake & Triage
// PURPOSE: Intake coordinator dashboard for welcoming new participants, creating
//          connection pathways, and 48-hour follow-up tracking (warm handoffs).
// DEPENDENCIES: UserProfile entity, Referral entity, IntakeReview entity
// ============================================================================

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Sprout, Users, Home, Heart, Clock, CheckCircle2,
  User, Phone, Mail, MessageCircle, Send, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function IntakeCoordinatorDashboard() {
  const [user, setUser] = useState(null);
  const [selectedGardener, setSelectedGardener] = useState(null);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  // Fetch gardeners needing tending (recent profiles without referrals)
  const { data: recentGardeners = [] } = useQuery({
    queryKey: ['recentGardeners'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list('-created_date', 50);
      return profiles;
    }
  });

  // Fetch active referrals created by this coordinator
  const { data: activeReferrals = [] } = useQuery({
    queryKey: ['intakeReferrals'],
    queryFn: async () => {
      if (!user) return [];
      const referrals = await base44.entities.Referral.filter({ 
        referred_by: user.email,
        status: ['pending', 'accepted']
      });
      return referrals;
    },
    enabled: !!user
  });

  // Fetch follow-up tasks (referrals needing 48-hour check-in)
  const { data: followUpTasks = [] } = useQuery({
    queryKey: ['followUpTasks'],
    queryFn: async () => {
      if (!user) return [];
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const referrals = await base44.entities.Referral.filter({ 
        referred_by: user.email,
        status: 'accepted'
      });
      
      return referrals.filter(r => {
        const createdDate = new Date(r.created_date);
        return createdDate <= twoDaysAgo && !r.follow_up_completed;
      });
    },
    enabled: !!user
  });

  const createReferralMutation = useMutation({
    mutationFn: async (referralData) => {
      return base44.entities.Referral.create(referralData);
    },
    onSuccess: () => {
      toast.success('Connection pathway created with grace');
      setReferralDialogOpen(false);
      setSelectedGardener(null);
      queryClient.invalidateQueries(['intakeReferrals']);
    }
  });

  const completeFollowUpMutation = useMutation({
    mutationFn: async ({ id, notes }) => {
      return base44.entities.Referral.update(id, {
        follow_up_completed: true,
        follow_up_notes: notes,
        follow_up_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Tending moment recorded');
      queryClient.invalidateQueries(['followUpTasks', 'intakeReferrals']);
    }
  });

  const ReferralForm = ({ gardener }) => {
    const [referralType, setReferralType] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
      if (!referralType) {
        toast.error('Please select a connection pathway');
        return;
      }

      createReferralMutation.mutate({
        participant_email: gardener.created_by,
        participant_name: gardener.created_by,
        referral_type: referralType,
        referred_by: user.email,
        referred_to: referralType === 'resource_navigator' ? 'Resource Navigator' : 'Service Team',
        status: 'pending',
        notes: notes,
        urgency: 'routine'
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <Label>Connection Pathway</Label>
          <Select value={referralType} onValueChange={setReferralType}>
            <SelectTrigger>
              <SelectValue placeholder="Where does this gardener need tending?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="peer_coaching">Guided Cultivation (Peer Coaching)</SelectItem>
              <SelectItem value="recovery_housing">Shelter & Roots (Recovery Housing)</SelectItem>
              <SelectItem value="resource_navigator">Pathway Guide (Resource Navigator)</SelectItem>
              <SelectItem value="peer_support">Shared Soil (Peer Support)</SelectItem>
              <SelectItem value="sober_living">Stable Ground (Sober Living)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tending Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What needs tending? What strengths did you notice? Any preferences they shared?"
            rows={4}
          />
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={createReferralMutation.isPending}
          className="w-full bg-teal-600 hover:bg-teal-700"
        >
          <Send className="w-4 h-4 mr-2" />
          Create Connection Pathway
        </Button>
      </div>
    );
  };

  const GardenerCard = ({ profile }) => {
    const daysInGarden = Math.floor((new Date() - new Date(profile.created_date)) / (1000 * 60 * 60 * 24));

    return (
      <GraceCard hover className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{profile.created_by}</h4>
              <p className="text-sm text-gray-500">In the garden for {daysInGarden} days</p>
              {profile.pathways && profile.pathways.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {profile.pathways.slice(0, 3).map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Dialog open={referralDialogOpen && selectedGardener?.id === profile.id} onOpenChange={(open) => {
            setReferralDialogOpen(open);
            if (!open) setSelectedGardener(null);
          }}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedGardener(profile)}
              >
                <Heart className="w-4 h-4 mr-1" />
                Create Connection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Connection Pathway</DialogTitle>
              </DialogHeader>
              <ReferralForm gardener={profile} />
            </DialogContent>
          </Dialog>
        </div>
      </GraceCard>
    );
  };

  const FollowUpCard = ({ referral }) => {
    const [followUpNotes, setFollowUpNotes] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleComplete = () => {
      completeFollowUpMutation.mutate({
        id: referral.id,
        notes: followUpNotes
      });
      setDialogOpen(false);
    };

    return (
      <GraceCard className="bg-amber-50 border-amber-200">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">{referral.participant_email}</h4>
            <p className="text-sm text-gray-600 mt-1">
              Connected to: {referral.referral_type?.replace(/_/g, ' ')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Created {Math.floor((new Date() - new Date(referral.created_date)) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Calendar className="w-4 h-4 mr-1" />
                Complete Tending
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>48-Hour Tending Check-In</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>How is this connection growing?</Label>
                  <Textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="Did the gardener connect? How are they feeling? Any adjustments needed?"
                    rows={4}
                  />
                </div>
                <Button onClick={handleComplete} className="w-full bg-teal-600 hover:bg-teal-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Record Tending Moment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </GraceCard>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader
          title="Intake Tending Garden"
          subtitle="Welcome gardeners with grace, create warm connections, and ensure no one tends alone"
          icon={Sprout}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard gradient>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{recentGardeners.length}</p>
                <p className="text-sm text-gray-600">New Gardeners This Season</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard gradient>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeReferrals.length}</p>
                <p className="text-sm text-gray-600">Active Connection Pathways</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard gradient>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{followUpTasks.length}</p>
                <p className="text-sm text-gray-600">Tending Moments Due</p>
              </div>
            </div>
          </GraceCard>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="new" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="new">New Gardeners</TabsTrigger>
            <TabsTrigger value="active">Active Pathways</TabsTrigger>
            <TabsTrigger value="followup">Tending Due</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Welcome New Gardeners</CardTitle>
                <p className="text-sm text-gray-600">
                  Reach out with warmth, guide them to their intake form, and create connection pathways as they share their needs
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentGardeners.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No new gardeners at this moment. The garden is peaceful.</p>
                ) : (
                  recentGardeners.map((profile) => (
                    <GardenerCard key={profile.id} profile={profile} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Connection Pathways</CardTitle>
                <p className="text-sm text-gray-600">
                  Connections you've cultivated, growing in their own time
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeReferrals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No active pathways yet. Your tending will create connections soon.</p>
                ) : (
                  activeReferrals.map((referral) => (
                    <GraceCard key={referral.id}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{referral.participant_email}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Pathway: {referral.referral_type?.replace(/_/g, ' ')}
                          </p>
                          <Badge className={
                            referral.status === 'accepted' ? 'bg-green-100 text-green-700 mt-2' :
                            referral.status === 'pending' ? 'bg-amber-100 text-amber-700 mt-2' :
                            'bg-gray-100 text-gray-700 mt-2'
                          }>
                            {referral.status === 'accepted' ? '🌱 Growing' : 
                             referral.status === 'pending' ? '🌾 Planted' : referral.status}
                          </Badge>
                        </div>
                      </div>
                      {referral.notes && (
                        <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
                          {referral.notes}
                        </p>
                      )}
                    </GraceCard>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tending Moments Due (48-Hour Check-Ins)</CardTitle>
                <p className="text-sm text-gray-600">
                  Gentle follow-up to ensure connections are taking root
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {followUpTasks.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">All tending is current. Beautiful work! 💚</p>
                ) : (
                  followUpTasks.map((referral) => (
                    <FollowUpCard key={referral.id} referral={referral} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Trauma-Informed Reminder */}
        <GraceCard className="mt-8 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <Heart className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">Tending with Trauma-Informed Grace</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• "You don't have to change alone. You don't have to be perfect. You just have to keep showing up."</li>
                <li>• Go at their pace. Respect what they share and what they hold back.</li>
                <li>• Every connection is an invitation, not a requirement.</li>
                <li>• Document with dignity: their words, neutral language, respectful framing.</li>
              </ul>
            </div>
          </div>
        </GraceCard>
      </div>
    </div>
  );
}