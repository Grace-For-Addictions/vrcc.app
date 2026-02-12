import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileEdit } from 'lucide-react';
import { toast } from 'sonner';

export default function ResourceModeration() {
  const [user, setUser] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin' && currentUser.user_role !== 'navigator') {
          window.location.href = '/';
          return;
        }
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: editSuggestions = [], isLoading: loadingEdits } = useQuery({
    queryKey: ['resourceEditSuggestions'],
    queryFn: () => base44.entities.ResourceEditSuggestion.list('-created_date'),
    enabled: !!user
  });

  const { data: verificationAlerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['verificationAlerts'],
    queryFn: () => base44.entities.FeedbackAlert.filter({
      alert_type: 'resource_verification_issue',
      status: 'open'
    }),
    enabled: !!user
  });

  const processEditMutation = useMutation({
    mutationFn: async ({ edit_id, action, notes }) => {
      return base44.functions.invoke('processResourceEditSuggestion', {
        edit_suggestion_id: edit_id,
        action,
        review_notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceEditSuggestions'] });
      toast.success('Edit suggestion processed');
      setExpandedId(null);
      setReviewNotes({});
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to process edit');
    }
  });

  const verifyResourceMutation = useMutation({
    mutationFn: async (resource_id) => {
      return base44.functions.invoke('verifyResourceDetails', { resource_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificationAlerts'] });
      toast.success('Resource verification started');
    }
  });

  if (!user || loadingEdits) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading moderation dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingEdits = editSuggestions.filter(e => e.status === 'pending');
  const processedEdits = editSuggestions.filter(e => e.status !== 'pending');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <GraceHeader 
          title="Resource Moderation"
          subtitle="Review community suggestions and verification alerts"
          icon={FileEdit}
        />

        <Tabs defaultValue="pending" className="mt-8">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Edits ({pendingEdits.length})
            </TabsTrigger>
            <TabsTrigger value="verification">
              Verification Alerts ({verificationAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="processed">
              Processed ({processedEdits.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingEdits.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  No pending edit suggestions
                </CardContent>
              </Card>
            ) : (
              pendingEdits.map((edit) => (
                <Card key={edit.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{edit.resource_name}</span>
                      <Badge variant="outline">Pending Review</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Suggested by: <strong>{edit.suggested_by_name || edit.suggested_by_email}</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        Reason: {edit.change_reason}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Proposed Changes:</h4>
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(edit.proposed_changes, null, 2)}
                      </pre>
                    </div>

                    {expandedId === edit.id && (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Review notes (optional)..."
                          value={reviewNotes[edit.id] || ''}
                          onChange={(e) => setReviewNotes({
                            ...reviewNotes,
                            [edit.id]: e.target.value
                          })}
                          rows={3}
                        />
                        <div className="flex gap-3">
                          <Button
                            onClick={() => processEditMutation.mutate({
                              edit_id: edit.id,
                              action: 'approve',
                              notes: reviewNotes[edit.id]
                            })}
                            disabled={processEditMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve & Apply
                          </Button>
                          <Button
                            onClick={() => processEditMutation.mutate({
                              edit_id: edit.id,
                              action: 'reject',
                              notes: reviewNotes[edit.id]
                            })}
                            disabled={processEditMutation.isPending}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setExpandedId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {expandedId !== edit.id && (
                      <Button
                        onClick={() => setExpandedId(edit.id)}
                        variant="outline"
                      >
                        Review
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="verification" className="space-y-4 mt-6">
            {verificationAlerts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  No verification alerts
                </CardContent>
              </Card>
            ) : (
              verificationAlerts.map((alert) => (
                <Card key={alert.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Resource Verification Issue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{alert.message}</p>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'outline'}>
                      {alert.severity} severity
                    </Badge>
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={() => verifyResourceMutation.mutate(alert.entity_id)}
                        disabled={verifyResourceMutation.isPending}
                        size="sm"
                      >
                        Re-verify Now
                      </Button>
                      <Button
                        onClick={() => {
                          window.location.href = `/Resources?highlight=${alert.entity_id}`;
                        }}
                        variant="outline"
                        size="sm"
                      >
                        View Resource
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="processed" className="space-y-4 mt-6">
            {processedEdits.map((edit) => (
              <Card key={edit.id} className="opacity-75">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{edit.resource_name}</span>
                    <Badge variant={edit.status === 'approved' ? 'default' : 'secondary'}>
                      {edit.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Reviewed by: {edit.reviewed_by}
                  </p>
                  {edit.review_notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      Notes: {edit.review_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}