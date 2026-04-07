import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { participant_email, recommended_resources } = await req.json();

    const createdRequests = [];

    // Automatically generate ResourceRequests for high-urgency AI recommendations
    for (const resource of recommended_resources) {
      if (resource.urgency === 'immediate' || resource.urgency === 'within_24h') {
        
        // Determine resource type and urgency
        let resourceType = 'offline_content';
        let urgencyLevel = 'high';
        
        if (resource.category === 'narcan') resourceType = 'crisis_materials';
        if (resource.resource_name?.toLowerCase().includes('wifi')) resourceType = 'wifi_access';
        if (resource.resource_name?.toLowerCase().includes('hotspot')) resourceType = 'mobile_hotspot';
        if (resource.urgency === 'immediate') urgencyLevel = 'critical';

        const profile = await base44.asServiceRole.entities.UserProfile.filter({ 
          created_by: participant_email 
        }).then(p => p[0]).catch(() => null);

        const request = await base44.asServiceRole.entities.ResourceRequest.create({
          requester_email: participant_email,
          requester_name: profile?.display_name || profile?.first_name || 'Participant',
          resource_type: resourceType,
          specific_resource: resource.resource_name,
          urgency_level: urgencyLevel,
          reason_for_request: `AI-recommended: ${resource.relevance_reason}`,
          location: profile?.county || 'Unknown',
          is_rural: profile?.county && !['Polk', 'Linn', 'Scott'].includes(profile.county),
          is_unhoused: profile?.living_status_update === 'unsheltered',
          ai_priority_score: resource.urgency === 'immediate' ? 95 : 75
        });

        createdRequests.push(request);

        // Notify participant
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: participant_email,
          subject: '📦 Resource Request Initiated - Grace For Addictions',
          body: `Hi there! 💚

Based on your current journey, we've identified that you could benefit from:

**${resource.resource_name}**

We've automatically requested this resource for you. Our MRCC team will prioritize fulfillment and reach out within 24 hours.

Why this matters: ${resource.relevance_reason}

You're not alone on this journey.

With care,
The GFA Team`
        });
      }
    }

    return Response.json({ 
      success: true,
      requests_created: createdRequests.length,
      requests: createdRequests
    });

  } catch (error) {
    console.error('Error auto-generating resource requests:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});