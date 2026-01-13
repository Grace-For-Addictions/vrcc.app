import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, TrendingDown, Users, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function PredictiveAnalytics() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['predictive-alerts'],
    queryFn: () => base44.entities.PredictiveAlert.list('-created_date', 50)
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: () => base44.entities.UserProfile.list()
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['recent-checkins'],
    queryFn: () => base44.entities.DailyCheckIn.list('-created_date', 100)
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, action }) => 
      base44.entities.PredictiveAlert.update(id, { 
        is_acknowledged: true, 
        action_taken: action,
        acknowledged_by: base44.auth.me().email
      }),
    onSuccess: () => queryClient.invalidateQueries(['predictive-alerts'])
  });

  const runPredictiveAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Calculate engagement scores
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const profile of profiles) {
        const userCheckIns = checkIns.filter(
          c => c.created_by === profile.created_by && 
          new Date(c.created_date) > thirtyDaysAgo
        );

        const engagementScore = (userCheckIns.length / 30) * 100;
        const lastActive = profile.last_active ? new Date(profile.last_active) : null;
        const daysSinceActive = lastActive ? 
          (new Date() - lastActive) / (1000 * 60 * 60 * 24) : 999;

        // Generate alert if at risk
        if (daysSinceActive > 7 || engagementScore < 30) {
          const riskScore = Math.min(100, daysSinceActive * 10 + (100 - engagementScore));
          
          const factors = [];
          if (daysSinceActive > 7) factors.push(`No activity for ${Math.floor(daysSinceActive)} days`);
          if (engagementScore < 30) factors.push(`Low engagement: ${engagementScore.toFixed(0)}%`);
          if (userCheckIns.length === 0) factors.push('No check-ins this month');

          const interventions = [];
          if (daysSinceActive > 14) {
            interventions.push('Immediate peer coach outreach');
            interventions.push('Wellness check call');
          } else if (daysSinceActive > 7) {
            interventions.push('Send encouraging message');
            interventions.push('Invite to upcoming event');
          }
          interventions.push('Share personalized resources');

          await base44.entities.PredictiveAlert.create({
            user_email: profile.created_by,
            alert_type: 'disengagement_risk',
            risk_score: riskScore,
            contributing_factors: factors,
            suggested_interventions: interventions,
            predicted_outcome: riskScore > 70 ? 
              'High likelihood of program dropout without intervention' :
              'May become disengaged if not contacted soon',
            confidence_level: 0.75
          });
        }
      }

      queryClient.invalidateQueries(['predictive-alerts']);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.is_acknowledged);
  const highRiskAlerts = alerts.filter(a => a.risk_score > 70);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Predictive Analytics Dashboard</CardTitle>
              <CardDescription>AI-driven insights to identify at-risk participants</CardDescription>
            </div>
            <Button onClick={runPredictiveAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Run Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">High Risk</p>
                  <p className="text-2xl font-bold text-red-700">{highRiskAlerts.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Needs Attention</p>
                  <p className="text-2xl font-bold text-orange-700">{unacknowledgedAlerts.length}</p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-700">
                    {alerts.filter(a => a.is_acknowledged).length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Alerts ({unacknowledgedAlerts.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {unacknowledgedAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No active alerts. Great work! 🎉</p>
              </CardContent>
            </Card>
          ) : (
            unacknowledgedAlerts.map(alert => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{alert.user_email}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant={alert.risk_score > 70 ? 'destructive' : 'default'}>
                          Risk Score: {alert.risk_score.toFixed(0)}%
                        </Badge>
                        <span className="text-xs">
                          Confidence: {(alert.confidence_level * 100).toFixed(0)}%
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Progress value={alert.risk_score} className="h-2" />
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Contributing Factors:</p>
                    <ul className="space-y-1">
                      {alert.contributing_factors.map((factor, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Suggested Interventions:</p>
                    <ul className="space-y-1">
                      {alert.suggested_interventions.map((intervention, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                          {intervention}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => acknowledgeMutation.mutate({ 
                        id: alert.id, 
                        action: 'Coach contacted participant' 
                      })}
                    >
                      Mark Contacted
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => acknowledgeMutation.mutate({ 
                        id: alert.id, 
                        action: 'Scheduled follow-up' 
                      })}
                    >
                      Schedule Follow-up
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {alerts.filter(a => a.is_acknowledged).map(alert => (
            <Card key={alert.id}>
              <CardHeader>
                <CardTitle className="text-lg">{alert.user_email}</CardTitle>
                <CardDescription>
                  Resolved by {alert.acknowledged_by} • Action: {alert.action_taken}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}