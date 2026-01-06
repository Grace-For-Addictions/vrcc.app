import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function ResidentApprovals({ user }) {
  const queryClient = useQueryClient();

  const { data: pendingProfiles } = useQuery({
    queryKey: ['pendingResidents'],
    queryFn: () => base44.entities.ResidentProfile.filter({ resident_status: 'pending_approval' }),
    initialData: []
  });

  const { data: houses } = useQuery({
    queryKey: ['allHouses'],
    queryFn: () => base44.entities.RecoveryHouse.list(),
    initialData: []
  });

  const approveResident = useMutation({
    mutationFn: ({ profileId, houseId }) => {
      return Promise.all([
        base44.entities.ResidentProfile.update(profileId, {
          resident_status: 'active',
          approved_by: user.email,
          approval_date: new Date().toISOString()
        }),
        base44.entities.RecoveryHouse.filter({ id: houseId }).then(houses => {
          if (houses[0]) {
            return base44.entities.RecoveryHouse.update(houseId, {
              current_occupancy: (houses[0].current_occupancy || 0) + 1
            });
          }
        })
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingResidents']);
      queryClient.invalidateQueries(['allHouses']);
    }
  });

  const rejectResident = useMutation({
    mutationFn: (profileId) => base44.entities.ResidentProfile.delete(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingResidents']);
    }
  });

  const getHouseName = (houseId) => {
    const house = houses.find(h => h.id === houseId);
    return house?.house_name || 'Unknown House';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Pending Resident Approvals</h3>
        <Badge className="bg-amber-100 text-amber-700">
          {pendingProfiles.length} Pending
        </Badge>
      </div>

      {pendingProfiles.length === 0 ? (
        <GraceCard className="text-center py-12">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4 opacity-50" />
          <p className="text-gray-600">No pending approvals</p>
        </GraceCard>
      ) : (
        <div className="space-y-4">
          {pendingProfiles.map((profile, idx) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GraceCard>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{profile.user_email}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        House: {getHouseName(profile.house_id)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested: {new Date(profile.intake_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveResident.mutate({ profileId: profile.id, houseId: profile.house_id })}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectResident.mutate(profile.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </GraceCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}