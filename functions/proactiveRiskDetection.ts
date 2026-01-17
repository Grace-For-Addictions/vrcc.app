import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Scheduled function - verify admin access if user is authenticated
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin' && user.user_role !== 'administrator') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch recent check-ins and assess risk
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentCheckIns = await base44.asServiceRole.entities.DailyCheckIn.filter({
      created_date: { $gte: sevenDaysAgo }
    }, '-created_date', 500);

    // Group by user
    const userCheckIns = recentCheckIns.reduce((acc, checkIn) => {
      if (!acc[checkIn.created_by]) acc[checkIn.created_by] = [];
      acc[checkIn.created_by].push(checkIn);
      return acc;
    }, {});

    const highRiskUsers = [];

    // Analyze each user's pattern
    for (const [email, checkIns] of Object.entries(userCheckIns)) {
      // Calculate risk indicators
      const avgMood = checkIns.reduce((sum, c) => sum + (c.mood || 3), 0) / checkIns.length;
      const avgTrigger = checkIns.reduce((sum, c) => sum + (c.trigger_level || 0), 0) / checkIns.length;
      const negativeStreak = checkIns.slice(0, 3).every(c => c.mood < 3);
      const crisisMentions = checkIns.some(c => 
        c.notes?.toLowerCase().includes('suicide') || 
        c.notes?.toLowerCase().includes('hurt myself') ||
        c.notes?.toLowerCase().includes('give up')
      );

      // Calculate risk score
      let riskScore = 0;
      if (avgMood < 2.5) riskScore += 30;
      if (avgTrigger > 3) riskScore += 25;
      if (negativeStreak) riskScore += 20;
      if (crisisMentions) riskScore += 50;
      if (checkIns.length < 2) riskScore += 15; // Disengagement

      if (riskScore >= 50) {
        highRiskUsers.push({
          email,
          riskScore,
          avgMood: avgMood.toFixed(1),
          avgTrigger: avgTrigger.toFixed(1),
          crisisMentions,
          negativeStreak,
          checkInCount: checkIns.length
        });

        // Generate personalized intervention
        const interventionPrompt = `You are Grace, the AI Peer Support Companion. A user is showing high-risk indicators.

RISK PROFILE:
- Average Mood (1-5): ${avgMood.toFixed(1)}
- Average Trigger Level (1-5): ${avgTrigger.toFixed(1)}
- Recent Notes Sentiment: ${crisisMentions ? 'Crisis language detected' : 'Struggling'}
- Engagement: ${checkIns.length} check-ins in 7 days

Generate a compassionate, trauma-informed outreach message that:
1. Validates their struggle without judgment
2. Offers immediate crisis resources (988 Lifeline)
3. Suggests connecting with a human peer coach
4. Reminds them they're not alone
5. Offers specific GFA resources (GFARC meeting, Grace chat)

Keep it warm, brief (3-4 sentences), and action-oriented.`;

        const intervention = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: interventionPrompt,
          add_context_from_internet: false
        });

        // Send intervention email
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: '💚 Checking in on you - Grace',
            body: `${intervention}\n\n---\n\n🆘 CRISIS RESOURCES:\n• 988 Suicide & Crisis Lifeline: Call or text 988\n• National Crisis Line: 1-800-273-8255\n• Crisis Text Line: Text HOME to 741741\n\nWith care,\nGrace & the GFA Team`
          });
        } catch (emailError) {
          console.error('Failed to send intervention email:', emailError);
        }
      }
    }

    return Response.json({ 
      success: true,
      users_analyzed: Object.keys(userCheckIns).length,
      high_risk_users_identified: highRiskUsers.length,
      interventions_sent: highRiskUsers.length
    });

  } catch (error) {
    console.error('Error in proactive risk detection:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});