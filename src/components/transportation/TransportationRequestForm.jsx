import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, MapPin, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TransportationRequestForm({ user, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    pickup_address: '',
    destination_address: '',
    destination_type: '',
    requested_date: '',
    requested_time: '',
    is_recurring: false,
    special_needs: ''
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      const request = await base44.entities.TransportationRequest.create({
        ...data,
        participant_email: user.email,
        participant_name: user.full_name,
        status: 'pending'
      });
      return request;
    },
    onSuccess: () => {
      toast.success('Transportation request submitted! Our team will connect you with Barnabus.');
      queryClient.invalidateQueries(['transportationRequests']);
      setFormData({
        pickup_address: '',
        destination_address: '',
        destination_type: '',
        requested_date: '',
        requested_time: '',
        is_recurring: false,
        special_needs: ''
      });
      if (onSuccess) onSuccess();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.pickup_address || !formData.destination_address || !formData.requested_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    createRequestMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5 text-teal-600" />
          Request Transportation
        </CardTitle>
        <p className="text-sm text-gray-600">
          We partner with Barnabus to provide free transportation to recovery-related appointments
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Pickup Location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={formData.pickup_address}
                onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                placeholder="123 Main St, Des Moines, IA 50309"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label>Destination *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={formData.destination_address}
                onChange={(e) => setFormData({...formData, destination_address: e.target.value})}
                placeholder="456 Oak Ave, Des Moines, IA 50310"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label>Trip Purpose *</Label>
            <Select
              value={formData.destination_type}
              onValueChange={(val) => setFormData({...formData, destination_type: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medical Appointment</SelectItem>
                <SelectItem value="recovery_meeting">Recovery Meeting</SelectItem>
                <SelectItem value="treatment">Treatment Facility</SelectItem>
                <SelectItem value="employment">Job Interview / Work</SelectItem>
                <SelectItem value="housing">Housing Appointment</SelectItem>
                <SelectItem value="food_bank">Food Bank</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={formData.requested_date}
                  onChange={(e) => setFormData({...formData, requested_date: e.target.value})}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label>Time *</Label>
              <Input
                type="time"
                value={formData.requested_time}
                onChange={(e) => setFormData({...formData, requested_time: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label>Special Needs (wheelchair, mobility aids, etc.)</Label>
            <Textarea
              value={formData.special_needs}
              onChange={(e) => setFormData({...formData, special_needs: e.target.value})}
              placeholder="Any accessibility needs we should know about?"
              rows={2}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">About Barnabus Transportation</p>
                <p>Barnabus provides free rides to recovery-related appointments across Iowa. Once you submit this request, our team will coordinate with Barnabus and confirm your ride.</p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700"
            disabled={createRequestMutation.isPending}
          >
            <Car className="w-4 h-4 mr-2" />
            {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}