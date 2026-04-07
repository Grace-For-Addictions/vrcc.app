import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse form data
    const formData = await req.json();
    
    console.log('Processing Program Activity Form:', formData);
    
    // Map form fields to ProgramActivityLog entity
    const activityData = {
      participant_name: formData['client_name'],
      participant_email: formData['client_email'] || formData['EMAIL-CONT'], // Try to get from intake
      activity_date: formData['activity_date'] ? new Date(formData['activity_date']).toISOString() : new Date().toISOString(),
      activity_type: formData['activity_type']?.toLowerCase().replace(/ /g, '_') || 'peer_coaching_session',
      activity_notes: formData['activity_notes'],
      referral_made: formData['referral_made'] === 'Yes',
      referral_type: formData['referral_type']?.toLowerCase().replace(/ /g, '_').replace(/\//g, '_'),
      referral_specify: formData['referral_specify'],
      goal_set: formData['goal_set'] === 'Yes',
      goal_description: formData['set_goal'],
      employment_status_update: formData['employment_status']?.toLowerCase(),
      employment_type: formData['employment_type']?.toLowerCase().replace(/ /g, '_').replace(/\//g, '_'),
      living_status_update: formData['living_status']?.replace(/\s*\(.*?\)/g, '').toLowerCase().replace(/ /g, '_'),
      drug_test_date: formData['drug_test_date'],
      drug_test_result: formData['drug_test_result']?.toLowerCase()
    };
    
    // Create activity log
    const activityLog = await base44.asServiceRole.entities.ProgramActivityLog.create(activityData);
    
    console.log('Activity log created:', activityLog.id);
    
    // If referral was made, create closed-loop referral
    if (activityData.referral_made && activityData.referral_type) {
      const referralData = {
        participant_email: activityData.participant_email,
        referral_to: formData['referral_specify'] || activityData.referral_type,
        service_type: mapReferralTypeToServiceType(activityData.referral_type),
        referral_method: 'cold_referral',
        status: 'sent',
        sent_date: new Date().toISOString(),
        referred_by: activityData.logged_by || 'system'
      };
      
      await base44.asServiceRole.entities.ClosedLoopReferral.create(referralData);
      console.log('Closed-loop referral created');
    }
    
    // Update employment/housing status in UserProfile if changed
    if (activityData.participant_email) {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
        created_by: activityData.participant_email 
      });
      
      if (profiles.length > 0) {
        const updateData = {};
        
        // Update employment if changed
        if (activityData.employment_status_update) {
          const empStatus = await base44.asServiceRole.entities.EmploymentHistory.filter({ 
            user_email: activityData.participant_email 
          });
          
          const empData = {
            user_email: activityData.participant_email,
            current_employment_status: mapEmploymentStatus(activityData.employment_status_update),
            full_time_vs_part_time: activityData.employment_type?.includes('full') ? 'full_time' : 
                                    activityData.employment_type?.includes('part') ? 'part_time' : 'n/a'
          };
          
          if (empStatus.length > 0) {
            await base44.asServiceRole.entities.EmploymentHistory.update(empStatus[0].id, empData);
          } else {
            await base44.asServiceRole.entities.EmploymentHistory.create(empData);
          }
        }
        
        // Update housing if changed
        if (activityData.living_status_update) {
          const housingStatus = await base44.asServiceRole.entities.HousingStatus.filter({ 
            user_email: activityData.participant_email 
          });
          
          const housingData = {
            user_email: activityData.participant_email,
            housing_status: mapHousingStatus(activityData.living_status_update)
          };
          
          if (housingStatus.length > 0) {
            await base44.asServiceRole.entities.HousingStatus.update(housingStatus[0].id, housingData);
          } else {
            await base44.asServiceRole.entities.HousingStatus.create(housingData);
          }
        }
      }
    }
    
    return Response.json({ 
      success: true, 
      message: 'Program activity form processed successfully',
      activity_log_id: activityLog.id
    });
    
  } catch (error) {
    console.error('Error processing program activity form:', error);
    return Response.json({ 
      error: 'Failed to process program activity form', 
      details: error.message 
    }, { status: 500 });
  }
});

function mapReferralTypeToServiceType(referralType) {
  const mapping = {
    'housing_assistance': 'housing',
    'shelter_placement': 'housing',
    'sober_living_placement': 'housing',
    'detox_admission': 'detox',
    'residential_treatment': 'treatment',
    'outpatient_treatment_iop': 'treatment',
    'mental_health_counseling': 'mental_health',
    'psychiatric_services': 'mental_health',
    'primary_care': 'medical',
    'dental_care': 'medical',
    'mat_provider': 'treatment',
    'transportation_assistance': 'transportation',
    'food_pantry': 'food',
    'legal_aid': 'legal',
    'court_advocacy': 'legal',
    'employment_services': 'employment',
    'education_ged': 'education',
    'vocational_training': 'education'
  };
  
  return mapping[referralType] || 'other';
}

function mapEmploymentStatus(status) {
  const mapping = {
    'employed': 'employed_full_time',
    'unemployed': 'unemployed',
    'student': 'student'
  };
  return mapping[status] || 'unemployed';
}

function mapHousingStatus(status) {
  const mapping = {
    'unsheltered': 'homeless_unsheltered',
    'emergency_shelter': 'homeless_sheltered',
    'safe_haven': 'homeless_sheltered',
    'transitional_housing': 'transitional_housing',
    'treatment_residential': 'transitional_housing',
    'sober_living': 'transitional_housing',
    'staying_with_family': 'temporary_housing',
    'hotel_self_paid': 'temporary_housing',
    'hotel_voucher': 'temporary_housing',
    'rented_market': 'permanent_housing',
    'rented_subsidy': 'permanent_housing',
    'owned_housing': 'permanent_housing',
    'institutional': 'temporary_housing',
    'jail_prison': 'temporary_housing'
  };
  
  return mapping[status] || 'at_risk_homelessness';
}