import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { narrative_type, target_audience, grant_context } = await req.json();

    // Agent 2: Neuroplasticity & Grant Architect
    const prompt = `You are the "Neuroplasticity & Grant Architect" for Grace For Addictions, specializing in clinical education and fundraising narratives.

NARRATIVE TYPE: ${narrative_type || 'workshop'}
TARGET AUDIENCE: ${target_audience || 'general_community'}
GRANT CONTEXT: ${grant_context || 'Iowa Opioid Settlement Fund / SAMHSA TIEH'}

REQUIRED CLINICAL LANGUAGE:
- "Structural and functional recovery" of brain circuitry post-cessation
- "Therapeutic substrate" - the neurobiological foundation for healing
- "Modulating brain reward circuits" through peer support and community connection
- Neuroplasticity as evidence-based mechanism for recovery
- Synaptic reorganization and dopaminergic pathway restoration
- Prefrontal cortex rehabilitation through consistent social connection

FRAMEWORK:
1. Opening Hook: Why the brain science matters for hope and healing
2. Core Education: Specific mechanisms of neuroplasticity in recovery
   - Cessation allows dendritic regrowth and myelin repair
   - Peer connection provides novel rewarding stimuli for circuit remodeling
   - Therapeutic community acts as environmental enrichment
3. Practical Application: How GFA's model leverages these mechanisms
4. Outcomes Language: Quantifiable metrics aligned with grant priorities
5. Call to Action: Investment in neuroplasticity-informed programming

TONE: Clinical yet compassionate, evidence-based yet hopeful, suitable for both grant reviewers and community workshops.

Generate a complete narrative (500-750 words) optimized for ${narrative_type === 'grant' ? 'grant application' : 'educational workshop'}.`;

    const narrative = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false
    });

    // Log for institutional knowledge capture
    await base44.asServiceRole.entities.CustomReport.create({
      report_name: `Neuroplasticity Narrative - ${narrative_type}`,
      report_type: 'neuroplasticity_education',
      generated_by: user.email,
      report_data: {
        narrative,
        narrative_type,
        target_audience,
        grant_context,
        generated_date: new Date().toISOString()
      }
    });

    return Response.json({ 
      success: true, 
      narrative,
      strategic_language_used: [
        'structural and functional recovery',
        'therapeutic substrate',
        'modulating brain reward circuits',
        'synaptic reorganization',
        'dopaminergic pathway restoration'
      ]
    });

  } catch (error) {
    console.error('Error generating neuroplasticity narrative:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});