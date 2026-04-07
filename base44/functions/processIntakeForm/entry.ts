import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse form data from BeePurple
    const formData = await req.json();
    
    // Helper function to parse full name
    const parseName = (fullName) => {
      if (!fullName) return { first_name: '', last_name: '' };
      const parts = fullName.trim().split(' ');
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';
      return { first_name, last_name };
    };
    
    // Helper function to convert MM/DD/YYYY to YYYY-MM-DD
    const convertDate = (mmddyyyy) => {
      if (!mmddyyyy) return null;
      const [month, day, year] = mmddyyyy.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };
    
    // Helper function to parse comma-separated values to array
    const parseArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return value.split(',').map(v => v.trim()).filter(v => v);
    };
    
    // Map form fields to UserProfile entity
    const { first_name, last_name } = parseName(formData['CONTACT-CONT']);
    const dob = convertDate(formData['ANAL01-RCMANL']);
    
    // Parse race/ethnicity
    const raceArray = parseArray(formData['ANAL21-RCMANL']);
    const ethnicityArray = parseArray(formData['ANAL10-RCMANL[]']);
    
    // Handle gender identity with "Other" option
    let genderIdentity = [formData['ANAL02-RCMANL']];
    if (formData['ANAL02-RCMANL'] === 'Othergender' && formData['gender-other']) {
      genderIdentity = [formData['gender-other']];
    }
    
    // Calculate age from DOB
    const calculateAge = (dobString) => {
      if (!dobString) return null;
      const birthDate = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };
    
    const userEmail = formData['EMAIL-CONT'];
    
    // Check if user profile already exists
    const existingProfiles = await base44.asServiceRole.entities.UserProfile.filter({ 
      created_by: userEmail 
    });
    
    const profileData = {
      display_name: first_name || 'Participant',
      first_name,
      last_name,
      dob,
      age: calculateAge(dob),
      gender_identity: genderIdentity,
      pronouns: formData['ANAL14-RCMANL'],
      race_ethnicity_primary: raceArray.slice(0, 1),
      race_ethnicity_additional: raceArray.slice(1),
      ethnicity: ethnicityArray,
      highest_education: formData['ANAL47-RCMANL'],
      phone_primary: formData['TELEPHONE-TELRCM'],
      emergency_contact_name: formData['ANAL18-RCMANL'],
      emergency_contact_relationship: formData['ANAL19-RCMANL'],
      emergency_contact_phone: formData['ANAL20-RCMANL'],
      drivers_license_status: formData['ANAL48-RCMANL'],
      transportation_access: formData['ANAL25-RCMANL'],
      intake_date: new Date().toISOString().split('T')[0],
      active_status: true,
      stage: 'exploring',
      client_id: formData['CONTACT-CONT']?.replace(/\s+/g, '_').toLowerCase() // Generate client ID
    };
    
    let userProfile;
    if (existingProfiles.length > 0) {
      // Update existing profile
      userProfile = await base44.asServiceRole.entities.UserProfile.update(
        existingProfiles[0].id,
        profileData
      );
    } else {
      // Create new profile
      userProfile = await base44.asServiceRole.entities.UserProfile.create({
        ...profileData,
        created_by: userEmail
      });
    }
    
    // Handle Housing Status (separate entity)
    let housingStatus = formData['ANAL12-RCMANL'];
    if (housingStatus === 'Other' && formData['housing-other-text']) {
      housingStatus = formData['housing-other-text'];
    }
    
    // Map form housing values to entity enum values
    const housingStatusMap = {
      'Owned Housing': 'permanent_housing',
      'Rented Housing (market rate)': 'permanent_housing',
      'Rented Housing (with subsidy)': 'permanent_housing',
      'Transitional Housing': 'transitional_housing',
      'Sober Living/Recovery Housing': 'transitional_housing',
      'Emergency Shelter': 'homeless_sheltered',
      'Safe Haven': 'homeless_sheltered',
      'Staying with Family/Friends (couch-surfing)': 'temporary_housing',
      'Hotel/Motel (self-paid)': 'temporary_housing',
      'Hotel/Motel (voucher/program-paid)': 'temporary_housing',
      'Unsheltered (street/vehicle/encampment)': 'homeless_unsheltered',
      'Treatment/Residential Program': 'transitional_housing',
      'Institutional Setting (hospital/psychiatric)': 'temporary_housing',
      'Jail/Prison': 'temporary_housing'
    };
    
    const mappedHousingStatus = housingStatusMap[housingStatus] || 'at_risk_homelessness';
    
    const existingHousing = await base44.asServiceRole.entities.HousingStatus.filter({ 
      user_email: userEmail 
    });
    
    const housingData = {
      user_email: userEmail,
      housing_status: mappedHousingStatus,
      current_address: housingStatus // Store original form value
    };
    
    if (existingHousing.length > 0) {
      await base44.asServiceRole.entities.HousingStatus.update(
        existingHousing[0].id,
        housingData
      );
    } else {
      await base44.asServiceRole.entities.HousingStatus.create(housingData);
    }
    
    // Handle Legal Status (separate entity)
    const legalStatusMap = {
      'None': 'none',
      'Pretrial': 'pending_charges',
      'Probation': 'probation',
      'Parole': 'parole',
      'Diversion': 'diversion_program',
      'Drug/Recovery Court (active)': 'diversion_program',
      'Drug/Recovery Court (completed)': 'diversion_program',
      'Reentry (released <12 months)': 'parole',
      'Incarcerated': 'incarcerated'
    };
    
    const mappedLegalStatus = legalStatusMap[formData['ANAL29-RCMANL']] || 'none';
    
    const existingLegal = await base44.asServiceRole.entities.LegalStatus.filter({ 
      user_email: userEmail 
    });
    
    const legalData = {
      user_email: userEmail,
      current_legal_status: mappedLegalStatus
    };
    
    if (existingLegal.length > 0) {
      await base44.asServiceRole.entities.LegalStatus.update(
        existingLegal[0].id,
        legalData
      );
    } else {
      await base44.asServiceRole.entities.LegalStatus.create(legalData);
    }
    
    return Response.json({ 
      success: true, 
      message: 'Intake form processed successfully',
      user_profile_id: userProfile.id,
      user_email: userEmail
    });
    
  } catch (error) {
    console.error('Error processing intake form:', error);
    return Response.json({ 
      error: 'Failed to process intake form', 
      details: error.message 
    }, { status: 500 });
  }
});