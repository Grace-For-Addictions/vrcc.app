import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.user_role !== 'administrator')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Gather comprehensive program data
    const [
      anchorCases, surveys, coachingSessions, gfaPlans, 
      events, preventionMetrics, narcanLogs, assessments
    ] = await Promise.all([
      base44.asServiceRole.entities.ANCHORCase.list('-updated_date', 500),
      base44.asServiceRole.entities.PostSessionSurvey.list('-survey_completed_date', 500),
      base44.asServiceRole.entities.CoachingSessionLog.list('-session_date', 500),
      base44.asServiceRole.entities.GFAPlan.list('-updated_date', 500),
      base44.asServiceRole.entities.Event.list('-start_time', 200),
      base44.asServiceRole.entities.PreventionCampaignMetrics.list('-campaign_date', 200),
      base44.asServiceRole.entities.NarcanLog.list('-distribution_date', 300),
      base44.asServiceRole.entities.Assessment.list('-created_date', 1000)
    ]);

    // Program effectiveness calculations
    const programs = {
      anchor: {
        participants: anchorCases.length,
        recidivism_rate: anchorCases.length > 0 
          ? ((anchorCases.filter(c => c.anchor_status === 'recidivism').length / anchorCases.length) * 100).toFixed(1)
          : 0,
        employment_rate: anchorCases.length > 0
          ? ((anchorCases.filter(c => c.employment_secured).length / anchorCases.length) * 100).toFixed(1)
          : 0,
        housing_rate: anchorCases.length > 0
          ? ((anchorCases.filter(c => c.housing_secured).length / anchorCases.length) * 100).toFixed(1)
          : 0
      },
      peer_coaching: {
        sessions: coachingSessions.length,
        avg_satisfaction: surveys.filter(s => s.session_type === 'peer_coaching').length > 0
          ? (surveys.filter(s => s.session_type === 'peer_coaching')
              .reduce((sum, s) => sum + (s.satisfaction_score || 0), 0) / 
             surveys.filter(s => s.session_type === 'peer_coaching').length).toFixed(1)
          : 0,
        avg_qol_impact: surveys.filter(s => s.session_type === 'peer_coaching').length > 0
          ? (surveys.filter(s => s.session_type === 'peer_coaching')
              .reduce((sum, s) => sum + (s.quality_of_life_impact || 0), 0) / 
             surveys.filter(s => s.session_type === 'peer_coaching').length).toFixed(1)
          : 0
      },
      gfa_plans: {
        active_plans: gfaPlans.filter(p => p.is_active).length,
        avg_sections_completed: gfaPlans.length > 0
          ? (gfaPlans.reduce((sum, p) => sum + (p.sections_completed || 0), 0) / gfaPlans.length).toFixed(1)
          : 0,
        tracking_opt_in_rate: gfaPlans.length > 0
          ? ((gfaPlans.filter(p => p.opt_in_tracking).length / gfaPlans.length) * 100).toFixed(1)
          : 0
      },
      prevention: {
        total_reach: preventionMetrics.reduce((sum, m) => sum + (m.reach_count || 0), 0),
        avg_stigma_reduction: preventionMetrics.filter(m => m.pre_survey_stigma_score && m.post_survey_stigma_score)
          .reduce((sum, m, _, arr) => sum + ((m.pre_survey_stigma_score - m.post_survey_stigma_score) / arr.length), 0)
      },
      harm_reduction: {
        narcan_distributed: narcanLogs.reduce((sum, n) => sum + (n.kits_distributed || 0), 0),
        reversals: narcanLogs.reduce((sum, n) => sum + (n.reversals_reported || 0), 0)
      }
    };

    // AI effectiveness analysis
    const analysisPrompt = `You are GFA's "Program Effectiveness Analyst" AI agent.

PROGRAM PERFORMANCE DATA:

ANCHOR (Justice-Involved Reentry):
- Participants: ${programs.anchor.participants}
- Recidivism rate: ${programs.anchor.recidivism_rate}%
- Employment secured: ${programs.anchor.employment_rate}%
- Housing secured: ${programs.anchor.housing_rate}%

PEER COACHING:
- Sessions: ${programs.peer_coaching.sessions}
- Satisfaction: ${programs.peer_coaching.avg_satisfaction}/5
- QOL impact: ${programs.peer_coaching.avg_qol_impact}/5

GFA PLANS:
- Active plans: ${programs.gfa_plans.active_plans}
- Avg sections completed: ${programs.gfa_plans.avg_sections_completed}/5
- Tracking opt-in: ${programs.gfa_plans.tracking_opt_in_rate}%

PREVENTION:
- Total reach: ${programs.prevention.total_reach} people
- Stigma reduction: ${programs.prevention.avg_stigma_reduction.toFixed(1)} points

HARM REDUCTION:
- Narcan distributed: ${programs.harm_reduction.narcan_distributed} kits
- Reversals reported: ${programs.harm_reduction.reversals}

ANALYZE:
1. Program strengths (what's working well)
2. Weaknesses & gaps (what needs improvement)
3. AI optimization recommendations
4. Resource allocation suggestions
5. Future campaign strategy insights

Be data-driven and actionable.`;

    const effectiveness = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          program_strengths: { type: "array", items: { type: "string" } },
          program_weaknesses: { type: "array", items: { type: "string" } },
          optimization_recommendations: { type: "array", items: { type: "string" } },
          resource_allocation_suggestions: { type: "array", items: { type: "string" } },
          campaign_strategy_insights: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({ 
      success: true,
      program_metrics: programs,
      ai_analysis: effectiveness
    });

  } catch (error) {
    console.error('Error analyzing program effectiveness:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});