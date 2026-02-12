import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.user_role !== 'navigator')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { edit_suggestion_id, action, review_notes } = await req.json();
    
    if (!edit_suggestion_id || !action) {
      return Response.json({ error: 'edit_suggestion_id and action required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'action must be approve or reject' }, { status: 400 });
    }

    // Fetch the edit suggestion
    const editSuggestion = await base44.entities.ResourceEditSuggestion.get(edit_suggestion_id);
    
    if (!editSuggestion) {
      return Response.json({ error: 'Edit suggestion not found' }, { status: 404 });
    }

    if (editSuggestion.status !== 'pending') {
      return Response.json({ error: 'Edit suggestion already processed' }, { status: 400 });
    }

    // Update the suggestion status
    await base44.entities.ResourceEditSuggestion.update(edit_suggestion_id, {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: user.email,
      review_notes: review_notes || '',
      reviewed_date: new Date().toISOString()
    });

    let updatedResource = null;

    // If approved, apply changes to the actual resource
    if (action === 'approve') {
      const resource = await base44.entities.Resource.get(editSuggestion.resource_id);
      
      if (!resource) {
        return Response.json({ error: 'Resource not found' }, { status: 404 });
      }

      // Apply proposed changes
      updatedResource = await base44.entities.Resource.update(
        editSuggestion.resource_id,
        editSuggestion.proposed_changes
      );

      // Trigger re-verification after update
      try {
        await base44.functions.invoke('tagResourceContent', { 
          resource_id: editSuggestion.resource_id 
        });
      } catch (e) {
        console.error('Failed to re-tag resource:', e);
      }
    }

    // Notify the suggester
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: editSuggestion.suggested_by_email,
        subject: `Resource Edit ${action === 'approve' ? 'Approved' : 'Declined'} - ${editSuggestion.resource_name}`,
        body: `
Hello ${editSuggestion.suggested_by_name || 'there'},

Your suggested edit to "${editSuggestion.resource_name}" has been ${action === 'approve' ? 'approved and applied' : 'declined'}.

${review_notes ? `\n**Reviewer Notes:**\n${review_notes}\n` : ''}

Thank you for helping keep our resource directory accurate and up-to-date!

- Grace For Addictions Team
        `
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    return Response.json({
      success: true,
      action,
      edit_suggestion_id,
      resource_updated: action === 'approve',
      updated_resource: updatedResource
    });

  } catch (error) {
    console.error('Process edit suggestion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});