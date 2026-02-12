import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Sparkles, Target, Video, MapPin, Calendar,
  TrendingUp, CheckCircle2, ArrowRight, RefreshCw,
  Heart, Brain, Users, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GraceHeader from '@/components/common/GraceHeader';

export default function MyPathway() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: pathway, isLoading, refetch } = useQuery({
    queryKey: ['personalizedPathway', user?.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('generatePersonalizedPathway');
      return response.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60 // Cache for 1 hour
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50 pb-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        <GraceHeader
          title="My Recovery Pathway"
          subtitle="Your personalized journey to healing and growth"
          icon={Sparkles}
        />

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
              <p className="text-gray-600">Creating your personalized pathway...</p>
            </div>
          </div>
        )}

        {pathway && !pathway.fallback && (
          <div className="space-y-6">
            
            {/* Personal Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-2xl mb-2">Welcome to Your Journey</CardTitle>
                      <p className="text-teal-50 leading-relaxed">
                        {pathway.pathway.personalMessage}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Update Pathway
              </Button>
            </div>

            {/* Priority Focus Areas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-orange-600" />
                    <CardTitle>Priority Focus Areas</CardTitle>
                  </div>
                  <CardDescription>Key areas for your recovery journey right now</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {pathway.pathway.priorityFocusAreas.map((area, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-gray-800">{area}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recommended Content */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Videos */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-purple-600" />
                      <CardTitle className="text-lg">Recommended Videos</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pathway.pathway.recommendedVideos.slice(0, 3).map((rec, idx) => (
                      <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                        <Badge className="mb-2 bg-purple-600">{rec.category}</Badge>
                        <p className="text-sm text-gray-600">{rec.reason}</p>
                      </div>
                    ))}
                    {pathway.pathway.contentMatches.videos.length > 0 && (
                      <Link to={createPageUrl('VideoLibrary')}>
                        <Button variant="outline" className="w-full mt-3">
                          Browse Videos <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Resources */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-teal-600" />
                      <CardTitle className="text-lg">Recommended Resources</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pathway.pathway.recommendedResources.slice(0, 3).map((rec, idx) => (
                      <div key={idx} className="p-3 bg-teal-50 rounded-lg">
                        <Badge className="mb-2 bg-teal-600">{rec.category}</Badge>
                        <p className="text-sm text-gray-600">{rec.reason}</p>
                      </div>
                    ))}
                    {pathway.pathway.contentMatches.resources.length > 0 && (
                      <Link to={createPageUrl('Resources')}>
                        <Button variant="outline" className="w-full mt-3">
                          Explore Resources <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

            </div>

            {/* Recommended Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <CardTitle>Recommended Events</CardTitle>
                  </div>
                  <CardDescription>Join these community gatherings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {pathway.pathway.recommendedEvents.map((rec, idx) => (
                      <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <Badge className="mb-2 bg-blue-600">{rec.eventType}</Badge>
                        <p className="text-sm text-gray-600">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                  {pathway.pathway.contentMatches.events.length > 0 && (
                    <Link to={createPageUrl('Events')}>
                      <Button variant="outline" className="w-full mt-4">
                        View Upcoming Events <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <CardTitle>Your Next Steps</CardTitle>
                  </div>
                  <CardDescription>Actionable steps you can take this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pathway.pathway.nextSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-800">{step}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-indigo-600" />
                    <CardTitle>Progress Milestones</CardTitle>
                  </div>
                  <CardDescription>What success looks like on your journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">1 Week</span>
                      <Progress value={33} className="w-20 h-2" />
                    </div>
                    <p className="text-sm text-gray-600 bg-indigo-50 p-3 rounded-lg">
                      {pathway.pathway.milestones.oneWeek}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">1 Month</span>
                      <Progress value={66} className="w-20 h-2" />
                    </div>
                    <p className="text-sm text-gray-600 bg-indigo-50 p-3 rounded-lg">
                      {pathway.pathway.milestones.oneMonth}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">3 Months</span>
                      <Progress value={100} className="w-20 h-2" />
                    </div>
                    <p className="text-sm text-gray-600 bg-indigo-50 p-3 rounded-lg">
                      {pathway.pathway.milestones.threeMonths}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Community Connection CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Users className="w-12 h-12 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">Connection Prevents Crisis</h3>
                      <p className="text-purple-50 mb-4">
                        Your pathway is strongest when shared with others. Join the community today.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link to={createPageUrl('Community')}>
                          <Button className="bg-white text-purple-600 hover:bg-purple-50">
                            Join Community
                          </Button>
                        </Link>
                        <Link to={createPageUrl('GraceChat')}>
                          <Button variant="outline" className="border-white text-white hover:bg-white/10">
                            Chat with Grace
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        )}

        {/* Fallback: No pathway data */}
        {pathway?.fallback && (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Let's Build Your Pathway Together
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Complete your assessment and daily check-ins to receive personalized recommendations.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to={createPageUrl('Assessment')}>
                  <Button>Take Assessment</Button>
                </Link>
                <Link to={createPageUrl('DailyReflection')}>
                  <Button variant="outline">Daily Check-In</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}