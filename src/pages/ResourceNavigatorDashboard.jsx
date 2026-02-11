import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Compass, MapPin, Users, Home, Briefcase, Heart,
  CheckCircle2, Clock, Send, Search, Filter, Phone
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
import { toast } from 'sonner';

export default function ResourceNavigatorDashboard() {
  const [user, setUser] = useState(null);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  // Fetch incoming referrals for this navigator
  const { data: incomingReferrals = [] } = useQuery({
    queryKey: ['navigatorReferrals'],
    queryFn: async () => {
      if (!user) return [];
      const referrals = await base44.entities.Referral.filter({ 
        referral_type: 'resource_navigator',
        status: ['pending', 'accepted']
      });
      return referrals;
    },
    enabled: !!user
  });

  // Fetch community resources
  const { data: allResources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const resources = await base44.entities.Resource.list('-updated_date', 200);
      return resources;
    }
  });

  // Filter resources by search and category
  const filteredResources = allResources.filter(resource => {
    const matchesSearch = !searchQuery || 
      resource.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const acceptReferralMutation = useMutation({
    mutationFn: async (referralId) => {
      return base44.entities.Referral.update(referralId, {
        status: 'accepted',
        referred_to: user.email,
        accepted_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Connection accepted - you are now their pathway guide');
      queryClient.invalidateQueries(['navigatorReferrals']);
    }
  });

  const createResourceReferralMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Referral.create(data);
    },
    onSuccess: () => {
      toast.success('Resource pathway created');
      setResourceDialogOpen(false);
      setSelectedReferral(null);
      queryClient.invalidateQueries(['navigatorReferrals']);
    }
  });

  const completeReferralMutation = useMutation({
    mutationFn: async ({ id, outcome }) => {
      return base44.entities.Referral.update(id, {
        status: 'completed',
        completion_date: new Date().toISOString(),
        outcome_notes: outcome
      });
    },
    onSuccess: () => {
      toast.success('Pathway journey completed with grace');
      queryClient.invalidateQueries(['navigatorReferrals']);
    }
  });

  const ResourceConnectionForm = ({ referral }) => {
    const [selectedResource, setSelectedResource] = useState('');
    const [connectionType, setConnectionType] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
      if (!connectionType) {
        toast.error('Please select a connection type');
        return;
      }

      const referralData = {
        participant_email: referral.participant_email,
        participant_name: referral.participant_name,
        referral_type: connectionType,
        referred_by: user.email,
        referred_to: selectedResource || connectionType,
        status: 'pending',
        notes: notes,
        parent_referral_id: referral.id
      };

      createResourceReferralMutation.mutate(referralData);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label>Connection Type</Label>
          <Select value={connectionType} onValueChange={setConnectionType}>
            <SelectTrigger>
              <SelectValue placeholder="Where does this gardener need roots?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="community_resource">Community Resource</SelectItem>
              <SelectItem value="peer_coaching">Guided Cultivation (Peer Coaching)</SelectItem>
              <SelectItem value="peer_support">Shared Soil (Peer Support)</SelectItem>
              <SelectItem value="permanent_housing">Deep Roots (Permanent Housing)</SelectItem>
              <SelectItem value="sober_living">Stable Ground (Sober Living)</SelectItem>
              <SelectItem value="peer_recovery_ally">Recovery Ally Check-In</SelectItem>
              <SelectItem value="employment">Work & Growth</SelectItem>
              <SelectItem value="healthcare">Wellness Support</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {connectionType === 'community_resource' && (
          <div>
            <Label>Select Community Resource</Label>
            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a resource" />
              </SelectTrigger>
              <SelectContent>
                {filteredResources.slice(0, 20).map((resource) => (
                  <SelectItem key={resource.id} value={resource.name}>
                    {resource.name} - {resource.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Connection Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why this connection? What strengths or needs did you notice?"
            rows={4}
          />
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={createResourceReferralMutation.isPending}
          className="w-full bg-teal-600 hover:bg-teal-700"
        >
          <Send className="w-4 h-4 mr-2" />
          Create Connection Pathway
        </Button>
      </div>
    );
  };

  const ReferralCard = ({ referral, showActions = true }) => {
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [outcomeNotes, setOutcomeNotes] = useState('');

    const handleComplete = () => {
      completeReferralMutation.mutate({
        id: referral.id,
        outcome: outcomeNotes
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
                'bg-gray-100 text-gray-700'
              }>
                {referral.status === 'accepted' ? '🌱 Tending' : 
                 referral.status === 'pending' ? '🌾 New' : referral.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              From: {referral.referred_by}
            </p>
            {referral.notes && (
              <p className="text-sm text-gray-700 mt-2 p-3 bg-white rounded-lg border border-gray-100">
                {referral.notes}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Received {Math.floor((new Date() - new Date(referral.created_date)) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </div>

          {showActions && (
            <div className="flex flex-col gap-2 ml-4">
              {referral.status === 'pending' && (
                <Button 
                  size="sm"
                  onClick={() => acceptReferralMutation.mutate(referral.id)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Accept
                </Button>
              )}
              
              {referral.status === 'accepted' && (
                <>
                  <Dialog open={resourceDialogOpen && selectedReferral?.id === referral.id} 
                    onOpenChange={(open) => {
                      setResourceDialogOpen(open);
                      if (!open) setSelectedReferral(null);
                    }}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedReferral(referral)}
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        Connect
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Resource Connection</DialogTitle>
                      </DialogHeader>
                      <ResourceConnectionForm referral={referral} />
                    </DialogContent>
                  </Dialog>

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
                          <Textarea
                            value={outcomeNotes}
                            onChange={(e) => setOutcomeNotes(e.target.value)}
                            placeholder="What connections were made? What roots were planted? How is the gardener doing?"
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
                </>
              )}
            </div>
          )}
        </div>
      </GraceCard>
    );
  };

  const ResourceCard = ({ resource }) => (
    <GraceCard hover>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
          {resource.category === 'housing' && <Home className="w-5 h-5 text-teal-600" />}
          {resource.category === 'employment' && <Briefcase className="w-5 h-5 text-teal-600" />}
          {resource.category === 'healthcare' && <Heart className="w-5 h-5 text-teal-600" />}
          {!['housing', 'employment', 'healthcare'].includes(resource.category) && <MapPin className="w-5 h-5 text-teal-600" />}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{resource.name}</h4>
          <Badge variant="outline" className="mt-1 text-xs">
            {resource.category?.replace(/_/g, ' ')}
          </Badge>
          {resource.description && (
            <p className="text-sm text-gray-600 mt-2">{resource.description.slice(0, 120)}...</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            {resource.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {resource.phone}
              </div>
            )}
            {resource.city && <span>{resource.city}, {resource.state}</span>}
          </div>
        </div>
      </div>
    </GraceCard>
  );

  const pendingCount = incomingReferrals.filter(r => r.status === 'pending').length;
  const activeCount = incomingReferrals.filter(r => r.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader
          title="Pathway Guide Garden"
          subtitle="Navigate gardeners to resources, create warm connections, and help them find their roots"
          icon={Compass}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard gradient>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-sm text-gray-600">New Pathways Awaiting</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard gradient>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-sm text-gray-600">Gardeners You're Tending</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard gradient>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{allResources.length}</p>
                <p className="text-sm text-gray-600">Community Resources</p>
              </div>
            </div>
          </GraceCard>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="referrals">Connection Pathways</TabsTrigger>
            <TabsTrigger value="resources">Resource Library</TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Incoming Connection Pathways</CardTitle>
                <p className="text-sm text-gray-600">
                  Gardeners seeking guidance to find their roots and resources
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingReferrals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pathways at this moment. The garden is peaceful.</p>
                ) : (
                  incomingReferrals.map((referral) => (
                    <ReferralCard key={referral.id} referral={referral} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Community Resource Library</CardTitle>
                <p className="text-sm text-gray-600">
                  Browse and connect gardeners to community resources across Iowa
                </p>
                
                {/* Search and Filter */}
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
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="crisis">Crisis</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredResources.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No resources match your search.</p>
                ) : (
                  filteredResources.slice(0, 20).map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigator Principles */}
        <GraceCard className="mt-8 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <Compass className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">Guiding with Grace & Dignity</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Every resource is an invitation, never a requirement</li>
                <li>• Listen for what the gardener needs, not what we think they should do</li>
                <li>• Warm handoffs build trust; cold referrals build walls</li>
                <li>• Follow up gently: "How did that connection feel?"</li>
              </ul>
            </div>
          </div>
        </GraceCard>
      </div>
    </div>
  );
}