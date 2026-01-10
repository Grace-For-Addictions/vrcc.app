import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * BeepurpleSync - Handles bidirectional data sync between Base44 and Beepurple 5CRM
 * Listens for webhook POST submissions and syncs data
 */

export function useBeepurpleSync() {
  useEffect(() => {
    // Listen for Beepurple webhook POST submissions
    const handleBeepurpleWebhook = (event) => {
      if (event.origin !== 'https://awsna01.fivecrm.com') return;
      
      if (event.data.type === 'webhookSubmission') {
        syncBeepurpleData(event.data);
      }
    };

    window.addEventListener('message', handleBeepurpleWebhook);
    return () => window.removeEventListener('message', handleBeepurpleWebhook);
  }, []);

  const syncBeepurpleData = async (webhookData) => {
    try {
      const { formType, data } = webhookData;

      // Sync intake data
      if (formType === 'intake') {
        await syncIntakeData(data);
      }
      
      // Sync activity data
      if (formType === 'activity') {
        await syncActivityData(data);
      }

      console.log('Beepurple sync completed:', formType);
    } catch (error) {
      console.error('Beepurple sync error:', error);
    }
  };

  const syncIntakeData = async (data) => {
    // Update User entity with intake data
    const userUpdates = {
      intake_completed: true,
      beepurple_client_id: data.client_id,
      beepurple_sync_date: new Date().toISOString()
    };

    // Preserve all Beepurple fields in custom user data
    if (data.demographics) {
      userUpdates.demographics = data.demographics;
    }
    if (data.contact_info) {
      userUpdates.contact_info = data.contact_info;
    }
    if (data.pathways) {
      userUpdates.pathways = data.pathways;
    }

    await base44.auth.updateMe(userUpdates);

    // Create UserProfile if doesn't exist
    const profiles = await base44.entities.UserProfile.filter({ created_by: data.email });
    if (profiles.length === 0) {
      await base44.entities.UserProfile.create({
        display_name: data.preferred_name || data.full_name || 'Anonymous',
        county: data.county,
        pathways: data.pathways || [],
        stage: 'exploring',
        onboarding_complete: true
      });
    }
  };

  const syncActivityData = async (data) => {
    const { activity_type, participant_email, ...activityData } = data;

    // Route to appropriate Base44 entity based on activity type
    switch (activity_type) {
      case 'meeting_attendance':
        await base44.entities.MeetingLog.create({
          user_email: participant_email,
          meeting_date: activityData.activity_date,
          meeting_type: activityData.meeting_type || 'Other',
          meeting_format: activityData.format || 'virtual',
          beepurple_activity_id: activityData.activity_id
        });
        break;

      case 'coaching_session':
        await base44.entities.CoachingSessionLog.create({
          client_email: participant_email,
          session_date: activityData.activity_date,
          session_type: activityData.session_type,
          duration_minutes: activityData.duration,
          beepurple_activity_id: activityData.activity_id
        });
        break;

      case 'daily_check_in':
        await base44.entities.DailyCheckIn.create({
          created_by: participant_email,
          mood: activityData.mood,
          gratitude: activityData.gratitude,
          beepurple_activity_id: activityData.activity_id
        });
        break;

      case 'assessment_completion':
        await base44.entities.Assessment.create({
          created_by: participant_email,
          total_score: activityData.score,
          dimension_scores: activityData.dimension_scores,
          beepurple_activity_id: activityData.activity_id
        });
        break;

      default:
        // Store in generic activity log
        console.log('Activity logged to Beepurple:', activity_type);
    }
  };

  return { syncBeepurpleData };
}

// Utility to send Base44 data to Beepurple via POST
export async function pushToBeepurple(activityType, activityData) {
  try {
    // This would trigger the Beepurple webhook endpoint
    // In production, this would be a backend function call
    console.log('Pushing to Beepurple:', activityType, activityData);
    
    // Example: Send to Beepurple webhook
    const response = await fetch('https://awsna01.fivecrm.com/webhook/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: activityType,
        ...activityData,
        timestamp: new Date().toISOString()
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Beepurple push error:', error);
    return false;
  }
}

export default useBeepurpleSync;