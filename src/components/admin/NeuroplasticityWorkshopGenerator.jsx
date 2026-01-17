import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Brain, Sparkles, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import GraceCard from '@/components/common/GraceCard';

export default function NeuroplasticityWorkshopGenerator() {
  const [narrativeType, setNarrativeType] = useState('workshop');
  const [targetAudience, setTargetAudience] = useState('general_community');
  const [grantContext, setGrantContext] = useState('Iowa Opioid Settlement Fund');
  const [generatedNarrative, setGeneratedNarrative] = useState('');

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateNeuroplasticityNarrative', {
        narrative_type: narrativeType,
        target_audience: targetAudience,
        grant_context: grantContext
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedNarrative(data.narrative);
      toast.success('Neuroplasticity narrative generated! 🧠');
    },
    onError: (error) => {
      toast.error('Failed to generate narrative');
      console.error(error);
    }
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedNarrative);
    toast.success('Copied to clipboard!');
  };

  const downloadAsText = () => {
    const blob = new Blob([generatedNarrative], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroplasticity-narrative-${narrativeType}-${Date.now()}.txt`;
    a.click();
    toast.success('Downloaded!');
  };

  return (
    <div className="space-y-6">
      <GraceCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Agent 2: Neuroplasticity & Grant Architect
          </CardTitle>
          <CardDescription>
            Generate clinical narratives using evidence-based language for workshops and grant applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Narrative Type</label>
              <Select value={narrativeType} onValueChange={setNarrativeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workshop">Workshop Presentation</SelectItem>
                  <SelectItem value="grant">Grant Application</SelectItem>
                  <SelectItem value="training">Clinical Training</SelectItem>
                  <SelectItem value="community">Community Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Target Audience</label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_community">General Community</SelectItem>
                  <SelectItem value="healthcare_professionals">Healthcare Professionals</SelectItem>
                  <SelectItem value="grant_reviewers">Grant Reviewers</SelectItem>
                  <SelectItem value="legislators">Legislators/Officials</SelectItem>
                  <SelectItem value="peer_coaches">Peer Coaches</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Grant Context</label>
              <Select value={grantContext} onValueChange={setGrantContext}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iowa Opioid Settlement Fund">Iowa Opioid Settlement</SelectItem>
                  <SelectItem value="SAMHSA TIEH">SAMHSA TIEH</SelectItem>
                  <SelectItem value="HRSA">HRSA</SelectItem>
                  <SelectItem value="County Strategic Plan">County Strategic Plan</SelectItem>
                  <SelectItem value="Private Foundation">Private Foundation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={() => generateMutation.mutate()} 
            disabled={generateMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generateMutation.isPending ? 'Generating Clinical Narrative...' : 'Generate Neuroplasticity Narrative'}
          </Button>

          {generatedNarrative && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Generated Narrative</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadAsText}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{generatedNarrative}</p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-900">
                  <strong>Strategic Language Included:</strong> "structural and functional recovery," "therapeutic substrate," "modulating brain reward circuits," "synaptic reorganization," "dopaminergic pathway restoration"
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </GraceCard>
    </div>
  );
}