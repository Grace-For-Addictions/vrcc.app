import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.user_role !== 'administrator')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { campaign_type, target_audience, channels, budget } = await req.json();

    // Fetch historical campaign data
    const [pastCampaigns, pastMetrics] = await Promise.all([
      base44.asServiceRole.entities.PreventionCampaign.list('-created_date', 100),
      base44.asServiceRole.entities.PreventionCampaignMetrics.list('-campaign_date', 100)
    ]);

    // Calculate historical effectiveness
    const similarCampaigns = pastCampaigns.filter(c => 
      c.campaign_type === campaign_type && c.target_audience === target_audience
    );

    const avgReach = similarCampaigns.length > 0
      ? similarCampaigns.reduce((sum, c) => sum + (c.actual_reach || 0), 0) / similarCampaigns.length
      : 0;

    const avgEngagement = similarCampaigns.length > 0
      ? similarCampaigns.reduce((sum, c) => sum + (c.engagement_count || 0), 0) / similarCampaigns.length
      : 0;

    // AI prediction
    const predictionPrompt = `You are GFA's "Campaign Effectiveness Predictor" AI agent.

PROPOSED CAMPAIGN:
- Type: ${campaign_type}
- Target: ${target_audience}
- Channels: ${channels?.join(', ')}
- Budget: $${budget || 0}

HISTORICAL DATA:
- Similar campaigns run: ${similarCampaigns.length}
- Average reach: ${avgReach.toFixed(0)} people
- Average engagement: ${avgEngagement.toFixed(0)} interactions
- Stigma reduction: ${pastMetrics.filter(m => m.post_survey_stigma_score < m.pre_survey_stigma_score).length} successful campaigns

PREDICT:
1. Effectiveness score (0-100): likelihood of achieving goals
2. Estimated reach
3. Estimated engagement rate (%)
4. Predicted stigma reduction (points on 0-10 scale)
5. Risk factors that could reduce effectiveness
6. Optimization suggestions

Return as JSON.`;

    const prediction = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: predictionPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          effectiveness_score: { type: "number" },
          estimated_reach: { type: "number" },
          estimated_engagement_rate: { type: "number" },
          predicted_stigma_reduction: { type: "number" },
          risk_factors: { type: "array", items: { type: "string" } },
          optimization_suggestions: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({ 
      success: true,
      prediction
    });

  } catch (error) {
    console.error('Error predicting campaign effectiveness:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});