import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Wifi, Monitor, Users, Navigation, AlertCircle } from 'lucide-react';
import GraceCard from '@/components/common/GraceCard';

export default function UnifiedCapacityDashboard() {
  const { data: capacityData = [] } = useQuery({
    queryKey: ['serviceCapacity'],
    queryFn: () => base44.entities.ServiceCapacity.list('-last_updated', 100),
    refetchInterval: 30000 // Real-time updates every 30s
  });

  const vrccServices = capacityData.filter(s => s.location_type === 'vrcc_virtual');
  const mrccServices = capacityData.filter(s => s.location_type === 'mrcc_mobile_unit');

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'at_capacity': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getCapacityPercentage = (service) => {
    return service.max_capacity > 0 
      ? (service.current_capacity / service.max_capacity) * 100 
      : 0;
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-6 h-6 text-teal-600" />
            VRCC-MRCC Unified Capacity Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VRCC Services */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Virtual Recovery Community Center</h3>
              </div>
              <div className="space-y-3">
                {vrccServices.map((service) => (
                  <div key={service.id} className="p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {service.service_type.replace(/_/g, ' ')}
                      </span>
                      <Badge className={getStatusColor(service.availability_status)}>
                        {service.availability_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <Users className="w-3 h-3" />
                      <span>{service.current_capacity}/{service.max_capacity} participants</span>
                    </div>
                    <Progress value={getCapacityPercentage(service)} className="h-2" />
                  </div>
                ))}
                {vrccServices.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No VRCC services tracked</p>
                )}
              </div>
            </div>

            {/* MRCC Services */}
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-gray-900">Mobile Recovery Community Centers</h3>
              </div>
              <div className="space-y-3">
                {mrccServices.map((service) => (
                  <div key={service.id} className="p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium capitalize block">
                          {service.service_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-600">{service.location_name}</span>
                      </div>
                      <Badge className={getStatusColor(service.availability_status)}>
                        {service.availability_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <Users className="w-3 h-3" />
                      <span>{service.current_capacity}/{service.max_capacity} slots</span>
                    </div>
                    <Progress value={getCapacityPercentage(service)} className="h-2" />
                  </div>
                ))}
                {mrccServices.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No MRCC units tracked</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {capacityData.filter(s => s.availability_status === 'available').length}
                  </p>
                  <p className="text-xs text-gray-600">Available Now</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {capacityData.filter(s => s.availability_status === 'limited').length}
                  </p>
                  <p className="text-xs text-gray-600">Limited Capacity</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">
                    {capacityData.filter(s => s.availability_status === 'at_capacity').length}
                  </p>
                  <p className="text-xs text-gray-600">At Capacity</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </GraceCard>

      <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-800">
          <strong>Impactful Collaboration:</strong> Unified VRCC-MRCC capacity tracking enables seamless cross-referrals, real-time resource allocation, and ensures no participant waits for critical services.
        </p>
      </div>
    </div>
  );
}