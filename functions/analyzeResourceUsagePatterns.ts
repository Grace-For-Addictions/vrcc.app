import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.user_role !== 'administrator')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Analyze resource request patterns
    const requests = await base44.asServiceRole.entities.ResourceRequest.list('-created_date', 200);
    
    // Analyze telehealth kiosk usage
    const kioskBookings = await base44.asServiceRole.entities.TelehealthKioskBooking.list('-created_date', 200);

    // Calculate patterns
    const resourceTypeFrequency = requests.reduce((acc, r) => {
      acc[r.resource_type] = (acc[r.resource_type] || 0) + 1;
      return acc;
    }, {});

    const urgentRequests = requests.filter(r => r.urgency_level === 'critical' || r.urgency_level === 'high');
    const ruralRequests = requests.filter(r => r.is_rural);
    const unhousedRequests = requests.filter(r => r.is_unhoused);

    // AI recommendation for offline resource prioritization
    const analysisPrompt = `You are analyzing MRCC resource usage patterns to optimize offline resource caching.

USAGE DATA:
- Total resource requests: ${requests.length}
- Urgent requests (critical/high): ${urgentRequests.length}
- Rural population requests: ${ruralRequests.length}
- Unhoused population requests: ${unhousedRequests.length}

RESOURCE TYPE BREAKDOWN:
${Object.entries(resourceTypeFrequency).map(([type, count]) => `- ${type}: ${count} requests`).join('\n')}

TELEHEALTH KIOSK BOOKINGS:
- Total bookings: ${kioskBookings.length}
- Most common service: ${kioskBookings.reduce((acc, b) => {
  acc[b.service_type] = (acc[b.service_type] || 0) + 1;
  return acc;
}, {})}

Based on this data, recommend:
1. Top 5 resources to prioritize for offline caching
2. Which populations need targeted resource expansion
3. What new resources should be developed
4. Estimated impact of offline access expansion

Return as structured JSON.`;

    const recommendations = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          offline_priority_resources: {
            type: "array",
            items: { type: "string" }
          },
          target_populations: {
            type: "array",
            items: { type: "string" }
          },
          new_resources_needed: {
            type: "array",
            items: { type: "string" }
          },
          estimated_impact: { type: "string" }
        }
      }
    });

    return Response.json({ 
      success: true,
      usage_stats: {
        total_requests: requests.length,
        urgent_requests: urgentRequests.length,
        rural_requests: ruralRequests.length,
        unhoused_requests: unhousedRequests.length,
        resource_type_frequency: resourceTypeFrequency
      },
      ai_recommendations: recommendations
    });

  } catch (error) {
    console.error('Error analyzing resource patterns:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});