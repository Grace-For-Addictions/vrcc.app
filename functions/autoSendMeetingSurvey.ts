import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { meeting_id, participant_emails } = await req.json();

    // Fetch meeting details
    const meeting = await base44.asServiceRole.entities.GFARCMeetingTracker.filter({ id: meeting_id }).then(r => r[0]);
    
    if (!meeting) {
      return Response.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Send survey to each participant
    const surveysSent = [];
    
    for (const email of (participant_emails || meeting.participant_emails || [])) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: '✨ How was today\'s GFARC meeting?',
          body: `Hi there! 💚

Thank you for joining today's GFA Recovery Circle meeting. Your experience matters to us.

We'd love to hear about your sense of connection today. This brief survey helps us improve and demonstrates the power of peer support to our funders.

**Quick 2-Minute Survey:**
Please rate your experience (1-5):

1. How connected did you feel during the meeting?
2. Did you feel heard and supported?
3. Will you return to future meetings?

Reply to this email or visit: ${process.env.BASE44_APP_URL}/survey/${meeting_id}

Your feedback helps us track "social connectedness" - a key metric for Quality of Life improvement and grant compliance.

With gratitude,
The GFA Team

P.S. Community connection literally rewires the brain for healing 🧠💚`
        });

        surveysSent.push(email);
      } catch (emailError) {
        console.error(`Failed to send survey to ${email}:`, emailError);
      }
    }

    return Response.json({ 
      success: true,
      surveys_sent: surveysSent.length,
      recipients: surveysSent
    });

  } catch (error) {
    console.error('Error sending meeting surveys:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});