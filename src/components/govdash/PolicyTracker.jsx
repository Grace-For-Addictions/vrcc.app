import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, TrendingUp, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

const IOWA_2026_POLICIES = [
  {
    id: 'hf1038',
    title: 'HF 1038 - Behavioral Health Funding Appropriations',
    status: 'active',
    priority: 'high',
    impact: 'Direct funding for behavioral health districts and opioid abatement',
    gfa_alignment: 'VRCC expansion, MRCC deployment, peer coach training',
    key_legislators: ['Health & Human Services Committee', 'Justice Appropriations'],
    funding_opportunity: '$500k-$2M',
    deadline: '2026-03-15'
  },
  {
    id: 'opioid_settlement',
    title: 'Iowa Opioid Settlement Funds Distribution',
    status: 'active',
    priority: 'critical',
    impact: 'Direct abatement funds for MAT/MOUD, naloxone, recovery housing',
    gfa_alignment: 'Grace House, NARR certification, harm reduction',
    key_legislators: ['Iowa HHS Division', 'Behavioral Health Districts'],
    funding_opportunity: '$500k-$1M',
    deadline: '2026-06-30'
  },
  {
    id: 'recovery_housing',
    title: 'Recovery Housing Certification & Standards',
    status: 'monitoring',
    priority: 'medium',
    impact: 'NARR certification requirements for recovery housing providers',
    gfa_alignment: 'Grace House NARR compliance, quality standards',
    key_legislators: ['Iowa Recovery Housing Advisory Board'],
    funding_opportunity: 'Compliance required for state contracts',
    deadline: 'Ongoing'
  },
  {
    id: 'rural_access',
    title: 'Rural Behavioral Health Access Expansion',
    status: 'active',
    priority: 'high',
    impact: 'Telehealth expansion, mobile units, rural peer support',
    gfa_alignment: 'MRCC rural outreach, digital equity, 99-county reach',
    key_legislators: ['Rural Caucus', 'Telehealth Advocates'],
    funding_opportunity: '$250k-$500k',
    deadline: '2026-09-01'
  },
  {
    id: 'justice_reentry',
    title: 'Justice-Involved Reentry Support Programs',
    status: 'active',
    priority: 'high',
    impact: 'Funding for reentry programs, warm handoffs from IDOC/jails',
    gfa_alignment: 'JUST GRACE Initiative, Grace House 30-day grace period',
    key_legislators: ['Corrections Committee', 'Criminal Justice Reform Coalition'],
    funding_opportunity: '$300k-$750k',
    deadline: '2026-04-30'
  },
  {
    id: 'peer_workforce',
    title: 'Peer Support Specialist Workforce Development',
    status: 'monitoring',
    priority: 'medium',
    impact: 'Training, certification, Medicaid billing for peer services',
    gfa_alignment: 'Peer coach certification, workforce development, sustainability',
    key_legislators: ['Workforce Development Board'],
    funding_opportunity: 'Medicaid reimbursement eligibility',
    deadline: '2026-12-31'
  }
];

export default function PolicyTracker() {
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredPolicies = filterStatus === 'all' 
    ? IOWA_2026_POLICIES 
    : IOWA_2026_POLICIES.filter(p => p.status === filterStatus);

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    monitoring: 'bg-blue-100 text-blue-700',
    expired: 'bg-gray-100 text-gray-700'
  };

  const priorityColors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700'
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="text-center">
          <Scale className="w-12 h-12 mx-auto mb-3 text-blue-600" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">2026 Iowa Policy & Funding Tracker</h3>
          <p className="text-gray-700">
            Real-time monitoring of state/federal policies, legislative priorities, and funding opportunities aligned with GFA's mission
          </p>
        </div>
      </GraceCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GraceCard className="text-center">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-green-700">
            {IOWA_2026_POLICIES.filter(p => p.status === 'active').length}
          </div>
          <div className="text-xs text-gray-600">Active Opportunities</div>
        </GraceCard>

        <GraceCard className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <div className="text-2xl font-bold text-red-700">
            {IOWA_2026_POLICIES.filter(p => p.priority === 'critical').length}
          </div>
          <div className="text-xs text-gray-600">Critical Priority</div>
        </GraceCard>

        <GraceCard className="text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-teal-600" />
          <div className="text-2xl font-bold text-teal-700">$2.5M+</div>
          <div className="text-xs text-gray-600">Total Funding Potential</div>
        </GraceCard>
      </div>

      {/* Policy Cards */}
      <div className="space-y-4">
        {filteredPolicies.map((policy, idx) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <GraceCard hover>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-900">{policy.title}</h4>
                    <Badge className={statusColors[policy.status]}>
                      {policy.status}
                    </Badge>
                    <Badge className={priorityColors[policy.priority]}>
                      {policy.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{policy.impact}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">GFA Alignment</p>
                  <p className="text-sm text-teal-700">{policy.gfa_alignment}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Key Stakeholders</p>
                  <div className="flex flex-wrap gap-1">
                    {policy.key_legislators.map(leg => (
                      <Badge key={leg} variant="outline" className="text-xs">
                        {leg}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Funding Opportunity</p>
                  <p className="text-sm font-bold text-green-700">{policy.funding_opportunity}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Deadline</p>
                  <p className="text-sm font-bold text-orange-700">{policy.deadline}</p>
                </div>
              </div>
            </GraceCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}