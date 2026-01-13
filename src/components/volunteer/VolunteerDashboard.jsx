import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Award, Calendar, Clock, CheckCircle2, Plus, Heart, Star } from 'lucide-react';

export default function VolunteerDashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: volunteers = [] } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => base44.entities.VolunteerProfile.list('-created_date')
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['volunteer-shifts'],
    queryFn: () => base44.entities.VolunteerShift.list('-shift_date')
  });

  const myProfile = volunteers.find(v => v.volunteer_email === user?.email);
  const myShifts = shifts.filter(s => s.volunteer_email === user?.email);
  const upcomingShifts = myShifts.filter(s => new Date(s.shift_date) >= new Date() && s.status !== 'completed');
  
  const totalVolunteers = volunteers.length;
  const activeVolunteers = volunteers.filter(v => v.application_status === 'active').length;
  const certifiedRecoveryAllies = volunteers.filter(v => v.is_recovery_ally).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Volunteer Hub</h1>
            <p className="text-gray-600">Grace For Addictions Community</p>
          </div>
          {user?.role === 'admin' && (
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              {activeVolunteers} / {totalVolunteers} active
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">My Hours</p>
                  <p className="text-2xl font-bold text-teal-600">{myProfile?.total_hours_volunteered || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming Shifts</p>
                  <p className="text-2xl font-bold text-blue-600">{upcomingShifts.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Certifications</p>
                  <p className="text-2xl font-bold text-purple-600">{myProfile?.certifications?.length || 0}</p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recovery Allies</p>
                  <p className="text-2xl font-bold text-amber-600">{certifiedRecoveryAllies}</p>
                  <p className="text-xs text-gray-500">Goal: 30+</p>
                </div>
                <Star className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Certifications */}
        {myProfile && (
          <Card>
            <CardHeader>
              <CardTitle>My Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${myProfile.just_grace_certified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">JUST GRACE Curriculum</p>
                    {myProfile.just_grace_certified && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  </div>
                  {myProfile.just_grace_certified ? (
                    <p className="text-xs text-gray-600">
                      Completed: {new Date(myProfile.just_grace_completion_date).toLocaleDateString()}
                    </p>
                  ) : (
                    <Badge variant="outline">Not Certified</Badge>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${myProfile.narcan_certified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Narcan Distribution</p>
                    {myProfile.narcan_certified && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  </div>
                  {myProfile.narcan_certified ? (
                    <p className="text-xs text-gray-600">
                      Certified: {new Date(myProfile.narcan_certification_date).toLocaleDateString()}
                    </p>
                  ) : (
                    <Badge variant="outline">Not Certified</Badge>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${myProfile.is_recovery_ally ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Recovery Ally</p>
                    {myProfile.is_recovery_ally && <Star className="w-5 h-5 text-amber-600" />}
                  </div>
                  {myProfile.is_recovery_ally ? (
                    <Badge className="bg-amber-100 text-amber-700">Certified</Badge>
                  ) : (
                    <Badge variant="outline">In Progress</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Shifts */}
        <Card>
          <CardHeader>
            <CardTitle>My Upcoming Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingShifts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No upcoming shifts scheduled</p>
            ) : (
              <div className="space-y-3">
                {upcomingShifts.map(shift => (
                  <div key={shift.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium">{shift.opportunity_title}</p>
                      <p className="text-sm text-gray-600">{shift.role?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(shift.shift_date).toLocaleDateString()} • {shift.shift_time}
                      </p>
                    </div>
                    <Badge variant={shift.status === 'confirmed' ? 'default' : 'outline'}>
                      {shift.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>Available Opportunities</CardTitle>
            <CardDescription>Matched to your skills and interests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myProfile?.skills_interests?.includes('transportation') && (
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-teal-900">MRCC Transportation Support</p>
                      <p className="text-sm text-teal-700">Provide warm handoff transport</p>
                      <Badge className="mt-2 bg-teal-100 text-teal-700">Matches your skills</Badge>
                    </div>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">Sign Up</Button>
                  </div>
                </div>
              )}
              
              {myProfile?.just_grace_certified && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900">Peer Coaching Session</p>
                      <p className="text-sm text-purple-700">1:1 support sessions available</p>
                      <Badge className="mt-2 bg-purple-100 text-purple-700">JUST GRACE Certified</Badge>
                    </div>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">View Details</Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}