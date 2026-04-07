import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('sendVolunteerReminders: Starting reminder check');
    
    // Get upcoming shifts in next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const shifts = await base44.asServiceRole.entities.VolunteerShift.filter({
      shift_date: tomorrowStr,
      status: 'scheduled'
    });
    
    console.log(`Found ${shifts.length} shifts for tomorrow`);
    
    let remindersSent = 0;
    
    for (const shift of shifts) {
      // Skip if reminder already sent
      if (shift.reminder_sent) continue;
      
      // Get volunteer profile
      const volunteers = await base44.asServiceRole.entities.VolunteerProfile.filter({
        volunteer_email: shift.volunteer_email
      });
      
      if (volunteers.length === 0) continue;
      const volunteer = volunteers[0];
      
      // Send reminder email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: shift.volunteer_email,
        subject: '🤝 Grace For Addictions - Volunteer Shift Reminder',
        body: `Hello ${volunteer.volunteer_name},

This is a friendly reminder about your upcoming volunteer shift:

📅 Date: ${new Date(shift.shift_date).toLocaleDateString()}
⏰ Time: ${shift.shift_time}
🎯 Role: ${shift.role?.replace(/_/g, ' ')}
📍 Location: ${shift.location || 'Virtual'}

${shift.opportunity_title ? `Opportunity: ${shift.opportunity_title}` : ''}

Thank you for your dedication to serving the GFA community. Your time and compassion make a profound difference in the lives of those navigating their recovery journey.

If you need to reschedule or have questions, please contact us at reporting@graceforaddictions.org.

With gratitude,
Grace For Addictions Team

---
"Community Rewires the Brain" 💚`
      });
      
      // Mark reminder as sent
      await base44.asServiceRole.entities.VolunteerShift.update(shift.id, {
        reminder_sent: true,
        reminder_sent_date: new Date().toISOString()
      });
      
      remindersSent++;
    }
    
    console.log(`Sent ${remindersSent} volunteer shift reminders`);
    
    return Response.json({ 
      success: true, 
      reminders_sent: remindersSent,
      shifts_checked: shifts.length
    });
    
  } catch (error) {
    console.error('Error sending volunteer reminders:', error);
    return Response.json({ 
      error: 'Failed to send volunteer reminders', 
      details: error.message 
    }, { status: 500 });
  }
});