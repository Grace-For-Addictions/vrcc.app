import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Send, CheckCircle2, Clock, XCircle, AlertTriangle, 
  TrendingUp, Users, DollarSign, Loader2 
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ClosedLoopCoordination() {
  const queryClient = useQueryClient();
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [updateNote, setUpdateNote] = useState('');

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['closed-loop-referrals'],
    queryFn: () => base44.entities.ClosedLoopReferral.list('-created_date', 100)
  });

  const { data: roiMetrics = [] } = useQuery({
    queryKey: ['roi-metrics-referral'],
    queryFn: () => base44.entities.ROIMetric.filter({ metric_type: 'referral_coordination_hours_saved' })
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }) => {
      const updateData = { status };
      const now = new Date().toISOString();
      
      // Update timestamps based on status
      if (status === 'received') updateData.received_date = now;
      if (status === 'accepted') updateData.accepted_date = now;
      if (status === 'completed') {
        updateData.completed_date = now;
        
        // Calculate time to completion
        const referral = referrals.find(r => r.id === id);
        if (referral?.sent_date) {
          const sentDate = new Date(referral.sent_date);
          const completedDate = new Date(now);
          const days = Math.floor((completedDate - sentDate) / (1000 * 60 * 60 * 24));
          updateData.time_to_completion_days = days;
        }
        
        // Log ROI savings (estimate 30 min saved per closed-loop completion)
        await base44.entities.ROIMetric.create({
          metric_date: new Date().toISOString().split('T')[0],
          metric_type: 'referral_coordination_hours_saved',
          time_period: 'daily',
          hours_saved: 0.5,
          dollar_value_saved: 15,
          roi_multiplier: 5,
          unite_us_style_savings: {
            closed_loop_hours_saved: 0.5,
            referral_success_rate: 100,
            projected_annual_savings: 7500
          }
        });
      }
      
      // Add follow-up note
      const existingReferral = referrals.find(r => r.id === id);
      const followUpNotes = existingReferral?.follow_up_notes || [];
      followUpNotes.push({
        date: now,
        note: note || `Status updated to ${status}`,
        logged_by: (await base44.auth.me()).email
      });
      updateData.follow_up_notes = followUpNotes;
      
      return base44.entities.ClosedLoopReferral.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['closed-loop-referrals']);
      queryClient.invalidateQueries(['roi-metrics-referral']);
      setSelectedReferral(null);
      setUpdateNote('');
    }
  });

  const statusConfig = {
    sent: { icon: Send, color: 'bg-blue-100 text-blue-700', label: 'Sent' },
    received: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Received' },
    accepted: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Accepted' },
    in_progress: { icon: TrendingUp, color: 'bg-purple-100 text-purple-700', label: 'In Progress' },
    completed: { icon: CheckCircle2, color: 'bg-teal-100 text-teal-700', label: 'Completed' },
    declined: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Declined' },
    no_show: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-700', label: 'No Show' },
    closed: { icon: XCircle, color: 'bg-gray-100 text-gray-700', label: 'Closed' }
  };

  const activeReferrals = referrals.filter(r => !['completed', 'closed', 'declined'].includes(r.status));
  const completedReferrals = referrals.filter(r => r.status === 'completed');
  const completionRate = referrals.length > 0 ? (completedReferrals.length / referrals.length * 100) : 0;
  
  const totalHoursSaved = roiMetrics.reduce((sum, m) => sum + (m.hours_saved || 0), 0);
  const annualProjection = totalHoursSaved * 52; // Weekly to annual

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Referrals</p>
                <p className="text-2xl font-bold text-teal-600">{activeReferrals.length}</p>
              </div>
              <Send className="w-8 h-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">{completionRate.toFixed(0)}%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hours Saved</p>
                <p className="text-2xl font-bold text-purple-600">{totalHoursSaved.toFixed(1)}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Annual Value</p>
                <p className="text-2xl font-bold text-amber-600">${(annualProjection * 30).toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Closed-Loop Referral Tracking</CardTitle>
          <CardDescription>Unite Us-inspired coordination • 88% capacity improvement</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active ({activeReferrals.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedReferrals.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3 mt-4">
              {activeReferrals.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active referrals</p>
              ) : (
                activeReferrals.map(referral => {
                  const config = statusConfig[referral.status];
                  const StatusIcon = config.icon;
                  
                  return (
                    <Card key={referral.id} className="border-l-4 border-l-teal-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{referral.participant_email}</CardTitle>
                            <CardDescription className="mt-1">
                              {referral.service_type} → {referral.referral_to}
                            </CardDescription>
                          </div>
                          <Badge className={config.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          Sent: {new Date(referral.sent_date).toLocaleDateString()}
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">Update Status</label>
                          <div className="flex gap-2">
                            <Select 
                              onValueChange={(value) => {
                                updateStatusMutation.mutate({ 
                                  id: referral.id, 
                                  status: value,
                                  note: updateNote 
                                });
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select new status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="received">Received by Partner</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="declined">Declined</SelectItem>
                                <SelectItem value="no_show">No Show</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {referral.follow_up_notes && referral.follow_up_notes.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs font-medium text-gray-600 mb-1">Follow-up History:</p>
                            {referral.follow_up_notes.slice(-3).map((note, idx) => (
                              <p key={idx} className="text-xs text-gray-500">
                                {new Date(note.date).toLocaleDateString()}: {note.note}
                              </p>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3 mt-4">
              {completedReferrals.map(referral => (
                <Card key={referral.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{referral.participant_email}</CardTitle>
                        <CardDescription>
                          {referral.service_type} → {referral.referral_to}
                        </CardDescription>
                      </div>
                      <Badge className="bg-teal-100 text-teal-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {referral.time_to_completion_days || 0} days
                      </Badge>
                    </div>
                  </CardHeader>
                  {referral.outcome && (
                    <CardContent>
                      <p className="text-sm text-gray-600"><strong>Outcome:</strong> {referral.outcome}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}