import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Users, CheckCircle, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function MobileOutreachTracker({ user }) {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const queryClient = useQueryClient();

  // Simulate GPS tracking (in production, use actual geolocation API)
  useEffect(() => {
    if (tracking) {
      const interval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: new Date().toISOString()
            });
          });
        }
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [tracking]);

  const { data: checkIns } = useQuery({
    queryKey: ['mobile-checkins', user.email],
    queryFn: () => base44.entities.CoachingSessionLog.filter({ 
      coach_name: user.full_name,
      activity_location: 'Mobile Outreach'
    }, '-activity_date', 20),
    initialData: []
  });

  const logCheckIn = useMutation({
    mutationFn: (data) => base44.entities.CoachingSessionLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['mobile-checkins']);
      toast.success('Remote check-in logged!');
    }
  });

  const [remoteCheckInData, setRemoteCheckInData] = useState({
    contact_name: '',
    contact_phone: '',
    activity_notes: ''
  });

  const handleRemoteCheckIn = () => {
    if (!remoteCheckInData.contact_name) {
      toast.error('Please enter participant name');
      return;
    }

    logCheckIn.mutate({
      ...remoteCheckInData,
      activity_date: new Date().toISOString(),
      operating_program: 'GFA Mobile RCC (Rural/Resource Nav./Coaching/GFARC)',
      activity_location: 'Mobile Outreach',
      activity_type: 'Peer Support',
      activity_channel: 'Mobile Outreach',
      coach_name: user.full_name,
      attendance: 'Yes (Completed)',
      gps_coordinates: location ? `${location.latitude},${location.longitude}` : null
    });

    setRemoteCheckInData({ contact_name: '', contact_phone: '', activity_notes: '' });
  };

  const todayCheckIns = checkIns.filter(c => {
    const checkInDate = new Date(c.activity_date);
    const today = new Date();
    return checkInDate.toDateString() === today.toDateString();
  });

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Navigation className="w-6 h-6 text-blue-600" />
          Mobile Recovery Community Center (MRCC)
        </h3>
        <p className="text-gray-700">Real-time outreach tracking and remote participant check-ins</p>
      </GraceCard>

      {/* GPS Tracking */}
      <GraceCard>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900">GPS Location Tracking</h4>
          <Button
            onClick={() => setTracking(!tracking)}
            variant={tracking ? 'default' : 'outline'}
            size="sm"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {tracking ? 'Tracking Active' : 'Start Tracking'}
          </Button>
        </div>

        {location && tracking && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Current Location</span>
            </div>
            <p className="text-sm text-blue-800">
              Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Last updated: {new Date(location.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}

        {!tracking && (
          <p className="text-sm text-gray-600">
            Enable GPS tracking to log your mobile outreach locations automatically
          </p>
        )}
      </GraceCard>

      {/* Today's Activity */}
      <div className="grid grid-cols-2 gap-4">
        <GraceCard className="text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-teal-600" />
          <div className="text-3xl font-bold text-teal-700">{todayCheckIns.length}</div>
          <div className="text-xs text-gray-600">Check-ins Today</div>
        </GraceCard>

        <GraceCard className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <div className="text-3xl font-bold text-purple-700">
            {Math.round(todayCheckIns.length * 15)}
          </div>
          <div className="text-xs text-gray-600">Minutes in Field</div>
        </GraceCard>
      </div>

      {/* Remote Check-In Form */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-green-600" />
          Digital Remote Check-In
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Participant Name *</label>
            <Input
              value={remoteCheckInData.contact_name}
              onChange={(e) => setRemoteCheckInData({ ...remoteCheckInData, contact_name: e.target.value })}
              placeholder="First Last"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <Input
              value={remoteCheckInData.contact_phone}
              onChange={(e) => setRemoteCheckInData({ ...remoteCheckInData, contact_phone: e.target.value })}
              placeholder="(555) 555-5555"
              type="tel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Check-In Notes</label>
            <Input
              value={remoteCheckInData.activity_notes}
              onChange={(e) => setRemoteCheckInData({ ...remoteCheckInData, activity_notes: e.target.value })}
              placeholder="Quick notes about this interaction..."
            />
          </div>

          <Button
            onClick={handleRemoteCheckIn}
            disabled={logCheckIn.isPending || !remoteCheckInData.contact_name}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Log Remote Check-In
          </Button>
        </div>
      </GraceCard>

      {/* Recent Check-Ins */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Recent MRCC Check-Ins</h4>
        <div className="space-y-3">
          {checkIns.slice(0, 10).map((checkIn, idx) => (
            <motion.div
              key={checkIn.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{checkIn.contact_name}</p>
                <p className="text-xs text-gray-600">
                  {new Date(checkIn.activity_date).toLocaleString()}
                  {checkIn.gps_coordinates && ' • GPS logged'}
                </p>
                {checkIn.activity_notes && (
                  <p className="text-sm text-gray-700 mt-1">{checkIn.activity_notes}</p>
                )}
              </div>
              <Badge variant="outline" className="text-green-700 bg-green-50">
                {checkIn.activity_channel}
              </Badge>
            </motion.div>
          ))}
        </div>
      </GraceCard>
    </div>
  );
}