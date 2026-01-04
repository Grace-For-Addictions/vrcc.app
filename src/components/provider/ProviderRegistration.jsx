import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceCard from '@/components/common/GraceCard';

export default function ProviderRegistration({ onSuccess }) {
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'treatment_center',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    county: '',
    services_offered: '',
    capacity: 10,
    description: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const submitRegistration = useMutation({
    mutationFn: async (data) => {
      const provider = await base44.entities.Provider.create({
        organization_name: data.organization_name,
        organization_type: data.organization_type,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        address: data.address,
        city: data.city,
        county: data.county,
        services_offered: data.services_offered.split(',').map(s => s.trim()),
        capacity: parseInt(data.capacity),
        is_verified: false,
        partnership_level: 'referral_only',
        accepts_warm_handoffs: false,
        profile_data: {
          description: data.description
        }
      });

      await base44.integrations.Core.SendEmail({
        to: 'providers@graceforaddictions.org',
        subject: `New Provider Registration: ${data.organization_name}`,
        body: `
New provider registration pending verification:

Organization: ${data.organization_name}
Type: ${data.organization_type}
Contact: ${data.contact_name}
Email: ${data.contact_email}
Phone: ${data.contact_phone}
City: ${data.city}, ${data.county} County

Services: ${data.services_offered}
        `
      });

      return provider;
    },
    onSuccess: () => {
      setSubmitted(true);
      onSuccess?.();
    }
  });

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <GraceCard className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Thank you for joining the Grace For Addictions provider network. We'll review your application and contact you within 48 hours.
          </p>
        </GraceCard>
      </motion.div>
    );
  }

  return (
    <GraceCard>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Join Our Provider Network</h3>
          <p className="text-sm text-gray-600">Connect with individuals in recovery across Iowa</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submitRegistration.mutate(formData); }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
            <Input
              value={formData.organization_name}
              onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type *</label>
            <Select value={formData.organization_type} onValueChange={(v) => setFormData({...formData, organization_type: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="treatment_center">Treatment Center</SelectItem>
                <SelectItem value="court">Court</SelectItem>
                <SelectItem value="probation">Probation/Parole</SelectItem>
                <SelectItem value="housing">Housing Provider</SelectItem>
                <SelectItem value="employment">Employment Services</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="peer_support">Peer Support</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
            <Input
              value={formData.contact_name}
              onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
            <Input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <Input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">County *</label>
            <Input
              value={formData.county}
              onChange={(e) => setFormData({...formData, county: e.target.value})}
              placeholder="e.g., Polk"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Capacity</label>
            <Input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Services Offered (comma-separated) *</label>
          <Input
            value={formData.services_offered}
            onChange={(e) => setFormData({...formData, services_offered: e.target.value})}
            placeholder="e.g., Outpatient therapy, Housing assistance, Job training"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization Description *</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={4}
            required
          />
        </div>

        <Button 
          type="submit" 
          disabled={submitRegistration.isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {submitRegistration.isLoading ? 'Submitting...' : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Registration
            </>
          )}
        </Button>
      </form>
    </GraceCard>
  );
}