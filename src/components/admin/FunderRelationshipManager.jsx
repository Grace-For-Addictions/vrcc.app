import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';
import GenerateGrantReport from './GenerateGrantReport';

export default function FunderRelationshipManager() {
  const queryClient = useQueryClient();

  const { data: funders = [] } = useQuery({
    queryKey: ['funderRelationships'],
    queryFn: () => base44.entities.FunderRelationship.list('-created_date', 100)
  });

  const { data: grantAnalysis } = useQuery({
    queryKey: ['grantAnalysis'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzePastGrants');
      return response.data;
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('analyzePastGrants');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['grantAnalysis', 'funderRelationships']);
      toast.success('Grant success analysis updated! 📊');
    }
  });

  const upcomingDeadlines = funders.flatMap(f => 
    (f.upcoming_deadlines || []).map(d => ({
      ...d,
      funder_name: f.funder_name
    }))
  ).sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));

  const nextWeekDeadlines = upcomingDeadlines.filter(d => {
    const deadline = new Date(d.deadline_date);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return deadline <= nextWeek;
  });

  return (
    <div className="space-y-6">
      <GraceCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Funder Relationship Management</CardTitle>
              <CardDescription>
                Track communications, deadlines, and funder preferences aligned with Polk County 5 Points
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyze Success
              </Button>
              <GenerateGrantReport />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deadlines">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="deadlines">
                <Calendar className="w-4 h-4 mr-2" />
                Deadlines ({nextWeekDeadlines.length})
              </TabsTrigger>
              <TabsTrigger value="funders">Funders</TabsTrigger>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="polk5">Polk 5 Points</TabsTrigger>
            </TabsList>

            <TabsContent value="deadlines">
              <div className="space-y-3">
                {nextWeekDeadlines.length > 0 ? (
                  nextWeekDeadlines.map((deadline, idx) => (
                    <div key={idx} className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <h4 className="font-semibold text-gray-900">{deadline.grant_name}</h4>
                          </div>
                          <p className="text-sm text-gray-600">{deadline.funder_name}</p>
                          <Badge variant="outline" className="mt-2 capitalize">
                            {deadline.deadline_type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-700">
                            {new Date(deadline.deadline_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.ceil((new Date(deadline.deadline_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No urgent deadlines in the next week</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="funders">
              <div className="space-y-3">
                {funders.map((funder) => {
                  const totalGrants = funder.past_grants?.length || 0;
                  const awardedGrants = funder.past_grants?.filter(g => g.status === 'awarded').length || 0;
                  const successRate = totalGrants > 0 ? (awardedGrants / totalGrants) * 100 : 0;

                  return (
                    <div key={funder.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{funder.funder_name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{funder.funder_type.replace(/_/g, ' ')}</p>
                          {funder.primary_contact_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              Contact: {funder.primary_contact_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{awardedGrants}/{totalGrants}</span>
                          </div>
                          <Progress value={successRate} className="w-20 h-2 mt-1" />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {funder.polk_county_5_points_alignment?.map((point, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {point.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>

                      {funder.preferred_language_keywords && funder.preferred_language_keywords.length > 0 && (
                        <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                          <p className="text-xs text-purple-900">
                            <strong>Keywords:</strong> {funder.preferred_language_keywords.join(', ')}
                          </p>
                        </div>
                      )}

                      {funder.ai_success_analysis && (
                        <div className="mt-2 p-2 bg-teal-50 rounded border border-teal-200">
                          <p className="text-xs text-teal-900">{funder.ai_success_analysis}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="analysis">
              {grantAnalysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-700">{grantAnalysis.stats?.success_rate}%</p>
                      <p className="text-sm text-gray-600">Overall Success Rate</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-2xl font-bold text-blue-700">{grantAnalysis.stats?.awarded}</p>
                      <p className="text-sm text-gray-600">Grants Awarded</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-2xl font-bold text-orange-700">{grantAnalysis.stats?.declined}</p>
                      <p className="text-sm text-gray-600">Grants Declined</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Success Patterns
                    </h4>
                    <ul className="space-y-1">
                      {grantAnalysis.analysis?.success_patterns?.map((pattern, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      Recommended Strategies
                    </h4>
                    <ul className="space-y-1">
                      {grantAnalysis.analysis?.recommended_strategies?.map((strategy, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-purple-600">→</span>
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Button onClick={() => analyzeMutation.mutate()}>
                    Generate AI Analysis
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="polk5">
              <div className="space-y-3">
                {['healthy_community', 'impactful_collaboration', 'infrastructure_investment', 'preventative_approaches', 'service_excellence'].map((point) => {
                  const alignedFunders = funders.filter(f => 
                    f.polk_county_5_points_alignment?.includes(point)
                  );

                  return (
                    <div key={point} className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                        {point.replace(/_/g, ' ')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {alignedFunders.map(f => (
                          <Badge key={f.id} variant="outline">{f.funder_name}</Badge>
                        ))}
                      </div>
                      {alignedFunders.length === 0 && (
                        <p className="text-sm text-gray-500">No funders aligned yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </GraceCard>
    </div>
  );
}