import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, CheckCircle2, XCircle, Clock, Mail,
  Search, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';
import GraceHeader from '@/components/common/GraceHeader';

export default function VolunteerDashboard() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.user_role !== 'administrator')) {
        window.location.href = '/';
      }
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: volunteers = [] } = useQuery({
    queryKey: ['volunteerProfiles'],
    queryFn: () => base44.entities.VolunteerProfile.list('-created_date', 200)
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ volunteerId, newStatus }) => {
      const volunteer = volunteers.find(v => v.id === volunteerId);
      await base44.entities.VolunteerProfile.update(volunteerId, {
        application_status: newStatus
      });

      // Send notification email
      await base44.integrations.Core.SendEmail({
        to: volunteer.volunteer_email,
        subject: `Volunteer Application ${newStatus === 'approved' ? 'Approved' : 'Update'} - GFA`,
        body: `Dear ${volunteer.volunteer_name},

${newStatus === 'approved' ? 
`Great news! Your volunteer application has been approved. 🎉

Next steps:
1. Complete onboarding training
2. Review volunteer handbook
3. Schedule your first shift

We're excited to have you join the GFA volunteer family!` :
newStatus === 'declined' ?
`Thank you for your interest in volunteering with Grace For Addictions. After careful review, we're unable to move forward with your application at this time.

We appreciate your willingness to serve the recovery community.` :
`Your volunteer application status has been updated to: ${newStatus}`}

With gratitude,
Grace For Addictions Team`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['volunteerProfiles']);
      toast.success('Status updated & volunteer notified');
    }
  });

  const pendingVolunteers = volunteers.filter(v => v.application_status === 'pending');
  const approvedVolunteers = volunteers.filter(v => v.application_status === 'approved' || v.application_status === 'active');
  const inTraining = volunteers.filter(v => v.application_status === 'in_training');

  const filteredVolunteers = volunteers.filter(v => 
    v.volunteer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.volunteer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <GraceHeader 
          title="Volunteer Management"
          subtitle="Approve applications and manage volunteer workforce"
          icon={Users}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <GraceCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{pendingVolunteers.length}</p>
                <p className="text-xs text-gray-600">Pending Review</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{approvedVolunteers.length}</p>
                <p className="text-xs text-gray-600">Approved/Active</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{inTraining.length}</p>
                <p className="text-xs text-gray-600">In Training</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <div className="mb-4">
          <Input 
            placeholder="Search volunteers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending ({pendingVolunteers.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedVolunteers.length})</TabsTrigger>
            <TabsTrigger value="training">In Training ({inTraining.length})</TabsTrigger>
            <TabsTrigger value="all">All ({volunteers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-3">
              {pendingVolunteers.map(volunteer => (
                <VolunteerCard 
                  key={volunteer.id}
                  volunteer={volunteer}
                  onUpdateStatus={updateStatusMutation.mutate}
                  isPending={updateStatusMutation.isPending}
                />
              ))}
              {pendingVolunteers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No pending applications</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <div className="space-y-3">
              {approvedVolunteers.map(volunteer => (
                <VolunteerCard 
                  key={volunteer.id}
                  volunteer={volunteer}
                  onUpdateStatus={updateStatusMutation.mutate}
                  isPending={updateStatusMutation.isPending}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="training">
            <div className="space-y-3">
              {inTraining.map(volunteer => (
                <VolunteerCard 
                  key={volunteer.id}
                  volunteer={volunteer}
                  onUpdateStatus={updateStatusMutation.mutate}
                  isPending={updateStatusMutation.isPending}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all">
            <div className="space-y-3">
              {filteredVolunteers.map(volunteer => (
                <VolunteerCard 
                  key={volunteer.id}
                  volunteer={volunteer}
                  onUpdateStatus={updateStatusMutation.mutate}
                  isPending={updateStatusMutation.isPending}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function VolunteerCard({ volunteer, onUpdateStatus, isPending }) {
  return (
    <GraceCard className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900">{volunteer.volunteer_name}</h3>
            <Badge className={
              volunteer.application_status === 'approved' ? 'bg-green-100 text-green-800' :
              volunteer.application_status === 'active' ? 'bg-blue-100 text-blue-800' :
              volunteer.application_status === 'pending' ? 'bg-orange-100 text-orange-800' :
              volunteer.application_status === 'declined' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }>
              {volunteer.application_status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {volunteer.volunteer_email}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {volunteer.volunteer_roles?.map(role => (
              <Badge key={role} variant="outline" className="text-xs capitalize">
                {role.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
          {volunteer.skills_interests?.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Skills: {volunteer.skills_interests.join(', ')}
            </p>
          )}
        </div>

        {volunteer.application_status === 'pending' && (
          <div className="flex gap-2">
            <Button 
              size="sm"
              onClick={() => onUpdateStatus({ volunteerId: volunteer.id, newStatus: 'approved' })}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button 
              size="sm"
              variant="destructive"
              onClick={() => onUpdateStatus({ volunteerId: volunteer.id, newStatus: 'declined' })}
              disabled={isPending}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Decline
            </Button>
          </div>
        )}
      </div>
    </GraceCard>
  );
}