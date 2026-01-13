import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, DollarSign, Users, Zap, Target } from 'lucide-react';

export default function ROIDashboard() {
  const { data: roiMetrics = [] } = useQuery({
    queryKey: ['all-roi-metrics'],
    queryFn: () => base44.entities.ROIMetric.list('-metric_date', 100)
  });

  const { data: aiSessions = [] } = useQuery({
    queryKey: ['ai-documentation-sessions'],
    queryFn: () => base44.entities.AIDocumentationSession.list()
  });

  const { data: closedLoopReferrals = [] } = useQuery({
    queryKey: ['completed-referrals'],
    queryFn: () => base44.entities.ClosedLoopReferral.filter({ status: 'completed' })
  });

  // Calculate totals
  const totalDocHoursSaved = aiSessions.reduce((sum, s) => sum + ((s.time_saved_minutes || 0) / 60), 0);
  const totalReferralHoursSaved = roiMetrics
    .filter(m => m.metric_type === 'referral_coordination_hours_saved')
    .reduce((sum, m) => sum + (m.hours_saved || 0), 0);
  
  const totalHoursSaved = totalDocHoursSaved + totalReferralHoursSaved;
  const totalDollarValue = totalHoursSaved * 30; // $30/hour
  const avgROI = roiMetrics.length > 0 ? 
    roiMetrics.reduce((sum, m) => sum + (m.roi_multiplier || 0), 0) / roiMetrics.length : 0;

  // Annualized projections
  const annualHoursSaved = totalHoursSaved * 52; // Weekly to annual
  const annualDollarValue = annualHoursSaved * 30;
  const capacityIncrease = (totalHoursSaved / 2080) * 100; // % of FTE capacity gained

  // Chart data
  const weeklyData = roiMetrics
    .reduce((acc, metric) => {
      const week = new Date(metric.metric_date).toLocaleDateString();
      const existing = acc.find(d => d.week === week);
      if (existing) {
        existing.hours_saved += metric.hours_saved || 0;
        existing.dollar_value += metric.dollar_value_saved || 0;
      } else {
        acc.push({
          week,
          hours_saved: metric.hours_saved || 0,
          dollar_value: metric.dollar_value_saved || 0
        });
      }
      return acc;
    }, [])
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-teal-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours Saved</p>
                <p className="text-3xl font-bold text-teal-600">{totalHoursSaved.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">≈ {(totalHoursSaved / 40).toFixed(1)} work weeks</p>
              </div>
              <Clock className="w-10 h-10 text-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dollar Value</p>
                <p className="text-3xl font-bold text-green-600">${totalDollarValue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">at $30/hr</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg ROI</p>
                <p className="text-3xl font-bold text-purple-600">{avgROI.toFixed(1)}x</p>
                <p className="text-xs text-gray-500 mt-1">Eleos-style return</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Capacity Gain</p>
                <p className="text-3xl font-bold text-amber-600">{capacityIncrease.toFixed(0)}%</p>
                <p className="text-xs text-gray-500 mt-1">Unite Us-style</p>
              </div>
              <Users className="w-10 h-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Annual Projections (Grant-Ready)</CardTitle>
          <CardDescription>Based on current efficiency gains</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg border border-teal-200">
              <p className="text-sm text-teal-600 mb-1">Annual Hours Saved</p>
              <p className="text-3xl font-bold text-teal-700">{annualHoursSaved.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-2">≈ 1 FTE volunteer equivalent</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200">
              <p className="text-sm text-green-600 mb-1">Annual Dollar Value</p>
              <p className="text-3xl font-bold text-green-700">${annualDollarValue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Cost savings & efficiency</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 mb-1">Additional Capacity</p>
              <p className="text-3xl font-bold text-purple-700">+{Math.floor(totalHoursSaved / 2)}</p>
              <p className="text-xs text-gray-500 mt-2">participants served/year</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="eleos">Eleos-Style (AI Documentation)</TabsTrigger>
          <TabsTrigger value="unite-us">Unite Us-Style (Closed Loop)</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Hours Saved Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hours_saved" stroke="#14b8a6" name="Hours Saved" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eleos" className="mt-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  AI Documentation Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <p className="text-sm text-teal-600">Sessions Automated</p>
                    <p className="text-2xl font-bold text-teal-700">{aiSessions.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Hours Saved</p>
                    <p className="text-2xl font-bold text-green-700">{totalDocHoursSaved.toFixed(1)}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium mb-2">Target: 108 hours/volunteer/year saved</p>
                  <Progress value={(totalDocHoursSaved / 108) * 100} className="h-2 mb-2" />
                  <p className="text-xs text-blue-600">
                    {((totalDocHoursSaved / 108) * 100).toFixed(1)}% of annual target achieved
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="unite-us" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Closed-Loop Coordination Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Referrals Closed</p>
                  <p className="text-2xl font-bold text-purple-700">{completedReferrals.length}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-700">{completionRate.toFixed(0)}%</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium mb-2">Projected Annual Value</p>
                <p className="text-3xl font-bold text-amber-700">${(annualProjection * 30).toLocaleString()}</p>
                <p className="text-xs text-amber-600 mt-1">
                  Based on $30/hour saved × {annualProjection.toFixed(0)} hours/year
                </p>
              </div>

              <div className="p-4 bg-teal-50 rounded-lg">
                <p className="text-sm font-medium text-teal-700 mb-2">Grant Narrative:</p>
                <p className="text-sm text-gray-700">
                  Closed-loop coordination has reduced administrative burden by {totalReferralHoursSaved.toFixed(0)} hours,
                  enabling {Math.floor(capacityIncrease)}% capacity increase. This efficiency gain allows GFA to serve
                  an additional {Math.floor(totalHoursSaved / 2)} participants annually without additional staffing,
                  representing a projected annual value of ${annualDollarValue.toLocaleString()}.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}