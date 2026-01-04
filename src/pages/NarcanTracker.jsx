import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Plus, TrendingUp, MapPin, Heart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

export default function NarcanTracker() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
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

  const { data: logs } = useQuery({
    queryKey: ['narcanLogs'],
    queryFn: () => base44.entities.NarcanLog.list('-created_date', 100),
    initialData: []
  });

  const createLog = useMutation({
    mutationFn: (data) => base44.entities.NarcanLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['narcanLogs']);
      setShowForm(false);
    }
  });

  const stats = {
    distributed: logs.filter(l => l.distribution_type === 'distributed').reduce((sum, l) => sum + l.quantity, 0),
    used: logs.filter(l => l.distribution_type === 'used').length,
    livesSaved: logs.reduce((sum, l) => sum + (l.lives_saved || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Narcan Distribution Tracker"
          subtitle="Track kits, training, and reversals - GPRA & Opioid Settlement reporting ready"
          icon={Shield}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.distributed}</p>
                <p className="text-sm text-gray-600">Kits Distributed</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{stats.used}</p>
                <p className="text-sm text-gray-600">Reversals Reported</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.livesSaved}</p>
                <p className="text-sm text-gray-600">Lives Saved</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <div className="flex gap-4 mb-8">
          <Button onClick={() => setShowForm(!showForm)} className="bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Log Activity
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            GPRA Report
          </Button>
        </div>

        {/* Log Form */}
        {showForm && (
          <GraceCard className="mb-8">
            <h3 className="font-semibold text-lg mb-4">Log Narcan Activity</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              createLog.mutate({
                distribution_type: e.target.type.value,
                quantity: parseInt(e.target.quantity.value),
                narcan_type: e.target.narcan_type.value,
                location_county: e.target.county.value,
                source: e.target.source.value,
                notes: e.target.notes.value,
                lives_saved: e.target.type.value === 'used' ? parseInt(e.target.lives_saved?.value || 1) : 0,
                is_anonymous: true
              });
            }} className="space-y-4">
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="distributed">Distributed</SelectItem>
                  <SelectItem value="used">Used (Reversal)</SelectItem>
                </SelectContent>
              </Select>

              <Input type="number" name="quantity" placeholder="Quantity" defaultValue={1} required />
              
              <Select name="narcan_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Narcan Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nasal_spray">Nasal Spray</SelectItem>
                  <SelectItem value="injectable">Injectable</SelectItem>
                </SelectContent>
              </Select>

              <Input name="county" placeholder="County" />
              <Input name="source" placeholder="Source/Provider" />
              <Textarea name="notes" placeholder="Notes (anonymous)" rows={2} />

              <div className="flex gap-2">
                <Button type="submit" disabled={createLog.isPending}>
                  {createLog.isPending ? 'Saving...' : 'Save Log'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </GraceCard>
        )}

        {/* Recent Logs */}
        <GraceCard>
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{log.distribution_type}</p>
                    <p className="text-sm text-gray-600">
                      {log.quantity} {log.narcan_type} • {log.location_county || 'Iowa'}
                    </p>
                    {log.lives_saved > 0 && (
                      <p className="text-sm text-green-700 font-medium mt-1">
                        💚 {log.lives_saved} {log.lives_saved === 1 ? 'life' : 'lives'} saved
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.created_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GraceCard>
      </div>

      <GraceChatWidget />
    </div>
  );
}