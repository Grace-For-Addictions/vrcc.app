import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Sprout, Compass, ClipboardList, Users, Heart, Clock, CheckCircle2,
  Send, MapPin, Search, Filter, Phone, FileText, TrendingUp, Sparkles,
  Calendar, Home, Briefcase, AlertTriangle, Target, Plus, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import SessionEntryForm from '@/components/coaching/SessionEntryForm';
import SessionHistory from '@/components/coaching/SessionHistory';
import EnhancedCoachingAnalytics from '@/components/coaching/EnhancedCoachingAnalytics';
import AIResourceNavigator from '@/components/resources/AIResourceNavigator';
import RoleGuard from '@/components/navigation/RoleGuard';
import { TraumaInformedTextarea } from '@/components/rbac/TraumaInformedInput';
import CareAlertMonitor from '@/components/rbac/CareAlertMonitor';
import { toast } from 'sonner';

export default function ServiceCoordinationHub() {
  const [user, setUser] = useState(null);
  const [selectedGardener, setSelectedGardener] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState('intake');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  // Universal data fetching
  const { data: recentGardeners = [] } = useQuery({
    queryKey: ['recentGardeners'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 50),
    enabled: !!user
  });

  const { data: allReferrals = [] } = useQuery({
    queryKey: ['allReferrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 100),
    enabled: !!user
  });

  const { data: coachingSessions = [] } = useQuery({
    queryKey: ['coachingSessions', user?.email],
    queryFn: () => base44.entities.CoachingSessionLog.filter({ coach_name: user?.full_name }, '-activity_date', 50),
    enabled: !!user
  });

  const { data: allResources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list('-updated_date', 200),
    enabled: !!user
  });

  const { data: priorityInsights = [] } = useQuery({
    queryKey: ['priorityInsights'],
    queryFn: () => base44.entities.ProgressInsight.filter({ severity: { $in: ['critical', 'high'] } }, '-insight_date', 50),
    enabled: !!user
  });

  // Mutations
  const createReferralMutation = useMutation({
    mutationFn: async (data) => base44.entities.Referral.create(data),
    onSuccess: () => {
      toast.success('Connection pathway created with grace');
      setDialogOpen(false);
      queryClient.invalidateQueries(['allReferrals']);
    }
  });

  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => {
      toast.success('Pathway updated');
      queryClient.invalidateQueries(['allReferrals']);
    }
  });

  // Computed values
  const myReferrals = allReferrals.filter(r => r.referred_by === user?.email);
  const incomingReferrals = allReferrals.filter(r => r.referral_type === 'resource_navigator');
  const followUpTasks = myReferrals.filter(r => {
    if (!r.created_date || r.follow_up_completed) return false;
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return new Date(r.created_date) <= twoDaysAgo && r.status === 'accepted';
  });

  const filteredResources = allResources.filter(resource => {
    const matchesSearch = !searchQuery || 
      resource.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const ReferralForm = ({ gardener, mode = 'create' }) => {
    const [formData, setFormData] = useState({
      referral_type: '',
      selectedResource: '',
      notes: '',
      urgency: 'routine'
    });

    const handleSubmit = () => {
      if (!formData.referral_type) {
        toast.error('Please select a connection pathway');
        return;
      }

      createReferralMutation.mutate({
        participant_email: gardener?.created_by || gardener?.email,
        participant_name: gardener?.created_by || gardener?.email,
        referral_type: formData.referral_type,
        referred_by: user.email,
        referred_to: formData.selectedResource || formData.referral_type,
        status: 'pending',
        notes: formData.notes,
        urgency: formData.urgency
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <Label>Connection Pathway</Label>
          <Select value={formData.referral_type} onValueChange={(val) => setFormData({...formData, referral_type: val})}>
            <SelectTrigger>
              <SelectValue placeholder="Where does this gardener need tending?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="peer_coaching">Guided Cultivation (Peer Coaching)</SelectItem>
              <SelectItem value="recovery_housing">Shelter & Roots (Recovery Housing)</SelectItem>
              <SelectItem value="resource_navigator">Pathway Guide (Resource Navigator)</SelectItem>
              <SelectItem value="peer_support">Shared Soil (Peer Support)</SelectItem>
              <SelectItem value="sober_living">Stable Ground (Sober Living)</SelectItem>
              <SelectItem value="community_resource">Community Resource</SelectItem>
              <SelectItem value="permanent_housing">Deep Roots (Permanent Housing)</SelectItem>
              <SelectItem value="peer_recovery_ally">Recovery Ally Check-In</SelectItem>
              <SelectItem value="employment">Work & Growth</SelectItem>
              <SelectItem value="healthcare">Wellness Support</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.referral_type === 'community_resource' && (
          <div>
            <Label>Select Community Resource</Label>
            <Select value={formData.selectedResource} onValueChange={(val) => setFormData({...formData, selectedResource: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a resource" />
              </SelectTrigger>
              <SelectContent>
                {filteredResources.slice(0, 20).map((r) => (
                  <SelectItem key={r.id} value={r.name}>{r.name} - {r.category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Tending Notes</Label>
          <TraumaInformedTextarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
      <GraceCard hover>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
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
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setSelectedGardener(profile);
              setDialogOpen(true);
            }}
          >
            <Heart className="w-4 h-4 mr-1" />
            Connect
          </Button>
        </div>
      </GraceCard>
    );
  };

  const ReferralCard = ({ referral, showActions = true }) => {
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [outcomeNotes, setOutcomeNotes] = useState('');

    const handleAccept = () => {
      updateReferralMutation.mutate({
        id: referral.id,
        data: { status: 'accepted', referred_to: user.email, accepted_date: new Date().toISOString() }
      });
    };

    const handleComplete = () => {
      updateReferralMutation.mutate({
        id: referral.id,
        data: { 
          status: 'completed', 
          completion_date: new Date().toISOString(), 
          outcome_notes: outcomeNotes,
          follow_up_completed: true
        }
      });
      setCompleteDialogOpen(false);
    };

    return (
      <GraceCard hover className={referral.status === 'pending' ? 'bg-amber-50 border-amber-200' : ''}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900">{referral.participant_email}</h4>
              <Badge className={
                referral.status === 'accepted' ? 'bg-green-100 text-green-700' :
                referral.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                referral.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }>
                {referral.status === 'accepted' ? '🌱 Tending' : 
                 referral.status === 'pending' ? '🌾 New' : 
                 referral.status === 'completed' ? '🌻 Harvested' : referral.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {referral.referral_type?.replace(/_/g, ' ')} • From: {referral.referred_by}
            </p>
            {referral.notes && (
              <p className="text-sm text-gray-700 mt-2 p-3 bg-white rounded-lg border border-gray-100">
                {referral.notes}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {Math.floor((new Date() - new Date(referral.created_date)) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </div>

          {showActions && (
            <div className="flex flex-col gap-2 ml-4">
              {referral.status === 'pending' && (
                <Button size="sm" onClick={handleAccept} className="bg-teal-600 hover:bg-teal-700">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Accept
                </Button>
              )}
              
              {referral.status === 'accepted' && (
                <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      Complete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Complete Connection Pathway</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>How did this connection grow?</Label>
                        <TraumaInformedTextarea
                          value={outcomeNotes}
                          onChange={(e) => setOutcomeNotes(e.target.value)}
                          placeholder="What connections were made? What roots were planted?"
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleComplete} className="w-full bg-teal-600 hover:bg-teal-700">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Complete Pathway
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>
      </GraceCard>
    );
  };

  if (!user) return null;

  const isIntakeRole = user.user_role === 'intake_coordinator' || user.role === 'admin';
  const isNavigatorRole = user.user_role === 'resource_navigator' || user.user_role === 'program_staff' || user.role === 'admin';
  const isCoachRole = user.user_role === 'peer_support' || user.user_role === 'program_staff' || user.role === 'admin';

  return (
    <RoleGuard allowedRoles={['intake_coordinator', 'resource_navigator', 'peer_support', 'program_staff']} pageName="Service Coordination Hub">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <GraceHeader
            title="Service Coordination Garden"
            subtitle="Unified intake, navigation, and coaching—all tending the same garden"
            icon={Sprout}
          />

          <CareAlertMonitor userRole={user?.user_role} />

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {isIntakeRole && (
              <GraceCard gradient>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{recentGardeners.length}</p>
                    <p className="text-sm text-gray-600">New Gardeners</p>
                  </div>
                </div>
              </GraceCard>
            )}

            <GraceCard gradient>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{myReferrals.length}</p>
                  <p className="text-sm text-gray-600">My Connections</p>
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
                  <p className="text-sm text-gray-600">Tending Due</p>
                </div>
              </div>
            </GraceCard>

            {isCoachRole && (
              <GraceCard gradient>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{coachingSessions.length}</p>
                    <p className="text-sm text-gray-600">Sessions Logged</p>
                  </div>
                </div>
              </GraceCard>
            )}
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue={isIntakeRole ? "intake" : isNavigatorRole ? "navigation" : "coaching"} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              {isIntakeRole && <TabsTrigger value="intake">Intake</TabsTrigger>}
              {isNavigatorRole && <TabsTrigger value="navigation">Navigation</TabsTrigger>}
              {isCoachRole && <TabsTrigger value="coaching">Coaching Log</TabsTrigger>}
              <TabsTrigger value="referrals">All Connections</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            {/* Intake Tab */}
            {isIntakeRole && (
              <TabsContent value="intake" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome New Gardeners</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentGardeners.slice(0, 10).map((profile) => (
                      <GardenerCard key={profile.id} profile={profile} />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Navigation Tab */}
            {isNavigatorRole && (
              <TabsContent value="navigation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Incoming Pathways & Priority Cases</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {incomingReferrals.filter(r => r.status === 'pending').map((ref) => (
                      <ReferralCard key={ref.id} referral={ref} />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Coaching Log Tab */}
            {isCoachRole && (
              <TabsContent value="coaching" className="space-y-4">
                <Tabs defaultValue="log" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="log">Log Session</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>
                  <TabsContent value="log">
                    <SessionEntryForm user={user} />
                  </TabsContent>
                  <TabsContent value="history">
                    <SessionHistory sessions={coachingSessions} user={user} />
                  </TabsContent>
                  <TabsContent value="analytics">
                    <EnhancedCoachingAnalytics sessions={coachingSessions} user={user} />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}

            {/* All Referrals Tab */}
            <TabsContent value="referrals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Connection Pathways</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allReferrals.slice(0, 20).map((ref) => (
                    <ReferralCard key={ref.id} referral={ref} showActions={ref.referred_by === user.email || ref.referred_to === user.email} />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Community Resource Library</CardTitle>
                  <div className="flex gap-3 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search resources..."
                        className="pl-10"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="housing">Housing</SelectItem>
                        <SelectItem value="employment">Employment</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredResources.slice(0, 20).map((resource) => (
                    <GraceCard key={resource.id} hover>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                          <Badge variant="outline" className="mt-1 text-xs">{resource.category}</Badge>
                          {resource.description && <p className="text-sm text-gray-600 mt-2">{resource.description.slice(0, 120)}...</p>}
                          {resource.phone && <p className="text-xs text-gray-500 mt-2">📞 {resource.phone}</p>}
                        </div>
                      </div>
                    </GraceCard>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Referral Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Connection Pathway</DialogTitle>
              </DialogHeader>
              <ReferralForm gardener={selectedGardener} />
            </DialogContent>
          </Dialog>

          {/* Guidance Card */}
          <GraceCard className="mt-8 bg-purple-50 border-purple-200">
            <div className="flex items-start gap-3">
              <Heart className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-purple-900 mb-2">Tending with Trauma-Informed Grace</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• "You don't have to change alone. You don't have to be perfect. You just have to keep showing up."</li>
                  <li>• Every connection is an invitation, never a requirement</li>
                  <li>• Document with dignity: their words, neutral language, respectful framing</li>
                </ul>
              </div>
            </div>
          </GraceCard>
        </div>
      </div>
    </RoleGuard>
  );
}