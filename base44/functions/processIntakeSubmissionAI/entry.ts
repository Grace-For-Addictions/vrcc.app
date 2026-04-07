import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { intake_submission_id } = await req.json();
    
    if (!intake_submission_id) {
      return Response.json({ error: 'intake_submission_id required' }, { status: 400 });
    }

    // Fetch intake submission
    const submission = await base44.asServiceRole.entities.IntakeSubmission.get(intake_submission_id);
    
    if (!submission) {
      return Response.json({ error: 'Intake submission not found' }, { status: 404 });
    }

    // Use AI to analyze intake submission
    const analysisPrompt = `
Analyze this intake submission and provide recommendations for care coordination.

**Participant Information:**
- Name: ${submission.full_name || 'N/A'}
- Email: ${submission.email || 'N/A'}
- Phone: ${submission.phone || 'N/A'}

**Submission Details:**
${JSON.stringify(submission, null, 2)}

**Your Task:**
1. **Urgency Assessment**: Rate the urgency (low, medium, high, critical). Critical = immediate safety concerns, active crisis, homelessness with children, severe mental health episode. High = unstable housing, recent relapse, multiple barriers. Medium = seeking services, stable but needs support. Low = preventative, informational.

2. **Primary Concerns**: Identify the top 3-5 primary concerns/needs expressed (e.g., housing instability, substance use treatment, mental health support, employment, legal issues, family reunification, crisis intervention).

3. **Recommended Track**: Based on concerns, recommend the most appropriate service track:
   - coaching: Peer support and recovery coaching
   - housing: Immediate housing needs or Grace House
   - crisis_intervention: Active crisis, safety concerns
   - treatment: Clinical SUD or mental health treatment
   - peer_support: Community connection, peer matching
   - case_management: Complex needs, multiple systems

4. **Coordinator Type**: Who should handle this intake? (peer_coach, housing_coordinator, clinical_navigator, crisis_specialist, case_manager)

5. **Immediate Actions**: List 2-4 immediate next steps the coordinator should take.

6. **Risk Factors**: Any red flags requiring immediate attention?

Provide practical, actionable recommendations.
`;

    const aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          urgency_level: {
            type: "string",
            enum: ["low", "medium", "high", "critical"]
          },
          primary_concerns: {
            type: "array",
            items: { type: "string" }
          },
          recommended_track: {
            type: "string",
            enum: ["coaching", "housing", "crisis_intervention", "treatment", "peer_support", "case_management"]
          },
          coordinator_type: {
            type: "string"
          },
          immediate_actions: {
            type: "array",
            items: { type: "string" }
          },
          risk_factors: {
            type: "array",
            items: { type: "string" }
          },
          summary: {
            type: "string"
          }
        }
      }
    });

    // Find available coordinators of the recommended type
    const coordinators = await base44.asServiceRole.entities.User.list();
    const availableCoordinators = coordinators.filter(u => 
      u.user_role === 'navigator' || 
      u.user_role === 'coordinator' || 
      u.user_role === 'peer_coach' ||
      u.role === 'admin'
    );

    // Simple assignment: pick first available (could be enhanced with workload balancing)
    const assignedCoordinator = availableCoordinators[0]?.email || null;

    // Create IntakeReview record
    const intakeReview = await base44.asServiceRole.entities.IntakeReview.create({
      intake_submission_id,
      participant_email: submission.email || submission.created_by,
      participant_name: submission.full_name || 'Unknown',
      review_status: aiAnalysis.urgency_level === 'critical' ? 'escalated' : 'draft',
      assigned_coordinator_email: assignedCoordinator,
      ai_urgency_level: aiAnalysis.urgency_level,
      ai_primary_concerns: aiAnalysis.primary_concerns || [],
      ai_recommended_track: aiAnalysis.recommended_track,
      ai_analysis_summary: aiAnalysis.summary,
      action_items: aiAnalysis.immediate_actions || []
    });

    // If critical urgency, send immediate notification
    if (aiAnalysis.urgency_level === 'critical') {
      await base44.asServiceRole.entities.FeedbackAlert.create({
        alert_type: 'critical_intake',
        entity_type: 'IntakeReview',
        entity_id: intakeReview.id,
        severity: 'critical',
        message: `CRITICAL INTAKE: ${submission.full_name || 'New participant'} - ${aiAnalysis.primary_concerns.join(', ')}`,
        requires_action: true,
        assigned_to: assignedCoordinator
      });

      // Send email to assigned coordinator if available
      if (assignedCoordinator) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: assignedCoordinator,
            subject: `🚨 CRITICAL Intake Submission - Immediate Attention Required`,
            body: `
A critical intake submission requires immediate attention.

**Participant:** ${submission.full_name || 'Unknown'}
**Primary Concerns:** ${aiAnalysis.primary_concerns.join(', ')}
**Risk Factors:** ${aiAnalysis.risk_factors?.join(', ') || 'See full analysis'}

**Immediate Actions:**
${aiAnalysis.immediate_actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Please review immediately in the Intake Coordinator Dashboard.
            `
          });
        } catch (emailError) {
          console.error('Failed to send critical intake email:', emailError);
        }
      }
    }

    return Response.json({
      success: true,
      intake_review_id: intakeReview.id,
      ai_analysis: aiAnalysis,
      assigned_coordinator: assignedCoordinator,
      urgency: aiAnalysis.urgency_level
    });

  } catch (error) {
    console.error('Intake processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});