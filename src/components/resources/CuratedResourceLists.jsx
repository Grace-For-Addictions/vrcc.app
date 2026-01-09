import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Plus, Share2, Trash2, BookmarkPlus, 
  ExternalLink, Mail, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function CuratedResourceLists({ user, isCoach = false }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newList, setNewList] = useState({
    list_name: '',
    description: '',
    resource_ids: [],
    is_public: false,
    target_audience: ''
  });

  const queryClient = useQueryClient();

  // Fetch user's favorite resources
  const { data: favoriteResources } = useQuery({
    queryKey: ['favoriteResources', user?.email],
    queryFn: async () => {
      // This would ideally be a separate entity, but for now we use UserPreferences
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0]?.favorite_resources || [];
    },
    enabled: !!user,
    initialData: []
  });

  // Fetch all resources
  const { data: allResources } = useQuery({
    queryKey: ['allResources'],
    queryFn: () => base44.entities.Resource.list('-created_date', 300),
    initialData: []
  });

  const { data: allEmergencyResources } = useQuery({
    queryKey: ['allEmergencyResources'],
    queryFn: () => base44.entities.EmergencyResource.list('-created_date', 100),
    initialData: []
  });

  const toggleFavorite = useMutation({
    mutationFn: async (resourceId) => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      const currentPrefs = prefs[0] || { user_email: user.email };
      const currentFavorites = currentPrefs.favorite_resources || [];
      
      const newFavorites = currentFavorites.includes(resourceId)
        ? currentFavorites.filter(id => id !== resourceId)
        : [...currentFavorites, resourceId];

      if (currentPrefs.id) {
        await base44.entities.UserPreferences.update(currentPrefs.id, {
          favorite_resources: newFavorites
        });
      } else {
        await base44.entities.UserPreferences.create({
          user_email: user.email,
          favorite_resources: newFavorites
        });
      }

      return newFavorites;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['favoriteResources']);
      toast.success('Favorites updated!');
    }
  });

  const shareResourceList = async (recipientEmail) => {
    if (!recipientEmail) {
      toast.error('Please enter recipient email');
      return;
    }

    const favoriteResourceData = allResources
      .filter(r => favoriteResources.includes(r.id))
      .map(r => `• ${r.name} (${r.category}): ${r.phone || r.website || ''}`)
      .join('\n');

    await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `${user.full_name} shared resources with you`,
      body: `Hi! ${user.full_name} thought these resources might be helpful for you:\n\n${favoriteResourceData}\n\nShared via Grace For Addictions VRCC`
    });

    toast.success('Resource list sent!');
  };

  const myFavorites = allResources.filter(r => favoriteResources.includes(r.id));
  const myEmergencyFavorites = allEmergencyResources.filter(r => favoriteResources.includes(r.id));

  return (
    <div className="space-y-6">
      {/* My Favorites */}
      <GraceCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            My Favorite Resources
          </h3>
          
          {myFavorites.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Resource List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Send your curated resource list to someone via email
                  </p>
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        shareResourceList(e.target.value);
                      }
                    }}
                  />
                  <Button 
                    onClick={(e) => {
                      const input = e.target.closest('.space-y-4').querySelector('input');
                      shareResourceList(input.value);
                    }}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send via Email
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {myFavorites.length === 0 && myEmergencyFavorites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No favorite resources yet</p>
            <p className="text-sm mt-1">Browse resources and click the heart icon to save them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myFavorites.map((resource) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{resource.name}</h4>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{resource.category}</Badge>
                    {resource.phone && (
                      <a href={`tel:${resource.phone}`} className="text-xs text-teal-600 hover:underline">
                        {resource.phone}
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite.mutate(resource.id)}
                >
                  <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                </Button>
              </motion.div>
            ))}

            {myEmergencyFavorites.map((resource) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{resource.title}</h4>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                  <Badge className="mt-2 bg-red-100 text-red-800">{resource.resource_type}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite.mutate(resource.id)}
                >
                  <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </GraceCard>

      {/* Quick Add to Favorites */}
      {isCoach && (
        <GraceCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-teal-600" />
            Quick Add Resources
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            As a coach, you can quickly build resource lists to share with participants
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allResources.slice(0, 10).map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-teal-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{resource.name}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{resource.category}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite.mutate(resource.id)}
                >
                  <Heart className={`w-4 h-4 ${favoriteResources.includes(resource.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`} />
                </Button>
              </div>
            ))}
          </div>
        </GraceCard>
      )}
    </div>
  );
}