import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.user_role !== 'administrator')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { grant_opportunity_id, report_type } = await req.json();

    // Fetch grant opportunity and related funder
    const opportunity = await base44.asServiceRole.entities.GrantOpportunity.filter({ 
      id: grant_opportunity_id 
    }).then(o => o[0]);
    
    if (!opportunity) {
      return Response.json({ error: 'Grant not found' }, { status: 404 });
    }

    const funder = await base44.asServiceRole.entities.FunderRelationship.filter({ 
      funder_name: opportunity.funder_name 
    }).then(f => f[0]).catch(() => null);

    // Gather comprehensive impact data
    const [profiles, assessments, anchorCases, narcanLogs, surveys, gfaPlans, preventionMetrics] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.list('-created_date', 1000),
      base44.asServiceRole.entities.Assessment.list('-created_date', 1000),
      base44.asServiceRole.entities.ANCHORCase.list('-created_date', 500),
      base44.asServiceRole.entities.NarcanLog.list('-created_date', 500),
      base44.asServiceRole.entities.PostSessionSurvey.list('-survey_completed_date', 500),
      base44.asServiceRole.entities.GFAPlan.list('-updated_date', 500),
      base44.asServiceRole.entities.PreventionCampaignMetrics.list('-campaign_date', 200)
    ]);

    // Calculate key metrics
    const totalParticipants = profiles.length;
    const avgRecoveryCapital = assessments.length > 0 
      ? (assessments.reduce((sum, a) => sum + (a.total_score || 0), 0) / assessments.length).toFixed(1)
      : 0;
    
    const recidivismRate = anchorCases.length > 0
      ? ((anchorCases.filter(c => c.anchor_status === 'recidivism').length / anchorCases.length) * 100).toFixed(1)
      : 0;
    
    const avgQOL = surveys.length > 0
      ? (surveys.reduce((sum, s) => sum + (s.quality_of_life_impact || 0), 0) / surveys.length).toFixed(1)
      : 0;

    const narcanReversals = narcanLogs.reduce((sum, n) => sum + (n.reversals_reported || 0), 0);
    const preventionReach = preventionMetrics.reduce((sum, p) => sum + (p.reach_count || 0), 0);
    const avgStigmaReduction = preventionMetrics.filter(p => p.pre_survey_stigma_score && p.post_survey_stigma_score)
      .reduce((sum, p, _, arr) => sum + ((p.pre_survey_stigma_score - p.post_survey_stigma_score) / arr.length), 0);

    // AI-powered report generation
    const reportPrompt = `You are GFA's "Grant Reporting Architect" AI agent.

GRANT: ${opportunity.grant_name}
FUNDER: ${opportunity.funder_name}
REPORT TYPE: ${report_type} (interim or final)

ORIGINAL GRANT PROPOSAL PROMISES:
${opportunity.auto_drafted_proposal || 'See metrics_highlighted for key commitments'}
Metrics highlighted: ${opportunity.metrics_highlighted?.join(', ')}

ACTUAL IMPACT DATA (CURRENT):
- Total Participants Served: ${totalParticipants}
- Average Recovery Capital (BARC-10): ${avgRecoveryCapital}/50
- Recidivism Rate: ${recidivismRate}%
- Quality of Life Improvement: ${avgQOL}/5
- Overdose Reversals (Narcan): ${narcanReversals}
- Prevention Campaign Reach: ${preventionReach} people
- Stigma Reduction: ${avgStigmaReduction.toFixed(1)} points (0-10 scale)

FUNDER PREFERENCES:
${funder?.preferred_language_keywords?.join(', ') || 'Use evidence-based, outcome-focused language'}

COMMUNICATION INSIGHTS:
${funder?.ai_success_analysis || 'This funder values measurable outcomes and community impact'}

GENERATE ${report_type.toUpperCase()} GRANT REPORT:

1. Executive Summary (progress toward grant goals)
2. Outcomes Achieved vs. Promised
   - Compare actual metrics to proposal commitments
   - Celebrate wins, explain variances transparently
3. Program Narrative (what happened during grant period)
   - Use funder's preferred language
   - Include participant stories (anonymized)
4. Challenges & Adaptations
5. Financial Report Summary (spent vs. budgeted)
6. Next Steps / Continuation Plan (for interim) OR Sustainability Plan (for final)

TONE: Professional, data-driven, aligned with funder values. Use their preferred keywords naturally.

LENGTH: 1000-1500 words.`;

    const report = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: reportPrompt,
      add_context_from_internet: false
    });

    // Save report
    await base44.asServiceRole.entities.CustomReport.create({
      report_name: `${report_type} Report - ${opportunity.grant_name}`,
      report_type: 'grant_report',
      generated_by: user.email,
      report_data: {
        grant_opportunity_id,
        report_type,
        report_content: report,
        metrics_used: {
          totalParticipants,
          avgRecoveryCapital,
          recidivismRate,
          avgQOL,
          narcanReversals,
          preventionReach,
          avgStigmaReduction
        },
        generated_date: new Date().toISOString()
      }
    });

    return Response.json({ 
      success: true,
      report,
      metrics_comparison: {
        promised: opportunity.metrics_highlighted,
        actual: {
          totalParticipants,
          avgRecoveryCapital,
          recidivismRate,
          avgQOL,
          narcanReversals,
          preventionReach
        }
      }
    });

  } catch (error) {
    console.error('Error generating grant report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});