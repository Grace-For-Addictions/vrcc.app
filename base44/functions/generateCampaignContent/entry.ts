import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.user_role !== 'administrator')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { campaign_type, target_audience, counties, themes } = await req.json();

    // AI-powered campaign content generation
    const contentPrompt = `You are GFA's "Prevention & Outreach Campaign Architect" AI agent.

CAMPAIGN TYPE: ${campaign_type}
TARGET AUDIENCE: ${target_audience}
GEOGRAPHIC FOCUS: ${counties?.join(', ') || 'Iowa statewide'}
THEMES: ${themes?.join(', ') || 'neuroplasticity, hope, stigma reduction'}

STRATEGIC APPROACH:
- Use strength-based, non-stigmatizing language
- Emphasize neuroplasticity: "Recovery rewires the brain"
- Counter "once an addict, always an addict" myths
- Person-first language always
- Hope + science = powerful combination

POLK COUNTY PREVENTION PRIORITY:
"Preventative Approaches" - Shifting from reactive to proactive, evidence-based prevention that reduces substance use initiation

GENERATE:
1. Campaign tagline (catchy, memorable, 5-8 words)
2. Core message (2-3 sentences explaining the campaign)
3. Social media post content (3 variations: Facebook, Instagram, TikTok-style)
4. Talking points for in-person presentations (5 key points)
5. Call-to-action suggestions

Target audience considerations:
- Youth: peer influence, brain development, future potential
- Parents: protective factors, recognizing signs, family connection
- Community: collective responsibility, harm reduction, support systems
- Professionals: trauma-informed care, referral pathways, collaboration

Return as structured JSON.`;

    const content = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: contentPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          tagline: { type: "string" },
          core_message: { type: "string" },
          social_media_posts: {
            type: "object",
            properties: {
              facebook: { type: "string" },
              instagram: { type: "string" },
              tiktok: { type: "string" }
            }
          },
          talking_points: { type: "array", items: { type: "string" } },
          call_to_action: { type: "string" }
        }
      }
    });

    return Response.json({ 
      success: true,
      content
    });

  } catch (error) {
    console.error('Error generating campaign content:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});