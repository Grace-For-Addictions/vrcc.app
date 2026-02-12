import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { intakeId } = await req.json();

    // Fetch the intake submission
    const intake = await base44.asServiceRole.entities.IntakeSubmission.filter({ id: intakeId });
    if (!intake || intake.length === 0) {
      return Response.json({ error: 'Intake not found' }, { status: 404 });
    }

    const intakeData = intake[0];

    // Determine auto-assignment and track
    let assignedCoordinator = null;
    let recommendedTrack = null;
    let eligibilityStatus = 'eligible';

    // Crisis auto-assignment - find first available program_staff or admin
    if (intakeData.urgencyLevel === 'crisis') {
      const staff = await base44.asServiceRole.entities.User.filter({ 
        user_role: { $in: ['program_staff', 'administrator'] } 
      });
      if (staff && staff.length > 0) {
        assignedCoordinator = staff[0].email;
      }
      recommendedTrack = 'peer_support'; // Immediate peer support for crisis
    }

    // Referral source-based track assignment
    if (intakeData.referralSource) {
      const source = intakeData.referralSource.toLowerCase();
      if (source.includes('housing') || source.includes('shelter')) {
        recommendedTrack = 'housing';
      } else if (source.includes('court') || source.includes('justice')) {
        recommendedTrack = 'peer_support';
      } else if (source.includes('treatment') || source.includes('medical')) {
        recommendedTrack = 'coaching';
      } else if (source.includes('neuro') || source.includes('brain')) {
        recommendedTrack = 'neuro_rewiring';
      }
    }

    // Housing status override
    if (intakeData.housingStatus === 'unsheltered') {
      recommendedTrack = 'housing';
    }

    // Create auto IntakeReview
    const review = await base44.asServiceRole.entities.IntakeReview.create({
      intakeSubmissionId: intakeId,
      reviewedBy: 'system_auto',
      eligibilityStatus,
      recommendedTrack: recommendedTrack || 'coaching',
      assignedCoordinator: assignedCoordinator || user.email,
      notes: `Auto-generated review based on urgency: ${intakeData.urgencyLevel}, source: ${intakeData.referralSource || 'N/A'}`,
      reviewCompletedAt: new Date().toISOString()
    });

    // Update intake status
    await base44.asServiceRole.entities.IntakeSubmission.update(intakeId, {
      status: 'under_review'
    });

    return Response.json({ 
      success: true, 
      review,
      message: 'Intake auto-processed successfully'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});