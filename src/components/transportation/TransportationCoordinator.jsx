import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, ExternalLink, CheckCircle2, Send, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function TransportationCoordinator() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [coordinatorNotes, setCoordinatorNotes] = useState('');

  const { data: requests = [] } = useQuery({
    queryKey: ['transportationRequests'],
    queryFn: () => base44.entities.TransportationRequest.list('-created_date', 100)
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }) => base44.entities.TransportationRequest.update(id, data),
    onSuccess: () => {
      toast.success('Request updated');
      queryClient.invalidateQueries(['transportationRequests']);
      setSelectedRequest(null);
    }
  });

  const handleSendToBarnabus = (request) => {
    // Open Barnabus join link in new window
    window.open('https://barnabusdemofeb6.com/join', '_blank');
    
    // Mark as referred
    updateRequestMutation.mutate({
      id: request.id,
      data: {
        barnabus_referral_sent: true,
        barnabus_referral_date: new Date().toISOString(),
        status: 'approved'
      }
    });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const scheduledRequests = requests.filter(r => r.status === 'scheduled');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-teal-600" />
            Transportation Coordination Dashboard
          </CardTitle>
          <p className="text-sm text-gray-600">Coordinate rides with Barnabus for participants</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-700">{pendingRequests.length}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{approvedRequests.length}</p>
              <p className="text-sm text-gray-600">Sent to Barnabus</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{scheduledRequests.length}</p>
              <p className="text-sm text-gray-600">Scheduled</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Pending Requests</h4>
            {pendingRequests.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No pending requests</p>
            ) : (
              pendingRequests.map((req) => (
                <GraceCard key={req.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{req.participant_name}</h4>
                        <Badge variant="outline">{req.destination_type}</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {req.pickup_address} → {req.destination_address}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(req.requested_date).toLocaleDateString()} at {req.requested_time}
                        </p>
                        {req.special_needs && (
                          <p className="text-orange-600">⚠️ Special needs: {req.special_needs}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSendToBarnabus(req)}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Send to Barnabus
                      </Button>
                    </div>
                  </div>
                </GraceCard>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">About Barnabus Integration</h4>
            <p className="text-sm text-purple-800 mb-3">
              Barnabus provides free transportation for recovery-related appointments across Iowa. 
              When you click "Send to Barnabus", you'll be directed to their registration portal 
              to complete the referral.
            </p>
            <a
              href="https://barnabusdemofeb6.com/join"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-purple-700 hover:text-purple-900 font-medium"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Visit Barnabus Portal
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}