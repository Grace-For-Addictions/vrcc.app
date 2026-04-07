import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.user_role !== 'administrator')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { anchor_case_id } = await req.json();

    // Fetch ANCHOR case data
    const anchorCase = await base44.asServiceRole.entities.ANCHORCase.filter({ id: anchor_case_id }).then(c => c[0]);
    
    if (!anchorCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Fetch related participant data
    const [profile, assessments, checkIns, coachingSessions, activityLogs] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ created_by: anchorCase.participant_email }).then(p => p[0]).catch(() => null),
      base44.asServiceRole.entities.Assessment.filter({ created_by: anchorCase.participant_email }, '-created_date', 5).catch(() => []),
      base44.asServiceRole.entities.DailyCheckIn.filter({ created_by: anchorCase.participant_email }, '-created_date', 30).catch(() => []),
      base44.asServiceRole.entities.CoachingSessionLog.filter({ participant_email: anchorCase.participant_email }, '-session_date', 10).catch(() => []),
      base44.asServiceRole.entities.ProgramActivityLog.filter({ participant_email: anchorCase.participant_email }, '-activity_date', 20).catch(() => [])
    ]);

    // Predictive analytics using AI
    const predictionPrompt = `You are an AI predictive analytics engine for ANCHOR reentry program.

PARTICIPANT PROFILE:
- Days since release: ${anchorCase.days_since_release || 'Still incarcerated'}
- Live-out program: ${anchorCase.live_out_program ? 'Yes' : 'No'}
- Employment secured: ${anchorCase.employment_secured ? 'Yes' : 'No'}
- Housing secured: ${anchorCase.housing_secured ? 'Yes' : 'No'}
- Recovery court compliance: ${anchorCase.recovery_court_compliance ? 'Yes' : 'No'}

ENGAGEMENT DATA:
- Recovery capital (BARC-10): ${assessments[0]?.total_score || 0}/50
- Recent check-ins: ${checkIns.length} (30 days)
- Average mood: ${checkIns.length > 0 ? (checkIns.reduce((s, c) => s + (c.mood || 3), 0) / checkIns.length).toFixed(1) : 0}/5
- Coaching sessions: ${coachingSessions.length} (recent)
- Program activities: ${activityLogs.length} (recent)

KNOWN RISK FACTORS:
- Unemployment post-release (highest predictor)
- Housing instability
- Low social support / recovery capital < 30
- Disengagement (< 2 check-ins/month)
- Non-compliance with court requirements

ANALYZE:
1. Recidivism risk score (0-100)
2. Disengagement risk score (0-100)
3. Key protective factors present
4. Key risk factors present
5. Recommended interventions (immediate, short-term, long-term)
6. Alert level: critical/high/medium/low

Return as JSON.`;

    const prediction = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: predictionPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          recidivism_risk_score: { type: "number" },
          disengagement_risk_score: { type: "number" },
          protective_factors: { type: "array", items: { type: "string" } },
          risk_factors: { type: "array", items: { type: "string" } },
          recommended_interventions: { type: "array", items: { type: "string" } },
          alert_level: { type: "string" }
        }
      }
    });

    // Update ANCHOR case with risk score
    await base44.asServiceRole.entities.ANCHORCase.update(anchor_case_id, {
      recidivism_risk_score: prediction.recidivism_risk_score
    });

    // Create alert if high risk
    if (prediction.alert_level === 'critical' || prediction.alert_level === 'high') {
      await base44.asServiceRole.entities.PredictiveAlert.create({
        participant_email: anchorCase.participant_email,
        alert_type: 'recidivism_risk',
        severity: prediction.alert_level,
        triggered_by_ai: true,
        alert_details: {
          recidivism_risk: prediction.recidivism_risk_score,
          disengagement_risk: prediction.disengagement_risk_score,
          risk_factors: prediction.risk_factors,
          interventions: prediction.recommended_interventions
        },
        assigned_to: anchorCase.assigned_specialist_email
      });
    }

    return Response.json({ 
      success: true,
      prediction
    });

  } catch (error) {
    console.error('Error predicting recidivism risk:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});