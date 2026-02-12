import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || !data) {
      return Response.json({ success: true, message: 'Not a create event' });
    }

    // Get all navigators/admins
    const users = await base44.asServiceRole.entities.User.list();
    const navigators = users.filter(u => 
      u.role === 'admin' || u.user_role === 'navigator'
    );

    // Send email to each navigator
    for (const navigator of navigators) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: navigator.email,
          subject: `New Resource Edit Suggestion - ${data.resource_name}`,
          body: `
A community member has suggested edits to a resource.

**Resource:** ${data.resource_name}
**Suggested by:** ${data.suggested_by_name || data.suggested_by_email}
**Reason:** ${data.change_reason}

**Proposed Changes:**
${JSON.stringify(data.proposed_changes, null, 2)}

Please review in the Resource Moderation dashboard.
          `
        });
      } catch (e) {
        console.error(`Failed to email ${navigator.email}:`, e);
      }
    }

    return Response.json({ 
      success: true, 
      notified: navigators.length 
    });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});