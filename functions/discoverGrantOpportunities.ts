import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This is a scheduled/automated function - verify service role access
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin' && user.user_role !== 'administrator') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // AI agent scans for grant opportunities aligned with GFA strategic priorities
    const discoveryPrompt = `You are the "Grant Opportunity Discovery" AI agent for Grace For Addictions.

MISSION: Scan for new grant opportunities from major funders aligned with GFA's strategic priorities.

STRATEGIC PRIORITIES (Polk County 5 Points of Progress):
1. Healthy Community - peer support, recovery capital, stigma reduction
2. Infrastructure Investment - MRCC tech hubs, telehealth kiosks
3. Preventative Approaches - school education, Narcan distribution
4. Service Excellence - AI-enhanced care, ROI measurement
5. Improvement & Innovation - neuroplasticity education, AI documentation

TARGET FUNDERS TO SCAN:
- SAMHSA (TIEH, MOUD expansion, Recovery Community Services)
- Iowa Opioid Settlement Fund
- HRSA (telehealth, rural health)
- Polk County Foundation
- Iowa Department of Human Services
- Robert Wood Johnson Foundation
- CDC (overdose prevention)
- State of Iowa Grants

CURRENT DATE: ${new Date().toLocaleDateString()}

TASK: Identify 3-5 NEW grant opportunities likely available in the next 6 months. For each, provide:
1. Funder name
2. Grant program name
3. Estimated deadline
4. Funding range
5. Strategic alignment (which of the 5 priorities)
6. Priority keywords the funder uses
7. Match score (0-100) with GFA's model

Format as JSON array:
[{
  "funder_name": "...",
  "grant_name": "...",
  "deadline": "YYYY-MM-DD",
  "funding_amount_min": number,
  "funding_amount_max": number,
  "strategic_alignment": ["healthy_community", ...],
  "priority_keywords": ["peer support", "recovery capital", ...],
  "ai_match_score": number
}]`;

    const opportunities = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: discoveryPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                funder_name: { type: "string" },
                grant_name: { type: "string" },
                deadline: { type: "string" },
                funding_amount_min: { type: "number" },
                funding_amount_max: { type: "number" },
                strategic_alignment: { type: "array", items: { type: "string" } },
                priority_keywords: { type: "array", items: { type: "string" } },
                ai_match_score: { type: "number" }
              }
            }
          }
        }
      }
    });

    const createdOpportunities = [];
    
    // Create GrantOpportunity entities and trigger proposal generation
    for (const opp of opportunities.opportunities || []) {
      // Check if already exists
      const existing = await base44.asServiceRole.entities.GrantOpportunity.filter({
        funder_name: opp.funder_name,
        grant_name: opp.grant_name
      });

      if (existing.length === 0) {
        const newOpp = await base44.asServiceRole.entities.GrantOpportunity.create({
          ...opp,
          proposal_status: 'identified'
        });

        createdOpportunities.push(newOpp);

        // Auto-trigger proposal generation if match score > 70
        if (opp.ai_match_score > 70) {
          try {
            await base44.asServiceRole.functions.invoke('autoGenerateGrantProposal', {
              grant_opportunity_id: newOpp.id
            });
          } catch (error) {
            console.error('Failed to auto-generate proposal:', error);
          }
        }
      }
    }

    return Response.json({ 
      success: true,
      opportunities_discovered: opportunities.opportunities?.length || 0,
      new_opportunities_created: createdOpportunities.length,
      auto_proposals_triggered: createdOpportunities.filter(o => o.ai_match_score > 70).length
    });

  } catch (error) {
    console.error('Error discovering grant opportunities:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});