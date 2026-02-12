import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Heart, Calendar, FileText, Upload, CheckCircle2, 
  Clock, MapPin, Car, Sprout, TrendingUp 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import TransportationRequestForm from '@/components/transportation/TransportationRequestForm';
import { toast } from 'sonner';

export default function MyServicePortal() {
  const [user, setUser] = useState(null);
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

  // Fetch my service data
  const { data: myInternalReferrals = [] } = useQuery({
    queryKey: ['myInternalReferrals', user?.email],
    queryFn: () => base44.entities.InternalReferral.filter({ participantId: user.email }, '-created_date'),
    enabled: !!user
  });

  const { data: myExternalReferrals = [] } = useQuery({
    queryKey: ['myExternalReferrals', user?.email],
    queryFn: () => base44.entities.ExternalReferral.filter({ participantId: user.email }, '-created_date'),
    enabled: !!user
  });

  const { data: myCoachingSessions = [] } = useQuery({
    queryKey: ['myCoachingSessions', user?.email],
    queryFn: () => base44.entities.CoachingSessionLog.filter({ contact_email: user.email }, '-activity_date', 20),
    enabled: !!user
  });

  const { data: myTransportation = [] } = useQuery({
    queryKey: ['myTransportation', user?.email],
    queryFn: () => base44.entities.TransportationRequest.filter({ participant_email: user.email }, '-created_date'),
    enabled: !!user
  });

  const { data: myDocuments = [] } = useQuery({
    queryKey: ['myDocuments', user?.email],
    queryFn: () => base44.entities.UploadedDocument.filter({ uploaded_by: user.email }, '-created_date'),
    enabled: !!user,
    initialData: []
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.UploadedDocument.create({
        uploaded_by: user.email,
        file_url,
        file_name: file.name,
        file_type: file.type,
        upload_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries(['myDocuments']);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDocumentMutation.mutate(file);
  };

  if (!user) return null;

  const activeReferrals = [...myInternalReferrals, ...myExternalReferrals].filter(r => 
    ['open', 'accepted', 'in_progress', 'pending', 'connected'].includes(r.status)
  );

  const upcomingAppointments = [
    ...myTransportation.filter(t => new Date(t.requested_date) >= new Date()),
    ...myCoachingSessions.filter(s => s.next_session_date && new Date(s.next_session_date) >= new Date())
  ].sort((a, b) => new Date(a.requested_date || a.next_session_date) - new Date(b.requested_date || b.next_session_date));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader
          title="My Service Garden"
          subtitle="Your pathways, progress, and connections—all in one place"
          icon={Sprout}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GraceCard gradient>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeReferrals.length}</p>
                <p className="text-sm text-gray-600">Active Pathways</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard gradient>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                <p className="text-sm text-gray-600">Upcoming</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard gradient>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{myCoachingSessions.length}</p>
                <p className="text-sm text-gray-600">Sessions</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard gradient>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{myDocuments.length}</p>
                <p className="text-sm text-gray-600">Documents</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <Tabs defaultValue="pathways" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pathways">My Pathways</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="transportation">Transportation</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* My Pathways Tab */}
          <TabsContent value="pathways" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Service Pathways</CardTitle>
                <p className="text-sm text-gray-600">Your current connections and supports</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeReferrals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No active pathways at this time</p>
                ) : (
                  activeReferrals.map((referral, idx) => (
                    <GraceCard key={idx} hover>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {referral.serviceType || referral.organizationName}
                            </h4>
                            <Badge className={
                              referral.status === 'accepted' || referral.status === 'in_progress' || referral.status === 'connected' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }>
                              {referral.status}
                            </Badge>
                          </div>
                          {referral.referralNotes && (
                            <p className="text-sm text-gray-600 mt-2">{referral.referralNotes}</p>
                          )}
                          {referral.referralReason && (
                            <p className="text-sm text-gray-600 mt-2">{referral.referralReason}</p>
                          )}
                        </div>
                      </div>
                    </GraceCard>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No upcoming appointments</p>
                ) : (
                  upcomingAppointments.slice(0, 5).map((appt, idx) => (
                    <GraceCard key={idx}>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-teal-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {appt.destination_type ? `Transportation: ${appt.destination_type}` : 'Coaching Session'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(appt.requested_date || appt.next_session_date).toLocaleDateString()} 
                            {appt.requested_time && ` at ${appt.requested_time}`}
                          </p>
                        </div>
                      </div>
                    </GraceCard>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transportation Tab */}
          <TabsContent value="transportation" className="space-y-4">
            <TransportationRequestForm user={user} />
            
            {myTransportation.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>My Transportation History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myTransportation.slice(0, 5).map((trip) => (
                    <GraceCard key={trip.id}>
                      <div className="flex items-start gap-3">
                        <Car className="w-5 h-5 text-teal-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{trip.destination_type}</p>
                            <Badge variant="outline">{trip.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(trip.requested_date).toLocaleDateString()} at {trip.requested_time}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {trip.pickup_address} → {trip.destination_address}
                          </p>
                        </div>
                      </div>
                    </GraceCard>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Documents</CardTitle>
                <p className="text-sm text-gray-600">Securely store and access your documents</p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-700 font-medium">Click to upload a document</p>
                      <p className="text-sm text-gray-500 mt-1">PDF, images, or documents</p>
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadDocumentMutation.isPending}
                    />
                  </Label>
                </div>

                <div className="space-y-2">
                  {myDocuments.map((doc) => (
                    <GraceCard key={doc.id} hover>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">{doc.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(doc.upload_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    </GraceCard>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}