import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, AlertTriangle, TrendingUp } from 'lucide-react';

export default function ResourceDensityAnalytics() {
  const { data: resources = [] } = useQuery({
    queryKey: ['all-resources'],
    queryFn: () => base44.entities.Resource.list()
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.UserProfile.list()
  });

  // Calculate resource density by county
  const countyData = resources.reduce((acc, resource) => {
    const county = resource.county || 'Unknown';
    if (!acc[county]) {
      acc[county] = { total: 0, by_category: {} };
    }
    acc[county].total++;
    
    const category = resource.category || 'other';
    acc[county].by_category[category] = (acc[county].by_category[category] || 0) + 1;
    
    return acc;
  }, {});

  // Calculate participant distribution
  const participantsByCounty = profiles.reduce((acc, profile) => {
    const county = profile.county || 'Unknown';
    acc[county] = (acc[county] || 0) + 1;
    return acc;
  }, {});

  // Identify gaps (counties with high participants, low resources)
  const gapAnalysis = Object.keys(participantsByCounty).map(county => {
    const participants = participantsByCounty[county] || 0;
    const resourceCount = countyData[county]?.total || 0;
    const ratio = participants > 0 ? resourceCount / participants : 0;
    
    return {
      county,
      participants,
      resources: resourceCount,
      ratio: ratio.toFixed(2),
      gap_severity: ratio < 0.5 ? 'high' : ratio < 1 ? 'medium' : 'low'
    };
  }).sort((a, b) => a.ratio - b.ratio);

  const categoryData = resources.reduce((acc, r) => {
    const cat = r.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  }));

  const COLORS = ['#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Resource Density Analytics
          </CardTitle>
          <CardDescription>Identify service gaps and resource distribution across Iowa</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gapAnalysis.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="county" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="participants" fill="#8b5cf6" name="Participants" />
              <Bar yAxisId="right" dataKey="resources" fill="#14b8a6" name="Resources" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Service Gaps */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Identified Service Gaps
          </CardTitle>
          <CardDescription>Counties with high participant-to-resource ratios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gapAnalysis.filter(g => g.gap_severity === 'high').slice(0, 5).map(gap => (
              <div key={gap.county} className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-red-900">{gap.county} County</p>
                  <Badge className="bg-red-100 text-red-700">High Priority</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Participants</p>
                    <p className="text-lg font-bold text-gray-900">{gap.participants}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Resources</p>
                    <p className="text-lg font-bold text-gray-900">{gap.resources}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ratio</p>
                    <p className="text-lg font-bold text-red-600">{gap.ratio}</p>
                  </div>
                </div>
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Resource expansion needed in this county
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Distribution by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Distribution by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}