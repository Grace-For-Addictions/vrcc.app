import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.user_role !== 'administrator')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all funder relationships and grant opportunities
    const [funderRelationships, grantOpportunities] = await Promise.all([
      base44.asServiceRole.entities.FunderRelationship.list('-created_date', 100),
      base44.asServiceRole.entities.GrantOpportunity.list('-created_date', 100)
    ]);

    // Extract all past grants
    const allPastGrants = funderRelationships.flatMap(f => 
      (f.past_grants || []).map(g => ({
        ...g,
        funder_name: f.funder_name,
        funder_type: f.funder_type,
        preferred_keywords: f.preferred_language_keywords
      }))
    );

    const awardedGrants = allPastGrants.filter(g => g.status === 'awarded');
    const declinedGrants = allPastGrants.filter(g => g.status === 'declined');

    // AI analysis of success patterns
    const analysisPrompt = `You are analyzing GFA's grant success/failure patterns to improve future proposals.

AWARDED GRANTS (${awardedGrants.length} total):
${awardedGrants.map(g => `- ${g.grant_name} (${g.funder_name}): $${g.amount || 'unknown'} - ${g.year}`).join('\n')}

DECLINED GRANTS (${declinedGrants.length} total):
${declinedGrants.map(g => `- ${g.grant_name} (${g.funder_name}) - ${g.year}`).join('\n')}

FUNDER PREFERENCES:
${funderRelationships.map(f => `${f.funder_name}: ${f.preferred_language_keywords?.join(', ')}`).join('\n')}

ANALYZE:
1. What characteristics do successful grants share?
   - Common funders, keywords, amounts, focus areas
2. What patterns exist in declined grants?
   - Were they wrong fit, timing issues, competitive?
3. Success rate by funder type (federal vs state vs private)
4. Recommended proposal strategies going forward
5. Which funders should GFA prioritize?
6. Red flags to avoid in future proposals

Return comprehensive analysis as JSON.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          success_patterns: { type: "array", items: { type: "string" } },
          failure_patterns: { type: "array", items: { type: "string" } },
          success_rate_by_type: { type: "object" },
          recommended_strategies: { type: "array", items: { type: "string" } },
          priority_funders: { type: "array", items: { type: "string" } },
          red_flags: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Update each funder with AI insights
    for (const funder of funderRelationships) {
      const funderGrants = allPastGrants.filter(g => g.funder_name === funder.funder_name);
      const successRate = funderGrants.length > 0 
        ? (funderGrants.filter(g => g.status === 'awarded').length / funderGrants.length * 100).toFixed(0)
        : 0;

      await base44.asServiceRole.entities.FunderRelationship.update(funder.id, {
        ai_success_analysis: `Success rate: ${successRate}%. ${analysis.success_patterns.join(' ')}`
      });
    }

    return Response.json({ 
      success: true,
      analysis,
      stats: {
        total_grants: allPastGrants.length,
        awarded: awardedGrants.length,
        declined: declinedGrants.length,
        success_rate: allPastGrants.length > 0 
          ? ((awardedGrants.length / allPastGrants.length) * 100).toFixed(1) 
          : 0
      }
    });

  } catch (error) {
    console.error('Error analyzing past grants:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});