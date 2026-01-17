import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function GenerateGrantReport() {
  const [open, setOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState('');
  const [reportType, setReportType] = useState('interim');
  const [generatedReport, setGeneratedReport] = useState('');

  const { data: grants = [] } = useQuery({
    queryKey: ['grantOpportunities'],
    queryFn: () => base44.entities.GrantOpportunity.filter({ 
      proposal_status: 'awarded' 
    })
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('autoGenerateGrantReport', {
        grant_opportunity_id: selectedGrant,
        report_type: reportType
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedReport(data.report);
      toast.success('Grant report generated! 📄');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auto-Generate Grant Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Grant</label>
            <Select value={selectedGrant} onValueChange={setSelectedGrant}>
              <SelectTrigger>
                <SelectValue placeholder="Choose awarded grant" />
              </SelectTrigger>
              <SelectContent>
                {grants.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.grant_name} - {g.funder_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interim">Interim Report</SelectItem>
                <SelectItem value="final">Final Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => generateMutation.mutate()}
            disabled={!selectedGrant || generateMutation.isPending}
            className="w-full"
          >
            Generate AI Report
          </Button>

          {generatedReport && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedReport);
                    toast.success('Copied!');
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([generatedReport], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `grant-report-${reportType}-${Date.now()}.txt`;
                    a.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{generatedReport}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}