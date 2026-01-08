import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Download, Sparkles, Loader2, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function GrantReportGenerator() {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState('90');
  const [grantName, setGrantName] = useState('');
  const [funder, setFunder] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const { data: sessions } = useQuery({
    queryKey: ['all-sessions-report'],
    queryFn: () => base44.entities.CoachingSessionLog.list('-activity_date', 1000),
    initialData: []
  });

  const { data: outcomes } = useQuery({
    queryKey: ['all-outcomes-report'],
    queryFn: () => base44.entities.OutcomeTracking.list('-outcome_date', 500),
    initialData: []
  });

  const { data: assessments } = useQuery({
    queryKey: ['all-assessments-report'],
    queryFn: () => base44.entities.Assessment.list('-created_date', 500),
    initialData: []
  });

  const generateReport = async () => {
    if (!reportType || !grantName || !funder) {
      toast.error('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    try {
      const days = parseInt(dateRange);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const filteredSessions = sessions.filter(s => new Date(s.activity_date) > cutoffDate);
      const filteredOutcomes = outcomes.filter(o => new Date(o.outcome_date) > cutoffDate);
      const filteredAssessments = assessments.filter(a => new Date(a.created_date) > cutoffDate);

      // Calculate metrics
      const uniqueClients = new Set(filteredSessions.map(s => s.contact_email || s.contact_name)).size;
      const totalSessions = filteredSessions.length;
      const housingPlacements = filteredOutcomes.filter(o => o.outcome_type === 'housing_stability').length;
      const employmentGained = filteredOutcomes.filter(o => o.outcome_type === 'employment_gained').length;
      const crisisDiversions = filteredOutcomes.filter(o => o.outcome_type === 'crisis_diversion').length;
      const overdosePrevented = filteredOutcomes.filter(o => o.outcome_type === 'overdose_prevented').length;
      const costAvoidance = filteredOutcomes.reduce((sum, o) => sum + (o.cost_avoidance_estimate || 0), 0);

      const avgRecoveryCapital = filteredAssessments.length > 0
        ? Math.round(filteredAssessments.reduce((sum, a) => sum + a.total_score, 0) / filteredAssessments.length)
        : 0;

      const demographics = {
        age_ranges: {},
        counties: {},
        pathways: {}
      };

      let prompt = '';
      let schema = {};

      if (reportType === 'general') {
        // Template A: General Grant-Reporting Form
        prompt = `Generate a comprehensive grant report for Grace For Addictions.

GRANT IDENTIFICATION:
- Grant Name: ${grantName}
- Funder: ${funder}
- Report Period: Last ${days} days
- Contact: GFA Operations Team

PROGRAM DATA (${days} days):
- Clients Served: ${uniqueClients}
- Peer Coaching Sessions: ${totalSessions}
- Housing Placements: ${housingPlacements}
- Employment Gained: ${employmentGained}
- Crisis Diversions: ${crisisDiversions}
- Overdoses Prevented: ${overdosePrevented}
- Average Recovery Capital: ${avgRecoveryCapital}/50

OUTCOMES:
- Cost Avoidance: $${costAvoidance.toLocaleString()}
- Housing Stability Rate: ${Math.round(housingPlacements / uniqueClients * 100)}%
- Employment Rate: ${Math.round(employmentGained / uniqueClients * 100)}%

Generate a professional grant report following Template A format with all required sections: Program Overview, Outputs, Outcomes, Demographics, Challenges, Budget Summary, Future Plans.`;

        schema = {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            program_overview: { type: "string" },
            activities_summary: { type: "string" },
            outputs_data: { type: "object" },
            outcome_data: { type: "object" },
            demographics: { type: "string" },
            challenges_learned: { type: "string" },
            budget_summary: { type: "string" },
            future_plans: { type: "string" }
          }
        };
      } else if (reportType === 'pilot') {
        // Template B: New Initiative / Pilot Grant Proposal
        prompt = `Generate a pilot grant proposal for a new GFA initiative.

Initiative: ${grantName}
Funder: ${funder}
Based on our proven track record (${uniqueClients} clients, ${totalSessions} sessions, $${costAvoidance.toLocaleString()} cost avoidance).

Generate a compelling proposal following Template B format: Purpose, Goals, Target Population, Activities, Metrics, Evaluation Plan, Budget, Sustainability, Risk Mitigation.`;

        schema = {
          type: "object",
          properties: {
            project_title: { type: "string" },
            purpose_problem: { type: "string" },
            goals_objectives: { type: "array", items: { type: "string" } },
            target_population: { type: "string" },
            activities_timeline: { type: "string" },
            metrics_outcomes: { type: "string" },
            evaluation_plan: { type: "string" },
            budget_resources: { type: "string" },
            sustainability_plan: { type: "string" },
            risk_mitigation: { type: "string" }
          }
        };
      } else {
        // Template C: Recovery Housing Referral & Monitoring
        prompt = `Generate a recovery housing program report for GFA.

Program: ${grantName}
Funder: ${funder}
Period: Last ${days} days

Housing Data:
- Placements Made: ${housingPlacements}
- Clients Referred: ${uniqueClients}
- Retention Rate: ${Math.round(housingPlacements / uniqueClients * 100)}%

Generate comprehensive housing report following Template C format: Referral Summary, Placement Details, Monitoring Data, Outcomes, Retention Analysis.`;

        schema = {
          type: "object",
          properties: {
            program_summary: { type: "string" },
            referral_summary: { type: "string" },
            placement_details: { type: "string" },
            monitoring_data: { type: "string" },
            retention_analysis: { type: "string" },
            outcomes_summary: { type: "string" },
            recommendations: { type: "string" }
          }
        };
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt + `\n\nUse professional, funder-ready language. Include specific numbers and percentages. Be comprehensive but concise.`,
        response_json_schema: schema
      });

      setGeneratedReport({
        type: reportType,
        data: response,
        metadata: {
          grantName,
          funder,
          dateRange: days,
          generatedDate: new Date().toISOString(),
          metrics: {
            uniqueClients,
            totalSessions,
            housingPlacements,
            employmentGained,
            costAvoidance
          }
        }
      });

    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = () => {
    if (!generatedReport) return;

    const reportText = Object.entries(generatedReport.data)
      .map(([key, value]) => {
        const title = key.replace(/_/g, ' ').toUpperCase();
        const content = Array.isArray(value) ? value.join('\n• ') : value;
        return `${title}\n${'='.repeat(title.length)}\n${content}\n\n`;
      })
      .join('\n');

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GFA_${reportType}_report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Auto-Generate Grant Reports
        </h3>
        <p className="text-gray-700">
          AI extracts data from your coaching sessions, outcomes, and assessments to automatically generate professional grant reports and proposals.
        </p>
      </GraceCard>

      {/* Report Configuration */}
      <GraceCard>
        <h4 className="font-bold text-gray-900 mb-4">Report Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Report Type *</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Template A: General Grant Report</SelectItem>
                <SelectItem value="pilot">Template B: Pilot/Initiative Proposal</SelectItem>
                <SelectItem value="housing">Template C: Housing Program Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Report Period</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Grant/Program Name *</label>
            <Input
              value={grantName}
              onChange={(e) => setGrantName(e.target.value)}
              placeholder="e.g., Dallas County Foundation Grant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Funder Organization *</label>
            <Input
              value={funder}
              onChange={(e) => setFunder(e.target.value)}
              placeholder="e.g., Dallas County Community Foundation"
            />
          </div>
        </div>

        <Button
          onClick={generateReport}
          disabled={generating || !reportType || !grantName || !funder}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-6 text-lg"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </GraceCard>

      {/* Generated Report Preview */}
      {generatedReport && (
        <GraceCard>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-gray-900">Generated Report</h4>
            <Button onClick={exportReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export as Text
            </Button>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Grant/Program</p>
              <p className="font-semibold text-gray-900">{generatedReport.metadata.grantName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Funder</p>
              <p className="font-semibold text-gray-900">{generatedReport.metadata.funder}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Clients Served</p>
              <p className="font-semibold text-gray-900">{generatedReport.metadata.metrics.uniqueClients}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Cost Avoidance</p>
              <p className="font-semibold text-gray-900">${generatedReport.metadata.metrics.costAvoidance.toLocaleString()}</p>
            </div>
          </div>

          {/* Report Content */}
          <div className="space-y-6">
            {Object.entries(generatedReport.data).map(([key, value]) => (
              <div key={key} className="border-b border-gray-200 pb-4">
                <h5 className="font-bold text-gray-900 mb-2 capitalize">
                  {key.replace(/_/g, ' ')}
                </h5>
                {Array.isArray(value) ? (
                  <ul className="list-disc list-inside space-y-1">
                    {value.map((item, i) => (
                      <li key={i} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                ) : typeof value === 'object' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(value).map(([k, v]) => (
                      <div key={k} className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600 capitalize">{k.replace(/_/g, ' ')}</p>
                        <p className="font-semibold text-gray-900">{v}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{value}</p>
                )}
              </div>
            ))}
          </div>
        </GraceCard>
      )}
    </div>
  );
}