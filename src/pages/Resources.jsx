import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Search, Filter, Phone, Globe, Mail, Clock,
  Building2, Heart, Briefcase, Home, Scale, Users, 
  Stethoscope, GraduationCap, Utensils, Car, Brain, Cross, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

const categoryIcons = {
  treatment: Stethoscope,
  housing: Home,
  employment: Briefcase,
  legal: Scale,
  family: Users,
  crisis: Phone,
  peer_support: Heart,
  healthcare: Cross,
  education: GraduationCap,
  food: Utensils,
  transportation: Car,
  mental_health: Brain,
  narcan: Cross
};

const categoryColors = {
  treatment: 'bg-blue-100 text-blue-700',
  housing: 'bg-orange-100 text-orange-700',
  employment: 'bg-purple-100 text-purple-700',
  legal: 'bg-gray-100 text-gray-700',
  family: 'bg-pink-100 text-pink-700',
  crisis: 'bg-red-100 text-red-700',
  peer_support: 'bg-teal-100 text-teal-700',
  healthcare: 'bg-green-100 text-green-700',
  education: 'bg-indigo-100 text-indigo-700',
  food: 'bg-yellow-100 text-yellow-700',
  transportation: 'bg-cyan-100 text-cyan-700',
  mental_health: 'bg-violet-100 text-violet-700',
  narcan: 'bg-rose-100 text-rose-700'
};

const iowaCounties = [
  'Polk', 'Linn', 'Scott', 'Johnson', 'Black Hawk', 'Woodbury', 'Dubuque', 
  'Story', 'Pottawattamie', 'Dallas', 'Warren', 'Cerro Gordo', 'Clinton',
  'Marshall', 'Jasper', 'Webster', 'Lee', 'Wapello', 'Marion', 'Muscatine'
];

function ResourceCard({ resource, onClick }) {
  const Icon = categoryIcons[resource.category] || Building2;
  const colorClass = categoryColors[resource.category] || 'bg-gray-100 text-gray-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{resource.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
          
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant="secondary" className={colorClass}>
              {resource.category?.replace(/_/g, ' ')}
            </Badge>
            {resource.county && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {resource.county}
              </Badge>
            )}
            {resource.is_free && (
              <Badge className="bg-green-100 text-green-700">Free</Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ResourceDetail({ resource, onClose }) {
  if (!resource) return null;

  const Icon = categoryIcons[resource.category] || Building2;

  return (
    <Dialog open={!!resource} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${categoryColors[resource.category]} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            {resource.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {resource.description && (
            <p className="text-gray-600">{resource.description}</p>
          )}

          <div className="space-y-3">
            {resource.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-900">{resource.address}</p>
                  <p className="text-sm text-gray-500">{resource.city}, {resource.state} {resource.zip}</p>
                </div>
              </div>
            )}

            {resource.phone && (
              <a href={`tel:${resource.phone}`} className="flex items-center gap-3 text-teal-600 hover:text-teal-700">
                <Phone className="w-5 h-5" />
                {resource.phone}
              </a>
            )}

            {resource.email && (
              <a href={`mailto:${resource.email}`} className="flex items-center gap-3 text-teal-600 hover:text-teal-700">
                <Mail className="w-5 h-5" />
                {resource.email}
              </a>
            )}

            {resource.website && (
              <a href={resource.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-teal-600 hover:text-teal-700">
                <Globe className="w-5 h-5" />
                Visit Website
              </a>
            )}

            {resource.hours && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{resource.hours}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {resource.is_free && <Badge className="bg-green-100 text-green-700">Free Services</Badge>}
            {resource.accepts_medicaid && <Badge variant="outline">Accepts Medicaid</Badge>}
            {resource.accepts_uninsured && <Badge variant="outline">Accepts Uninsured</Badge>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Resources() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [county, setCounty] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list('-created_date', 200),
    initialData: []
  });

  const filteredResources = resources.filter(r => {
    const matchesSearch = !search || 
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || r.category === category;
    const matchesCounty = county === 'all' || r.county === county;
    return matchesSearch && matchesCategory && matchesCounty;
  });

  const categories = [...new Set(resources.map(r => r.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Resource Hub"
          subtitle="Find treatment, housing, jobs, and support across all 99 Iowa counties. Everything you need, all in one place."
          icon={MapPin}
        />

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">Browse Resources</TabsTrigger>
            <TabsTrigger value="personalized">
              <Sparkles className="w-4 h-4 mr-2" />
              For You
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-2" />
              My Favorites
            </TabsTrigger>
            <TabsTrigger value="ai">AI Navigator</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search & Filters */}
            <GraceCard>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search resources..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 rounded-full"
                  />
                </div>
                
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat?.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="County" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    {iowaCounties.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </GraceCard>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
              </p>
              {(category !== 'all' || county !== 'all' || search) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setSearch(''); setCategory('all'); setCounty('all'); }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredResources.map((resource) => (
                  <ResourceCard 
                    key={resource.id} 
                    resource={resource}
                    onClick={() => setSelectedResource(resource)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {filteredResources.length === 0 && !isLoading && (
              <GraceCard className="text-center py-12">
                <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No resources found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
              </GraceCard>
            )}
          </TabsContent>

          <TabsContent value="personalized">
            <PersonalizedRecommendations user={user} />
          </TabsContent>

          <TabsContent value="favorites">
            <CuratedResourceLists user={user} isCoach={user?.role === 'admin'} />
          </TabsContent>

          <TabsContent value="ai">
            <AIResourceNavigator user={user} />
          </TabsContent>
        </Tabs>

        <ResourceDetail 
          resource={selectedResource} 
          onClose={() => setSelectedResource(null)} 
        />
      </div>

      <GraceChatWidget />
    </div>
  );
}