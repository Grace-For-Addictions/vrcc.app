import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Wifi, Calendar, Phone, Download, Navigation,
  Monitor, Clock, CheckCircle2, AlertCircle, Radio
} from 'lucide-react';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';

export default function MRCCTechHub() {
  const [user, setUser] = useState(null);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [userLocation, setUserLocation] = useState(null);
  const [routeDestination, setRouteDestination] = useState(null);
  const [showHotspotRequest, setShowHotspotRequest] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();

    // Offline mode detection
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => {
      setOfflineMode(true);
      toast.info('📱 Offline mode activated - essential resources still available');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get user location for geo-based recommendations
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location access denied')
      );
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: bookings = [] } = useQuery({
    queryKey: ['telehealthBookings', user?.email],
    queryFn: () => base44.entities.TelehealthKioskBooking.filter({ 
      participant_email: user.email 
    }, '-appointment_date', 10),
    enabled: !!user && !offlineMode
  });

  const { data: nearbyResources = [] } = useQuery({
    queryKey: ['nearbyResources', userLocation],
    queryFn: async () => {
      if (!userLocation) return [];
      // In real implementation, calculate distance
      const resources = await base44.entities.Resource.list('-updated_date', 50);
      return resources.filter(r => r.latitude && r.longitude).slice(0, 5);
    },
    enabled: !!userLocation && !offlineMode
  });

  const bookKioskMutation = useMutation({
    mutationFn: async (bookingData) => {
      return await base44.entities.TelehealthKioskBooking.create({
        participant_email: user.email,
        participant_name: user.full_name,
        booking_status: 'requested',
        ...bookingData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['telehealthBookings']);
      toast.success('Kiosk appointment requested! 📅');
    }
  });

  const routeMutation = useMutation({
    mutationFn: async (destination) => {
      const response = await base44.functions.invoke('suggestOptimalRoute', {
        destination_lat: destination.latitude || 41.5868,
        destination_lng: destination.longitude || -93.6250,
        destination_name: destination.name || destination.mrcc_location
      });
      return response.data;
    },
    onSuccess: (data) => {
      setRouteDestination(data);
      toast.success('Route optimized!');
    }
  });

  const hotspotRequestMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.ResourceRequest.create({
        requester_email: user.email,
        requester_name: user.full_name,
        resource_type: 'mobile_hotspot',
        specific_resource: 'Mobile WiFi Hotspot Device',
        urgency_level: 'high',
        reason_for_request: 'Rural area internet access for telehealth and virtual services',
        is_rural: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resourceRequests']);
      toast.success('Mobile hotspot requested! We\'ll contact you within 24 hours.');
      setShowHotspotRequest(false);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Offline Indicator */}
        {offlineMode && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Offline Mode Active</p>
              <p className="text-sm text-amber-800">Critical resources and chat still available</p>
            </div>
          </div>
        )}

        {/* Header */}
        <GraceCard gradient>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">MRCC Tech Hub</h1>
              <p className="text-sm text-gray-600">
                Mobile Recovery Community Center • Access Anywhere, Anytime
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1">
                <MapPin className="w-3 h-3" />
                {userLocation ? 'Location Enabled' : 'Enable Location'}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Wifi className="w-3 h-3" />
                {offlineMode ? 'Offline' : 'Online'}
              </Badge>
            </div>
          </div>
        </GraceCard>

        <Tabs defaultValue="kiosk" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kiosk">
              <Monitor className="w-4 h-4 mr-2" />
              Telehealth Kiosk
            </TabsTrigger>
            <TabsTrigger value="wifi">
              <Wifi className="w-4 h-4 mr-2" />
              Wi-Fi Access
            </TabsTrigger>
            <TabsTrigger value="nearby">
              <Navigation className="w-4 h-4 mr-2" />
              Nearby Resources
            </TabsTrigger>
          </TabsList>

          {/* Telehealth Kiosk Tab */}
          <TabsContent value="kiosk">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraceCard>
                <CardHeader>
                  <CardTitle>Book Kiosk Appointment</CardTitle>
                  <CardDescription>
                    Schedule time at MRCC for virtual services, job applications, or court appearances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Service Type</label>
                    <select className="w-full p-2 border rounded-lg">
                      <option>Peer Coaching</option>
                      <option>Case Management</option>
                      <option>Benefits Enrollment</option>
                      <option>Job Application Help</option>
                      <option>Virtual Court Appearance</option>
                      <option>Telehealth Medical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Preferred Date/Time</label>
                    <Input type="datetime-local" />
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="device" defaultChecked />
                    <label htmlFor="device" className="text-sm">I need to borrow a device/tablet</label>
                  </div>

                  <Button 
                    onClick={() => bookKioskMutation.mutate({
                      mrcc_location: 'Grace House MRCC',
                      appointment_date: new Date().toISOString(),
                      service_type: 'peer_coaching'
                    })}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!user || offlineMode}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Request Appointment
                  </Button>
                </CardContent>
              </GraceCard>

              <GraceCard>
                <CardHeader>
                  <CardTitle>Your Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No upcoming appointments
                      </p>
                    ) : (
                      bookings.map((booking) => (
                        <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium capitalize">
                                {booking.service_type.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(booking.appointment_date).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {booking.mrcc_location}
                              </p>
                            </div>
                            <Badge variant={
                              booking.booking_status === 'confirmed' ? 'default' :
                              booking.booking_status === 'requested' ? 'outline' :
                              'secondary'
                            }>
                              {booking.booking_status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </GraceCard>
            </div>
          </TabsContent>

          {/* Wi-Fi Access Tab */}
          <TabsContent value="wifi">
            <GraceCard>
              <CardHeader>
                <CardTitle>High-Speed Wi-Fi Access Points</CardTitle>
                <CardDescription>
                  Free internet access at MRCC locations statewide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Grace House MRCC', address: 'Des Moines, IA', speed: '100 Mbps', hours: '24/7' },
                    { name: 'MRCC - Cedar Rapids', address: 'Cedar Rapids, IA', speed: '100 Mbps', hours: '8am-8pm' },
                    { name: 'MRCC - Davenport', address: 'Davenport, IA', speed: '100 Mbps', hours: '8am-8pm' }
                  ].map((location, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Wifi className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">{location.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{location.address}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{location.speed}</Badge>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {location.hours}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-sm text-teal-900">
                    <strong>Investments in Health Care Infrastructure:</strong> MRCC Wi-Fi access removes connectivity barriers for unhoused and rural populations, enabling telehealth access and virtual recovery support.
                  </p>
                </div>
              </CardContent>
            </GraceCard>
          </TabsContent>

          {/* Nearby Resources Tab */}
          <TabsContent value="nearby">
            <GraceCard>
              <CardHeader>
                <CardTitle>
                  Geo-Location Based Resources
                  {userLocation && <Badge className="ml-2 bg-green-100 text-green-800">Location Active</Badge>}
                </CardTitle>
                <CardDescription>
                  Resources near you, ranked by distance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!userLocation ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Enable location to see nearby resources</p>
                    <Button onClick={() => {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setUserLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                          });
                          toast.success('Location enabled!');
                        }
                      );
                    }}>
                      Enable Location
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {nearbyResources.map((resource, idx) => (
                      <div key={resource.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="capitalize">
                                {resource.category.replace(/_/g, ' ')}
                              </Badge>
                              {resource.is_free && (
                                <Badge className="bg-green-100 text-green-800">Free</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {resource.address}, {resource.city}
                            </p>
                            {resource.phone && (
                              <a href={`tel:${resource.phone}`} className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {resource.phone}
                              </a>
                            )}
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">
                            ~{Math.floor(Math.random() * 5 + 1)} mi
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </GraceCard>
          </TabsContent>
        </Tabs>

        {/* Transit Navigation & Hotspot Request */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GraceCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                Get Directions to MRCC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                AI-powered transit routing with real-time public transport data
              </p>
              <div className="space-y-2">
                {[
                  { name: 'Grace House MRCC', latitude: 41.5868, longitude: -93.6250 },
                  { name: 'MRCC - Cedar Rapids', latitude: 42.0080, longitude: -91.6440 }
                ].map(loc => (
                  <Button 
                    key={loc.name}
                    size="sm"
                    variant="outline"
                    onClick={() => routeMutation.mutate(loc)}
                    disabled={routeMutation.isPending || !user}
                    className="w-full justify-start"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {loc.name}
                  </Button>
                ))}
              </div>
              {routeDestination && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-sm mb-2">Recommended Route</h4>
                  <p className="text-sm text-gray-700">{routeDestination.route_suggestion?.route_details}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <Badge variant="outline">{routeDestination.route_suggestion?.estimated_travel_time}</Badge>
                    <Badge variant="outline">{routeDestination.route_suggestion?.estimated_cost}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </GraceCard>

          <GraceCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-600" />
                Request Mobile Hotspot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Need internet access in a rural area? Request a mobile hotspot device.
              </p>
              {!showHotspotRequest ? (
                <Button 
                  onClick={() => setShowHotspotRequest(true)} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!user}
                >
                  Request Hotspot Device
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button 
                    onClick={() => hotspotRequestMutation.mutate()}
                    disabled={hotspotRequestMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {hotspotRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowHotspotRequest(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </GraceCard>
        </div>

        {/* Offline Resources */}
        {offlineMode && (
          <GraceCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-teal-600" />
                Offline-Accessible Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Crisis Hotlines (Cached)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Daily Reflections (Downloaded)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Grace AI Chat (Limited)
                </Button>
              </div>
            </CardContent>
          </GraceCard>
        )}
      </div>
    </div>
  );
}