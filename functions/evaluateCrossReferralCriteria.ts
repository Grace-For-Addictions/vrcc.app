import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This can be called by automation or manually
    const { participant_email } = await req.json();

    // Fetch comprehensive participant data
    const [profile, anchorCase, checkIns, assessments, coachingSessions, housingStatus] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ created_by: participant_email }).then(r => r[0]),
      base44.asServiceRole.entities.ANCHORCase.filter({ participant_email }).then(r => r[0]),
      base44.asServiceRole.entities.DailyCheckIn.filter({ created_by: participant_email }, '-created_date', 7),
      base44.asServiceRole.entities.Assessment.filter({ created_by: participant_email }, '-created_date', 2),
      base44.asServiceRole.entities.CoachingSession.filter({ participant_email }, '-created_date', 5),
      base44.asServiceRole.entities.HousingStatus.filter({ user_email: participant_email }).then(r => r[0])
    ]);

    const referrals = [];
    const criteriaMet = [];

    // ANCHOR Re-entry → Housing Navigation
    if (anchorCase && !anchorCase.housing_secured && anchorCase.days_since_release < 30) {
      criteriaMet.push('Recently released, housing not secured');
      referrals.push({
        from_service: 'anchor_reentry',
        to_service: 'housing_navigation',
        referral_reason: 'Critical housing need within 30 days of release - urgent warm handoff recommended',
        ai_generated: true,
        criteria_met: [...criteriaMet]
      });
    }

    // Low Recovery Capital → Peer Coaching
    if (assessments.length > 0 && assessments[0].total_score < 25 && coachingSessions.length === 0) {
      const newCriteria = ['Recovery capital score below 25', 'No peer coaching history'];
      referrals.push({
        from_service: 'gfarc_meetings',
        to_service: 'peer_coaching',
        referral_reason: 'Low recovery capital detected - 1-on-1 peer support may help build social connections',
        ai_generated: true,
        criteria_met: newCriteria
      });
    }

    // Justice-involved + Employment barrier → ANCHOR
    if (profile?.pathways?.includes('justice_involved') && !anchorCase && profile?.employment_status === 'unemployed') {
      const newCriteria = ['Justice-involved pathway', 'Unemployed status', 'Not enrolled in ANCHOR'];
      referrals.push({
        from_service: 'peer_coaching',
        to_service: 'anchor_reentry',
        referral_reason: 'Justice-involved participant needs specialized re-entry support for employment barriers',
        ai_generated: true,
        criteria_met: newCriteria
      });
    }

    // Housing insecurity → Multiple supports
    if (housingStatus?.current_status === 'unsheltered' || housingStatus?.current_status === 'emergency_shelter') {
      const newCriteria = ['Housing insecurity', 'Immediate basic needs'];
      referrals.push({
        from_service: 'peer_coaching',
        to_service: 'housing_navigation',
        referral_reason: 'Immediate housing crisis - fulfilling basic needs is priority before higher-level goals',
        ai_generated: true,
        criteria_met: newCriteria
      });
    }

    // Low mood + No recent meetings → GFARC engagement
    const avgMood = checkIns.length > 0 
      ? checkIns.reduce((sum, c) => sum + (c.mood || 3), 0) / checkIns.length 
      : 3;
    
    if (avgMood < 2.5 && coachingSessions.length === 0) {
      const newCriteria = ['Low average mood (7-day)', 'No recent peer support sessions'];
      referrals.push({
        from_service: 'gfarc_meetings',
        to_service: 'peer_coaching',
        referral_reason: 'Low mood pattern - may benefit from consistent peer coaching for emotional support',
        ai_generated: true,
        criteria_met: newCriteria
      });
    }

    // Create referrals in database
    for (const referral of referrals) {
      await base44.asServiceRole.entities.CrossReferral.create({
        participant_email,
        ...referral,
        referral_status: 'suggested'
      });
    }

    return Response.json({ 
      success: true,
      referrals_created: referrals.length,
      referrals 
    });

  } catch (error) {
    console.error('Error evaluating cross-referral criteria:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});