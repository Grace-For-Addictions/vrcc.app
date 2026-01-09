import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Save, Loader2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function SessionEntryForm({ user }) {
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_email: '',
    activity_date: new Date().toISOString().split('T')[0],
    operating_program: '',
    activity_location: '',
    activity_type: '',
    activity_channel: '',
    activity_notes: '',
    attendance: 'Yes (Completed)',
    referral_made: false,
    referral_type: '',
    referral_status: '',
    warm_handoff: false,
    goal_set: false,
    personal_goal: '',
    personal_affirmation: '',
    days_in_recovery: '',
    coach_name: user.full_name,
    strengths: [],
    areas_for_improvement: []
  });

  const [aiProcessing, setAiProcessing] = useState(false);
  const queryClient = useQueryClient();

  const saveSession = useMutation({
    mutationFn: (data) => base44.entities.CoachingSessionLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coachingSessions']);
      toast.success('Session logged successfully!');
      // Reset form
      setFormData({
        ...formData,
        contact_name: '',
        contact_email: '',
        activity_notes: '',
        referral_type: '',
        personal_goal: '',
        personal_affirmation: ''
      });
    }
  });

  const generateAISummary = async () => {
    if (!formData.activity_notes) {
      toast.error('Please add activity notes first');
      return;
    }

    setAiProcessing(true);
    try {
      const aiSummary = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this peer recovery coaching session with trauma-informed, person-first language. Session notes:

"${formData.activity_notes}"

Participant: ${formData.contact_name}
Days in Recovery: ${formData.days_in_recovery || 'Not specified'}

Provide comprehensive analysis:
1. Session overview (2-3 sentences)
2. Key themes and discussion points
3. Identified strengths (be specific and empowering)
4. Areas for growth (gentle, strength-based framing)
5. Personalized affirmation based on their journey
6. Specific action items for next steps
7. Any crisis indicators or concerns requiring follow-up

Use person-first, stigma-free language. Be warm and encouraging.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_themes: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            growth_areas: { type: "array", items: { type: "string" } },
            affirmation: { type: "string" },
            action_items: { type: "array", items: { type: "string" } },
            concerns: { type: "string" }
          }
        }
      });

      const formattedSummary = `
SUMMARY: ${aiSummary.summary}

KEY THEMES:
${aiSummary.key_themes.map((t, i) => `${i + 1}. ${t}`).join('\n')}

STRENGTHS IDENTIFIED:
${aiSummary.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

AREAS FOR GROWTH:
${aiSummary.growth_areas.map((g, i) => `${i + 1}. ${g}`).join('\n')}

PERSONALIZED AFFIRMATION:
"${aiSummary.affirmation}"

ACTION ITEMS:
${aiSummary.action_items.map((a, i) => `${i + 1}. ${a}`).join('\n')}

${aiSummary.concerns ? `FOLLOW-UP NEEDED: ${aiSummary.concerns}` : ''}
      `.trim();

      setFormData({ 
        ...formData, 
        ai_generated_summary: formattedSummary,
        personal_affirmation: aiSummary.affirmation,
        strengths: aiSummary.strengths,
        areas_for_improvement: aiSummary.growth_areas
      });
      toast.success('AI analysis complete!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setAiProcessing(false);
    }
  };

  const suggestReferrals = async () => {
    if (!formData.activity_notes) {
      toast.error('Please add activity notes first');
      return;
    }

    setAiProcessing(true);
    try {
      // Fetch emergency resources from database
      const emergencyResources = await base44.entities.EmergencyResource.list('-created_date', 50);
      const regularResources = await base44.entities.Resource.list('-created_date', 100);

      const suggestions = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this coaching session and provide comprehensive resource suggestions:

Session Notes: "${formData.activity_notes}"
Participant: ${formData.contact_name}
Days in Recovery: ${formData.days_in_recovery || 'Not specified'}

Available Emergency Resources:
${emergencyResources.map(r => `- ${r.title} (${r.resource_type}): ${r.description}`).join('\n')}

Available Regular Resources (top 20):
${regularResources.slice(0, 20).map(r => `- ${r.name} (${r.category}): ${r.description || ''}`).join('\n')}

Provide:
1. Top 3 referral types based on identified needs
2. For each, match to ACTUAL resources from the lists above (use exact names)
3. Suggest specific recovery goals based on session content
4. Identify any crisis indicators that need EmergencyResource suggestions
5. Suggest recovery milestones to celebrate

Consider housing, employment, mental health, legal, family, healthcare, crisis support needs.`,
        response_json_schema: {
          type: "object",
          properties: {
            referral_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  referral_type: { type: "string" },
                  matched_resource: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            },
            suggested_goals: { type: "array", items: { type: "string" } },
            recovery_milestones: { type: "array", items: { type: "string" } },
            emergency_needs: { type: "array", items: { type: "string" } },
            recurring_themes: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Auto-populate goal field if suggested
      if (suggestions.suggested_goals?.length > 0 && !formData.personal_goal) {
        setFormData({
          ...formData,
          personal_goal: suggestions.suggested_goals[0],
          goal_set: true
        });
      }

      const message = `🔍 AI Resource & Goal Analysis:\n\n` +
        `SUGGESTED REFERRALS:\n` +
        suggestions.referral_suggestions.map((s, i) => 
          `${i + 1}. ${s.referral_type}\n   Resource: ${s.matched_resource}\n   Why: ${s.rationale}`
        ).join('\n\n') +
        (suggestions.suggested_goals?.length > 0 ? `\n\n📋 SUGGESTED GOALS:\n${suggestions.suggested_goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : '') +
        (suggestions.recovery_milestones?.length > 0 ? `\n\n🎉 MILESTONES TO CELEBRATE:\n${suggestions.recovery_milestones.map((m, i) => `• ${m}`).join('\n')}` : '') +
        (suggestions.emergency_needs?.length > 0 ? `\n\n⚠️ CRISIS SUPPORT NEEDED:\n${suggestions.emergency_needs.map((e, i) => `• ${e}`).join('\n')}` : '') +
        `\n\n💡 RECURRING THEMES:\n` +
        suggestions.recurring_themes.map((t, i) => `• ${t}`).join('\n');

      alert(message);
      toast.success('Goal auto-filled from AI suggestion!');
    } catch (error) {
      toast.error('Failed to generate suggestions');
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveSession.mutate(formData);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Participant Info */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Participant Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Contact Name *</Label>
            <Input
              value={formData.contact_name}
              onChange={(e) => updateField('contact_name', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input
              type="email"
              value={formData.contact_email}
              onChange={(e) => updateField('contact_email', e.target.value)}
            />
          </div>
          <div>
            <Label>Activity Date *</Label>
            <Input
              type="date"
              value={formData.activity_date}
              onChange={(e) => updateField('activity_date', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Days in Recovery</Label>
            <Input
              type="number"
              value={formData.days_in_recovery}
              onChange={(e) => updateField('days_in_recovery', e.target.value)}
            />
          </div>
        </div>
      </GraceCard>

      {/* Activity Details */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Operating Program</Label>
            <Select value={formData.operating_program} onValueChange={(v) => updateField('operating_program', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GFA Virtual RCC (Resource Nav./Coaching/Check-In)">GFA Virtual RCC</SelectItem>
                <SelectItem value="GFA Mobile RCC (Rural/Resource Nav./Coaching/GFARC)">GFA Mobile RCC</SelectItem>
                <SelectItem value="GFA Sober Living">GFA Sober Living</SelectItem>
                <SelectItem value="JUST GRACE">JUST GRACE</SelectItem>
                <SelectItem value="ANCHOR (Resource Nav./Coaching/Check-In)">ANCHOR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Activity Type *</Label>
            <Select value={formData.activity_type} onValueChange={(v) => updateField('activity_type', v)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Recovery Coaching">Recovery Coaching</SelectItem>
                <SelectItem value="Resource Navigation">Resource Navigation</SelectItem>
                <SelectItem value="Life Coaching">Life Coaching</SelectItem>
                <SelectItem value="Peer Support">Peer Support</SelectItem>
                <SelectItem value="Re-entry Coaching">Re-entry Coaching</SelectItem>
                <SelectItem value="Mental Health Coaching">Mental Health Coaching</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Activity Channel</Label>
            <Select value={formData.activity_channel} onValueChange={(v) => updateField('activity_channel', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In-Person">In-Person</SelectItem>
                <SelectItem value="Video/Virtual">Video/Virtual</SelectItem>
                <SelectItem value="Phone">Phone</SelectItem>
                <SelectItem value="Text">Text</SelectItem>
                <SelectItem value="515-310-DIAL">515-310-DIAL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Activity Location</Label>
            <Select value={formData.activity_location} onValueChange={(v) => updateField('activity_location', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In-Office">In-Office</SelectItem>
                <SelectItem value="Field/Community">Field/Community</SelectItem>
                <SelectItem value="Online/Remote">Online/Remote</SelectItem>
                <SelectItem value="Client Home">Client Home</SelectItem>
                <SelectItem value="Phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GraceCard>

      {/* Session Notes with AI */}
      <GraceCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Session Notes</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={suggestReferrals}
              disabled={aiProcessing}
            >
              {aiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
              Suggest Referrals
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateAISummary}
              disabled={aiProcessing}
            >
              {aiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Summary
            </Button>
          </div>
        </div>
        <Textarea
          rows={8}
          placeholder="Document what happened during the session, supports provided, participant responses, and any next steps..."
          value={formData.activity_notes}
          onChange={(e) => updateField('activity_notes', e.target.value)}
        />
        {formData.ai_generated_summary && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm font-semibold text-purple-900 mb-2">AI-Generated Summary:</p>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{formData.ai_generated_summary}</pre>
          </div>
        )}
      </GraceCard>

      {/* Referral Section */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Information</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.referral_made}
              onCheckedChange={(checked) => updateField('referral_made', checked)}
            />
            <Label>Was a referral made?</Label>
          </div>
          {formData.referral_made && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <Label>Referral Type</Label>
                <Input
                  value={formData.referral_type}
                  onChange={(e) => updateField('referral_type', e.target.value)}
                  placeholder="e.g., Housing Assistance, Mental Health Counseling"
                />
              </div>
              <div>
                <Label>Referral Status</Label>
                <Select value={formData.referral_status} onValueChange={(v) => updateField('referral_status', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Referred">Referred</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Attended">Attended</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.warm_handoff}
                  onCheckedChange={(checked) => updateField('warm_handoff', checked)}
                />
                <Label>Warm hand-off completed</Label>
              </div>
            </div>
          )}
        </div>
      </GraceCard>

      {/* Goals & Affirmations */}
      <GraceCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals & Affirmations</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.goal_set}
              onCheckedChange={(checked) => updateField('goal_set', checked)}
            />
            <Label>Personal goal set during session</Label>
          </div>
          {formData.goal_set && (
            <div className="grid grid-cols-1 gap-4 ml-6">
              <div>
                <Label>Personal Goal</Label>
                <Input
                  value={formData.personal_goal}
                  onChange={(e) => updateField('personal_goal', e.target.value)}
                  placeholder="What goal did the participant set?"
                />
              </div>
            </div>
          )}
          <div>
            <Label>Personal Affirmation</Label>
            <Input
              value={formData.personal_affirmation}
              onChange={(e) => updateField('personal_affirmation', e.target.value)}
              placeholder="Any affirmation shared or discussed"
            />
          </div>
        </div>
      </GraceCard>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit" disabled={saveSession.isPending} className="bg-blue-600 hover:bg-blue-700">
          {saveSession.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Session
            </>
          )}
        </Button>
      </div>
    </form>
  );
}