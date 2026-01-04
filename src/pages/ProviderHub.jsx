import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Send, CheckCircle2, Clock,
  TrendingUp, BarChart3, Eye, Plus, Search, UserPlus
} from 'lucide-react';
import ProviderRegistration from '@/components/provider/ProviderRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

function ProviderProfile({ provider, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(provider || {});

  const handleSave = () => {
    onUpdate(formData);
    setEditing(false);
  };

  return (
    <GraceCard>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{provider.organization_name}</h3>
          <Badge className="mt-2">{provider.organization_type}</Badge>
        </div>
        <Button variant="outline" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {editing ? (
        <div className="space-y-4">
          <Input
            placeholder="Organization Name"
            value={formData.organization_name}
            onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
          />
          <Textarea
            placeholder="Services Description"
            value={formData.profile_data?.description || ''}
            onChange={(e) => setFormData({
              ...formData,
              profile_data: { ...formData.profile_data, description: e.target.value }
            })}
            rows={4}
          />
          <Input
            type="number"
            placeholder="Current Capacity"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
          />
          <Button onClick={handleSave} className="w-full">Save Changes</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-600">{provider.profile_data?.description}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Capacity</p>
              <p className="font-semibold">{provider.capacity} clients</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Partnership Level</p>
              <Badge variant="outline">{provider.partnership_level}</Badge>
            </div>
          </div>
        </div>
      )}
    </GraceCard>
  );
}

function ReferralTracking({ referrals }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800'
  };

  return (
    <GraceCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
      <div className="space-y-3">
        {referrals.map((referral) => (
          <div key={referral.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900">{referral.service_needed}</p>
                <p className="text-sm text-gray-600">
                  {new Date(referral.created_date).toLocaleDateString()}
                </p>
              </div>
              <Badge className={statusColors[referral.status]}>{referral.status}</Badge>
            </div>
            {referral.referral_notes && (
              <p className="text-sm text-gray-600 mt-2">{referral.referral_notes}</p>
            )}
          </div>
        ))}
      </div>
    </GraceCard>
  );
}

export default function ProviderHub() {
  const [user, setUser] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: provider } = useQuery({
    queryKey: ['provider'],
    queryFn: async () => {
      if (!user) return null;
      const providers = await base44.entities.Provider.filter({ created_by: user.email });
      return providers[0] || null;
    },
    enabled: !!user
  });

  const { data: referrals } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      if (!provider) return [];
      return base44.entities.Referral.filter({ provider_id: provider.id }, '-created_date', 50);
    },
    enabled: !!provider,
    initialData: []
  });

  const updateProvider = useMutation({
    mutationFn: (data) => base44.entities.Provider.update(provider.id, data),
    onSuccess: () => queryClient.invalidateQueries(['provider'])
  });

  if (!provider) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <GraceHeader 
            title="Provider Hub"
            subtitle="Partner portal for warm handoffs, referral tracking, and collaboration"
            icon={Building2}
          />
          
          {!showRegistration ? (
            <GraceCard className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Join Our Provider Network</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Partner with Grace For Addictions to receive warm handoffs and support individuals in recovery.
              </p>
              <Button onClick={() => setShowRegistration(true)} className="bg-blue-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Register Your Organization
              </Button>
            </GraceCard>
          ) : (
            <ProviderRegistration onSuccess={() => queryClient.invalidateQueries(['provider'])} />
          )}
        </div>
      </div>
    );
  }

  const stats = {
    totalReferrals: referrals.length,
    pending: referrals.filter(r => r.status === 'pending').length,
    completed: referrals.filter(r => r.status === 'completed').length,
    capacity: provider.capacity
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Provider Hub"
          subtitle={`Welcome, ${provider.organization_name}`}
          icon={Building2}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.totalReferrals}</p>
                <p className="text-sm text-gray-600">Total Referrals</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{stats.capacity}</p>
                <p className="text-sm text-gray-600">Capacity</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ProviderProfile 
              provider={provider}
              onUpdate={(data) => updateProvider.mutate(data)}
            />
          </div>

          <div className="lg:col-span-2">
            <ReferralTracking referrals={referrals} />
          </div>
        </div>
      </div>

      <GraceChatWidget />
    </div>
  );
}