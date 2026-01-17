import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.user_role !== 'administrator' && user.user_role !== 'anchor_specialist')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { participant_email } = await req.json();

    // Fetch participant data
    const [profile, assessments, activities, housingStatus] = await Promise.all([
      base44.entities.UserProfile.filter({ created_by: participant_email }).then(r => r[0]),
      base44.entities.Assessment.filter({ created_by: participant_email }, '-created_date', 3),
      base44.entities.ProgramActivityLog.filter({ participant_email }, '-activity_date', 10),
      base44.entities.HousingStatus.filter({ user_email: participant_email }, '-updated_date', 1).then(r => r[0])
    ]);

    // Generate comprehensive case plan using AI
    const prompt = `You are an ANCHOR (Addiction Navigation & Coaching for Hope, Opportunity, & Reentry) specialist creating a Collaborative Comprehensive Case Plan for a justice-involved individual in recovery.

PARTICIPANT PROFILE:
- Recovery Capital Score: ${assessments[0]?.total_score || 'Not assessed'}
- Housing Status: ${housingStatus?.current_status || 'Unknown'}
- Recent Activities: ${activities.map(a => a.activity_type).join(', ') || 'None logged'}
- County: ${profile?.county || 'Not specified'}

EVIDENCE-BASED FRAMEWORK:
Use neuroplasticity principles and trauma-informed language. Focus on:
1. Housing Goal - Stable, safe environment for brain healing
2. Employment Goal - Meaningful work for dopamine regulation
3. Recovery Goal - Peer support and community connection
4. Legal Obligations - Court compliance and therapeutic accountability
5. Support Network - Relationships that modulate brain reward circuits

Generate a compassionate, actionable case plan in JSON format.`;

    const casePlan = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          housing_goal: { type: 'string' },
          employment_goal: { type: 'string' },
          recovery_goal: { type: 'string' },
          legal_obligations: { type: 'string' },
          support_network: { type: 'string' },
          generated_date: { type: 'string' }
        }
      }
    });

    casePlan.generated_date = new Date().toISOString();

    // Update or create ANCHOR case
    const existingCases = await base44.asServiceRole.entities.ANCHORCase.filter({ participant_email });
    
    if (existingCases.length > 0) {
      await base44.asServiceRole.entities.ANCHORCase.update(existingCases[0].id, {
        comprehensive_case_plan: casePlan
      });
    } else {
      await base44.asServiceRole.entities.ANCHORCase.create({
        participant_email,
        anchor_status: 'intake',
        comprehensive_case_plan: casePlan,
        assigned_specialist_email: user.email
      });
    }

    return Response.json({ 
      success: true, 
      case_plan: casePlan,
      message: 'ANCHOR Comprehensive Case Plan generated successfully'
    });

  } catch (error) {
    console.error('Error generating ANCHOR case plan:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});