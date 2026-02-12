import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function should be called via automation when a Resource is updated
    const { resourceId, changes } = await req.json();

    if (!resourceId) {
      return Response.json({ error: 'Resource ID required' }, { status: 400 });
    }

    // Get the resource
    const resources = await base44.asServiceRole.entities.Resource.filter({ id: resourceId });
    if (resources.length === 0) {
      return Response.json({ error: 'Resource not found' }, { status: 404 });
    }
    const resource = resources[0];

    // Find all users who favorited this resource with notifications enabled
    const favorites = await base44.asServiceRole.entities.FavoriteResource.filter({
      resource_id: resourceId,
      notify_on_changes: true
    });

    if (favorites.length === 0) {
      return Response.json({ message: 'No users to notify' });
    }

    // Send email notifications
    const notifications = await Promise.all(favorites.map(async (favorite) => {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: favorite.created_by,
          subject: `Update: ${resource.name}`,
          body: `
            <h2>Resource Update Notification</h2>
            <p>A resource you favorited has been updated:</p>
            <h3>${resource.name}</h3>
            
            <p><strong>Changes:</strong></p>
            <ul>
              ${Object.entries(changes || {}).map(([key, value]) => 
                `<li>${key}: ${value}</li>`
              ).join('')}
            </ul>
            
            <p><strong>Current Details:</strong></p>
            <ul>
              ${resource.phone ? `<li>Phone: ${resource.phone}</li>` : ''}
              ${resource.website ? `<li>Website: ${resource.website}</li>` : ''}
              ${resource.address ? `<li>Address: ${resource.address}, ${resource.city}, ${resource.state}</li>` : ''}
              ${resource.hours ? `<li>Hours: ${resource.hours}</li>` : ''}
            </ul>
            
            <p>View in app: <a href="${Deno.env.get('BASE44_APP_URL')}/resources?id=${resourceId}">View Resource</a></p>
            
            <p><small>To stop receiving notifications for this resource, remove it from your favorites.</small></p>
          `
        });
        return { success: true, email: favorite.created_by };
      } catch (error) {
        console.error(`Failed to notify ${favorite.created_by}:`, error);
        return { success: false, email: favorite.created_by, error: error.message };
      }
    }));

    return Response.json({
      message: 'Notifications sent',
      notified: notifications.filter(n => n.success).length,
      failed: notifications.filter(n => !n.success).length,
      details: notifications
    });

  } catch (error) {
    console.error('Notify Resource Changes Error:', error);
    return Response.json({ 
      error: error.message || 'Notification failed'
    }, { status: 500 });
  }
});