import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Calendar, MessageCircle, Sparkles, 
  Heart, Brain, Award
} from 'lucide-react';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';

export default function VRCCDetail() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <GraceHeader 
          title="Virtual Recovery Community Center (VRCC)"
          subtitle="Iowa's first 24/7 virtual recovery community - free and accessible statewide"
          icon={Sparkles}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <GraceCard className="bg-gradient-to-br from-teal-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-600" />
                Community & Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ Virtual Recovery Circles (GFARC meetings)</li>
                <li>✓ Peer matching & support groups</li>
                <li>✓ Community forums & walls</li>
                <li>✓ Recovery garden visualization</li>
              </ul>
              <Link to={createPageUrl('Community')}>
                <Button className="mt-4 w-full bg-teal-600 hover:bg-teal-700">
                  Join Community
                </Button>
              </Link>
            </CardContent>
          </GraceCard>

          <GraceCard className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-600" />
                Education & Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ Brain science (neuroplasticity)</li>
                <li>✓ Recovery stories & videos</li>
                <li>✓ Daily reflections & check-ins</li>
                <li>✓ Resource navigation tools</li>
              </ul>
              <Link to={createPageUrl('Neuroplasticity')}>
                <Button className="mt-4 w-full bg-purple-600 hover:bg-purple-700">
                  Explore Resources
                </Button>
              </Link>
            </CardContent>
          </GraceCard>
        </div>

        <GraceCard className="mb-8">
          <CardHeader>
            <CardTitle>What Makes VRCC Different?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-teal-50 rounded-lg">
                <Heart className="w-8 h-8 text-teal-600 mb-2" />
                <h4 className="font-semibold mb-1">No Stigma</h4>
                <p className="text-sm text-gray-700">
                  Strength-based, person-first language. You're not defined by your struggles.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <Sparkles className="w-8 h-8 text-purple-600 mb-2" />
                <h4 className="font-semibold mb-1">AI Support</h4>
                <p className="text-sm text-gray-700">
                  Grace, your AI recovery companion, provides 24/7 personalized support.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <Award className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-semibold mb-1">Evidence-Based</h4>
                <p className="text-sm text-gray-700">
                  Grounded in recovery capital research and neuroplasticity science.
                </p>
              </div>
            </div>
          </CardContent>
        </GraceCard>

        <GraceCard>
          <CardHeader>
            <CardTitle>Get Started Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to={createPageUrl('Home')}>
              <Button className="w-full bg-teal-600 hover:bg-teal-700" size="lg">
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat with Grace Now
              </Button>
            </Link>
            <Link to={createPageUrl('Events')}>
              <Button variant="outline" className="w-full" size="lg">
                <Calendar className="w-5 h-5 mr-2" />
                View Upcoming Events
              </Button>
            </Link>
          </CardContent>
        </GraceCard>
      </div>
    </div>
  );
}