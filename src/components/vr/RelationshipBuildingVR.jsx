import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Heart, Users, MessageCircle, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function RelationshipBuildingVR({ user }) {
  const [activeScenario, setActiveScenario] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [emotionalState, setEmotionalState] = useState('calm');
  const [trustLevel, setTrustLevel] = useState(50);

  const scenarios = [
    {
      id: 'boundaries',
      title: 'Setting Healthy Boundaries',
      description: 'A friend from your past use asks to "catch up". Practice saying no with compassion.',
      difficulty: 'intermediate',
      icon: Users
    },
    {
      id: 'conflict',
      title: 'Family Conflict Resolution',
      description: 'Your parent brings up past mistakes during a recovery celebration. Practice de-escalation.',
      difficulty: 'advanced',
      icon: AlertTriangle
    },
    {
      id: 'vulnerability',
      title: 'Sharing Your Story',
      description: 'A new friend asks about your recovery journey. Practice vulnerability with discernment.',
      difficulty: 'beginner',
      icon: Heart
    },
    {
      id: 'rebuilding_trust',
      title: 'Rebuilding Trust',
      description: 'You missed a commitment to a loved one. Practice accountability and repair.',
      difficulty: 'intermediate',
      icon: CheckCircle
    }
  ];

  const startScenario = async (scenario) => {
    setActiveScenario(scenario);
    setConversation([]);
    setEmotionalState('calm');
    setTrustLevel(50);

    // AI generates realistic opening dialogue
    const opening = await base44.integrations.Core.InvokeLLM({
      prompt: `You are role-playing as a person in this scenario: "${scenario.description}". 

Generate a realistic opening statement that would start this conversation. Make it feel authentic, with natural language and emotion. 1-2 sentences.

Example tone: "Hey! Long time no see. I was thinking... wanna grab a drink and catch up like old times?"`
    });

    setConversation([{ role: 'npc', text: opening, emotion: 'hopeful' }]);
  };

  const handleResponse = async (responseType) => {
    const userResponses = {
      boundaries: {
        assertive: "I really appreciate you thinking of me, but I'm not in a place where that would support my recovery right now. I hope you understand.",
        passive: "Um, maybe... I don't know, I'll have to check my schedule...",
        aggressive: "No way. You should know better than to even ask me that."
      },
      conflict: {
        assertive: "I hear that you're hurt. Those were painful times for all of us. I'm working hard to be different now, and I'd love your support in focusing on who I'm becoming.",
        passive: "You're right, I was terrible. I'm sorry for everything...",
        aggressive: "Why do you always have to bring up the past? Can't you just be happy for me for once?"
      },
      vulnerability: {
        balanced: "Recovery has been a journey. I'm learning to be honest about my struggles while also protecting my peace. What made you curious?",
        oversharing: "Oh man, let me tell you EVERYTHING about my addiction and trauma...",
        closed: "I don't really want to talk about it."
      },
      rebuilding_trust: {
        accountable: "You're right, I didn't follow through, and that wasn't okay. I understand if you're frustrated. Here's what I'm going to do differently...",
        defensive: "It wasn't that big of a deal. You're overreacting.",
        minimizing: "Yeah, sorry. It won't happen again." 
      }
    };

    const userChoice = responseType;
    setConversation(prev => [...prev, { role: 'user', text: userResponses[activeScenario.id][userChoice], type: userChoice }]);

    // AI generates realistic NPC response + emotional feedback
    const aiFeedback = await base44.integrations.Core.InvokeLLM({
      prompt: `You are role-playing the other person in this scenario: "${activeScenario.description}".

The user responded: "${userResponses[activeScenario.id][userChoice]}"
Response type: ${userChoice}

Generate:
1. A realistic 1-2 sentence reply from the NPC's perspective (show how they would actually react)
2. Emotional impact on the relationship (positive/neutral/negative)
3. Trust level change (-20 to +20)
4. Brief coaching tip for the user (1 sentence)`,
      response_json_schema: {
        type: "object",
        properties: {
          npc_reply: { type: "string" },
          emotional_impact: { type: "string" },
          trust_change: { type: "number" },
          coaching_tip: { type: "string" }
        }
      }
    });

    setConversation(prev => [...prev, { role: 'npc', text: aiFeedback.npc_reply }]);
    setTrustLevel(Math.max(0, Math.min(100, trustLevel + aiFeedback.trust_change)));
    
    // Show coaching feedback
    setTimeout(() => {
      setConversation(prev => [...prev, { 
        role: 'coach', 
        text: aiFeedback.coaching_tip,
        impact: aiFeedback.emotional_impact
      }]);
    }, 1000);

    if (aiFeedback.trust_change > 0) {
      toast.success(`Trust increased by ${aiFeedback.trust_change}!`);
    }
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="text-center">
          <Heart className="w-12 h-12 mx-auto mb-3 text-rose-600" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">VR Healthy Relationship Building</h3>
          <p className="text-gray-700">
            Practice real conversations with AI role-playing. Build skills in boundaries, vulnerability, conflict resolution, and trust repair.
          </p>
        </div>
      </GraceCard>

      {!activeScenario ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((scenario) => (
            <GraceCard key={scenario.id} hover className="cursor-pointer" onClick={() => startScenario(scenario)}>
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  scenario.difficulty === 'beginner' ? 'bg-green-100' :
                  scenario.difficulty === 'intermediate' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <scenario.icon className={`w-6 h-6 ${
                    scenario.difficulty === 'beginner' ? 'text-green-600' :
                    scenario.difficulty === 'intermediate' ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900">{scenario.title}</h4>
                    <Badge variant="outline" className="text-xs capitalize">{scenario.difficulty}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </div>
              </div>
            </GraceCard>
          ))}
        </div>
      ) : (
        <>
          <GraceCard>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-900">{activeScenario.title}</h4>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-gray-600">Trust Level</div>
                  <div className="text-lg font-bold text-rose-600">{trustLevel}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Emotional State</div>
                  <div className="text-lg font-bold text-blue-600 capitalize">{emotionalState}</div>
                </div>
              </div>
            </div>

            {/* Conversation */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {conversation.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'coach' ? (
                    <div className="w-full p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-purple-900">AI Coach Feedback</p>
                          <p className="text-sm text-gray-700">{msg.text}</p>
                          {msg.impact && (
                            <Badge className="mt-2" variant={msg.impact === 'positive' ? 'default' : 'outline'}>
                              {msg.impact}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`max-w-[70%] p-4 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Response Options */}
            {conversation.length > 0 && conversation[conversation.length - 1].role === 'npc' && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-3">How do you respond?</p>
                {activeScenario.id === 'boundaries' && (
                  <>
                    <Button onClick={() => handleResponse('assertive')} className="w-full justify-start bg-green-600 hover:bg-green-700">
                      ✅ Assertive & Compassionate
                    </Button>
                    <Button onClick={() => handleResponse('passive')} variant="outline" className="w-full justify-start">
                      😬 Passive / Unclear
                    </Button>
                    <Button onClick={() => handleResponse('aggressive')} variant="outline" className="w-full justify-start">
                      ❌ Aggressive / Dismissive
                    </Button>
                  </>
                )}
                {activeScenario.id === 'conflict' && (
                  <>
                    <Button onClick={() => handleResponse('assertive')} className="w-full justify-start bg-green-600 hover:bg-green-700">
                      ✅ Validate + Set Boundary
                    </Button>
                    <Button onClick={() => handleResponse('passive')} variant="outline" className="w-full justify-start">
                      😔 Accept Blame Fully
                    </Button>
                    <Button onClick={() => handleResponse('aggressive')} variant="outline" className="w-full justify-start">
                      😤 Defensive / Counter-Attack
                    </Button>
                  </>
                )}
              </div>
            )}
          </GraceCard>

          <Button onClick={() => setActiveScenario(null)} variant="outline" className="w-full">
            Back to Scenarios
          </Button>
        </>
      )}
    </div>
  );
}