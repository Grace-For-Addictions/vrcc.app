import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, MapPin, Wifi, Users, TrendingUp, 
  Navigation, Shield, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';

export default function VRCCMRCCIntegration() {
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const queryClient = useQueryClient();

  // Real-time capacity data
  const { data: capacityData = [] } = useQuery({
    queryKey: ['serviceCapacity'],
    queryFn: () => base44.entities.ServiceCapacity.list('-updated_date', 50),
    refetchInterval: 30000 // Real-time: refresh every 30 seconds
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['aiRecommendations'],
    queryFn: () => base44.entities.AIServiceRecommendation.list('-created_date', 20)
  });

  const { data: crossReferrals = [] } = useQuery({
    queryKey: ['crossReferrals'],
    queryFn: () => base44.entities.CrossReferral.filter({ 
      referral_status: 'suggested' 
    })
  });

  const generateRecommendationMutation = useMutation({
    mutationFn: async (participantEmail) => {
      const response = await base44.functions.invoke('dynamicResourceRecommendation', {
        participant_email: participantEmail
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['aiRecommendations']);
      toast.success('AI recommendations generated!');
    }
  });

  const approveCrossReferralMutation = useMutation({
    mutationFn: async (referralId) => {
      return await base44.entities.CrossReferral.update(referralId, {
        referral_status: 'sent',
        accepted_by: (await base44.auth.me()).email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['crossReferrals']);
      toast.success('Cross-referral approved & participant notified');
    }
  });

  // Aggregate capacity by service type
  const vrccCapacity = capacityData.filter(c => c.location_type === 'vrcc_virtual');
  const mrccCapacity = capacityData.filter(c => c.location_type === 'mrcc_mobile_unit');

  const vrccUtilization = vrccCapacity.length > 0
    ? (vrccCapacity.reduce((sum, c) => sum + (c.current_capacity || 0), 0) / 
       vrccCapacity.reduce((sum, c) => sum + (c.max_capacity || 1), 0) * 100)
    : 0;

  const mrccUtilization = mrccCapacity.length > 0
    ? (mrccCapacity.reduce((sum, c) => sum + (c.current_capacity || 0), 0) / 
       mrccCapacity.reduce((sum, c) => sum + (c.max_capacity || 1), 0) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Real-Time Capacity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GraceCard className="bg-gradient-to-br from-blue-50 to-teal-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">VRCC (Virtual)</p>
              <p className="text-3xl font-bold text-blue-700">
                {vrccCapacity.reduce((sum, c) => sum + (c.current_capacity || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Active participants</p>
            </div>
            <div className="text-right">
              <Wifi className="w-10 h-10 text-blue-600 mb-2" />
              <Progress value={vrccUtilization} className="h-2 w-20" />
            </div>
          </div>
        </GraceCard>

        <GraceCard className="bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">MRCC (Mobile)</p>
              <p className="text-3xl font-bold text-purple-700">
                {mrccCapacity.reduce((sum, c) => sum + (c.current_capacity || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Current participants</p>
            </div>
            <div className="text-right">
              <MapPin className="w-10 h-10 text-purple-600 mb-2" />
              <Progress value={mrccUtilization} className="h-2 w-20" />
            </div>
          </div>
        </GraceCard>

        <GraceCard className="bg-gradient-to-br from-green-50 to-teal-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">AI Recommendations</p>
              <p className="text-3xl font-bold text-green-700">
                {recommendations.filter(r => !r.participant_accepted).length}
              </p>
              <p className="text-xs text-gray-500">Pending suggestions</p>
            </div>
            <div className="text-right">
              <TrendingUp className="w-10 h-10 text-green-600 mb-2" />
            </div>
          </div>
        </GraceCard>
      </div>

      <Tabs defaultValue="capacity">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capacity">
            <Activity className="w-4 h-4 mr-2" />
            Live Capacity
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            AI Matching ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="referrals">
            Cross-Referrals ({crossReferrals.length})
          </TabsTrigger>
          <TabsTrigger value="risks">
            <Shield className="w-4 h-4 mr-2" />
            Risk Mitigation
          </TabsTrigger>
        </TabsList>

        {/* Live Capacity Tab */}
        <TabsContent value="capacity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GraceCard>
              <CardHeader>
                <CardTitle>VRCC Virtual Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {vrccCapacity.map(service => (
                  <div key={service.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm capitalize">
                        {service.service_type.replace(/_/g, ' ')}
                      </h4>
                      <Badge className={
                        service.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                        service.availability_status === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {service.availability_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{service.current_capacity}/{service.max_capacity} capacity</span>
                      {service.next_available_slot && (
                        <span>Next: {new Date(service.next_available_slot).toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </GraceCard>

            <GraceCard>
              <CardHeader>
                <CardTitle>MRCC Mobile Units</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mrccCapacity.map(service => (
                  <div key={service.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm capitalize">
                          {service.service_type.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-xs text-gray-600">{service.location_name}</p>
                      </div>
                      <Badge className={
                        service.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                        service.availability_status === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {service.availability_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>{service.county} County</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </GraceCard>
          </div>
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations">
          <GraceCard>
            <CardContent className="pt-6 space-y-3">
              {recommendations.map(rec => (
                <div key={rec.id} className="p-4 bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg border border-teal-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{rec.participant_email}</h4>
                      <Badge className="mt-1 capitalize">
                        {rec.recommended_service.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-sm text-gray-700 mt-2">{rec.recommendation_reason}</p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <Badge variant="outline">Confidence: {rec.confidence_score}%</Badge>
                        <Badge variant="outline" className={
                          rec.urgency_level === 'immediate' ? 'border-red-500 text-red-700' :
                          rec.urgency_level === 'within_24h' ? 'border-orange-500 text-orange-700' :
                          'border-gray-500'
                        }>
                          {rec.urgency_level}
                        </Badge>
                      </div>
                    </div>
                    {!rec.participant_accepted && (
                      <Navigation className="w-5 h-5 text-teal-600" />
                    )}
                  </div>
                </div>
              ))}
              {recommendations.length === 0 && (
                <p className="text-center text-gray-500 py-8">No pending AI recommendations</p>
              )}
            </CardContent>
          </GraceCard>
        </TabsContent>

        {/* Cross-Referrals Tab */}
        <TabsContent value="referrals">
          <GraceCard>
            <CardContent className="pt-6 space-y-3">
              {crossReferrals.map(referral => (
                <div key={referral.id} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{referral.participant_email}</h4>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">
                          From: {referral.from_service.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge className="bg-purple-100 text-purple-800 capitalize">
                          To: {referral.to_service.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{referral.referral_reason}</p>
                      {referral.ai_generated && (
                        <Badge className="mt-2 bg-blue-100 text-blue-800 text-xs">
                          AI-Generated
                        </Badge>
                      )}
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => approveCrossReferralMutation.mutate(referral.id)}
                      disabled={approveCrossReferralMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
              {crossReferrals.length === 0 && (
                <p className="text-center text-gray-500 py-8">No pending cross-referrals</p>
              )}
            </CardContent>
          </GraceCard>
        </TabsContent>

        {/* Risk Mitigation Tab */}
        <TabsContent value="risks">
          <GraceCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                AI Risk Mitigation Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Algorithmic Bias - Medium Risk</h4>
                    <p className="text-sm text-orange-800 mt-1">
                      <strong>Mitigation:</strong> Annual third-party audits and Community Oversight Board review of decision-making logic to ensure equitable resource matching.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Data Breach - High Risk</h4>
                    <p className="text-sm text-red-800 mt-1">
                      <strong>Mitigation:</strong> 42 CFR Part 2 and HIPAA compliant architecture; zero-knowledge encryption where GFA staff cannot access raw identifying data without explicit daily opt-in.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Model Hallucinations - Low Risk</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>Mitigation:</strong> AI-assisted notes are used as templates only; all progress notes must be reviewed and signed by a human Peer Recovery Coach.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Digital Divide - High Risk</h4>
                    <p className="text-sm text-red-800 mt-1">
                      <strong>Mitigation:</strong> The Device Lending Library and Mobile Outreach Vehicle specifically target individuals without internet access or high-cost hardware.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </GraceCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}