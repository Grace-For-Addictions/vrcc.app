import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participant_email } = await req.json();

    // Fetch comprehensive participant data for contextualized recommendations
    const [profile, recentCheckIns, assessments, anchorCase, gfaPlan, recentChats] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ created_by: participant_email }).then(p => p[0]).catch(() => null),
      base44.asServiceRole.entities.DailyCheckIn.filter({ created_by: participant_email }, '-created_date', 7).catch(() => []),
      base44.asServiceRole.entities.Assessment.filter({ created_by: participant_email }, '-created_date', 1).catch(() => []),
      base44.asServiceRole.entities.ANCHORCase.filter({ participant_email }).then(c => c[0]).catch(() => null),
      base44.asServiceRole.entities.GFAPlan.filter({ user_email: participant_email }).then(p => p[0]).catch(() => null),
      base44.asServiceRole.entities.Conversation.filter({ created_by: participant_email }, '-created_date', 5).catch(() => [])
    ]);

    // Analyze recent chat sentiment
    let chatSentiment = 'neutral';
    if (recentChats.length > 0) {
      const latestMessages = recentChats[0]?.messages || [];
      const lastUserMessage = latestMessages.filter(m => m.role === 'user').slice(-1)[0];
      
      if (lastUserMessage) {
        const sentimentResponse = await base44.asServiceRole.functions.invoke('analyzeSentiment', {
          message_text: lastUserMessage.content
        });
        chatSentiment = sentimentResponse.data?.sentiment || 'neutral';
      }
    }

    // Fetch all available resources
    const allResources = await base44.asServiceRole.entities.Resource.list('-updated_date', 200);

    // AI-powered dynamic recommendation
    const recommendationPrompt = `You are GFA's "Dynamic Resource Curation Engine" AI agent.

PARTICIPANT REAL-TIME CONTEXT:
- Recent mood trend: ${recentCheckIns.length > 0 ? (recentCheckIns.reduce((s, c) => s + (c.mood || 3), 0) / recentCheckIns.length).toFixed(1) : 'N/A'}/5
- Chat sentiment: ${chatSentiment}
- Recovery capital: ${assessments[0]?.total_score || 'Not assessed'}/50
- Pathways: ${profile?.pathways?.join(', ') || 'Not specified'}
- Justice-involved: ${anchorCase ? 'Yes (ANCHOR eligible)' : 'No'}
- GFA Plan active: ${gfaPlan ? 'Yes' : 'No'}
- Location: ${profile?.county || 'Unknown'}

CASE PLAN GOALS (from GFA Plan):
- Gratitude focus: ${gfaPlan?.section_gratitude ? 'Active' : 'Not set'}
- Resilience building: ${gfaPlan?.section_resilience ? 'Active' : 'Not set'}
- Connection needs: ${gfaPlan?.section_connection ? 'Active' : 'Not set'}
- Empowerment actions: ${gfaPlan?.section_empowerment ? 'Active' : 'Not set'}

AVAILABLE RESOURCES: ${allResources.length} resources across categories

ANALYZE & RECOMMEND:
Based on their real-time emotional state, case plan goals, and immediate needs:

1. What are their TOP 5 most relevant resources right now?
   (Include resource name, category, why it's relevant, urgency level)

2. What GFA programs should they engage with next?
   (peer coaching, GFARC meeting, ANCHOR, housing navigation, etc.)

3. What offline resources should be cached for MRCC access?
   (if rural or unhoused)

Return as structured JSON.`;

    const recommendations = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: recommendationPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          top_resources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                resource_name: { type: "string" },
                category: { type: "string" },
                relevance_reason: { type: "string" },
                urgency: { type: "string" }
              }
            }
          },
          recommended_programs: { type: "array", items: { type: "string" } },
          offline_priority_resources: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Auto-generate resource requests for high-priority recommendations
    if (recommendations.top_resources?.length > 0) {
      const urgentResources = recommendations.top_resources.filter(r => 
        r.urgency === 'immediate' || r.urgency === 'within_24h'
      );

      if (urgentResources.length > 0) {
        try {
          await base44.asServiceRole.functions.invoke('autoGenerateResourceRequest', {
            participant_email,
            recommended_resources: urgentResources
          });
        } catch (error) {
          console.error('Failed to auto-generate resource requests:', error);
        }
      }
    }

    return Response.json({ 
      success: true,
      recommendations,
      auto_requests_generated: recommendations.top_resources?.filter(r => 
        r.urgency === 'immediate' || r.urgency === 'within_24h'
      ).length || 0,
      context_analyzed: {
        mood_trend: recentCheckIns.length > 0 ? (recentCheckIns.reduce((s, c) => s + (c.mood || 3), 0) / recentCheckIns.length).toFixed(1) : null,
        chat_sentiment: chatSentiment,
        has_case_plan: !!gfaPlan
      }
    });

  } catch (error) {
    console.error('Error generating dynamic resource recommendations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});