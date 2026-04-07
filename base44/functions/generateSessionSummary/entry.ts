import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, sessionNotes } = await req.json();

    if (!sessionId) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Fetch session details
    const session = await base44.entities.Event.get(sessionId);

    // Check if user is authorized (host, moderator, or admin)
    const isAuthorized = 
      session.created_by === user.email ||
      session.host_email === user.email ||
      session.moderator_emails?.includes(user.email) ||
      user.role === 'admin' ||
      user.user_role === 'administrator' ||
      user.user_role === 'moderator';

    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden: Not authorized to generate summary' }, { status: 403 });
    }

    // Prepare context for AI
    const summaryContext = {
      title: session.title,
      description: session.description,
      eventType: session.event_type,
      topics: session.session_topics || [],
      attendeeCount: session.attendee_count,
      duration: session.end_time ? `${new Date(session.start_time).toLocaleString()} - ${new Date(session.end_time).toLocaleString()}` : new Date(session.start_time).toLocaleString(),
      notes: sessionNotes || 'No additional notes provided'
    };

    // Generate AI summary
    const aiSummary = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a compassionate recovery session documenter. Generate a concise summary for this completed group recovery session.

Session Details:
${JSON.stringify(summaryContext, null, 2)}

Create a structured summary with:
1. **Overview**: Brief description of what happened (2-3 sentences)
2. **Key Discussion Points**: Main topics and themes discussed (3-5 bullet points)
3. **Insights & Wisdom Shared**: Important realizations or advice shared by participants
4. **Decisions Made**: Any group decisions or agreements
5. **Action Items**: Next steps or commitments (if any)
6. **Tone & Energy**: Overall mood and participant engagement

Keep the tone warm, person-first, and stigma-free. Focus on connection, growth, and hope.`,
      response_json_schema: {
        type: "object",
        properties: {
          overview: { type: "string" },
          keyPoints: {
            type: "array",
            items: { type: "string" }
          },
          insightsShared: {
            type: "array",
            items: { type: "string" }
          },
          decisionsMade: {
            type: "array",
            items: { type: "string" }
          },
          actionItems: {
            type: "array",
            items: { type: "string" }
          },
          toneAndEnergy: { type: "string" }
        }
      }
    });

    // Format summary as markdown
    const formattedSummary = `
# ${session.title} - Session Summary

**Date**: ${new Date(session.start_time).toLocaleDateString()}
**Attendees**: ${session.attendee_count} participants

## Overview
${aiSummary.overview}

## Key Discussion Points
${aiSummary.keyPoints.map(point => `- ${point}`).join('\n')}

## Insights & Wisdom Shared
${aiSummary.insightsShared.map(insight => `- ${insight}`).join('\n')}

${aiSummary.decisionsMade.length > 0 ? `## Decisions Made\n${aiSummary.decisionsMade.map(d => `- ${d}`).join('\n')}\n` : ''}

${aiSummary.actionItems.length > 0 ? `## Action Items\n${aiSummary.actionItems.map(item => `- ${item}`).join('\n')}\n` : ''}

## Tone & Energy
${aiSummary.toneAndEnergy}

---
*Summary generated on ${new Date().toLocaleString()}*
    `.trim();

    // Update session with summary
    await base44.asServiceRole.entities.Event.update(sessionId, {
      session_summary: formattedSummary,
      summary_generated_at: new Date().toISOString(),
      session_status: 'completed'
    });

    return Response.json({
      success: true,
      summary: formattedSummary,
      structuredData: aiSummary
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});