import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.user_role !== 'administrator')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { grant_opportunity_id } = await req.json();

    // Fetch grant opportunity
    const opportunity = await base44.asServiceRole.entities.GrantOpportunity.filter({ id: grant_opportunity_id }).then(r => r[0]);
    
    if (!opportunity) {
      return Response.json({ error: 'Grant opportunity not found' }, { status: 404 });
    }

    // Fetch aggregated, anonymized impact data
    const [allProfiles, allAssessments, allANCHOR, allNarcan, allSurveys, allGFAPlans, allPreventionMetrics] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.list('-created_date', 1000),
      base44.asServiceRole.entities.Assessment.list('-created_date', 1000),
      base44.asServiceRole.entities.ANCHORCase.list('-created_date', 500),
      base44.asServiceRole.entities.NarcanLog.list('-created_date', 500),
      base44.asServiceRole.entities.PostSessionSurvey.list('-survey_completed_date', 500),
      base44.asServiceRole.entities.GFAPlan.list('-updated_date', 500),
      base44.asServiceRole.entities.PreventionCampaignMetrics.list('-campaign_date', 200)
    ]);

    // Calculate key metrics
    const totalParticipants = allProfiles.length;
    const avgRecoveryCapital = allAssessments.length > 0 
      ? (allAssessments.reduce((sum, a) => sum + (a.total_score || 0), 0) / allAssessments.length).toFixed(1)
      : 0;
    
    const recidivismRate = allANCHOR.length > 0
      ? ((allANCHOR.filter(c => c.anchor_status === 'recidivism').length / allANCHOR.length) * 100).toFixed(1)
      : 0;
    
    const avgQOL = allSurveys.length > 0
      ? (allSurveys.reduce((sum, s) => sum + (s.quality_of_life_impact || 0), 0) / allSurveys.length).toFixed(1)
      : 0;

    const narcanReversals = allNarcan.reduce((sum, n) => sum + (n.reversals_reported || 0), 0);
    const preventionReach = allPreventionMetrics.reduce((sum, p) => sum + (p.reach_count || 0), 0);

    // Generate tailored proposal
    const prompt = `You are the "Neuroplasticity & Grant Architect" AI agent for Grace For Addictions. Generate a compelling grant proposal.

FUNDER: ${opportunity.funder_name}
GRANT: ${opportunity.grant_name}
STRATEGIC ALIGNMENT: ${opportunity.strategic_alignment.join(', ')}
PRIORITY KEYWORDS: ${opportunity.priority_keywords.join(', ')}

AGGREGATED IMPACT DATA (ANONYMIZED):
- Total Participants Served: ${totalParticipants}
- Average Recovery Capital (BARC-10): ${avgRecoveryCapital}/50
- Recidivism Rate: ${recidivismRate}%
- Quality of Life Improvement: ${avgQOL}/5
- Overdose Reversals (Narcan): ${narcanReversals}
- Prevention Campaign Reach: ${preventionReach} people

REQUIRED LANGUAGE FOR POLK COUNTY 5 POINTS OF PROGRESS:
- "Fulfilling Basic Needs" (housing, employment, healthcare)
- "Impactful Collaboration" (closed-loop referrals, MRCC partnerships)
- "Healthy Community" (peer support, stigma reduction)
- "Investments in Health Care Infrastructure" (MRCC tech hubs, telehealth kiosks)
- "Preventative Approaches" (school education, Narcan distribution)

NEUROPLASTICITY CLINICAL LANGUAGE:
- "Structural and functional recovery" of brain circuitry
- "Therapeutic substrate" - peer support as neurobiological foundation
- "Modulating brain reward circuits" through community connection
- "Synaptic reorganization" enabled by trauma-informed care

SECTIONS TO INCLUDE:
1. Executive Summary (compelling hook with brain science)
2. Problem Statement (opioid crisis + neuroplasticity opportunity)
3. Program Description (VRCC + MRCC model)
4. Evidence-Based Approach (peer support literature + brain science)
5. Measurable Outcomes (use actual data above)
6. Sustainability Plan (volunteer capacity + AI efficiency)
7. Budget Justification (ROI narrative)

LENGTH: 1500-2000 words, grant-ready, professional yet compassionate tone.`;

    const proposal = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false
    });

    // Update grant opportunity with drafted proposal
    await base44.asServiceRole.entities.GrantOpportunity.update(grant_opportunity_id, {
      auto_drafted_proposal: proposal,
      proposal_status: 'drafted',
      metrics_highlighted: [
        `${totalParticipants} participants served`,
        `${avgRecoveryCapital}/50 recovery capital`,
        `${recidivismRate}% recidivism rate`,
        `${narcanReversals} overdose reversals`,
        `${preventionReach} prevention reach`
      ]
    });

    return Response.json({ 
      success: true, 
      proposal,
      metrics_used: {
        totalParticipants,
        avgRecoveryCapital,
        recidivismRate,
        avgQOL,
        narcanReversals,
        preventionReach
      }
    });

  } catch (error) {
    console.error('Error generating grant proposal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});