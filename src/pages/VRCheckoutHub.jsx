import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Headphones, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';

export default function VRCheckoutHub() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    participant_email: '',
    headset_id: '',
    checkout_type: '1_week_prevention',
    target_population: 'youth_prevention',
    connectivity_provided: false,
    school_affiliation: '',
    dallas_county_resident: true,
    consent_data_sharing: false
  });

  const queryClient = useQueryClient();

  const { data: checkouts } = useQuery({
    queryKey: ['vr-checkouts'],
    queryFn: () => base44.entities.VRHeadsetCheckout.list('-checkout_date', 100),
    initialData: []
  });

  const createCheckout = useMutation({
    mutationFn: (data) => base44.entities.VRHeadsetCheckout.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vr-checkouts']);
      setShowForm(false);
      setFormData({
        participant_email: '',
        headset_id: '',
        checkout_type: '1_week_prevention',
        target_population: 'youth_prevention',
        connectivity_provided: false,
        school_affiliation: '',
        dallas_county_resident: true,
        consent_data_sharing: false
      });
    }
  });

  const returnHeadset = useMutation({
    mutationFn: (checkoutId) => base44.entities.VRHeadsetCheckout.update(checkoutId, {
      status: 'returned',
      return_date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => queryClient.invalidateQueries(['vr-checkouts'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.consent_data_sharing) {
      alert('Consent for data sharing required for IBHRS compliance');
      return;
    }
    createCheckout.mutate({
      ...formData,
      checkout_date: new Date().toISOString().split('T')[0]
    });
  };

  const activeCheckouts = checkouts.filter(c => c.status === 'active');
  const overdueCheckouts = checkouts.filter(c => {
    if (c.status !== 'active') return false;
    const checkoutDate = new Date(c.checkout_date);
    const daysOut = Math.floor((new Date() - checkoutDate) / (1000 * 60 * 60 * 24));
    return daysOut > (c.checkout_type === '1_week_prevention' ? 7 : 14);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="VR Headset Checkout Hub"
          subtitle="Dallas County Opioid Settlement-funded VR program for youth prevention and recovery support"
          icon={Headphones}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{activeCheckouts.length}</p>
                <p className="text-sm text-gray-600">Active Checkouts</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {checkouts.filter(c => c.status === 'returned').length}
                </p>
                <p className="text-sm text-gray-600">Returned</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{overdueCheckouts.length}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </div>
          </GraceCard>
        </div>

        {/* New Checkout Button */}
        <div className="mb-6">
          <Button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            New VR Checkout
          </Button>
        </div>

        {/* Checkout Form */}
        {showForm && (
          <GraceCard className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Headset Checkout</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participant Email
                  </label>
                  <Input
                    type="email"
                    value={formData.participant_email}
                    onChange={(e) => setFormData({...formData, participant_email: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headset ID
                  </label>
                  <Input
                    value={formData.headset_id}
                    onChange={(e) => setFormData({...formData, headset_id: e.target.value})}
                    placeholder="VR-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Checkout Type
                  </label>
                  <Select 
                    value={formData.checkout_type}
                    onValueChange={(v) => setFormData({...formData, checkout_type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_week_prevention">1 Week (Prevention)</SelectItem>
                      <SelectItem value="2_week_treatment">2 Weeks (Treatment)</SelectItem>
                      <SelectItem value="extended_recovery">Extended (Recovery)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Population
                  </label>
                  <Select 
                    value={formData.target_population}
                    onValueChange={(v) => setFormData({...formData, target_population: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youth_prevention">Youth Prevention</SelectItem>
                      <SelectItem value="adult_recovery">Adult Recovery</SelectItem>
                      <SelectItem value="justice_involved">Justice-Involved</SelectItem>
                      <SelectItem value="high_risk">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Affiliation (if youth)
                  </label>
                  <Input
                    value={formData.school_affiliation}
                    onChange={(e) => setFormData({...formData, school_affiliation: e.target.value})}
                    placeholder="Perry High School"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.connectivity_provided}
                    onCheckedChange={(checked) => setFormData({...formData, connectivity_provided: checked})}
                  />
                  <label className="text-sm text-gray-700">
                    Mobile hotspot included (Digital Equity Fund)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.dallas_county_resident}
                    onCheckedChange={(checked) => setFormData({...formData, dallas_county_resident: checked})}
                  />
                  <label className="text-sm text-gray-700">
                    Dallas County resident (Opioid Settlement eligibility)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.consent_data_sharing}
                    onCheckedChange={(checked) => setFormData({...formData, consent_data_sharing: checked})}
                  />
                  <label className="text-sm text-gray-700 font-medium">
                    Consent to data sharing for IBHRS reporting (required)
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={createCheckout.isLoading} className="bg-purple-600 hover:bg-purple-700">
                  Create Checkout
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </GraceCard>
        )}

        {/* Active Checkouts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Checkouts</h3>
          {activeCheckouts.map(checkout => {
            const checkoutDate = new Date(checkout.checkout_date);
            const daysOut = Math.floor((new Date() - checkoutDate) / (1000 * 60 * 60 * 24));
            const maxDays = checkout.checkout_type === '1_week_prevention' ? 7 : 14;
            const isOverdue = daysOut > maxDays;

            return (
              <GraceCard key={checkout.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                        {checkout.headset_id}
                      </Badge>
                      <Badge variant="outline">{checkout.target_population}</Badge>
                      {checkout.connectivity_provided && (
                        <Badge className="bg-green-100 text-green-800">+ Hotspot</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Checked out {daysOut} days ago • Sessions: {checkout.sessions_completed || 0}
                    </p>
                    {checkout.school_affiliation && (
                      <p className="text-xs text-gray-500 mt-1">School: {checkout.school_affiliation}</p>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => returnHeadset.mutate(checkout.id)}
                  >
                    Mark Returned
                  </Button>
                </div>
              </GraceCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}