import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message_text } = await req.json();

    // Real-time sentiment analysis for Grace bot responses
    const sentimentPrompt = `Analyze the emotional state and sentiment of this message from a recovery community member:

"${message_text}"

Provide:
1. Sentiment: positive/neutral/negative/crisis
2. Emotion tags: e.g., hopeful, anxious, discouraged, angry, grateful
3. Crisis indicators: true/false (suicidal ideation, self-harm, immediate danger)
4. Recommended response tone: supportive/validating/urgent/celebratory
5. Suggested intervention level: chat_only/peer_coach/crisis_line

Return as JSON.`;

    const sentiment = await base44.integrations.Core.InvokeLLM({
      prompt: sentimentPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          sentiment: { type: "string" },
          emotion_tags: { type: "array", items: { type: "string" } },
          crisis_indicators: { type: "boolean" },
          recommended_tone: { type: "string" },
          intervention_level: { type: "string" }
        }
      }
    });

    return Response.json({ 
      success: true,
      ...sentiment
    });

  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});