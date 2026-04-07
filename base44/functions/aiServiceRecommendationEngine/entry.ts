import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participant_email } = await req.json();

    // Fetch comprehensive participant data
    const [profile, checkIns, assessments, anchorCases, coachingSessions, eventAttendance] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ created_by: participant_email }).then(p => p[0]).catch(() => null),
      base44.asServiceRole.entities.DailyCheckIn.filter({ created_by: participant_email }, '-created_date', 10).catch(() => []),
      base44.asServiceRole.entities.Assessment.filter({ created_by: participant_email }, '-created_date', 5).catch(() => []),
      base44.asServiceRole.entities.ANCHORCase.filter({ participant_email }).catch(() => []),
      base44.asServiceRole.entities.CoachingSessionLog.filter({ participant_email }, '-session_date', 5).catch(() => []),
      base44.asServiceRole.entities.Event.list('-start_time', 10).catch(() => [])
    ]);

    // Get available capacity
    const serviceCapacity = await base44.asServiceRole.entities.ServiceCapacity.list('-last_updated', 50);

    // AI recommendation analysis
    const recommendationPrompt = `You are the "AI Service Recommendation Engine" for Grace For Addictions.

PARTICIPANT DATA:
- Location: ${profile?.county || 'Unknown'}
- Pathways: ${profile?.pathways?.join(', ') || 'Not specified'}
- Recent mood trend: ${checkIns.length > 0 ? (checkIns.reduce((s, c) => s + (c.mood || 3), 0) / checkIns.length).toFixed(1) : 'No data'}/5
- Recovery capital score: ${assessments[0]?.total_score || 'Not assessed'}/50
- Justice-involved: ${anchorCases.length > 0 ? 'Yes - ANCHOR eligible' : 'No'}
- Recent engagement: ${coachingSessions.length} sessions, ${checkIns.length} check-ins (30d)

AVAILABLE SERVICES & CAPACITY:
${serviceCapacity.map(s => `- ${s.location_type} ${s.service_type}: ${s.availability_status}`).join('\n')}

ANALYZE AND RECOMMEND:
1. What is the MOST appropriate GFA service for this participant right now?
   Options: vrcc_peer_coaching, mrcc_telehealth_kiosk, anchor_reentry_program, gfarc_meeting, narcan_access, housing_navigation, employment_services, crisis_intervention

2. Why this recommendation? (data-driven explanation)

3. Urgency level: immediate/within_24h/within_week/routine

4. Confidence score (0-100)

5. What data points informed this? (list)

Return as JSON.`;

    const recommendation = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: recommendationPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          recommended_service: { type: "string" },
          recommendation_reason: { type: "string" },
          urgency_level: { type: "string" },
          confidence_score: { type: "number" },
          data_points_analyzed: { type: "array", items: { type: "string" } },
          nearest_location: { type: "string" }
        }
      }
    });

    // Save recommendation
    const savedRec = await base44.asServiceRole.entities.AIServiceRecommendation.create({
      participant_email,
      ...recommendation
    });

    return Response.json({ 
      success: true,
      recommendation: savedRec
    });

  } catch (error) {
    console.error('Error generating service recommendation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});