import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit, Home, Users, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GraceCard from '@/components/common/GraceCard';

export default function HouseManagement({ user }) {
  const [editingHouse, setEditingHouse] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: houses } = useQuery({
    queryKey: ['allHouses'],
    queryFn: () => base44.entities.RecoveryHouse.list(),
    initialData: []
  });

  const createHouse = useMutation({
    mutationFn: (data) => base44.entities.RecoveryHouse.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allHouses']);
      setEditingHouse(null);
      setFormData({});
    }
  });

  const updateHouse = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecoveryHouse.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allHouses']);
      setEditingHouse(null);
      setFormData({});
    }
  });

  const handleSave = () => {
    if (editingHouse === 'new') {
      createHouse.mutate({
        ...formData,
        house_code: Math.random().toString(36).substring(2, 8).toUpperCase()
      });
    } else {
      updateHouse.mutate({ id: editingHouse, data: formData });
    }
  };

  const openEdit = (house) => {
    setEditingHouse(house?.id || 'new');
    setFormData(house || {
      house_name: '',
      gender_served: 'men',
      capacity: 10,
      current_occupancy: 0,
      is_active: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Recovery Houses</h3>
        <Button onClick={() => openEdit(null)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Add House
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses.map((house, idx) => (
          <motion.div
            key={house.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <GraceCard>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">{house.house_name}</h4>
                  <Badge className={house.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {house.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Button size="icon" variant="ghost" onClick={() => openEdit(house)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Code:</span>
                  <span className="font-mono font-bold">{house.house_code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="capitalize">{house.gender_served}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Occupancy:</span>
                  <span>{house.current_occupancy}/{house.capacity}</span>
                </div>
                {house.address && (
                  <p className="text-xs text-gray-500 mt-2">{house.address}, {house.city}</p>
                )}
              </div>
            </GraceCard>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!editingHouse} onOpenChange={() => setEditingHouse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHouse === 'new' ? 'Add New House' : 'Edit House'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="House Name"
              value={formData.house_name || ''}
              onChange={(e) => setFormData({ ...formData, house_name: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="City"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <Input
                placeholder="County"
                value={formData.county || ''}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
              />
            </div>
            <Select
              value={formData.gender_served || 'men'}
              onValueChange={(v) => setFormData({ ...formData, gender_served: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="co-ed">Co-Ed</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Capacity"
              value={formData.capacity || ''}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            />
            <Button
              onClick={handleSave}
              disabled={createHouse.isPending || updateHouse.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {(createHouse.isPending || updateHouse.isPending) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save House
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}