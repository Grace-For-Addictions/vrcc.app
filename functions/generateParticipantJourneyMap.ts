import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participant_email } = await req.json();

    // Gather comprehensive participant interaction history
    const [
      profile, checkIns, assessments, coachingSessions, events, 
      chatConversations, gfaPlan, anchorCase, activityLogs, 
      resourceRequests, meetingAttendance
    ] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ created_by: participant_email }).then(p => p[0]),
      base44.asServiceRole.entities.DailyCheckIn.filter({ created_by: participant_email }, '-created_date', 100),
      base44.asServiceRole.entities.Assessment.filter({ created_by: participant_email }, '-created_date', 10),
      base44.asServiceRole.entities.CoachingSessionLog.filter({ participant_email }, '-session_date', 20),
      base44.asServiceRole.entities.Event.list('-start_time', 50),
      base44.asServiceRole.entities.Conversation.filter({ created_by: participant_email }, '-created_date', 10),
      base44.asServiceRole.entities.GFAPlan.filter({ user_email: participant_email }).then(p => p[0]),
      base44.asServiceRole.entities.ANCHORCase.filter({ participant_email }).then(c => c[0]),
      base44.asServiceRole.entities.ProgramActivityLog.filter({ participant_email }, '-activity_date', 50),
      base44.asServiceRole.entities.ResourceRequest.filter({ requester_email: participant_email }, '-created_date', 20),
      base44.asServiceRole.entities.GFARCMeetingTracker.list('-meeting_date', 50)
    ]);

    // AI analysis of journey
    const journeyPrompt = `You are GFA's "Participant Journey Mapper" AI agent.

PARTICIPANT PROFILE:
- Name: ${profile?.display_name || 'Participant'}
- Pathways: ${profile?.pathways?.join(', ')}
- Stage: ${profile?.stage}
- Recovery date: ${profile?.recovery_date || 'Not set'}
- Current streak: ${profile?.current_streak || 0} days

INTERACTION HISTORY:
- Total check-ins: ${checkIns.length}
- Coaching sessions: ${coachingSessions.length}
- Assessments completed: ${assessments.length}
- Chat conversations: ${chatConversations.length}
- Resource requests: ${resourceRequests.length}
- Program activities: ${activityLogs.length}
- Justice-involved (ANCHOR): ${anchorCase ? 'Yes' : 'No'}
- GFA Plan active: ${gfaPlan ? 'Yes' : 'No'}

ENGAGEMENT PATTERNS:
- Avg mood: ${checkIns.length > 0 ? (checkIns.reduce((s, c) => s + (c.mood || 3), 0) / checkIns.length).toFixed(1) : 'N/A'}/5
- Recovery capital trend: ${assessments.map(a => a.total_score).join(' → ')}
- Most active periods: ${checkIns.slice(0, 10).map(c => new Date(c.created_date).toLocaleDateString()).join(', ')}

ANALYZE & MAP:
1. Key Milestones (timeline)
   - First engagement, assessment milestones, program completions
2. Disengagement Risk Points
   - Periods of low activity, mood drops, missed sessions
3. Growth Moments
   - Recovery capital increases, streak achievements, case plan progress
4. AI-Identified Intervention Opportunities
   - When to reach out, what services to offer
5. Recommended Next Steps
   - Immediate actions for case manager

Return as structured JSON with timeline data.`;

    const journeyMap = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: journeyPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          milestones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                event: { type: "string" },
                type: { type: "string" }
              }
            }
          },
          disengagement_points: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date_range: { type: "string" },
                risk_level: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          growth_moments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                achievement: { type: "string" }
              }
            }
          },
          intervention_opportunities: {
            type: "array",
            items: { type: "string" }
          },
          recommended_next_steps: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({ 
      success: true,
      journey_map: journeyMap,
      summary_stats: {
        total_interactions: checkIns.length + coachingSessions.length + chatConversations.length,
        engagement_score: Math.min(100, (checkIns.length + coachingSessions.length * 2) * 2),
        current_status: profile?.stage
      }
    });

  } catch (error) {
    console.error('Error generating participant journey map:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});