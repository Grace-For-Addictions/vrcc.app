import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Search, MapPin, Phone, Globe, Mail, ExternalLink, Loader2, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function AIResourceNavigator({ user, context = {} }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: resources } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list('-updated_date', 100),
    initialData: []
  });

  const { data: resourceStats } = useQuery({
    queryKey: ['resourceStats'],
    queryFn: async () => {
      // Get referral logs to track success
      const referrals = await base44.entities.CoachingSessionLog.filter({ referral_made: true }, '-activity_date', 200);
      
      const stats = {};
      referrals.forEach(ref => {
        const type = ref.referral_type;
        if (!stats[type]) {
          stats[type] = { count: 0, successful: 0 };
        }
        stats[type].count++;
        if (ref.referral_status === 'Completed' || ref.referral_status === 'Attended') {
          stats[type].successful++;
        }
      });
      
      return stats;
    },
    initialData: {}
  });

  const trackResourceAccess = useMutation({
    mutationFn: (resourceId) => {
      // Log resource access for tracking
      return base44.entities.CoachingSessionLog.create({
        contact_name: user.full_name,
        contact_email: user.email,
        activity_date: new Date().toISOString().split('T')[0],
        activity_type: 'Resource Navigation',
        activity_notes: `Accessed resource: ${resourceId}`,
        activity_channel: 'Online/Remote',
        coach_name: 'Self-Service',
        attendance: 'Yes (Completed)'
      });
    }
  });

  const generateAISuggestions = async (contextText) => {
    setLoading(true);
    try {
      const recentSessions = context.sessionNotes || '';
      const userNeeds = context.needs || searchQuery;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI resource navigator for Grace For Addictions serving all 99 Iowa counties.

USER CONTEXT:
${recentSessions ? `Recent session notes: ${recentSessions}` : ''}
Current need/search: ${userNeeds}
Location: Iowa

TASK: Suggest the 5 most relevant resources from the available options below, prioritizing Iowa-based services.

AVAILABLE RESOURCES:
${resources.slice(0, 50).map(r => `- ${r.name} (${r.category}): ${r.description || ''} | ${r.city}, ${r.county} County`).join('\n')}

For each suggestion provide:
1. Resource name (from list above)
2. Why it's relevant (specific, actionable explanation)
3. What to expect (services offered, eligibility, process)
4. Urgency level (immediate, soon, when_ready)

Focus on practical, accessible services. Consider barriers like transportation, cost, insurance.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  resource_name: { type: "string" },
                  relevance: { type: "string" },
                  what_to_expect: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            overall_guidance: { type: "string" }
          }
        }
      });

      setAiSuggestions(response);
    } catch (error) {
      toast.error('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = searchQuery
    ? resources.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.county?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : resources.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* AI Search */}
      <GraceCard gradient>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          AI Resource Navigator
        </h3>
        <div className="flex gap-3">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What do you need help with? (housing, employment, mental health...)"
            className="flex-1"
          />
          <Button
            onClick={() => generateAISuggestions(searchQuery)}
            disabled={loading || !searchQuery}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </Button>
        </div>
      </GraceCard>

      {/* AI Suggestions */}
      {aiSuggestions && (
        <GraceCard>
          <h4 className="font-bold text-gray-900 mb-2">AI Recommendations</h4>
          <p className="text-sm text-gray-700 mb-4 italic">{aiSuggestions.overall_guidance}</p>
          
          <div className="space-y-4">
            {aiSuggestions.suggestions.map((suggestion, idx) => {
              const resource = resources.find(r => r.name.includes(suggestion.resource_name) || suggestion.resource_name.includes(r.name));
              
              const urgencyColors = {
                immediate: 'bg-red-100 text-red-700',
                soon: 'bg-orange-100 text-orange-700',
                when_ready: 'bg-blue-100 text-blue-700'
              };

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-purple-50 border border-purple-200 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-bold text-gray-900">{suggestion.resource_name}</h5>
                      {resource && (
                        <p className="text-xs text-gray-600">
                          {resource.city}, {resource.county} County • {resource.category}
                        </p>
                      )}
                    </div>
                    <Badge className={urgencyColors[suggestion.urgency]}>
                      {suggestion.urgency.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="font-medium text-purple-900">Why this resource:</p>
                      <p className="text-gray-700">{suggestion.relevance}</p>
                    </div>
                    <div>
                      <p className="font-medium text-purple-900">What to expect:</p>
                      <p className="text-gray-700">{suggestion.what_to_expect}</p>
                    </div>
                  </div>

                  {resource && (
                    <div className="mt-3 pt-3 border-t border-purple-200 flex flex-wrap gap-2">
                      {resource.phone && (
                        <a href={`tel:${resource.phone}`} className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {resource.phone}
                        </a>
                      )}
                      {resource.website && (
                        <a href={resource.website} target="_blank" rel="noopener noreferrer" 
                           onClick={() => trackResourceAccess.mutate(resource.id)}
                           className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          Visit Website
                        </a>
                      )}
                      {resource.email && (
                        <a href={`mailto:${resource.email}`} className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Email
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </GraceCard>
      )}

      {/* Most Successful Resources */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Most Successful Referrals
        </h4>
        <div className="space-y-2">
          {Object.entries(resourceStats)
            .sort((a, b) => (b[1].successful / b[1].count) - (a[1].successful / a[1].count))
            .slice(0, 5)
            .map(([type, stats], idx) => (
              <div key={type} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">{type}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {stats.successful}/{stats.count} successful ({Math.round((stats.successful / stats.count) * 100)}%)
                </div>
              </div>
            ))}
        </div>
      </GraceCard>

      {/* Resource List */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Iowa Resources Directory</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((resource, idx) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.02 }}
              className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h5 className="font-semibold text-gray-900">{resource.name}</h5>
                  <p className="text-xs text-gray-600">{resource.city}, {resource.county} County</p>
                </div>
                <Badge variant="outline" className="text-xs">{resource.category}</Badge>
              </div>
              
              {resource.description && (
                <p className="text-sm text-gray-700 mb-3">{resource.description}</p>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                {resource.phone && (
                  <a href={`tel:${resource.phone}`} className="flex items-center gap-1 text-teal-700 hover:text-teal-800">
                    <Phone className="w-3 h-3" />
                    Call
                  </a>
                )}
                {resource.website && (
                  <a href={resource.website} target="_blank" rel="noopener noreferrer"
                     onClick={() => trackResourceAccess.mutate(resource.id)}
                     className="flex items-center gap-1 text-teal-700 hover:text-teal-800">
                    <ExternalLink className="w-3 h-3" />
                    Website
                  </a>
                )}
                {resource.address && (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(resource.address + ', ' + resource.city + ', Iowa')}`}
                     target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1 text-teal-700 hover:text-teal-800">
                    <MapPin className="w-3 h-3" />
                    Directions
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </GraceCard>
    </div>
  );
}