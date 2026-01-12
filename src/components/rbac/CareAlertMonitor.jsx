import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { CARE_ALERT_THRESHOLDS } from './PermissionHelper';

// Automatic care alert monitoring for disengagement
export default function CareAlertMonitor({ userRole }) {
  const queryClient = useQueryClient();

  // Only run for program staff and admins
  if (!['program_staff', 'administrator'].includes(userRole)) {
    return null;
  }

  const { data: profiles } = useQuery({
    queryKey: ['allProfilesForMonitoring'],
    queryFn: () => base44.entities.UserProfile.list('-last_active', 500),
    initialData: []
  });

  const { data: checkIns } = useQuery({
    queryKey: ['recentCheckIns'],
    queryFn: () => base44.entities.DailyCheckIn.list('-created_date', 500),
    initialData: []
  });

  // Find users at risk (no activity in 7+ days)
  const atRiskUsers = profiles.filter(profile => {
    if (!profile.last_active) return false;
    
    const lastActiveDate = new Date(profile.last_active);
    const daysSince = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSince >= CARE_ALERT_THRESHOLDS.disengagement_days;
  });

  const createAlert = useMutation({
    mutationFn: (data) => base44.entities.CareAlert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['careAlerts']);
    }
  });

  if (atRiskUsers.length === 0) return null;

  return (
    <GraceCard className="bg-amber-50 border-amber-200 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">
            Care Alert: Disengagement Detected
          </h3>
          <p className="text-sm text-amber-800 mb-3">
            {atRiskUsers.length} participant{atRiskUsers.length > 1 ? 's have' : ' has'} not been active for 7+ days.
          </p>
          <div className="space-y-2">
            {atRiskUsers.slice(0, 5).map(profile => {
              const lastActive = new Date(profile.last_active);
              const daysAgo = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={profile.id} className="flex items-center justify-between p-2 bg-white rounded border border-amber-200">
                  <div>
                    <p className="font-medium text-gray-900">{profile.display_name}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last active {daysAgo} days ago
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-700">
                    At Risk
                  </Badge>
                </div>
              );
            })}
          </div>
          {atRiskUsers.length > 5 && (
            <p className="text-xs text-amber-600 mt-2">
              +{atRiskUsers.length - 5} more participants need follow-up
            </p>
          )}
        </div>
      </div>
    </GraceCard>
  );
}