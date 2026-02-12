import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Home, Briefcase, AlertTriangle, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ROIMetricsDashboard() {
  const { data: roiMetrics = [] } = useQuery({
    queryKey: ['roiMetrics'],
    queryFn: () => base44.entities.ROIMetric.list('-recorded_date', 200)
  });

  // Calculate metric counts
  const metricCounts = roiMetrics.reduce((acc, metric) => {
    acc[metric.metric_type] = (acc[metric.metric_type] || 0) + 1;
    return acc;
  }, {});

  const topMetrics = [
    { 
      key: 'housing_secured', 
      label: 'Housing Secured', 
      icon: Home, 
      color: 'bg-green-100 text-green-700',
      iconColor: 'text-green-600'
    },
    { 
      key: 'employment_gained', 
      label: 'Employment Gained', 
      icon: Briefcase, 
      color: 'bg-blue-100 text-blue-700',
      iconColor: 'text-blue-600'
    },
    { 
      key: 'crisis_events_reduced', 
      label: 'Crisis Events Reduced', 
      icon: AlertTriangle, 
      color: 'bg-orange-100 text-orange-700',
      iconColor: 'text-orange-600'
    },
    { 
      key: 'peer_support_engagement', 
      label: 'Peer Support Engagement', 
      icon: Heart, 
      color: 'bg-purple-100 text-purple-700',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-teal-900">
          <TrendingUp className="w-5 h-5" />
          Captured ROI Metrics
        </CardTitle>
        <p className="text-sm text-gray-600">Outcomes tracked from referral completions</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topMetrics.map((metric) => {
            const Icon = metric.icon;
            const count = metricCounts[metric.key] || 0;
            return (
              <div key={metric.key} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg ${metric.color} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-600">{metric.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-teal-200">
          <h4 className="font-semibold text-gray-900 mb-3">All Metrics</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metricCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => (
                <Badge key={key} variant="outline" className="text-sm">
                  {key.replace(/_/g, ' ')}: {count}
                </Badge>
              ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border border-teal-200">
          <p className="text-sm text-gray-700">
            <strong className="text-teal-900">Total Outcomes:</strong> {roiMetrics.length} tracked across all service pathways
          </p>
        </div>
      </CardContent>
    </Card>
  );
}