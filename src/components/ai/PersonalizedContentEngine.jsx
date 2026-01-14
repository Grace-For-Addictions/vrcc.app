import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Target, BookOpen, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PersonalizedContentEngine({ userEmail }) {
  const [recommendations, setRecommendations] = useState({
    resources: [],
    events: [],
    content: [],
    peers: [],
    goals: []
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile', userEmail],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: userEmail }),
    select: (data) => data[0]
  });

  const { data: checkIns } = useQuery({
    queryKey: ['recentCheckIns', userEmail],
    queryFn: () => base44.entities.DailyCheckIn.filter({ user_email: userEmail }),
    initialData: []
  });

  const { data: sessions } = useQuery({
    queryKey: ['coachingSessions', userEmail],
    queryFn: () => base44.entities.CoachingSession.filter({ client_email: userEmail }),
    initialData: []
  });

  const { data: allResources } = useQuery({
    queryKey: ['allResources'],
    queryFn: () => base44.entities.Resource.list(),
    initialData: []
  });

  const { data: allEvents } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: () => base44.entities.Event.list('-start_time', 20),
    initialData: []
  });

  useEffect(() => {
    if (profile && allResources.length > 0) {
      generatePersonalizedRecommendations();
    }
  }, [profile, checkIns, sessions, allResources, allEvents]);

  const generatePersonalizedRecommendations = async () => {
    try {
      // Analyze user patterns
      const recentMood = checkIns.slice(0, 7).reduce((sum, c) => sum + (c.mood_score || 3), 0) / 7;
      const hasLowMood = recentMood < 2.5;
      const engagementLevel = checkIns.length > 14 ? 'high' : checkIns.length > 5 ? 'medium' : 'low';
      const userPathways = profile?.pathways || [];
      const userCounty = profile?.county || '';
      const readinessLevel = profile?.readiness_level || 1;

      // Use AI to generate personalized recommendations
      const prompt = `
        Analyze this user's recovery journey and recommend 3 specific resources and 2 events:
        
        User Profile:
        - Pathways: ${userPathways.join(', ')}
        - County: ${userCounty}
        - Stage: ${profile?.stage || 'exploring'}
        - Readiness Level: ${readinessLevel}/5
        - Recent Mood: ${recentMood.toFixed(1)}/5
        - Engagement: ${engagementLevel}
        - Coaching Sessions: ${sessions.length}
        
        Recommend resources that match their pathways and address current needs.
        Focus on ${hasLowMood ? 'immediate support and crisis resources' : 'growth and community connection'}.
      `;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            resource_keywords: { type: 'array', items: { type: 'string' } },
            event_keywords: { type: 'array', items: { type: 'string' } },
            goal_suggestions: { type: 'array', items: { type: 'string' } },
            reasoning: { type: 'string' }
          }
        }
      });

      // Filter resources based on AI recommendations
      const recommendedResources = allResources
        .filter(r => {
          const matchesKeywords = aiResponse.resource_keywords.some(kw => 
            r.name?.toLowerCase().includes(kw.toLowerCase()) ||
            r.category?.toLowerCase().includes(kw.toLowerCase()) ||
            r.description?.toLowerCase().includes(kw.toLowerCase())
          );
          const matchesCounty = !userCounty || r.county === userCounty || r.county === 'Statewide';
          return matchesKeywords && matchesCounty;
        })
        .slice(0, 3);

      // Filter events based on upcoming schedule - PILOT BUILD: no readiness gating
      const recommendedEvents = allEvents
        .filter(e => {
          const futureEvent = new Date(e.start_time) > new Date();
          return futureEvent; // All events accessible in pilot phase
        })
        .slice(0, 2);

      setRecommendations({
        resources: recommendedResources,
        events: recommendedEvents,
        goals: aiResponse.goal_suggestions || [],
        reasoning: aiResponse.reasoning
      });

    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Personalized for Your Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.reasoning && (
            <p className="text-sm text-gray-600 italic">
              {recommendations.reasoning}
            </p>
          )}

          {/* Resource Recommendations */}
          {recommendations.resources.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                Resources for You
              </h4>
              <div className="space-y-2">
                {recommendations.resources.map((resource) => (
                  <Link key={resource.id} to={createPageUrl('Resources')}>
                    <div className="p-3 bg-white rounded-lg border hover:border-teal-300 transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{resource.name}</p>
                          <p className="text-sm text-gray-600">{resource.category}</p>
                        </div>
                        <Badge variant="outline">{resource.county}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Event Recommendations */}
          {recommendations.events.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Upcoming Events
              </h4>
              <div className="space-y-2">
                {recommendations.events.map((event) => (
                  <Link key={event.id} to={createPageUrl('Events')}>
                    <div className="p-3 bg-white rounded-lg border hover:border-blue-300 transition">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.start_time).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Goal Suggestions */}
          {recommendations.goals.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Suggested Next Steps
              </h4>
              <ul className="space-y-1">
                {recommendations.goals.map((goal, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}