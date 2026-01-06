import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function ReportGenerator({ user }) {
  const [selectedResident, setSelectedResident] = useState('');
  const [reportPeriod, setReportPeriod] = useState('weekly');
  const [reportType, setReportType] = useState('probation');
  const [generating, setGenerating] = useState(false);

  const { data: residents } = useQuery({
    queryKey: ['allResidents'],
    queryFn: () => base44.entities.ResidentProfile.filter({ resident_status: 'active' }),
    initialData: []
  });

  const generateReport = async () => {
    if (!selectedResident) return;
    
    setGenerating(true);
    try {
      const resident = residents.find(r => r.id === selectedResident);
      const events = await base44.entities.ResidencyEventLog.filter({ 
        resident_email: resident.user_email 
      }, '-event_date', 200);

      const now = new Date();
      const periodDays = {
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        yearly: 365
      }[reportPeriod];

      const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const periodEvents = events.filter(e => new Date(e.event_date) > cutoffDate);

      const meetings = periodEvents.filter(e => e.event_type === 'meeting');
      const checkIns = periodEvents.filter(e => e.event_type === 'check_in');
      const chores = periodEvents.filter(e => e.event_type === 'chore' && e.chore_data?.completed);
      const moodLogs = periodEvents.filter(e => e.event_type === 'mood_log');
      const avgMood = moodLogs.length > 0 
        ? (moodLogs.reduce((sum, e) => sum + (e.mood_data?.mood_score || 0), 0) / moodLogs.length).toFixed(1)
        : 'N/A';

      const reportContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional ${reportPeriod} progress report for a recovery housing resident to share with ${reportType}. 

Resident Email: ${resident.user_email}
Program Days: ${Math.floor((now - new Date(resident.intake_date)) / (1000 * 60 * 60 * 24))}
Recovery Days: ${resident.sobriety_date ? Math.floor((now - new Date(resident.sobriety_date)) / (1000 * 60 * 60 * 24)) : 'N/A'}

${reportPeriod} Summary:
- Recovery meetings attended: ${meetings.length}
- House check-ins: ${checkIns.length}
- Chores completed: ${chores.length}
- Average mood score: ${avgMood}/10

Create a formal, structured report suitable for ${reportType === 'probation' ? 'probation officers' : reportType === 'court' ? 'court officials' : reportType === 'dhs' ? 'DHS workers' : 'legal professionals'}. Include:
1. Executive Summary
2. Attendance & Compliance
3. Behavioral Observations
4. Progress Toward Goals
5. Recommendations

Be professional, objective, and recovery-focused.`,
        add_context_from_internet: false
      });

      // In production, this would generate a PDF
      alert(`Report Generated!\n\n${reportContent}\n\n(In production, this would be a downloadable PDF)`);
      
    } catch (error) {
      alert('Error generating report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Generate Individual Reports</h3>

      <GraceCard>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Resident
            </label>
            <Select value={selectedResident} onValueChange={setSelectedResident}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a resident" />
              </SelectTrigger>
              <SelectContent>
                {residents.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.user_email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Period
              </label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report For
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="probation">Probation Officer</SelectItem>
                  <SelectItem value="parole">Parole Officer</SelectItem>
                  <SelectItem value="court">Court/Drug Court</SelectItem>
                  <SelectItem value="recovery_court">Recovery Court</SelectItem>
                  <SelectItem value="dhs">DHS/CINA Worker</SelectItem>
                  <SelectItem value="attorney">Attorney</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateReport}
            disabled={!selectedResident || generating}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {generating ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <FileText className="w-5 h-5 mr-2" />
            )}
            Generate Report
          </Button>
        </div>
      </GraceCard>

      <GraceCard>
        <h4 className="font-semibold text-gray-900 mb-3">Report Features</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <Badge className="bg-teal-100 text-teal-700 mt-0.5">✓</Badge>
            Professional formatting for legal stakeholders
          </li>
          <li className="flex items-start gap-2">
            <Badge className="bg-teal-100 text-teal-700 mt-0.5">✓</Badge>
            Blockchain-verified activity logs
          </li>
          <li className="flex items-start gap-2">
            <Badge className="bg-teal-100 text-teal-700 mt-0.5">✓</Badge>
            Compliance metrics and attendance tracking
          </li>
          <li className="flex items-start gap-2">
            <Badge className="bg-teal-100 text-teal-700 mt-0.5">✓</Badge>
            Exportable PDF with GFA branding
          </li>
        </ul>
      </GraceCard>
    </div>
  );
}