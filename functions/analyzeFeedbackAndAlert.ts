import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Gather all feedback sources
    const [surveys, recentCheckIns, chatConversations, caseLogs] = await Promise.all([
      base44.asServiceRole.entities.PostSessionSurvey.filter({ 
        survey_completed_date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
      }),
      base44.asServiceRole.entities.DailyCheckIn.list('-created_date', 200),
      base44.asServiceRole.entities.Conversation.list('-created_date', 50),
      base44.asServiceRole.entities.ANCHORCase.list('-updated_date', 100)
    ]);

    const alertsCreated = [];

    // Analyze survey feedback with sentiment
    for (const survey of surveys) {
      if (!survey.sentiment_score && (survey.what_could_improve || survey.additional_support_needed)) {
        const feedbackText = `${survey.what_could_improve || ''} ${survey.additional_support_needed || ''}`.trim();
        
        if (feedbackText) {
          const sentimentResponse = await base44.asServiceRole.functions.invoke('analyzeSentiment', {
            message_text: feedbackText
          });
          
          const sentiment = sentimentResponse.data?.sentiment;
          const sentimentScore = sentimentResponse.data?.score || 0;

          // Update survey with sentiment
          await base44.asServiceRole.entities.PostSessionSurvey.update(survey.id, {
            sentiment_score: sentimentScore,
            sentiment_label: sentiment,
            key_themes: sentimentResponse.data?.themes || []
          });

          // Create alert for critical negative feedback
          if (sentiment === 'very_negative' || sentiment === 'negative') {
            const alert = await base44.asServiceRole.entities.FeedbackAlert.create({
              participant_email: survey.respondent_email,
              alert_type: sentimentScore < -0.5 ? 'critical_negative_sentiment' : 'service_complaint',
              severity: sentimentScore < -0.5 ? 'critical' : 'high',
              source: `${survey.session_type} survey`,
              feedback_content: feedbackText,
              ai_analysis: `Negative feedback detected. Score: ${sentimentScore}. Recommended action: Follow up within 24 hours to address concerns and prevent disengagement.`
            });

            alertsCreated.push(alert);

            // Notify case manager
            const profile = await base44.asServiceRole.entities.UserProfile.filter({ 
              created_by: survey.respondent_email 
            }).then(p => p[0]).catch(() => null);

            if (profile?.assigned_case_manager) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: profile.assigned_case_manager,
                subject: '🚨 Critical Feedback Alert - GFA',
                body: `A participant has provided concerning feedback requiring immediate follow-up.

**Participant:** ${survey.respondent_email}
**Feedback:** ${feedbackText}
**Sentiment:** ${sentiment} (${sentimentScore})

**AI Recommendation:** ${alert.ai_analysis}

Please review in your case manager dashboard.`
              });
            }
          }
        }
      }
    }

    // Analyze mood trends for disengagement risk
    const participantMoods = {};
    checkIns.forEach(checkin => {
      if (!participantMoods[checkin.created_by]) {
        participantMoods[checkin.created_by] = [];
      }
      participantMoods[checkin.created_by].push(checkin.mood || 3);
    });

    for (const [email, moods] of Object.entries(participantMoods)) {
      if (moods.length >= 3) {
        const recentMoods = moods.slice(0, 3);
        const avgMood = recentMoods.reduce((s, m) => s + m, 0) / recentMoods.length;
        
        if (avgMood < 2.5) {
          const existingAlert = await base44.asServiceRole.entities.FeedbackAlert.filter({
            participant_email: email,
            alert_type: 'disengagement_risk',
            status: 'pending'
          });

          if (existingAlert.length === 0) {
            const alert = await base44.asServiceRole.entities.FeedbackAlert.create({
              participant_email: email,
              alert_type: 'disengagement_risk',
              severity: avgMood < 2 ? 'high' : 'medium',
              source: 'daily_check_ins',
              feedback_content: `Mood trending low: ${recentMoods.join(', ')}/5`,
              ai_analysis: `Participant showing consistent low mood over last 3 check-ins. Recommend proactive outreach to assess needs and prevent disengagement.`
            });

            alertsCreated.push(alert);
          }
        }
      }
    }

    return Response.json({ 
      success: true,
      alerts_created: alertsCreated.length,
      surveys_analyzed: surveys.length
    });

  } catch (error) {
    console.error('Error analyzing feedback:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});