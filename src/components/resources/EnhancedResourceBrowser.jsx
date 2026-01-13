import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Heart, Send, Phone, Globe, CheckCircle2, Star } from 'lucide-react';

export default function EnhancedResourceBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list()
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['my-favorite-resources', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const prefs = await base44.entities.UserPreferences.filter({ created_by: user.email });
      return prefs[0]?.favorite_resources || [];
    },
    enabled: !!user
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (resourceId) => {
      const prefs = await base44.entities.UserPreferences.filter({ created_by: user.email });
      const currentFavs = prefs[0]?.favorite_resources || [];
      
      const newFavs = currentFavs.includes(resourceId) 
        ? currentFavs.filter(id => id !== resourceId)
        : [...currentFavs, resourceId];
      
      if (prefs.length > 0) {
        return base44.entities.UserPreferences.update(prefs[0].id, { favorite_resources: newFavs });
      } else {
        return base44.entities.UserPreferences.create({ favorite_resources: newFavs });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-favorite-resources']);
    }
  });

  const sendReferralMutation = useMutation({
    mutationFn: async (resource) => {
      return base44.entities.ClosedLoopReferral.create({
        participant_email: user.email,
        referral_to: resource.name,
        service_type: resource.category,
        referral_method: 'cold_referral',
        status: 'sent',
        sent_date: new Date().toISOString(),
        partner_contact_name: resource.name,
        partner_contact_phone: resource.phone,
        partner_contact_email: resource.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['closed-loop-referrals']);
      setSelectedResource(null);
    }
  });

  const filteredResources = resources.filter(r => {
    const matchesSearch = !searchTerm || 
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCounty = selectedCounty === 'all' || r.county === selectedCounty;
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    
    return matchesSearch && matchesCounty && matchesCategory;
  });

  const counties = [...new Set(resources.map(r => r.county).filter(Boolean))].sort();

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-600" />
            Resource Navigator
          </CardTitle>
          <CardDescription>Search Iowa recovery resources with real-time availability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="County" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {counties.map(county => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
                <SelectItem value="housing">Housing</SelectItem>
                <SelectItem value="employment">Employment</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="mental_health">Mental Health</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resource Results */}
      <div className="grid grid-cols-1 gap-4">
        {filteredResources.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No resources found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          filteredResources.map(resource => {
            const isFavorite = favorites.includes(resource.id);
            
            return (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {resource.name}
                        {resource.is_verified && (
                          <Badge className="bg-teal-100 text-teal-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{resource.description}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavoriteMutation.mutate(resource.id)}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {resource.category?.replace(/_/g, ' ')}
                    </Badge>
                    {resource.county && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="w-3 h-3" />
                        {resource.county}
                      </Badge>
                    )}
                    {resource.is_free && <Badge className="bg-green-100 text-green-700">Free</Badge>}
                    {resource.accepts_medicaid && <Badge className="bg-blue-100 text-blue-700">Medicaid</Badge>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {resource.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {resource.phone}
                      </div>
                    )}
                    {resource.website && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Globe className="w-4 h-4" />
                        <a href={resource.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => {
                        setSelectedResource(resource);
                        sendReferralMutation.mutate(resource);
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Referral
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Referral Success Dialog */}
      <Dialog open={!!selectedResource && sendReferralMutation.isSuccess} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Referral Sent Successfully
            </DialogTitle>
            <DialogDescription>
              Your referral to {selectedResource?.name} has been logged and will be tracked through completion.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              You'll receive updates as your referral progresses through: Sent → Received → Accepted → Completed
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}