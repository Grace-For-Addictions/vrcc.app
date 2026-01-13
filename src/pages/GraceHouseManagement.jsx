import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Home, Users, TrendingUp, DollarSign, Calendar, Award, Heart, Plus } from 'lucide-react';
import GraceHeader from '@/components/common/GraceHeader';

export default function GraceHouseManagement() {
  const [newResident, setNewResident] = useState({
    resident_email: '',
    admission_date: '',
    referral_source: '',
    assigned_room: ''
  });
  const queryClient = useQueryClient();

  const { data: residents = [] } = useQuery({
    queryKey: ['grace-house-residents'],
    queryFn: () => base44.entities.GraceHouseResident.list('-admission_date')
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['resident-profiles'],
    queryFn: async () => {
      const residentEmails = residents.map(r => r.resident_email);
      if (residentEmails.length === 0) return [];
      
      const allProfiles = await base44.entities.UserProfile.list();
      return allProfiles.filter(p => residentEmails.includes(p.created_by));
    },
    enabled: residents.length > 0
  });

  const admitResidentMutation = useMutation({
    mutationFn: async (residentData) => {
      const admissionDate = new Date(residentData.admission_date);
      const gracePeriodEnd = new Date(admissionDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);

      return base44.entities.GraceHouseResident.create({
        ...residentData,
        program_phase: 'grace_period_30',
        grace_period_status: 'active',
        grace_period_end_date: gracePeriodEnd.toISOString().split('T')[0],
        housing_fees_covered: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['grace-house-residents']);
      setNewResident({ resident_email: '', admission_date: '', referral_source: '', assigned_room: '' });
    }
  });

  const currentResidents = residents.filter(r => !['graduated', 'exited'].includes(r.program_phase));
  const gracePeriodResidents = residents.filter(r => r.program_phase === 'grace_period_30');
  const graduatedCount = residents.filter(r => r.program_phase === 'graduated').length;

  const totalFeesCovered = residents.reduce((sum, r) => sum + (r.housing_fees_covered || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <GraceHeader
          title="Grace House Management"
          subtitle="30-90-180 Day Grace-Based Recovery Housing"
          icon={Home}
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Residents</p>
                  <p className="text-3xl font-bold text-teal-600">{currentResidents.length}</p>
                </div>
                <Users className="w-8 h-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Grace Period (30d)</p>
                  <p className="text-3xl font-bold text-green-600">{gracePeriodResidents.length}</p>
                </div>
                <Heart className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fees Covered</p>
                  <p className="text-2xl font-bold text-purple-600">${totalFeesCovered.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Graduated</p>
                  <p className="text-3xl font-bold text-amber-600">{graduatedCount}</p>
                </div>
                <Award className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admit New Resident */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resident Management</CardTitle>
                <CardDescription>Admit and track Grace House participants</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Admit Resident
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Admit New Resident</DialogTitle>
                    <DialogDescription>Start 30-day grace period</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Resident Email</Label>
                      <Input
                        value={newResident.resident_email}
                        onChange={(e) => setNewResident({...newResident, resident_email: e.target.value})}
                        type="email"
                      />
                    </div>
                    <div>
                      <Label>Admission Date</Label>
                      <Input
                        value={newResident.admission_date}
                        onChange={(e) => setNewResident({...newResident, admission_date: e.target.value})}
                        type="date"
                      />
                    </div>
                    <div>
                      <Label>Referral Source</Label>
                      <Select 
                        value={newResident.referral_source}
                        onValueChange={(value) => setNewResident({...newResident, referral_source: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDOC">IDOC</SelectItem>
                          <SelectItem value="Polk_County_Jail">Polk County Jail</SelectItem>
                          <SelectItem value="Clive_Behavioral_Health">Clive Behavioral Health</SelectItem>
                          <SelectItem value="IHYC">IHYC</SelectItem>
                          <SelectItem value="Beacon">Beacon</SelectItem>
                          <SelectItem value="Future_Change_Course">Future Change Course</SelectItem>
                          <SelectItem value="Self_Referral">Self Referral</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Room Assignment</Label>
                      <Input
                        value={newResident.assigned_room}
                        onChange={(e) => setNewResident({...newResident, assigned_room: e.target.value})}
                        placeholder="e.g., Room 1A"
                      />
                    </div>
                    <Button 
                      onClick={() => admitResidentMutation.mutate(newResident)}
                      disabled={!newResident.resident_email || !newResident.admission_date}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                      Admit to Grace House
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Active ({currentResidents.length})</TabsTrigger>
                <TabsTrigger value="grace-period">Grace Period ({gracePeriodResidents.length})</TabsTrigger>
                <TabsTrigger value="graduated">Graduated ({graduatedCount})</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-3 mt-4">
                {currentResidents.map(resident => {
                  const profile = profiles.find(p => p.created_by === resident.resident_email);
                  const daysInProgram = Math.floor((new Date() - new Date(resident.admission_date)) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <Card key={resident.id} className="border-l-4 border-l-teal-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {profile?.first_name} {profile?.last_name}
                            </CardTitle>
                            <CardDescription>{resident.resident_email}</CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={
                              resident.program_phase === 'grace_period_30' ? 'bg-green-100 text-green-700' :
                              resident.program_phase === 'days_31_90' ? 'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                            }>
                              {resident.program_phase.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">{daysInProgram} days</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Room:</p>
                            <p className="font-medium">{resident.assigned_room || 'Not assigned'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Referral Source:</p>
                            <p className="font-medium">{resident.referral_source?.replace(/_/g, ' ')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">JUST GRACE Curriculum:</p>
                            <Badge variant="outline">
                              {resident.just_grace_curriculum_status?.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-gray-600">Employment:</p>
                            <Badge variant="outline">
                              {resident.employment_secured ? 'Secured' : 'In Progress'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="grace-period" className="mt-4">
                {gracePeriodResidents.map(resident => {
                  const daysRemaining = resident.grace_period_end_date ?
                    Math.max(0, Math.ceil((new Date(resident.grace_period_end_date) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
                  
                  return (
                    <Card key={resident.id} className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{resident.resident_email}</CardTitle>
                            <CardDescription>Admitted: {new Date(resident.admission_date).toLocaleDateString()}</CardDescription>
                          </div>
                          <Badge className="bg-green-100 text-green-700">
                            <Heart className="w-3 h-3 mr-1" />
                            {daysRemaining} days remaining
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-700 mb-2">Grace Period Active</p>
                          <p className="text-xs text-gray-600">
                            Housing fees covered • Focus on stabilization, healing, and building recovery capital
                            before financial pressure begins
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="graduated" className="mt-4">
                <p className="text-center text-gray-500 py-8">
                  Graduated residents will appear here
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}