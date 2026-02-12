import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Search, Filter, Phone, Globe, Mail, Clock,
  Building2, Heart, Briefcase, Home, Scale, Users, 
  Stethoscope, GraduationCap, Utensils, Car, Brain, Cross, X,
  Star, AlertCircle, Plus, MessageSquare, Loader2, Send
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';
import PersonalizedRecommendations from '@/components/resources/PersonalizedRecommendations';
import CuratedResourceLists from '@/components/resources/CuratedResourceLists';
import AIResourceNavigator from '@/components/resources/AIResourceNavigator';
import ResourceSuggestionForm from '@/components/resources/ResourceSuggestionForm';
import ResourceEditForm from '@/components/resources/ResourceEditForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Edit } from 'lucide-react';

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

function ResourceCard({ resource, onClick, isFavorited, onToggleFavorite, matchScore, matchReason }) {
  const Icon = categoryIcons[resource.category] || Building2;
  const colorClass = categoryColors[resource.category] || 'bg-gray-100 text-gray-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all cursor-pointer relative"
    >
      {matchScore && matchScore >= 70 && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-teal-600">{matchScore}% match</Badge>
        </div>
      )}
      
      <div onClick={onClick}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{resource.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
            
            {matchReason && (
              <p className="text-xs text-teal-600 mt-2 italic line-clamp-2">{matchReason}</p>
            )}
            
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
      </div>
      
      {onToggleFavorite && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="mt-3 w-full"
        >
          <Star className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          {isFavorited ? 'Saved' : 'Save to Favorites'}
        </Button>
      )}
    </motion.div>
  );
}

function ResourceDetail({ resource, onClose, user, isFavorited, onToggleFavorite }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [accuracyRating, setAccuracyRating] = useState(0);
  const queryClient = useQueryClient();

  if (!resource) return null;

  const Icon = categoryIcons[resource.category] || Building2;

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.ResourceFeedback.create(data);
    },
    onSuccess: () => {
      toast.success('Feedback submitted - thank you!');
      setFeedbackOpen(false);
      setFeedbackText('');
      setFeedbackType('');
      setAccuracyRating(0);
    }
  });

  const handleSubmitFeedback = () => {
    if (!feedbackType) {
      toast.error('Please select feedback type');
      return;
    }
    
    submitFeedbackMutation.mutate({
      resource_id: resource.id,
      resource_name: resource.name,
      feedback_type: feedbackType,
      feedback_text: feedbackText,
      accuracy_rating: accuracyRating || undefined
    });
  };

  return (
    <Dialog open={!!resource} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${categoryColors[resource.category]} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              {resource.name}
            </div>
            {user && onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFavorite}
                className="ml-2"
              >
                <Star className={`w-5 h-5 ${isFavorited ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
            )}
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

          {/* Feedback and Edit Section */}
          {user && (
            <div className="pt-4 border-t space-y-2">
              {editFormOpen ? (
                <ResourceEditForm 
                  resource={resource} 
                  onClose={() => setEditFormOpen(false)} 
                />
              ) : !feedbackOpen ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditFormOpen(true)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Suggest Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFeedbackOpen(true)}
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Report Issue or Give Feedback
                  </Button>
                </>
              )
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Resource Feedback</h4>
                  
                  <Select value={feedbackType} onValueChange={setFeedbackType}>
                    <SelectTrigger>
                      <SelectValue placeholder="What type of feedback?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outdated_info">Outdated Information</SelectItem>
                      <SelectItem value="incorrect_phone">Incorrect Phone</SelectItem>
                      <SelectItem value="incorrect_address">Incorrect Address</SelectItem>
                      <SelectItem value="incorrect_hours">Incorrect Hours</SelectItem>
                      <SelectItem value="no_longer_available">No Longer Available</SelectItem>
                      <SelectItem value="positive_experience">Positive Experience</SelectItem>
                      <SelectItem value="negative_experience">Negative Experience</SelectItem>
                      <SelectItem value="additional_info">Additional Info</SelectItem>
                    </SelectContent>
                  </Select>

                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Accuracy Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setAccuracyRating(rating)}
                          className={`w-8 h-8 rounded-full ${
                            accuracyRating >= rating ? 'bg-teal-600 text-white' : 'bg-gray-200'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    placeholder="Share details about this resource..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={3}
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={submitFeedbackMutation.isPending}
                      size="sm"
                      className="flex-1"
                    >
                      {submitFeedbackMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFeedbackOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
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
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => base44.entities.FavoriteResource.filter({ created_by: user.email }),
    enabled: !!user,
    initialData: []
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ resourceId, isFavorited }) => {
      if (isFavorited) {
        const fav = favorites.find(f => f.resource_id === resourceId);
        if (fav) {
          await base44.entities.FavoriteResource.delete(fav.id);
        }
      } else {
        const resource = resources.find(r => r.id === resourceId);
        await base44.entities.FavoriteResource.create({
          resource_id: resourceId,
          resource_name: resource?.name || 'Unknown'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
      toast.success('Favorites updated');
    }
  });

  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim()) return;
    
    setAiSearching(true);
    try {
      const result = await base44.functions.invoke('aiResourceSearch', {
        searchQuery: aiSearchQuery,
        userLocation: user?.county || 'Iowa'
      });
      setAiResults(result.data);
      toast.success(`Found ${result.data.results.length} matches`);
    } catch (error) {
      toast.error('Search failed: ' + error.message);
    } finally {
      setAiSearching(false);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = !search || 
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || r.category === category;
    const matchesCounty = county === 'all' || r.county === county;
    return matchesSearch && matchesCategory && matchesCounty;
  });

  const favoriteResources = resources.filter(r => 
    favorites.some(f => f.resource_id === r.id)
  );

  const isFavorited = (resourceId) => favorites.some(f => f.resource_id === resourceId);

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="ai-search">
              <Sparkles className="w-4 h-4 mr-1" />
              AI Search
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="w-4 h-4 mr-1" />
              Saved ({favoriteResources.length})
            </TabsTrigger>
            <TabsTrigger value="personalized">For You</TabsTrigger>
            <TabsTrigger value="suggest">
              <Plus className="w-4 h-4 mr-1" />
              Suggest
            </TabsTrigger>
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
                    isFavorited={user && isFavorited(resource.id)}
                    onToggleFavorite={user ? () => toggleFavoriteMutation.mutate({
                      resourceId: resource.id,
                      isFavorited: isFavorited(resource.id)
                    }) : null}
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

          <TabsContent value="ai-search" className="space-y-6">
            <GraceCard>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                AI-Powered Natural Language Search
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Describe what you need in your own words (e.g., "housing for veterans with children" or "free mental health counseling near Des Moines")
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="What are you looking for?"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAiSearch} 
                  disabled={aiSearching || !aiSearchQuery.trim()}
                  className="bg-teal-600"
                >
                  {aiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </GraceCard>

            {aiResults && (
              <div className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h4 className="font-medium text-teal-900 mb-2">Search Understanding</h4>
                  <p className="text-sm text-teal-700">{aiResults.searchAnalysis?.search_explanation}</p>
                  {aiResults.searchAnalysis?.primary_categories && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {aiResults.searchAnalysis.primary_categories.map((cat, i) => (
                        <Badge key={i} className="bg-teal-600">{cat}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-gray-600">
                  Found {aiResults.totalMatches} matching resource{aiResults.totalMatches !== 1 ? 's' : ''}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiResults.results.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onClick={() => setSelectedResource(resource)}
                      matchScore={resource.match_score}
                      matchReason={resource.match_reason}
                      isFavorited={user && isFavorited(resource.id)}
                      onToggleFavorite={user ? () => toggleFavoriteMutation.mutate({
                        resourceId: resource.id,
                        isFavorited: isFavorited(resource.id)
                      }) : null}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            {!user ? (
              <GraceCard className="text-center py-12">
                <Star className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">Sign in to save favorite resources</p>
              </GraceCard>
            ) : favoriteResources.length === 0 ? (
              <GraceCard className="text-center py-12">
                <Star className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No saved resources yet</p>
                <p className="text-sm text-gray-500 mt-2">Click the star on any resource to save it</p>
              </GraceCard>
            ) : (
              <>
                <p className="text-gray-600">
                  {favoriteResources.length} saved resource{favoriteResources.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onClick={() => setSelectedResource(resource)}
                      isFavorited={true}
                      onToggleFavorite={() => toggleFavoriteMutation.mutate({
                        resourceId: resource.id,
                        isFavorited: true
                      })}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="personalized">
            <PersonalizedRecommendations user={user} />
          </TabsContent>

          <TabsContent value="suggest">
            <ResourceSuggestionForm user={user} />
          </TabsContent>
        </Tabs>

        <ResourceDetail 
          resource={selectedResource} 
          onClose={() => setSelectedResource(null)}
          user={user}
          isFavorited={selectedResource && user && isFavorited(selectedResource.id)}
          onToggleFavorite={selectedResource && user ? () => toggleFavoriteMutation.mutate({
            resourceId: selectedResource.id,
            isFavorited: isFavorited(selectedResource.id)
          }) : null}
        />
      </div>

      <GraceChatWidget />
    </div>
  );
}