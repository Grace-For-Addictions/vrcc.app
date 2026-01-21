import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Heart, Shield, MessageCircle, Users, 
  TrendingUp, MapPin, Calendar, Phone, Globe
} from 'lucide-react';

const capabilities = [
  {
    category: "Proactive Engagement",
    icon: TrendingUp,
    color: "text-blue-600",
    features: [
      "Detects inactivity and reaches out",
      "Celebrates recovery milestones",
      "Flags risk indicators (with human oversight)",
      "Analyzes mood trends from check-ins",
      "Recommends peer matches"
    ]
  },
  {
    category: "Crisis De-Escalation",
    icon: Phone,
    color: "text-red-600",
    features: [
      "Grounding exercises (5-4-3-2-1)",
      "Immediate 988 Crisis Lifeline provision",
      "Validation & normalization techniques",
      "Escalation tree for human support",
      "Iowa Warm Line connection"
    ]
  },
  {
    category: "Resource Navigation",
    icon: MapPin,
    color: "text-green-600",
    features: [
      "Iowa-wide resource matching",
      "Location & insurance-based filtering",
      "Warm hand-off instructions",
      "Referral outcome tracking",
      "Narcan access points"
    ]
  },
  {
    category: "Therapeutic Frameworks",
    icon: Brain,
    color: "text-purple-600",
    features: [
      "ACT (Acceptance & Commitment Therapy)",
      "Motivational Interviewing (MI)",
      "CRAFT (family support)",
      "Trauma-Informed Care (TIC)",
      "DBT & CBT techniques"
    ]
  },
  {
    category: "Meeting Support",
    icon: Users,
    color: "text-teal-600",
    features: [
      "Pre-meeting reminders",
      "Post-meeting reflection prompts",
      "GFARC meeting integration",
      "Peer coaching coordination",
      "Event attendance tracking"
    ]
  },
  {
    category: "Multilingual & Cultural",
    icon: Globe,
    color: "text-orange-600",
    features: [
      "Real-time translation (Spanish MVP)",
      "Culturally adapted responses",
      "Faith-inclusive content (opt-in)",
      "Cultural humility in all interactions",
      "Accessibility features"
    ]
  }
];

export default function EnhancedGraceCapabilities() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI Grace Enhanced Capabilities
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Powered by advanced AI with 10,000+ knowledge base entries, therapeutic frameworks, 
          and continuous learning—all while maintaining human oversight and ethical safeguards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capabilities.map((cap, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <cap.icon className={`w-5 h-5 ${cap.color}`} />
                {cap.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {cap.features.map((feature, fidx) => (
                  <li key={fidx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-teal-600 mt-1">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Mitigation */}
      <Card className="border-2 border-teal-200 bg-teal-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-700" />
            Ethical AI & Risk Mitigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <Badge className="bg-green-100 text-green-800 shrink-0">Human Oversight</Badge>
            <p>All AI-generated notes reviewed by Peer Recovery Coaches</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-blue-100 text-blue-800 shrink-0">Privacy First</Badge>
            <p>42 CFR Part 2 & HIPAA compliant, zero-knowledge encryption</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-purple-100 text-purple-800 shrink-0">Bias Mitigation</Badge>
            <p>Annual Community Oversight Board audits of decision logic</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-orange-100 text-orange-800 shrink-0">No Hallucinations</Badge>
            <p>Grounded in real Iowa resources, verified knowledge base</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500">
        <p>Grace is an AI tool and cannot replace human support.</p>
        <p>Always reach out to qualified professionals for medical advice.</p>
      </div>
    </div>
  );
}