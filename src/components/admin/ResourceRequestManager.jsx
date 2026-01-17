import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, CheckCircle2, Clock, Package,
  TrendingUp, MapPin, Wifi
} from 'lucide-react';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';

export default function ResourceRequestManager() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['resourceRequests'],
    queryFn: () => base44.entities.ResourceRequest.list('-created_date', 100)
  });

  const { data: usageAnalysis } = useQuery({
    queryKey: ['resourceUsageAnalysis'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzeResourceUsagePatterns');
      return response.data;
    }
  });

  const fulfillMutation = useMutation({
    mutationFn: async ({ requestId, notes }) => {
      return await base44.entities.ResourceRequest.update(requestId, {
        request_status: 'fulfilled',
        fulfillment_date: new Date().toISOString(),
        fulfillment_notes: notes,
        fulfilled_by: (await base44.auth.me()).email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resourceRequests']);
      toast.success('Request fulfilled! ✅');
      setSelectedRequest(null);
    }
  });

  const pendingRequests = requests.filter(r => r.request_status === 'pending');
  const urgentRequests = pendingRequests.filter(r => 
    r.urgency_level === 'critical' || r.urgency_level === 'high'
  );

  const getUrgencyColor = (level) => {
    switch(level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{urgentRequests.length}</p>
              <p className="text-xs text-gray-600">Urgent Requests</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{pendingRequests.length}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {requests.filter(r => r.request_status === 'fulfilled').length}
              </p>
              <p className="text-xs text-gray-600">Fulfilled</p>
            </div>
          </div>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{requests.length}</p>
              <p className="text-xs text-gray-600">Total Requests</p>
            </div>
          </div>
        </GraceCard>
      </div>

      <Tabs defaultValue="urgent">
        <TabsList>
          <TabsTrigger value="urgent">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Urgent ({urgentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="urgent">
          <GraceCard>
            <CardHeader>
              <CardTitle>Urgent Resource Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {urgentRequests.map((request) => (
                  <div key={request.id} className={`p-4 rounded-lg border-2 ${getUrgencyColor(request.urgency_level)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{request.specific_resource}</h4>
                          <Badge variant="outline" className="capitalize">
                            {request.resource_type.replace(/_/g, ' ')}
                          </Badge>
                          {request.is_rural && (
                            <Badge className="bg-green-100 text-green-800">
                              <MapPin className="w-3 h-3 mr-1" />
                              Rural
                            </Badge>
                          )}
                          {request.is_unhoused && (
                            <Badge className="bg-blue-100 text-blue-800">Unhoused</Badge>
                          )}
                        </div>
                        <p className="text-sm mb-2">{request.reason_for_request}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{request.requester_name}</span>
                          <span>•</span>
                          <span>{request.location}</span>
                          <span>•</span>
                          <span>{new Date(request.created_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setSelectedRequest(request)}
                        size="sm"
                      >
                        Fulfill
                      </Button>
                    </div>
                  </div>
                ))}
                {urgentRequests.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No urgent requests</p>
                )}
              </div>
            </CardContent>
          </GraceCard>
        </TabsContent>

        <TabsContent value="all">
          <GraceCard>
            <CardHeader>
              <CardTitle>All Resource Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {requests.map((request) => (
                  <div key={request.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{request.specific_resource}</p>
                        <p className="text-xs text-gray-600">{request.requester_name} • {request.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getUrgencyColor(request.urgency_level)}>
                          {request.urgency_level}
                        </Badge>
                        <Badge variant={
                          request.request_status === 'fulfilled' ? 'default' :
                          request.request_status === 'pending' ? 'outline' :
                          'secondary'
                        }>
                          {request.request_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GraceCard>
        </TabsContent>

        <TabsContent value="analytics">
          <GraceCard>
            <CardHeader>
              <CardTitle>AI Usage Pattern Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {usageAnalysis ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Usage Statistics</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-gray-600">Total Requests</p>
                        <p className="text-xl font-bold">{usageAnalysis.usage_stats?.total_requests}</p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded">
                        <p className="text-gray-600">Urgent Requests</p>
                        <p className="text-xl font-bold text-orange-700">{usageAnalysis.usage_stats?.urgent_requests}</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <p className="text-gray-600">Rural Requests</p>
                        <p className="text-xl font-bold text-green-700">{usageAnalysis.usage_stats?.rural_requests}</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-gray-600">Unhoused Requests</p>
                        <p className="text-xl font-bold text-blue-700">{usageAnalysis.usage_stats?.unhoused_requests}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">AI Recommendations</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Priority Offline Resources:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {usageAnalysis.ai_recommendations?.offline_priority_resources?.map((resource, idx) => (
                            <Badge key={idx} className="bg-purple-100 text-purple-800">{resource}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Target Populations:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {usageAnalysis.ai_recommendations?.target_populations?.map((pop, idx) => (
                            <Badge key={idx} variant="outline">{pop}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={() => queryClient.invalidateQueries(['resourceUsageAnalysis'])}>
                    Generate Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </GraceCard>
        </TabsContent>
      </Tabs>

      {/* Fulfillment Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Fulfill Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Resource:</p>
                <p className="text-lg">{selectedRequest.specific_resource}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fulfillment Notes</label>
                <Textarea 
                  placeholder="How was this request fulfilled?"
                  id="fulfillment-notes"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    const notes = document.getElementById('fulfillment-notes').value;
                    fulfillMutation.mutate({ requestId: selectedRequest.id, notes });
                  }}
                  className="flex-1"
                >
                  Mark as Fulfilled
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}