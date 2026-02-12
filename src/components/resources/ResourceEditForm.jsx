import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function ResourceEditForm({ resource, onClose }) {
  const [formData, setFormData] = useState({
    name: resource.name || '',
    phone: resource.phone || '',
    email: resource.email || '',
    website: resource.website || '',
    address: resource.address || '',
    city: resource.city || '',
    hours: resource.hours || '',
    description: resource.description || ''
  });
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const queryClient = useQueryClient();

  const submitEditMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      // Compare with original to find changes
      const changes = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== (resource[key] || '')) {
          changes[key] = formData[key];
        }
      });

      if (Object.keys(changes).length === 0) {
        throw new Error('No changes detected');
      }

      return base44.entities.ResourceEditSuggestion.create({
        resource_id: resource.id,
        resource_name: resource.name,
        suggested_by_email: user.email,
        suggested_by_name: user.full_name,
        proposed_changes: changes,
        change_reason: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceEditSuggestions'] });
      setSubmitted(true);
      toast.success('Edit suggestion submitted for review');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit edit');
    }
  });

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
          <p className="text-gray-600 mb-4">
            Your edit suggestion has been submitted and will be reviewed by a navigator.
          </p>
          <Button onClick={onClose}>Close</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="w-5 h-5" />
          Suggest Edits to {resource.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => {
          e.preventDefault();
          submitEditMutation.mutate();
        }} className="space-y-4">
          
          <div>
            <Label>Organization Name</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Website</Label>
            <Input 
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div>
            <Label>City</Label>
            <Input 
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
          </div>

          <div>
            <Label>Hours</Label>
            <Input 
              value={formData.hours}
              onChange={(e) => setFormData({...formData, hours: e.target.value})}
              placeholder="e.g., Mon-Fri 9am-5pm"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div>
            <Label>Why are you suggesting this change? *</Label>
            <Textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              required
              placeholder="e.g., I contacted them and they have new hours"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={submitEditMutation.isPending || !reason}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {submitEditMutation.isPending ? 'Submitting...' : 'Submit for Review'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}