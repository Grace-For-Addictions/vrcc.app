import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, CheckCircle, Send, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GraceCard from '@/components/common/GraceCard';

export default function FundingPipeline({ grants }) {
  const pipeline = [
    { stage: 'Prospecting', grants: grants.filter(g => g.status === 'prospecting'), color: 'blue' },
    { stage: 'Drafting', grants: grants.filter(g => g.status === 'draft'), color: 'yellow' },
    { stage: 'Submitted', grants: grants.filter(g => g.status === 'submitted'), color: 'purple' },
    { stage: 'Under Review', grants: grants.filter(g => g.status === 'under_review'), color: 'indigo' },
    { stage: 'Awarded', grants: grants.filter(g => g.status === 'awarded'), color: 'green' },
    { stage: 'Declined', grants: grants.filter(g => g.status === 'declined'), color: 'red' }
  ];

  const totalRequested = grants.reduce((sum, g) => sum + (g.amount_requested || 0), 0);
  const totalAwarded = grants.filter(g => g.status === 'awarded')
    .reduce((sum, g) => sum + (g.amount_requested || 0), 0);
  const winRate = grants.filter(g => g.status === 'awarded' || g.status === 'declined').length > 0
    ? (grants.filter(g => g.status === 'awarded').length / 
       grants.filter(g => g.status === 'awarded' || g.status === 'declined').length * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GraceCard className="text-center">
          <DollarSign className="w-10 h-10 mx-auto mb-2 text-blue-600" />
          <div className="text-3xl font-bold text-blue-700">
            ${totalRequested.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Total Requested</div>
        </GraceCard>

        <GraceCard className="text-center">
          <DollarSign className="w-10 h-10 mx-auto mb-2 text-green-600" />
          <div className="text-3xl font-bold text-green-700">
            ${totalAwarded.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Total Awarded</div>
        </GraceCard>

        <GraceCard className="text-center">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-teal-600" />
          <div className="text-3xl font-bold text-teal-700">{Math.round(winRate)}%</div>
          <div className="text-xs text-gray-600">Win Rate</div>
        </GraceCard>
      </div>

      {/* Pipeline Stages */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Funding Pipeline by Stage</h4>
        <div className="space-y-4">
          {pipeline.map((stage, idx) => (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-gray-900">{stage.stage}</h5>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{stage.grants.length} grants</Badge>
                  <span className="text-sm font-bold text-gray-700">
                    ${stage.grants.reduce((sum, g) => sum + (g.amount_requested || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <Progress 
                value={(stage.grants.length / grants.length) * 100} 
                className="h-2" 
              />
            </motion.div>
          ))}
        </div>
      </GraceCard>

      {/* Active Grants */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Active Grant Applications</h4>
        <div className="space-y-3">
          {grants.slice(0, 10).map((grant, idx) => (
            <div key={grant.id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">{grant.project_title}</h5>
                <p className="text-xs text-gray-600 mt-1">{grant.grant_type}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-teal-700">${(grant.amount_requested || 0).toLocaleString()}</p>
                <Badge variant="outline" className="text-xs mt-1">{grant.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </GraceCard>
    </div>
  );
}