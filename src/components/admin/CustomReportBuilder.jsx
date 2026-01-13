import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Calendar, Mail, Save, Loader2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AVAILABLE_METRICS = [
  { id: 'total_users', label: 'Total Users', category: 'engagement' },
  { id: 'active_users', label: 'Active Users (30 days)', category: 'engagement' },
  { id: 'check_ins', label: 'Daily Check-ins', category: 'engagement' },
  { id: 'session_attendance', label: 'Session Attendance', category: 'engagement' },
  { id: 'goal_completion', label: 'Goal Completion Rate', category: 'outcomes' },
  { id: 'assessment_scores', label: 'Assessment Scores (BARC-10, PIL)', category: 'outcomes' },
  { id: 'housing_stability', label: 'Housing Stability', category: 'outcomes' },
  { id: 'employment_status', label: 'Employment Status', category: 'outcomes' },
  { id: 'resource_connections', label: 'Resource Connections', category: 'services' },
  { id: 'narcan_distribution', label: 'Narcan Distribution', category: 'services' },
  { id: 'crisis_interventions', label: 'Crisis Interventions', category: 'services' }
];

const ENTITY_TYPES = [
  'UserProfile', 'DailyCheckIn', 'CoachingSessionLog', 'Assessment', 
  'MenteeGoal', 'HousingStatus', 'EmploymentHistory', 'NarcanLog'
];

export default function CustomReportBuilder() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [reportName, setReportName] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [demographicFilters, setDemographicFilters] = useState({});
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [deliveryEmails, setDeliveryEmails] = useState('');
  const queryClient = useQueryClient();

  const { data: savedReports = [], isLoading } = useQuery({
    queryKey: ['custom-reports'],
    queryFn: () => base44.entities.CustomReport.list('-created_date')
  });

  const saveReportMutation = useMutation({
    mutationFn: (config) => base44.entities.CustomReport.create(config),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-reports']);
      resetForm();
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportConfig) => {
      // This would call a backend function to generate the actual report
      return base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive recovery program report with the following configuration:
        
Metrics: ${reportConfig.metrics.join(', ')}
Entities: ${reportConfig.entity_types.join(', ')}
Date Range: ${reportConfig.date_range.start_date} to ${reportConfig.date_range.end_date}
Filters: ${JSON.stringify(reportConfig.demographic_filters)}

Provide analysis, trends, and key insights in a structured format suitable for stakeholders.`,
        add_context_from_internet: false
      });
    }
  });

  const resetForm = () => {
    setReportName('');
    setSelectedMetrics([]);
    setSelectedEntities([]);
    setDateRange({ start: '', end: '' });
    setDemographicFilters({});
    setIsScheduled(false);
    setDeliveryEmails('');
  };

  const handleSaveReport = async () => {
    const config = {
      report_name: reportName,
      configuration: {
        metrics: selectedMetrics,
        entity_types: selectedEntities,
        date_range: {
          start_date: dateRange.start,
          end_date: dateRange.end
        },
        demographic_filters: demographicFilters
      },
      is_scheduled: isScheduled,
      schedule_config: isScheduled ? {
        frequency: scheduleFrequency,
        delivery_emails: deliveryEmails.split(',').map(e => e.trim())
      } : null
    };

    await saveReportMutation.mutateAsync(config);
  };

  const handleGenerateReport = async (config) => {
    setIsBuilding(true);
    try {
      const result = await generateReportMutation.mutateAsync(config);
      // Download or display result
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.report_name || 'report'}_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>Create, save, and schedule custom reports</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Build Custom Report</DialogTitle>
                  <DialogDescription>
                    Select metrics, date ranges, and filters for your report
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div>
                    <Label>Report Name</Label>
                    <Input
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="e.g., Monthly Engagement Report"
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Select Metrics</Label>
                    <div className="space-y-3">
                      {['engagement', 'outcomes', 'services'].map(category => (
                        <div key={category}>
                          <p className="text-sm font-medium text-gray-600 mb-2 capitalize">{category}</p>
                          <div className="space-y-2 ml-4">
                            {AVAILABLE_METRICS.filter(m => m.category === category).map(metric => (
                              <div key={metric.id} className="flex items-center gap-2">
                                <Checkbox
                                  checked={selectedMetrics.includes(metric.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedMetrics([...selectedMetrics, metric.id]);
                                    } else {
                                      setSelectedMetrics(selectedMetrics.filter(m => m !== metric.id));
                                    }
                                  }}
                                />
                                <Label className="font-normal">{metric.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Data Sources (Entities)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ENTITY_TYPES.map(entity => (
                        <div key={entity} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedEntities.includes(entity)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedEntities([...selectedEntities, entity]);
                              } else {
                                setSelectedEntities(selectedEntities.filter(e => e !== entity));
                              }
                            }}
                          />
                          <Label className="font-normal text-sm">{entity}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <Checkbox
                        checked={isScheduled}
                        onCheckedChange={setIsScheduled}
                      />
                      <Label>Schedule automated delivery</Label>
                    </div>

                    {isScheduled && (
                      <div className="space-y-4 ml-6">
                        <div>
                          <Label>Frequency</Label>
                          <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Delivery Email(s)</Label>
                          <Input
                            value={deliveryEmails}
                            onChange={(e) => setDeliveryEmails(e.target.value)}
                            placeholder="email1@example.com, email2@example.com"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSaveReport}
                      disabled={!reportName || selectedMetrics.length === 0}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Report
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleGenerateReport({
                        report_name: reportName,
                        metrics: selectedMetrics,
                        entity_types: selectedEntities,
                        date_range: dateRange,
                        demographic_filters: demographicFilters
                      })}
                      disabled={!reportName || selectedMetrics.length === 0 || isBuilding}
                    >
                      {isBuilding ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Generate Now
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {savedReports.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No saved reports yet</p>
            ) : (
              savedReports.map(report => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{report.report_name}</CardTitle>
                        <CardDescription>
                          {report.configuration.metrics.length} metrics • {report.configuration.entity_types.length} data sources
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.is_scheduled && (
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="w-3 h-3" />
                            {report.schedule_config.frequency}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateReport(report.configuration)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}