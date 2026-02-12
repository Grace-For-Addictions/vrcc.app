import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const ROI_METRICS = [
  { value: 'housing_secured', label: 'Housing Secured' },
  { value: 'employment_gained', label: 'Employment Gained' },
  { value: 'crisis_events_reduced', label: 'Crisis Events Reduced' },
  { value: 'treatment_engagement', label: 'Treatment Engagement' },
  { value: 'justice_diversion', label: 'Justice Diversion' },
  { value: 'education_enrollment', label: 'Education Enrollment' },
  { value: 'family_reunification', label: 'Family Reunification' },
  { value: 'peer_support_engagement', label: 'Peer Support Engagement' },
  { value: 'medication_adherence', label: 'Medication Adherence' },
  { value: 'reduced_hospitalization', label: 'Reduced Hospitalization' }
];

export default function ROIMetricSelector({ 
  referralId, 
  referralType, 
  participantEmail,
  onComplete 
}) {
  const queryClient = useQueryClient();
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const recordMetricsMutation = useMutation({
    mutationFn: async (metrics) => {
      const user = await base44.auth.me();
      const promises = metrics.map(metric =>
        base44.entities.ROIMetric.create({
          participant_email: participantEmail,
          referral_id: referralId,
          referral_type: referralType,
          metric_type: metric,
          recorded_by: user.email,
          outcome_notes: outcomeNotes,
          recorded_date: new Date().toISOString()
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Outcomes recorded for ROI tracking');
      queryClient.invalidateQueries(['roiMetrics']);
      if (onComplete) onComplete();
    }
  });

  const handleToggleMetric = (metric) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleSubmit = () => {
    if (selectedMetrics.length === 0) {
      toast.error('Please select at least one outcome');
      return;
    }
    recordMetricsMutation.mutate(selectedMetrics);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          Select Achieved Outcomes (for ROI)
        </Label>
        <div className="space-y-2">
          {ROI_METRICS.map((metric) => (
            <div key={metric.value} className="flex items-center space-x-2">
              <Checkbox
                id={metric.value}
                checked={selectedMetrics.includes(metric.value)}
                onCheckedChange={() => handleToggleMetric(metric.value)}
              />
              <label
                htmlFor={metric.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {metric.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Outcome Notes</Label>
        <Textarea
          value={outcomeNotes}
          onChange={(e) => setOutcomeNotes(e.target.value)}
          placeholder="Describe the outcomes achieved..."
          rows={3}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={recordMetricsMutation.isPending || selectedMetrics.length === 0}
        className="w-full bg-teal-600 hover:bg-teal-700"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Record Outcomes & Complete Referral
      </Button>
    </div>
  );
}