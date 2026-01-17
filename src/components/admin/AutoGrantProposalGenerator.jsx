import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Download, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';

export default function AutoGrantProposalGenerator() {
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const queryClient = useQueryClient();

  const { data: opportunities = [] } = useQuery({
    queryKey: ['grantOpportunities'],
    queryFn: () => base44.entities.GrantOpportunity.list('-deadline', 20)
  });

  const generateProposalMutation = useMutation({
    mutationFn: async (opportunityId) => {
      const response = await base44.functions.invoke('autoGenerateGrantProposal', {
        grant_opportunity_id: opportunityId
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['grantOpportunities']);
      toast.success('Grant proposal auto-generated! 📝');
      setSelectedOpportunity(opportunities.find(o => o.id === data.opportunity_id));
    }
  });

  const copyProposal = (proposal) => {
    navigator.clipboard.writeText(proposal);
    toast.success('Proposal copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <GraceCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Auto-Grant Proposal Generator
          </CardTitle>
          <CardDescription>
            AI identifies funding opportunities and drafts proposals using aggregated impact data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.slice(0, 4).map((opp) => (
              <div key={opp.id} className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{opp.grant_name}</h4>
                    <p className="text-sm text-gray-600">{opp.funder_name}</p>
                  </div>
                  {opp.ai_match_score && (
                    <Badge className="bg-green-100 text-green-800">
                      {opp.ai_match_score}% match
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {opp.strategic_alignment?.map((alignment, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {alignment.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Due: {new Date(opp.deadline).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => generateProposalMutation.mutate(opp.id)}
                    disabled={generateProposalMutation.isPending || opp.proposal_status === 'drafted'}
                  >
                    {opp.proposal_status === 'drafted' ? 'View Draft' : 'Generate'}
                  </Button>
                </div>

                {opp.auto_drafted_proposal && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyProposal(opp.auto_drafted_proposal)}
                        className="flex-1"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-gray-800">
              <strong>Agent 2 Enhancement:</strong> AI automatically identifies funding opportunities aligned with GFA's strategic priorities, then drafts grant-ready proposals using real aggregated metrics: recidivism reduction, recovery capital growth, QOL improvements, and neuroplasticity-informed language.
            </p>
          </div>
        </CardContent>
      </GraceCard>
    </div>
  );
}