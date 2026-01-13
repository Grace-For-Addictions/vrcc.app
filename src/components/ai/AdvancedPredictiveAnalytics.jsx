import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, TrendingDown, Brain, Users, Calendar, 
  Target, Zap, Loader2, CheckCircle2, Send 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function AdvancedPredictiveAnalytics() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.UserProfile.list()
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['all-checkins'],
    queryFn: () => base44.entities.DailyCheckIn.list('-created_date', 500)
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['all-sessions'],
    queryFn: () => base44.entities.CoachingSessionLog.list('-session_date', 500)
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['predictive-alerts'],
    queryFn: () => base44.entities.PredictiveAlert.list('-created_date')
  });

  const analyzeEngagementMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      
      // Analyze each participant for risk factors
      const newAlerts = [];
      
      for (const profile of profiles) {
        const userEmail = profile.created_by;
        
        // Get participant's recent activity
        const userCheckIns = checkIns.filter(c => c.created_by === userEmail);
        const userSessions = sessions.filter(s => s.client_email === userEmail);
        
        // Calculate engagement metrics
        const daysSinceLastCheckIn = userCheckIns.length > 0 
          ? Math.floor((new Date() - new Date(userCheckIns[0].created_date)) / (1000 * 60 * 60 * 24))
          : 999;
        
        const daysSinceLastSession = userSessions.length > 0
          ? Math.floor((new Date() - new Date(userSessions[0].session_date)) / (1000 * 60 * 60 * 24))
          : 999;
        
        const recentMoodScores = userCheckIns.slice(0, 7).map(c => c.mood || 3);
        const avgMood = recentMoodScores.length > 0 
          ? recentMoodScores.reduce((a, b) => a + b, 0) / recentMoodScores.length 
          : 3;
        
        const moodTrend = recentMoodScores.length >= 3 
          ? recentMoodScores[0] - recentMoodScores[recentMoodScores.length - 1]
          : 0;
        
        // Risk scoring
        let riskScore = 0;
        const contributingFactors = [];
        const suggestedInterventions = [];
        
        // Disengagement risk
        if (daysSinceLastCheckIn > 7) {
          riskScore += 25;
          contributingFactors.push('No check-ins in 7+ days');
          suggestedInterventions.push('Immediate outreach call from assigned coach');
        }
        
        if (daysSinceLastSession > 14) {
          riskScore += 20;
          contributingFactors.push('No coaching session in 14+ days');
          suggestedInterventions.push('Schedule urgent coaching session');
        }
        
        // Mood deterioration
        if (avgMood < 2.5) {
          riskScore += 30;
          contributingFactors.push('Low mood scores (avg < 2.5)');
          suggestedInterventions.push('Mental health resource referral');
        }
        
        if (moodTrend < -1) {
          riskScore += 20;
          contributingFactors.push('Declining mood trend');
          suggestedInterventions.push('Enhanced peer support check-in');
        }
        
        // Missed sessions
        const missedSessions = userSessions.filter(s => s.attendance_status === 'no_show').length;
        if (missedSessions > 0) {
          riskScore += missedSessions * 15;
          contributingFactors.push(`${missedSessions} missed session(s)`);
          suggestedInterventions.push('Address barriers to attendance');
        }
        
        // Generate alert if high risk
        if (riskScore >= 40) {
          const alertType = 
            daysSinceLastCheckIn > 14 ? 'disengagement_risk' :
            avgMood < 2 ? 'crisis_risk' :
            'dropout_risk';
          
          newAlerts.push({
            user_email: userEmail,
            alert_type: alertType,
            risk_score: Math.min(100, riskScore),
            contributing_factors: contributingFactors,
            suggested_interventions: suggestedInterventions,
            predicted_outcome: 'Without intervention, participant may disengage from program within 7-14 days',
            confidence_level: 0.75,
            is_acknowledged: false
          });
        }
      }
      
      // Create new alerts
      if (newAlerts.length > 0) {
        await base44.entities.PredictiveAlert.bulkCreate(newAlerts);
      }
      
      return { alerts_generated: newAlerts.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['predictive-alerts']);
      setIsAnalyzing(false);
    }
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async ({ alertId, action }) => {
      const user = await base44.auth.me();
      return base44.entities.PredictiveAlert.update(alertId, {
        is_acknowledged: true,
        acknowledged_by: user.email,
        action_taken: action
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['predictive-alerts']);
    }
  });

  const unacknowledgedAlerts = alerts.filter(a => !a.is_acknowledged);
  const highRiskAlerts = unacknowledgedAlerts.filter(a => a.risk_score >= 70);
  const mediumRiskAlerts = unacknowledgedAlerts.filter(a => a.risk_score >= 40 && a.risk_score < 70);

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-600" />
                Advanced Predictive Analytics
              </CardTitle>
              <CardDescription>AI-powered engagement monitoring and intervention suggestions</CardDescription>
            </div>
            <Button
              onClick={() => analyzeEngagementMutation.mutate()}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> Run Analysis</>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk Alerts</p>
                <p className="text-3xl font-bold text-red-600">{highRiskAlerts.length}</p>
                <p className="text-xs text-red-500 mt-1">Risk Score ≥70</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medium Risk</p>
                <p className="text-3xl font-bold text-yellow-600">{mediumRiskAlerts.length}</p>
                <p className="text-xs text-yellow-600 mt-1">Risk Score 40-69</p>
              </div>
              <TrendingDown className="w-10 h-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Acknowledged</p>
                <p className="text-3xl font-bold text-green-600">{alerts.length - unacknowledgedAlerts.length}</p>
                <p className="text-xs text-green-600 mt-1">Actions taken</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Tabs defaultValue="high-risk">
        <TabsList>
          <TabsTrigger value="high-risk">High Risk ({highRiskAlerts.length})</TabsTrigger>
          <TabsTrigger value="medium-risk">Medium Risk ({mediumRiskAlerts.length})</TabsTrigger>
          <TabsTrigger value="all">All Alerts ({unacknowledgedAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="high-risk" className="mt-4 space-y-3">
          {highRiskAlerts.map(alert => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              onAcknowledge={acknowledgeAlertMutation.mutate}
            />
          ))}
        </TabsContent>

        <TabsContent value="medium-risk" className="mt-4 space-y-3">
          {mediumRiskAlerts.map(alert => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              onAcknowledge={acknowledgeAlertMutation.mutate}
            />
          ))}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-3">
          {unacknowledgedAlerts.map(alert => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              onAcknowledge={acknowledgeAlertMutation.mutate}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AlertCard({ alert, onAcknowledge }) {
  const [selectedAction, setSelectedAction] = useState('');
  
  const severityColor = 
    alert.risk_score >= 70 ? 'border-l-red-500 bg-red-50/50' :
    alert.risk_score >= 40 ? 'border-l-yellow-500 bg-yellow-50/50' :
    'border-l-blue-500 bg-blue-50/50';

  return (
    <Card className={`border-l-4 ${severityColor}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{alert.user_email}</CardTitle>
            <CardDescription className="mt-1 capitalize">
              {alert.alert_type.replace(/_/g, ' ')}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={
              alert.risk_score >= 70 ? 'bg-red-100 text-red-700' :
              alert.risk_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }>
              Risk: {alert.risk_score}/100
            </Badge>
            <Badge variant="outline" className="text-xs">
              {(alert.confidence_level * 100).toFixed(0)}% confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contributing Factors */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Contributing Factors:</p>
          <ul className="space-y-1">
            {alert.contributing_factors?.map((factor, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>

        {/* Predicted Outcome */}
        <div className="p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm font-medium text-gray-700 mb-1">Predicted Outcome:</p>
          <p className="text-sm text-gray-600">{alert.predicted_outcome}</p>
        </div>

        {/* Suggested Interventions */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">AI-Recommended Interventions:</p>
          <div className="space-y-2">
            {alert.suggested_interventions?.map((intervention, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-teal-50 rounded border border-teal-200">
                <Target className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <p className="text-sm text-teal-900">{intervention}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => onAcknowledge({ alertId: alert.id, action: 'Outreach initiated' })}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Acknowledge & Take Action
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}