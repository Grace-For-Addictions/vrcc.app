import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Loader2, CheckCircle } from 'lucide-react';

export default function ResourceSuggestionForm({ user }) {
  const [formData, setFormData] = useState({
    organization_name: '',
    category: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    county: '',
    why_helpful: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.ResourceSuggestion.create({
        ...data,
        suggested_by_email: user.email,
        status: 'pending'
      });
    },
    onSuccess: () => {
      toast.success('Resource suggestion submitted! Our team will review it.');
      setSubmitted(true);
      setFormData({
        organization_name: '',
        category: '',
        description: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        city: '',
        county: '',
        why_helpful: ''
      });
      setTimeout(() => setSubmitted(false), 3000);
    },
    onError: (error) => {
      toast.error('Failed to submit: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.organization_name || !formData.category) {
      toast.error('Please fill in organization name and category');
      return;
    }

    submitMutation.mutate(formData);
  };

  if (!user) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Plus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">Sign in to suggest resources</p>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-600">
            Your resource suggestion has been submitted and will be reviewed by our navigators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Suggest a New Resource
        </CardTitle>
        <CardDescription>
          Know a helpful resource that's not listed? Share it with the community! Our navigators will verify and add it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Organization Name *</label>
              <Input
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                placeholder="e.g., Hope Recovery Center"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="family">Family Support</SelectItem>
                  <SelectItem value="crisis">Crisis Services</SelectItem>
                  <SelectItem value="peer_support">Peer Support</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="food">Food Assistance</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="mental_health">Mental Health</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">County</label>
              <Input
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                placeholder="e.g., Polk"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What services do they provide?"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@organization.org"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Des Moines"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Why is this resource helpful?</label>
              <Textarea
                value={formData.why_helpful}
                onChange={(e) => setFormData({ ...formData, why_helpful: e.target.value })}
                placeholder="Share your experience or why you think this would help others..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={submitMutation.isPending}
              className="flex-1 bg-teal-600"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Suggestion
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}