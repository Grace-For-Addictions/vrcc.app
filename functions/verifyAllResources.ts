import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all resources
    const resources = await base44.asServiceRole.entities.Resource.list('-updated_date', 500);

    console.log(`Starting verification of ${resources.length} resources...`);

    let verified = 0;
    let failed = 0;

    // Verify each resource
    for (const resource of resources) {
      try {
        await base44.asServiceRole.functions.invoke('verifyResourceDetails', {
          resource_id: resource.id
        });
        verified++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to verify ${resource.name}:`, error);
        failed++;
      }
    }

    return Response.json({
      success: true,
      total_resources: resources.length,
      verified,
      failed
    });
  } catch (error) {
    console.error('Bulk verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});