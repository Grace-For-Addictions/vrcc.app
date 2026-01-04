import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Send, Loader2, Download, Save, 
  Sparkles, DollarSign, Users, Target, TrendingUp,
  BookOpen, CheckCircle2, Plus, Edit3, Eye, Search,
  Filter, Calendar, MapPin, Award, Lightbulb, ChevronDown,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

const grantmakers = [
  {
    id: 'polk_betterment',
    name: 'Polk County Community Betterment',
    type: 'Local - Polk County',
    focus: ['Community Health', 'Equity', 'Social Services'],
    deadline: 'Varies per cycle',
    maxAmount: 250000,
    description: 'Supports community health and equity initiatives in Polk County',
    address: 'Polk County, Iowa',
    priorities: ['Health equity', 'Community development', 'Social determinants of health']
  },
  {
    id: 'dallas_foundation',
    name: 'Dallas County Foundation Grants',
    type: 'Local - Dallas County',
    focus: ['Education', 'Health', 'Human Services', 'Environment', 'Arts'],
    deadline: 'March 3, 2026',
    maxAmount: 20000,
    description: 'Community grants for Dallas County non-profits (501c3, 501c5, 501c6, 170b)',
    address: 'P.O. Box 46, Adel, IA 50003',
    email: 'dcfboardmember@gmail.com',
    website: 'www.dallascountyfoundation.org',
    priorities: ['Community impact', 'Greatest number of residents', '25% match required'],
    requirements: ['Board signature', 'IRS determination letter', '25% matching funds', 'Post-evaluation within 12 months']
  },
  {
    id: 'iowa_hhs_opioid',
    name: 'Iowa HHS Opioid Infrastructure Grants',
    type: 'State',
    focus: ['Opioid Abatement', 'Recovery Support', 'Harm Reduction'],
    deadline: 'September 30, 2026 (rolling)',
    maxAmount: 1000000,
    description: 'Opioid settlement funds for prevention, treatment, and recovery infrastructure',
    priorities: ['Evidence-based practices', 'Peer support', 'Recovery housing', 'Overdose prevention']
  },
  {
    id: 'iowa_hhs_block',
    name: 'Iowa HHS Block Grants',
    type: 'State',
    focus: ['Behavioral Health', 'Peer Support', 'Mental Health Services'],
    deadline: 'Annual rolling',
    maxAmount: 500000,
    description: 'SABG/MHBG sub-awards for behavioral health and peer support services',
    priorities: ['SAMHSA-approved EBPs', 'Peer workforce development', 'Service expansion']
  },
  {
    id: 'samhsa_bcor',
    name: 'SAMHSA Building Communities of Recovery (BCOR)',
    type: 'Federal',
    focus: ['RCO Capacity', 'Peer Services', 'Community Mobilization'],
    deadline: 'Q1-Q2 2026 (forecasted)',
    maxAmount: 300000,
    description: 'Funds RCOs to build recovery-ready communities and expand peer support',
    priorities: ['RCO capacity building', 'ROSC development', 'Peer workforce', 'BARC-10/GPRA data collection']
  },
  {
    id: 'samhsa_sor',
    name: 'SAMHSA State Opioid Response (SOR) Grants',
    type: 'Federal',
    focus: ['Opioid Treatment', 'Recovery Support', 'MAT Access'],
    deadline: 'State-distributed rolling',
    maxAmount: 1000000,
    description: 'Sub-awards through Iowa HHS for opioid/stimulant treatment and recovery',
    priorities: ['MAT expansion', 'Peer recovery support', 'Naloxone distribution', 'Recovery housing']
  },
  {
    id: 'hrsa_rcorp',
    name: 'HRSA Rural Communities Opioid Response Program (RCORP)',
    type: 'Federal',
    focus: ['Rural Opioid Response', 'Recovery Community Centers', 'Healthcare Integration'],
    deadline: 'Spring 2026 (forecasted)',
    maxAmount: 1000000,
    description: 'Supports rural areas to prevent/treat opioid use disorder and build RCCs',
    priorities: ['Rural access', 'RCC development', 'Healthcare partnerships', 'Consortium approach']
  },
  {
    id: 'cdc_cara',
    name: 'CDC CARA (Overdose Data to Action)',
    type: 'Federal',
    focus: ['Overdose Prevention', 'Data Linkage', 'Recovery Pathways'],
    deadline: 'Early 2026 (forecasted)',
    maxAmount: 100000,
    description: 'Overdose prevention through data-driven strategies and recovery connections',
    priorities: ['Data systems', 'Harm reduction', 'Linkage to care', 'Surveillance']
  },
  {
    id: 'aureon_charity',
    name: 'Aureon Charity Grant Program',
    type: 'Local/State',
    focus: ['Community Development', 'Education', 'Health'],
    deadline: 'March 31, 2026 (quarterly)',
    maxAmount: 10000,
    description: 'Quarterly grants for Iowa nonprofits serving communities',
    priorities: ['Community impact', 'Technology', 'Education', 'Sustainability']
  },
  {
    id: 'bankers_trust',
    name: 'Bankers Trust Charitable Giving',
    type: 'Local',
    focus: ['Health', 'Human Services', 'Community Development'],
    deadline: 'March 1, 2026 (quarterly)',
    maxAmount: null,
    description: 'Quarterly giving for health and human services in Des Moines metro',
    priorities: ['Direct service provision', 'Vulnerable populations', 'Measurable outcomes']
  },
  {
    id: 'barkema_trust',
    name: 'Foster and Evelyn Barkema Charitable Trust',
    type: 'Local/State',
    focus: ['Education', 'Health', 'Youth Development'],
    deadline: 'September 30, 2026',
    maxAmount: null,
    description: 'Supports education, health, and youth-focused programs in Iowa',
    priorities: ['Youth services', 'Educational programming', 'Health initiatives']
  },
  {
    id: 'bechtel_trust',
    name: 'Harold R. Bechtel Charitable Trust',
    type: 'Local',
    focus: ['Community Development', 'Arts', 'Culture'],
    deadline: 'Rolling',
    maxAmount: null,
    description: 'Community and arts support in central Iowa',
    priorities: ['Community enrichment', 'Cultural programming', 'Quality of life']
  }
];

const proposalSections = [
  { 
    key: 'executive_summary', 
    label: 'Executive Summary', 
    icon: FileText,
    strategy: 'Craft concise, compelling overviews with data hooks and alignment to funder priorities. Lead with your strongest statistic.'
  },
  { 
    key: 'statement_of_need', 
    label: 'Statement of Need', 
    icon: Target,
    strategy: 'Build data-driven narratives identifying gaps using local/state stats. Problem-solve for evidence gaps with expert interviews.'
  },
  { 
    key: 'goals_objectives', 
    label: 'Goals & Objectives', 
    icon: CheckCircle2,
    strategy: 'Develop SMART, measurable targets with strategic alignment to outcomes like retention/ROI. Use action verbs.'
  },
  { 
    key: 'implementation_plan', 
    label: 'Implementation Plan', 
    icon: TrendingUp,
    strategy: 'Outline phased timelines with risk mitigation and collaborative contingencies. Show you have a realistic plan.'
  },
  { 
    key: 'evaluation_plan', 
    label: 'Evaluation Plan', 
    icon: BookOpen,
    strategy: 'Design metrics/tools like BARC-10/GPRA with problem-solving for data collection challenges. Specify who, what, when.'
  },
  { 
    key: 'budget_narrative', 
    label: 'Budget Narrative', 
    icon: DollarSign,
    strategy: 'Justify costs with efficiency strategies and value-for-money analysis. Show cost per participant/outcome.'
  },
  { 
    key: 'organizational_capacity', 
    label: 'Organizational Capacity', 
    icon: Users,
    strategy: 'Highlight strengths/past successes with goal-oriented capacity-building plans. Show track record.'
  },
  { 
    key: 'sustainability_plan', 
    label: 'Sustainability Plan', 
    icon: Award,
    strategy: 'Create diversified funding roadmaps with long-term viability strategies. Show this is not one-time.'
  }
];

function GrantmakerBrowser({ onSelect, selectedGrantmaker }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFocus, setFilterFocus] = useState('all');

  const filteredGrantmakers = grantmakers.filter(gm => {
    const matchesSearch = gm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          gm.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || gm.type === filterType;
    const matchesFocus = filterFocus === 'all' || gm.focus.some(f => f.toLowerCase().includes(filterFocus.toLowerCase()));
    return matchesSearch && matchesType && matchesFocus;
  });

  const allTypes = ['all', ...new Set(grantmakers.map(g => g.type))];
  const allFocusAreas = ['all', 'Recovery', 'Opioid', 'Peer Support', 'Housing', 'Health', 'Education'];

  return (
    <GraceCard>
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Search className="w-6 h-6 text-purple-600" />
        Grantmaker Directory
      </h3>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search grantmakers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-600 mb-2 block">Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-gray-600 mb-2 block">Focus Area</Label>
            <Select value={filterFocus} onValueChange={setFilterFocus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allFocusAreas.map(focus => (
                  <SelectItem key={focus} value={focus}>
                    {focus === 'all' ? 'All Focus Areas' : focus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredGrantmakers.map(gm => (
          <motion.div
            key={gm.id}
            whileHover={{ x: 4 }}
            onClick={() => onSelect(gm)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedGrantmaker?.id === gm.id 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{gm.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{gm.description}</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 ml-2">{gm.type}</Badge>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {gm.focus.slice(0, 3).map((f, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">{gm.deadline}</span>
              </div>
              {gm.maxAmount && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Up to ${(gm.maxAmount / 1000)}K</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {filteredGrantmakers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No grantmakers match your filters</p>
          </div>
        )}
      </div>
    </GraceCard>
  );
}

function BrainstormMode({ onGenerate, selectedGrantmaker }) {
  const [formData, setFormData] = useState({
    organization_name: '',
    mission: '',
    target_population: '',
    project_focus: '',
    funding_amount: '',
    specific_goals: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [brainstormNotes, setBrainstormNotes] = useState('');

  const handleBrainstorm = async () => {
    setIsGenerating(true);
    try {
      const grantContext = selectedGrantmaker ? `
TARGET GRANTMAKER: ${selectedGrantmaker.name} (${selectedGrantmaker.type})
Priorities: ${selectedGrantmaker.priorities?.join(', ') || 'See description'}
Deadline: ${selectedGrantmaker.deadline}
Max Amount: $${selectedGrantmaker.maxAmount?.toLocaleString() || 'Varies'}
Focus Areas: ${selectedGrantmaker.focus.join(', ')}
${selectedGrantmaker.requirements ? `Requirements: ${selectedGrantmaker.requirements.join(', ')}` : ''}
` : 'General grant exploration';

      const prompt = `You are an EXPERT GRANT WRITER with strategic planning, goal identification, and collaborative problem-solving skills.

${grantContext}

ORGANIZATION INFO:
- Name: ${formData.organization_name}
- Mission: ${formData.mission}
- Target Population: ${formData.target_population}
- Project Focus: ${formData.project_focus}
- Specific Goals: ${formData.specific_goals || 'To be determined'}
- Requested Amount: $${formData.funding_amount}

STRATEGIC ANALYSIS REQUESTED:
1. **Alignment Score (1-10)**: How well does this org align with funder priorities? Explain.
2. **Key Strengths**: What are the 3 strongest selling points for this proposal?
3. **Evidence Gaps**: What data/evidence is missing? How to gather it?
4. **Strategic Goals**: Propose 3 SMART objectives aligned to funder outcomes
5. **Risk Mitigation**: What are potential challenges and contingency plans?
6. **Data Strategy**: Suggest evaluation metrics (BARC-10, GPRA, retention, cost-per-participant)
7. **Budget Efficiency**: Estimated cost-per-participant/outcome?
8. **Sustainability Angle**: How will this continue after grant ends?
9. **Competitive Edge**: What makes THIS org uniquely qualified?
10. **Recommended Next Steps**: 3 actions before writing proposal

Format as markdown with clear headers. Be strategic and data-focused.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      setBrainstormNotes(response);
    } catch (error) {
      setBrainstormNotes('Error generating strategic analysis. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-500" />
          Strategic Grant Planning
        </h3>
        <p className="text-gray-600 mb-6">
          AI Grace will collaborate with you to identify goals, solve problems, and develop a winning strategy.
        </p>

        {selectedGrantmaker && (
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm font-medium text-purple-900">
              Planning for: {selectedGrantmaker.name}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              {selectedGrantmaker.description}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Organization Name *</label>
            <Input
              value={formData.organization_name}
              onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
              placeholder="e.g., Grace For Addictions"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Mission Statement *</label>
            <Textarea
              value={formData.mission}
              onChange={(e) => setFormData({...formData, mission: e.target.value})}
              placeholder="What is your organization's core mission?"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Target Population *</label>
            <Input
              value={formData.target_population}
              onChange={(e) => setFormData({...formData, target_population: e.target.value})}
              placeholder="e.g., Justice-involved individuals in Iowa"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Project Focus *</label>
            <Textarea
              value={formData.project_focus}
              onChange={(e) => setFormData({...formData, project_focus: e.target.value})}
              placeholder="What services/programs will grant funds support?"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Specific Goals (Optional)</label>
            <Textarea
              value={formData.specific_goals}
              onChange={(e) => setFormData({...formData, specific_goals: e.target.value})}
              placeholder="Any specific measurable goals? (e.g., serve 100 participants, reduce recidivism by 20%)"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Funding Amount Needed *</label>
            <Input
              type="number"
              value={formData.funding_amount}
              onChange={(e) => setFormData({...formData, funding_amount: e.target.value})}
              placeholder="500000"
            />
          </div>

          <Button
            onClick={handleBrainstorm}
            disabled={isGenerating || !formData.organization_name || !formData.mission}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Developing strategy...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Strategic Analysis
              </>
            )}
          </Button>
        </div>
      </GraceCard>

      {brainstormNotes && (
        <GraceCard>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Strategic Analysis Complete
          </h4>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-6">
            {brainstormNotes}
          </div>
          <Button
            onClick={() => onGenerate(formData, brainstormNotes, selectedGrantmaker)}
            className="w-full bg-teal-600 hover:bg-teal-700"
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
  const [activeSection, setActiveSection] = useState('executive_summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const currentSection = proposalSections.find(s => s.key === activeSection);

  const generateSectionContent = async () => {
    setIsGenerating(true);
    try {
      const sectionPrompts = {
        executive_summary: `You are an EXPERT GRANT WRITER crafting an Executive Summary.

ORGANIZATION: ${proposal.organization_info?.name || 'Organization'}
MISSION: ${proposal.organization_info?.mission || 'Not provided'}
TARGET POPULATION: ${proposal.organization_info?.target_population || 'Not provided'}
FUNDER: ${proposal.funder}
GRANT TYPE: ${proposal.grant_type}
FUNDING REQUESTED: $${proposal.funding_amount_requested?.toLocaleString()}

BRAINSTORM NOTES:
${proposal.ai_brainstorm_notes || 'No brainstorm notes available'}

CUSTOM INSTRUCTIONS: ${customPrompt || 'None'}

REQUIREMENTS:
1. Lead with your STRONGEST statistic or data hook in the first sentence
2. Align explicitly to funder priorities (${proposal.grant_type === 'federal' ? 'federal evidence-based practices' : 'community impact'})
3. Be concise (300-400 words MAX)
4. Include: problem statement, proposed solution, target outcomes, funding request
5. Use compelling, action-oriented language
6. End with impact statement

Generate a professional Executive Summary following these requirements. Make it copy-paste ready.`,

        statement_of_need: `You are an EXPERT GRANT WRITER crafting a Statement of Need.

ORGANIZATION: ${proposal.organization_info?.name || 'Organization'}
TARGET POPULATION: ${proposal.organization_info?.target_population || 'Not provided'}
FUNDER: ${proposal.funder}

BRAINSTORM NOTES:
${proposal.ai_brainstorm_notes || 'No brainstorm notes available'}

CUSTOM INSTRUCTIONS: ${customPrompt || 'None'}

REQUIREMENTS:
1. Build data-driven narrative using Iowa/local statistics
2. Identify specific service gaps in the community
3. Problem-solve for evidence gaps (cite expert interviews, pilot data, or comparable communities)
4. Use person-first language always
5. Connect need to your organization's unique position to address it
6. Include: prevalence data, current service gaps, barriers to access, consequences of unmet need
7. Length: 500-700 words

Generate a professional Statement of Need. Use specific Iowa statistics where possible. Make it copy-paste ready.`,

        goals_objectives: `You are an EXPERT GRANT WRITER crafting Goals & Objectives.

PROJECT FOCUS: Based on brainstorm notes below
FUNDER: ${proposal.funder}

BRAINSTORM NOTES:
${proposal.ai_brainstorm_notes || 'No brainstorm notes available'}

CUSTOM INSTRUCTIONS: ${customPrompt || 'None'}

REQUIREMENTS:
1. Develop 3-5 SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound)
2. Strategic alignment to funder outcomes (retention, ROI, population health)
3. Use action verbs (increase, reduce, improve, establish, train, connect)
4. Specify: target numbers, timeframes, measurable indicators
5. Show logic model connection (inputs → activities → outputs → outcomes)
6. Format: Goal 1: [statement], Objectives: 1.1, 1.2, etc.

Generate professional Goals & Objectives. Make it copy-paste ready with clear numbering.`,

        implementation_plan: `You are an EXPERT GRANT WRITER crafting an Implementation Plan.

PROJECT: Based on brainstorm notes
TIMELINE: ${proposal.project_duration_months || 12} months

BRAINSTORM NOTES:
${proposal.ai_brainstorm_notes || 'No brainstorm notes available'}

CUSTOM INSTRUCTIONS: ${customPrompt || 'None'}

REQUIREMENTS:
1. Outline phased timeline (startup, implementation, sustainability phases)
2. Include risk mitigation strategies for each phase
3. Show collaborative contingencies (what if staff leaves, enrollment is slow, etc.)
4. Demonstrate realistic planning with milestones
5. Specify: activities, responsible parties, timelines, deliverables
6. Include staffing plan and key partnerships
7. Format as timeline or phase breakdown

Generate a professional Implementation Plan showing you have a realistic, well-thought-out approach. Make it copy-paste ready.`,

        evaluation_plan: `You are an EXPERT GRANT WRITER crafting an Evaluation Plan.

PROJECT: Based on brainstorm notes
FUNDER: ${proposal.funder}

BRAINSTORM NOTES:
${proposal.ai_brainstorm_notes || 'No brainstorm notes available'}

CUSTOM INSTRUCTIONS: ${customPrompt || 'None'}

REQUIREMENTS:
1. Design metrics/tools (BARC-10 for recovery capital, GPRA for SAMHSA grants, retention rates)
2. Specify: WHO collects data, WHAT tools are used, WHEN/HOW OFTEN data is collected
3. Problem-solve data collection challenges (low literacy? use interviews; retention? use incentives)
4. Include process AND outcome evaluation
5. Show data will inform continuous improvement
6. Specify analysis plan and reporting schedule
7. Length: 400-500 words

Generate a professional Evaluation Plan with specific tools and protocols. Make it copy-paste ready.`,

        budget_narrative: `You are an EXPERT GRANT WRITER crafting a Budget Narrative.

TOTAL BUDGET: $${proposal.funding_amount_requested?.toLocaleString()}
PROJECT: Based on brainstorm notes

BRAINSTORM NOTES:
${proposal.ai_brainstorm_notes || 'No brainstorm notes available'}

CUSTOM INSTRUCTIONS: ${customPrompt || 'None'}

REQUIREMENTS:
1. Justify each major cost category with efficiency strategies
2. Show value-for-money analysis (e.g., "peer coach salary $45K serves 75 participants = $600/participant")
3. Calculate and highlight cost per participant/outcome
4. Explain any unusual or large expenses
5. Show matching funds or cost-sharing if applicable
6. Categories typically: Personnel, Fringe, Travel, Equipment, Supplies, Contractual, Other
7. Be specific about FTE percentages and hourly rates

Generate a professional Budget Narrative that justifies costs strategically. Make it copy-paste ready.`,

        organizational_capacity: `You are an EXPERT GRANT WRITER crafting Organizational Capacity section.

ORGANIZATION: ${proposal.organization_info?.name || 'Organization'}
MISSION: ${proposal.organization_info?.mission || 'Not provided'}

BRAINSTORM NOTES:
${proposal.ai_brainstorm_notes || 'No brainstorm notes available'}

CUSTOM INSTRUCTIONS: ${customPrompt || 'None'}

REQUIREMENTS:
1. Highlight past successes with specific metrics (e.g., "served 500 participants with 85% retention")
2. Show organizational track record and credibility
3. Describe staff qualifications (lived experience, certifications, years in field)
4. Include goal-oriented capacity-building plans (e.g., "will hire evaluation coordinator in Month 2")
5. Demonstrate cultural competence and community connections
6. Show financial stability and governance structure
7. Length: 400-500 words

Generate a professional Organizational Capacity section that builds funder confidence. Make it copy-paste ready.`,

        sustainability_plan: `You are an EXPERT GRANT WRITER crafting a Sustainability Plan.

PROJECT: Based on brainstorm notes
CURRENT FUNDING: Grant request for $${proposal.funding_amount_requested?.toLocaleString()}

BRAINSTORM NOTES:
${proposal.ai_brainstorm_notes || 'No brainstorm notes available'}

CUSTOM INSTRUCTIONS: ${customPrompt || 'None'}

REQUIREMENTS:
1. Create diversified funding roadmap (list 3-5 specific future funders)
2. Show long-term viability strategies (fee-for-service, partnerships, cost reduction)
3. Demonstrate this is NOT one-time funding
4. Include: timeline for pursuing additional funding, plans to institutionalize successful practices
5. Show how pilot/program will be integrated into ongoing operations
6. Specify which components will continue and how
7. Length: 300-400 words

Generate a professional Sustainability Plan that shows long-term thinking. Make it copy-paste ready.`
      };

      const prompt = sectionPrompts[activeSection];
      if (!prompt) {
        alert('No prompt defined for this section yet.');
        return;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setContent({...content, [activeSection]: response});
      setCustomPrompt('');
    } catch (error) {
      alert('Error generating content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{proposal?.title}</h2>
          <div className="flex items-center gap-3 mt-2">
            <Badge className="bg-purple-100 text-purple-700">{proposal?.grant_type}</Badge>
            <Badge variant="outline">{proposal?.status}</Badge>
            <span className="text-sm text-gray-500">Version {proposal?.version || 1}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditMode(!editMode)}>
            {editMode ? <Eye className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
            {editMode ? 'Preview' : 'Edit'}
          </Button>
          <Button onClick={() => onSave(content)} className="bg-teal-600">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          {proposalSections.map(section => (
            <TabsTrigger key={section.key} value={section.key} className="text-xs">
              {section.label.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {proposalSections.map(section => (
          <TabsContent key={section.key} value={section.key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-purple-600" />
                  {section.label}
                </CardTitle>
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Strategy:</strong> {section.strategy}</span>
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-4">
                    {/* AI Generation Section */}
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h5 className="font-semibold text-purple-900">Generate with AI</h5>
                      </div>
                      <p className="text-sm text-purple-800 mb-3">
                        AI Grace will generate professional, copy-paste ready content following best practices for this section.
                      </p>
                      <textarea
                        placeholder="Optional: Add custom instructions or specific details you want included..."
                        value={activeSection === section.key ? customPrompt : ''}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm mb-3"
                      />
                      <Button
                        onClick={generateSectionContent}
                        disabled={isGenerating}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating professional content...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate {section.label}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Content Editor */}
                    <Textarea
                      value={content[section.key] || ''}
                      onChange={(e) => setContent({...content, [section.key]: e.target.value})}
                      rows={15}
                      className="font-mono text-sm"
                      placeholder={`Generated content will appear here. You can edit it before saving.`}
                    />
                  </div>
                ) : (
                  <div className="prose max-w-none whitespace-pre-wrap">
                    {content[section.key] || `No content yet. Click Edit to generate or add ${section.label} content.`}
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
  const [mode, setMode] = useState('browse');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedGrantmaker, setSelectedGrantmaker] = useState(null);
  const [grantWritingMode, setGrantWritingMode] = useState(false);
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

  const handleStartBrainstorm = (formData, notes, grantmaker) => {
    createProposal.mutate({
      title: `${grantmaker?.name || 'Grant Proposal'} - ${formData.organization_name}`,
      funder: grantmaker?.name || 'TBD',
      grant_type: grantmaker?.type.includes('Federal') ? 'federal' : 
                  grantmaker?.type.includes('State') ? 'state' : 'local',
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
          title="Grant Writing Station"
          subtitle="AI-powered grant development with expert strategic planning, goal identification, and collaborative problem-solving."
          icon={FileText}
        />

        {/* Grant Writing Mode Toggle */}
        <GraceCard gradient className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Grace Professional Grant Writer Mode</h3>
                <p className="text-sm text-gray-600">
                  {grantWritingMode 
                    ? '✓ Active - AI Grace is in expert grant writer persona' 
                    : 'Activate to transform AI Grace into a professional grant writer'}
                </p>
              </div>
            </div>
            <Switch
              checked={grantWritingMode}
              onCheckedChange={setGrantWritingMode}
            />
          </div>
          {grantWritingMode && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900">
                💡 <strong>Grant Writing Mode Active:</strong> Chat with AI Grace using the widget below for expert guidance on any grant section. 
                She will use strategic planning, identify goals, and help solve problems collaboratively.
              </p>
            </div>
          )}
        </GraceCard>

        {mode === 'browse' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grantmaker Browser */}
            <div className="lg:col-span-1">
              <GrantmakerBrowser 
                onSelect={setSelectedGrantmaker}
                selectedGrantmaker={selectedGrantmaker}
              />
            </div>

            {/* Proposals List */}
            <div className="lg:col-span-2 space-y-6">
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
                  <p className="text-gray-500 mt-1 mb-4">
                    Select a grantmaker and start strategic planning with AI Grace
                  </p>
                  <Button onClick={() => setMode('brainstorm')} className="bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Planning
                  </Button>
                </GraceCard>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {proposals.map((proposal) => (
                    <motion.div
                      key={proposal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
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
                              <h4 className="font-semibold text-gray-900">{proposal.title}</h4>
                              <p className="text-sm text-gray-500">
                                {new Date(proposal.created_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className="bg-purple-100 text-purple-700">{proposal.grant_type}</Badge>
                            <Badge variant="outline">{proposal.status}</Badge>
                            {proposal.funding_amount_requested > 0 && (
                              <Badge className="bg-teal-100 text-teal-700">
                                ${(proposal.funding_amount_requested / 1000)}K
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {mode === 'brainstorm' && (
          <div>
            <Button variant="ghost" onClick={() => setMode('browse')} className="mb-4">
              ← Back to Proposals
            </Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <GrantmakerBrowser 
                  onSelect={setSelectedGrantmaker}
                  selectedGrantmaker={selectedGrantmaker}
                />
              </div>
              <div className="lg:col-span-2">
                <BrainstormMode 
                  onGenerate={handleStartBrainstorm}
                  selectedGrantmaker={selectedGrantmaker}
                />
              </div>
            </div>
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