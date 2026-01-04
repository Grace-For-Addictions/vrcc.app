import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceCard from '@/components/common/GraceCard';

export default function ReferralManager({ referrals, providerId }) {
  const [selectedReferral, setSelectedReferral] = useState(null);
  const queryClient = useQueryClient();

  const updateReferral = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['referrals']);
      setSelectedReferral(null);
    }
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    accepted: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    declined: 'bg-red-100 text-red-800 border-red-200',
    no_show: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const statusIcons = {
    pending: Clock,
    accepted: CheckCircle2,
    completed: CheckCircle2,
    declined: XCircle,
    no_show: XCircle
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Referrals</h3>
      
      {referrals.map((referral) => {
        const StatusIcon = statusIcons[referral.status] || Clock;
        const isExpanded = selectedReferral?.id === referral.id;

        return (
          <motion.div
            key={referral.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div 
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-teal-300 transition-all cursor-pointer"
              onClick={() => setSelectedReferral(isExpanded ? null : referral)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusIcon className={`w-4 h-4 ${
                      referral.status === 'completed' || referral.status === 'accepted' 
                        ? 'text-green-600' 
                        : referral.status === 'pending' 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`} />
                    <h4 className="font-semibold text-gray-900">{referral.service_needed}</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Referred: {new Date(referral.created_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {referral.referral_type}
                  </p>
                </div>
                <Badge className={statusColors[referral.status]}>
                  {referral.status}
                </Badge>
              </div>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-4 pt-4 border-t border-gray-100 space-y-4"
                >
                  {referral.referral_notes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-1">Referral Notes:</p>
                      <p className="text-sm text-gray-600">{referral.referral_notes}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                    <Select 
                      value={referral.status}
                      onValueChange={(value) => {
                        updateReferral.mutate({ 
                          id: referral.id, 
                          data: { status: value }
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Outcome Notes</label>
                    <Textarea
                      placeholder="Document outcome, next steps, or feedback..."
                      defaultValue={referral.outcome || ''}
                      onBlur={(e) => {
                        if (e.target.value !== referral.outcome) {
                          updateReferral.mutate({
                            id: referral.id,
                            data: { outcome: e.target.value }
                          });
                        }
                      }}
                      rows={3}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}

      {referrals.length === 0 && (
        <GraceCard className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No referrals yet</p>
        </GraceCard>
      )}
    </div>
  );
}