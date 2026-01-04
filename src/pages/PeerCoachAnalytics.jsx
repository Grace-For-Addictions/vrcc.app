import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Target, Award,
  AlertCircle, CheckCircle2, Brain, Lightbulb
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

export default function PeerCoachAnalytics() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: sessions } = useQuery({
    queryKey: ['coachingSessions'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.CoachingSession.filter({ created_by: user.email }, '-created_date', 100);
    },
    enabled: !!user,
    initialData: []
  });

  // Calculate KPIs
  const totalSessions = sessions.length;
  const avgScore = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
    : 0;
  const avgEmpathy = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + (s.empathy_score || 0), 0) / sessions.length).toFixed(1)
    : 0;
  const avgMI = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + (s.mi_skills_score || 0), 0) / sessions.length).toFixed(1)
    : 0;
  const avgResource = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + (s.resource_accuracy || 0), 0) / sessions.length).toFixed(1)
    : 0;

  // Identify strengths and weaknesses
  const allStrengths = sessions.flatMap(s => s.strengths || []);
  const allImprovements = sessions.flatMap(s => s.improvements || []);
  
  const strengthCounts = {};
  allStrengths.forEach(s => {
    const key = s.substring(0, 50); // Normalize
    strengthCounts[key] = (strengthCounts[key] || 0) + 1;
  });

  const improvementCounts = {};
  allImprovements.forEach(i => {
    const key = i.substring(0, 50);
    improvementCounts[key] = (improvementCounts[key] || 0) + 1;
  });

  const topStrengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topImprovements = Object.entries(improvementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Scenario difficulty breakdown
  const byDifficulty = sessions.reduce((acc, s) => {
    acc[s.difficulty] = acc[s.difficulty] || [];
    acc[s.difficulty].push(s.score);
    return acc;
  }, {});

  const difficultyAvgs = Object.entries(byDifficulty).map(([diff, scores]) => ({
    difficulty: diff,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    count: scores.length
  }));

  // Most challenging scenarios
  const scenarioPerformance = sessions.reduce((acc, s) => {
    acc[s.scenario_title] = acc[s.scenario_title] || [];
    acc[s.scenario_title].push(s.score);
    return acc;
  }, {});

  const challengingScenarios = Object.entries(scenarioPerformance)
    .map(([title, scores]) => ({
      title,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      attempts: scores.length
    }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Peer Coach Analytics"
          subtitle="Track your performance, identify trends, and get personalized training recommendations"
          icon={BarChart3}
        />

        {/* Overall KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-700">{totalSessions}</p>
                <p className="text-sm text-gray-600">Sessions</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{avgScore}%</p>
                <p className="text-sm text-gray-600">Avg Score</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{avgEmpathy}/10</p>
                <p className="text-sm text-gray-600">Empathy</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{avgMI}/10</p>
                <p className="text-sm text-gray-600">MI Skills</p>
              </div>
            </div>
          </GraceCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Skill Breakdown */}
          <GraceCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Empathy</span>
                  <span className="text-sm font-bold text-blue-700">{avgEmpathy}/10</span>
                </div>
                <Progress value={avgEmpathy * 10} className="h-3" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Motivational Interviewing</span>
                  <span className="text-sm font-bold text-purple-700">{avgMI}/10</span>
                </div>
                <Progress value={avgMI * 10} className="h-3" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Resource Accuracy</span>
                  <span className="text-sm font-bold text-teal-700">{avgResource}/10</span>
                </div>
                <Progress value={avgResource * 10} className="h-3" />
              </div>
            </div>
          </GraceCard>

          {/* Difficulty Performance */}
          <GraceCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Difficulty</h3>
            <div className="space-y-3">
              {difficultyAvgs.map((item) => (
                <div key={item.difficulty} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Badge className={
                      item.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      item.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {item.difficulty}
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">{item.count} attempts</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{item.avg}%</p>
                </div>
              ))}
            </div>
          </GraceCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Strengths */}
          <GraceCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Top Strengths
            </h3>
            <div className="space-y-2">
              {topStrengths.map(([strength, count], idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-bold">{count}x</span>
                  <p className="text-sm text-green-800 flex-1">{strength}</p>
                </div>
              ))}
            </div>
          </GraceCard>

          {/* Areas for Growth */}
          <GraceCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Areas for Growth
            </h3>
            <div className="space-y-2">
              {topImprovements.map(([improvement, count], idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <span className="text-amber-700 font-bold">{count}x</span>
                  <p className="text-sm text-amber-800 flex-1">{improvement}</p>
                </div>
              ))}
            </div>
          </GraceCard>
        </div>

        {/* Challenging Scenarios */}
        {challengingScenarios.length > 0 && (
          <GraceCard className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-600" />
              Recommended Training Focus
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              These scenarios have your lowest scores. Consider retrying them for improvement.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {challengingScenarios.map((scenario, idx) => (
                <div key={idx} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{scenario.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{scenario.attempts} attempts</span>
                    <span className="text-lg font-bold text-purple-700">{scenario.avg}%</span>
                  </div>
                </div>
              ))}
            </div>
          </GraceCard>
        )}
      </div>

      <GraceChatWidget />
    </div>
  );
}