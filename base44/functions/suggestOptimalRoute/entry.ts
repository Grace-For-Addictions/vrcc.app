import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { destination_lat, destination_lng, destination_name } = await req.json();

    // Get user's current location (from profile or provided)
    const profile = await base44.entities.UserProfile.filter({ created_by: user.email })
      .then(p => p[0]).catch(() => null);

    // AI-powered route optimization with transit integration
    const routePrompt = `You are GFA's "Transit Navigator" AI agent helping rural Iowa participants access services.

DESTINATION: ${destination_name}
Coordinates: ${destination_lat}, ${destination_lng}
Participant Location: ${profile?.county || 'Unknown'}, Iowa

IOWA TRANSIT CONTEXT:
- Rural areas often lack public transit
- DART (Des Moines Area Regional Transit) serves Polk County
- Many counties have limited or no transit
- MRCC mobile units can deploy to rural areas

ANALYZE & RECOMMEND:
1. Best transit option (if available)
   - Public bus routes
   - DART schedules (if Polk County)
   - Ride-share estimates
2. MRCC mobile unit deployment recommendation
   - If rural with no transit access
3. Optimal travel time suggestions
4. Alternative accessibility options
5. Cost estimates

Return structured route suggestions.`;

    const routeSuggestion = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: routePrompt,
      add_context_from_internet: true, // Get real-time transit data
      response_json_schema: {
        type: "object",
        properties: {
          recommended_option: { type: "string" },
          transit_available: { type: "boolean" },
          route_details: { type: "string" },
          estimated_travel_time: { type: "string" },
          estimated_cost: { type: "string" },
          mrcc_deployment_needed: { type: "boolean" },
          accessibility_notes: { type: "string" }
        }
      }
    });

    return Response.json({ 
      success: true,
      route_suggestion: routeSuggestion,
      participant_location: profile?.county
    });

  } catch (error) {
    console.error('Error suggesting route:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});