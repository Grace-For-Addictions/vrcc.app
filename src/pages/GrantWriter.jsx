import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Send, Loader2, Download, Save, 
  Sparkles, DollarSign, Users, Target, TrendingUp,
  BookOpen, CheckCircle2, Plus, Edit3, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

const proposalSections = [
  { key: 'executive_summary', label: 'Executive Summary', icon: FileText },
  { key: 'statement_of_need', label: 'Statement of Need', icon: Target },
  { key: 'goals_objectives', label: 'Goals & Objectives', icon: CheckCircle2 },
  { key: 'implementation_plan', label: 'Implementation Plan', icon: TrendingUp },
  { key: 'evaluation_plan', label: 'Evaluation Plan', icon: BookOpen },
  { key: 'budget_narrative', label: 'Budget Narrative', icon: DollarSign },
  { key: 'organizational_capacity', label: 'Organizational Capacity', icon: Users },
  { key: 'sustainability_plan', label: 'Sustainability Plan', icon: Target }
];

function BrainstormMode({ onGenerate }) {
  const [formData, setFormData] = useState({
    organization_name: '',
    mission: '',
    target_population: '',
    funder: 'SAMHSA',
    funding_amount: '',
    project_focus: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [brainstormNotes, setBrainstormNotes] = useState('');

  const handleBrainstorm = async () => {
    setIsGenerating(true);
    try {
      const prompt = `You are an expert grant writer specializing in SAMHSA grants for recovery and behavioral health organizations.

ORGANIZATION INFO:
- Name: ${formData.organization_name}
- Mission: ${formData.mission}
- Target Population: ${formData.target_population}
- Project Focus: ${formData.project_focus}
- Target Funder: ${formData.funder}
- Requested Amount: $${formData.funding_amount}

Based on this information, provide:
1. 3-5 potential grant opportunity matches from SAMHSA
2. Key strengths to highlight in the proposal
3. Potential challenges and how to address them
4. Recommended data sources for statement of need
5. Suggested evidence-based practices to include

Format as markdown with clear sections.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setBrainstormNotes(response);
    } catch (error) {
      setBrainstormNotes('Error generating brainstorm. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-teal-500" />
          Grant Brainstorming
        </h3>
        <p className="text-gray-600 mb-6">
          Tell AI Grace about your organization and goals, and get personalized grant recommendations and strategy.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Organization Name</label>
            <Input
              value={formData.organization_name}
              onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
              placeholder="e.g., Grace For Addictions"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Mission Statement</label>
            <Textarea
              value={formData.mission}
              onChange={(e) => setFormData({...formData, mission: e.target.value})}
              placeholder="Brief mission statement..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Target Population</label>
            <Input
              value={formData.target_population}
              onChange={(e) => setFormData({...formData, target_population: e.target.value})}
              placeholder="e.g., Justice-involved individuals in Iowa"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Project Focus</label>
            <Textarea
              value={formData.project_focus}
              onChange={(e) => setFormData({...formData, project_focus: e.target.value})}
              placeholder="What services or programs do you want to provide?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Target Funder</label>
              <Input
                value={formData.funder}
                onChange={(e) => setFormData({...formData, funder: e.target.value})}
                placeholder="e.g., SAMHSA, Iowa HHS"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Funding Amount Needed</label>
              <Input
                type="number"
                value={formData.funding_amount}
                onChange={(e) => setFormData({...formData, funding_amount: e.target.value})}
                placeholder="500000"
              />
            </div>
          </div>

          <Button
            onClick={handleBrainstorm}
            disabled={isGenerating || !formData.organization_name}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating ideas...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Brainstorm Grant Ideas
              </>
            )}
          </Button>
        </div>
      </GraceCard>

      {brainstormNotes && (
        <GraceCard>
          <h4 className="font-semibold text-gray-900 mb-4">Brainstorm Results</h4>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {brainstormNotes}
          </div>
          <Button
            onClick={() => onGenerate(formData, brainstormNotes)}
            className="w-full mt-6 bg-teal-600 hover:bg-teal-700"
          >
            Generate Full Proposal →
          </Button>
        </GraceCard>
      )}
    </div>
  );
}

function ProposalEditor({ proposal, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState(proposal?.content || {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{proposal?.title}</h2>
          <p className="text-gray-500">Version {proposal?.version || 1}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditMode(!editMode)}>
            {editMode ? <Eye className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
            {editMode ? 'Preview' : 'Edit'}
          </Button>
          <Button onClick={() => onSave(content)}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      <Tabs defaultValue="executive_summary">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          {proposalSections.map(section => (
            <TabsTrigger key={section.key} value={section.key} className="text-xs">
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {proposalSections.map(section => (
          <TabsContent key={section.key} value={section.key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-teal-600" />
                  {section.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Textarea
                    value={content[section.key] || ''}
                    onChange={(e) => setContent({...content, [section.key]: e.target.value})}
                    rows={15}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="prose max-w-none whitespace-pre-wrap">
                    {content[section.key] || 'No content yet. Click Edit to add content.'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function GrantWriter() {
  const [mode, setMode] = useState('browse'); // browse, brainstorm, edit
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: proposals } = useQuery({
    queryKey: ['grantProposals'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.GrantProposal.filter({ created_by: user.email }, '-created_date', 20);
    },
    enabled: !!user,
    initialData: []
  });

  const createProposal = useMutation({
    mutationFn: (data) => base44.entities.GrantProposal.create(data),
    onSuccess: (newProposal) => {
      queryClient.invalidateQueries(['grantProposals']);
      setSelectedProposal(newProposal);
      setMode('edit');
    }
  });

  const handleStartBrainstorm = (formData, notes) => {
    createProposal.mutate({
      title: `${formData.funder} Grant - ${formData.organization_name}`,
      funder: formData.funder,
      grant_type: formData.funder.toLowerCase().includes('samhsa') ? 'samhsa' : 'state',
      status: 'draft',
      funding_amount_requested: parseInt(formData.funding_amount) || 0,
      ai_brainstorm_notes: notes,
      organization_info: {
        name: formData.organization_name,
        mission: formData.mission,
        target_population: formData.target_population
      },
      content: {}
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Grant Writing Center"
          subtitle="AI-powered grant proposal development using SAMHSA best practices. From brainstorming to final proposal."
          icon={FileText}
        />

        {mode === 'browse' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Your Proposals</h3>
              <Button
                onClick={() => setMode('brainstorm')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Proposal
              </Button>
            </div>

            {proposals.length === 0 ? (
              <GraceCard className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No proposals yet</h3>
                <p className="text-gray-500 mt-1 mb-4">Start by brainstorming grant ideas with AI Grace</p>
                <Button onClick={() => setMode('brainstorm')} className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Brainstorming
                </Button>
              </GraceCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {proposals.map((proposal) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    onClick={() => { setSelectedProposal(proposal); setMode('edit'); }}
                    className="cursor-pointer"
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{proposal.title}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(proposal.created_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-purple-100 text-purple-700">{proposal.grant_type}</Badge>
                          <Badge variant="outline">{proposal.status}</Badge>
                        </div>
                        {proposal.funding_amount_requested > 0 && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${proposal.funding_amount_requested.toLocaleString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === 'brainstorm' && (
          <div>
            <Button variant="ghost" onClick={() => setMode('browse')} className="mb-4">
              ← Back to Proposals
            </Button>
            <BrainstormMode onGenerate={handleStartBrainstorm} />
          </div>
        )}

        {mode === 'edit' && selectedProposal && (
          <div>
            <Button variant="ghost" onClick={() => setMode('browse')} className="mb-4">
              ← Back to Proposals
            </Button>
            <ProposalEditor 
              proposal={selectedProposal}
              onSave={(content) => {
                base44.entities.GrantProposal.update(selectedProposal.id, { content });
              }}
            />
          </div>
        )}
      </div>

      <GraceChatWidget />
    </div>
  );
}