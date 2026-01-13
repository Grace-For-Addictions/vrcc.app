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
import { FileText, Download, Send, Calendar, Filter, Plus, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CustomReportBuilder() {
  const [reportConfig, setReportConfig] = useState({
    report_name: '',
    metrics: [],
    date_range: { start_date: '', end_date: '' },
    demographic_filters: {},
    entity_types: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: savedReports = [] } = useQuery({
    queryKey: ['custom-reports'],
    queryFn: () => base44.entities.CustomReport.list('-created_date')
  });

  const availableMetrics = [
    { id: 'total_participants', label: 'Total Participants', category: 'enrollment' },
    { id: 'active_participants', label: 'Active Participants', category: 'enrollment' },
    { id: 'new_admissions', label: 'New Admissions', category: 'enrollment' },
    { id: 'completion_rate', label: 'Program Completion Rate', category: 'outcomes' },
    { id: 'employment_rate', label: 'Employment Rate', category: 'outcomes' },
    { id: 'housing_secured', label: 'Housing Secured', category: 'outcomes' },
    { id: 'avg_barc_score', label: 'Average BARC-10 Score', category: 'assessments' },
    { id: 'narcan_distributions', label: 'Narcan Distributions', category: 'harm_reduction' },
    { id: 'reversal_reports', label: 'Reversal Reports', category: 'harm_reduction' },
    { id: 'coaching_sessions', label: 'Coaching Sessions Delivered', category: 'services' },
    { id: 'group_attendance', label: 'Group Program Attendance', category: 'services' },
    { id: 'volunteer_hours', label: 'Volunteer Hours', category: 'operations' },
    { id: 'referrals_completed', label: 'Referrals Completed', category: 'coordination' },
    { id: 'grace_house_admissions', label: 'Grace House Admissions', category: 'housing' }
  ];

  const saveReportMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.CustomReport.create({
        report_name: reportConfig.report_name,
        created_by: user.email,
        configuration: reportConfig,
        is_scheduled: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-reports']);
      setReportConfig({
        report_name: '',
        metrics: [],
        date_range: { start_date: '', end_date: '' },
        demographic_filters: {},
        entity_types: []
      });
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async (config) => {
      // Generate report data based on configuration
      const reportData = {};
      
      // Fetch data for each selected metric
      for (const metricId of config.metrics) {
        const metric = availableMetrics.find(m => m.id === metricId);
        
        // Calculate metric value based on entities and filters
        switch (metricId) {
          case 'total_participants':
            const profiles = await base44.entities.UserProfile.list();
            reportData[metricId] = profiles.length;
            break;
          case 'coaching_sessions':
            const sessions = await base44.entities.CoachingSessionLog.list();
            reportData[metricId] = sessions.length;
            break;
          case 'housing_secured':
            const housing = await base44.entities.HousingStatus.filter({ 
              housing_status: 'permanent_housing' 
            });
            reportData[metricId] = housing.length;
            break;
          // Add more metric calculations as needed
        }
      }
      
      return { reportData, config };
    },
    onSuccess: ({ reportData, config }) => {
      // Create downloadable report (simplified - would use jsPDF in production)
      console.log('Generated report:', reportData);
      
      // Update last_generated timestamp
      const report = savedReports.find(r => r.report_name === config.report_name);
      if (report) {
        base44.entities.CustomReport.update(report.id, {
          last_generated: new Date().toISOString()
        });
      }
    }
  });

  const toggleMetric = (metricId) => {
    setReportConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(m => m !== metricId)
        : [...prev.metrics, metricId]
    }));
  };

  const metricsByCategory = availableMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Custom Report Builder
              </CardTitle>
              <CardDescription>Create, save, and schedule custom reports</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Name */}
          <div>
            <Label>Report Name</Label>
            <Input
              value={reportConfig.report_name}
              onChange={(e) => setReportConfig({...reportConfig, report_name: e.target.value})}
              placeholder="e.g., Monthly Outcomes Report"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={reportConfig.date_range.start_date}
                onChange={(e) => setReportConfig({
                  ...reportConfig,
                  date_range: { ...reportConfig.date_range, start_date: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={reportConfig.date_range.end_date}
                onChange={(e) => setReportConfig({
                  ...reportConfig,
                  date_range: { ...reportConfig.date_range, end_date: e.target.value }
                })}
              />
            </div>
          </div>

          {/* Metrics Selection */}
          <div>
            <Label className="mb-3 block">Select Metrics to Include</Label>
            <div className="space-y-4">
              {Object.entries(metricsByCategory).map(([category, metrics]) => (
                <div key={category} className="border rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3 capitalize">
                    {category.replace(/_/g, ' ')}
                  </p>
                  <div className="space-y-2">
                    {metrics.map(metric => (
                      <div key={metric.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={reportConfig.metrics.includes(metric.id)}
                          onCheckedChange={() => toggleMetric(metric.id)}
                        />
                        <label className="text-sm cursor-pointer">{metric.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demographic Filters */}
          <div>
            <Label className="mb-3 block">Demographic Filters (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <Select 
                onValueChange={(value) => setReportConfig({
                  ...reportConfig,
                  demographic_filters: { ...reportConfig.demographic_filters, county: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="County" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  <SelectItem value="Polk">Polk</SelectItem>
                  <SelectItem value="Linn">Linn</SelectItem>
                  <SelectItem value="Scott">Scott</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                onValueChange={(value) => setReportConfig({
                  ...reportConfig,
                  demographic_filters: { ...reportConfig.demographic_filters, pathway: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pathway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pathways</SelectItem>
                  <SelectItem value="substance_use">Substance Use</SelectItem>
                  <SelectItem value="mental_health">Mental Health</SelectItem>
                  <SelectItem value="justice_involved">Justice Involved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => saveReportMutation.mutate()}
              disabled={!reportConfig.report_name || reportConfig.metrics.length === 0}
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
            <Button
              onClick={() => generateReportMutation.mutate(reportConfig)}
              disabled={reportConfig.metrics.length === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Report Configurations</CardTitle>
          <CardDescription>Quick access to your saved reports</CardDescription>
        </CardHeader>
        <CardContent>
          {savedReports.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No saved reports yet</p>
          ) : (
            <div className="space-y-3">
              {savedReports.map(report => (
                <Card key={report.id} className="bg-gray-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{report.report_name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {report.configuration.metrics?.length || 0} metrics selected
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateReportMutation.mutate(report.configuration)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {report.is_scheduled && (
                          <Badge className="bg-purple-100 text-purple-700">
                            <Calendar className="w-3 h-3 mr-1" />
                            Scheduled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}