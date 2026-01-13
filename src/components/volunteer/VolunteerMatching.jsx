import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, Send, Heart, TrendingUp } from 'lucide-react';

export default function VolunteerMatching({ volunteerEmail }) {
  const queryClient = useQueryClient();

  const { data: volunteer } = useQuery({
    queryKey: ['volunteer-profile', volunteerEmail],
    queryFn: async () => {
      const vols = await base44.entities.VolunteerProfile.filter({ volunteer_email: volunteerEmail });
      return vols[0];
    },
    enabled: !!volunteerEmail
  });

  const { data: allShifts = [] } = useQuery({
    queryKey: ['available-shifts'],
    queryFn: () => base44.entities.VolunteerShift.filter({ status: 'scheduled' })
  });

  const matchOpportunities = () => {
    if (!volunteer) return [];
    
    const skills = volunteer.skills_interests || [];
    const roles = volunteer.volunteer_roles || [];
    const availability = volunteer.availability || {};
    
    // Match shifts to volunteer skills and availability
    return allShifts
      .filter(shift => {
        // No volunteer assigned yet
        if (shift.volunteer_email) return false;
        
        // Check role match
        const roleMatch = roles.includes(shift.role);
        
        // Check skill match
        const skillMatch = skills.some(skill => 
          shift.opportunity_description?.toLowerCase().includes(skill.toLowerCase())
        );
        
        // Check day availability
        const shiftDay = new Date(shift.shift_date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const dayAvailable = availability[shiftDay];
        
        return (roleMatch || skillMatch) && dayAvailable;
      })
      .slice(0, 5);
  };

  const matchedOpportunities = matchOpportunities();

  const assignShiftMutation = useMutation({
    mutationFn: async (shiftId) => {
      return base44.entities.VolunteerShift.update(shiftId, {
        volunteer_email: volunteerEmail,
        status: 'confirmed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['available-shifts']);
      queryClient.invalidateQueries(['volunteer-shifts']);
    }
  });

  if (!volunteer) return null;

  return (
    <Card className="border-teal-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          Matched Opportunities for You
        </CardTitle>
        <CardDescription>Based on your skills and availability</CardDescription>
      </CardHeader>
      <CardContent>
        {matchedOpportunities.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No matching opportunities at this time. Check back soon!
          </p>
        ) : (
          <div className="space-y-3">
            {matchedOpportunities.map(shift => (
              <div key={shift.id} className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-teal-900">{shift.opportunity_title}</p>
                    <p className="text-sm text-teal-700 mt-1">{shift.opportunity_description}</p>
                  </div>
                  <Badge className="bg-teal-100 text-teal-700">
                    <Heart className="w-3 h-3 mr-1" />
                    Match
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-teal-200">
                  <div className="text-sm text-gray-600">
                    <p>{new Date(shift.shift_date).toLocaleDateString()}</p>
                    <p className="text-xs">{shift.shift_time}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => assignShiftMutation.mutate(shift.id)}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}