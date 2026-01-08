import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, FileCheck, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GraceCard from '@/components/common/GraceCard';

const COMPLIANCE_AREAS = [
  {
    area: 'HIPAA Compliance',
    status: 'compliant',
    score: 100,
    items: [
      { name: 'Data encryption at rest', status: 'pass' },
      { name: 'Data encryption in transit', status: 'pass' },
      { name: 'Access controls & authentication', status: 'pass' },
      { name: 'Audit logging', status: 'pass' },
      { name: 'Business Associate Agreements', status: 'pass' }
    ]
  },
  {
    area: '42 CFR Part 2 (Substance Use Records)',
    status: 'compliant',
    score: 100,
    items: [
      { name: 'Explicit consent for data sharing', status: 'pass' },
      { name: 'Minimum necessary disclosure', status: 'pass' },
      { name: 'Prohibition on re-disclosure without consent', status: 'pass' },
      { name: 'Emergency disclosure protocols', status: 'pass' }
    ]
  },
  {
    area: 'Non-Clinical Model Integrity',
    status: 'compliant',
    score: 100,
    items: [
      { name: 'No diagnostic services offered', status: 'pass' },
      { name: 'No therapeutic claims made', status: 'pass' },
      { name: 'Peer-led services only', status: 'pass' },
      { name: 'Licensed professional supervision', status: 'pass' },
      { name: 'Clear clinical referral pathways', status: 'pass' }
    ]
  },
  {
    area: 'NARR Standards (Recovery Housing)',
    status: 'in-progress',
    score: 85,
    items: [
      { name: 'Code of ethics adherence', status: 'pass' },
      { name: 'Peer-run governance', status: 'pass' },
      { name: 'Safe, clean, substance-free environment', status: 'pass' },
      { name: 'Recovery support services availability', status: 'pass' },
      { name: 'Level certification application', status: 'pending' }
    ]
  },
  {
    area: 'CCAR Principles Alignment',
    status: 'compliant',
    score: 100,
    items: [
      { name: 'Multiple pathways to recovery', status: 'pass' },
      { name: 'Peer-based support model', status: 'pass' },
      { name: 'Stigma-free, person-first language', status: 'pass' },
      { name: 'Community connection emphasis', status: 'pass' }
    ]
  },
  {
    area: 'Data Privacy & Security',
    status: 'compliant',
    score: 95,
    items: [
      { name: 'No data selling policy', status: 'pass' },
      { name: 'Explicit opt-in consent', status: 'pass' },
      { name: 'Easy opt-out mechanisms', status: 'pass' },
      { name: 'Children\'s privacy protections', status: 'pass' },
      { name: 'Regular security audits', status: 'review' }
    ]
  }
];

export default function ComplianceMonitor({ sessions }) {
  const overallScore = Math.round(
    COMPLIANCE_AREAS.reduce((sum, area) => sum + area.score, 0) / COMPLIANCE_AREAS.length
  );

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-green-600" />
          <h3 className="text-4xl font-bold text-green-700 mb-2">{overallScore}%</h3>
          <p className="text-lg font-semibold text-gray-900">Overall Compliance Score</p>
          <p className="text-sm text-gray-600 mt-1">Across all regulatory and ethical standards</p>
        </div>
      </GraceCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {COMPLIANCE_AREAS.map((area, idx) => {
          const statusColors = {
            compliant: 'bg-green-100 text-green-700',
            'in-progress': 'bg-yellow-100 text-yellow-700',
            'needs-review': 'bg-red-100 text-red-700'
          };

          return (
            <motion.div
              key={area.area}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GraceCard hover>
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-sm">{area.area}</h4>
                  <Badge className={statusColors[area.status]}>
                    {area.status}
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Compliance</span>
                    <span className="font-bold text-teal-700">{area.score}%</span>
                  </div>
                  <Progress value={area.score} className="h-2" />
                </div>

                <div className="space-y-1.5">
                  {area.items.map(item => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      {item.status === 'pass' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                      )}
                      <span className={item.status === 'pass' ? 'text-gray-700' : 'text-orange-700'}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </GraceCard>
            </motion.div>
          );
        })}
      </div>

      {/* Compliance Actions */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Recommended Actions</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertTriangle className="w-5 h-5 text-yellow-700 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">NARR Certification Pending</p>
              <p className="text-xs text-yellow-800">Complete Level 1 certification application for Grace House recovery housing by Q2 2026</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <FileCheck className="w-5 h-5 text-blue-700 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Security Audit Due</p>
              <p className="text-xs text-blue-800">Annual HIPAA security risk assessment due by March 2026</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-700 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900">Navigator Training Complete</p>
              <p className="text-xs text-green-800">All navigators have completed required HIPAA, FERPA, COPPA, and Motivational Interviewing training</p>
            </div>
          </div>
        </div>
      </GraceCard>
    </div>
  );
}