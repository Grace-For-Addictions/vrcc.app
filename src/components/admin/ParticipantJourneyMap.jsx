import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, AlertTriangle, Star, Navigation, 
  Calendar, Activity, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';

export default function ParticipantJourneyMap({ participantEmail }) {
  const [mapData, setMapData] = useState(null);

  const generateMapMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateParticipantJourneyMap', {
        participant_email: participantEmail
      });
      return response.data;
    },
    onSuccess: (data) => {
      setMapData(data);
      toast.success('Journey map generated! 🗺️');
    }
  });

  return (
    <div className="space-y-6">
      <GraceCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-6 h-6 text-purple-600" />
              AI Participant Journey Map
            </CardTitle>
            <Button 
              onClick={() => generateMapMutation.mutate()}
              disabled={generateMapMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generateMapMutation.isPending ? 'Analyzing...' : 'Generate Map'}
            </Button>
          </div>
        </CardHeader>

        {mapData && (
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-700">
                      {mapData.summary_stats?.total_interactions}
                    </p>
                    <p className="text-xs text-gray-600">Total Interactions</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-700">
                      {mapData.summary_stats?.engagement_score}%
                    </p>
                    <p className="text-xs text-gray-600">Engagement Score</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-bold text-purple-700 capitalize">
                      {mapData.summary_stats?.current_status}
                    </p>
                    <p className="text-xs text-gray-600">Current Stage</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Milestones Timeline */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                Key Milestones
              </h3>
              <div className="space-y-2">
                {mapData.journey_map?.milestones?.map((milestone, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg border-l-4 border-teal-500">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{milestone.event}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600">
                          {new Date(milestone.date).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {milestone.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disengagement Risk Points */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Disengagement Risk Points
              </h3>
              <div className="space-y-2">
                {mapData.journey_map?.disengagement_points?.map((point, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                    point.risk_level === 'high' ? 'bg-red-50 border-red-500' :
                    point.risk_level === 'medium' ? 'bg-orange-50 border-orange-500' :
                    'bg-yellow-50 border-yellow-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{point.reason}</p>
                        <p className="text-xs text-gray-600 mt-1">{point.date_range}</p>
                      </div>
                      <Badge className={
                        point.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                        point.risk_level === 'medium' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {point.risk_level} risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Moments */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Growth Moments
              </h3>
              <div className="space-y-2">
                {mapData.journey_map?.growth_moments?.map((moment, idx) => (
                  <div key={idx} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{moment.achievement}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(moment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold mb-2 text-purple-900">
                AI-Identified Intervention Opportunities
              </h3>
              <ul className="space-y-1">
                {mapData.journey_map?.intervention_opportunities?.map((opp, idx) => (
                  <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                    <span className="text-purple-600">→</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Next Steps */}
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <h3 className="font-semibold mb-2 text-teal-900">
                Recommended Next Steps for Case Manager
              </h3>
              <ul className="space-y-1">
                {mapData.journey_map?.recommended_next_steps?.map((step, idx) => (
                  <li key={idx} className="text-sm text-teal-800 flex items-start gap-2">
                    <span className="text-teal-600">✓</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </GraceCard>
    </div>
  );
}