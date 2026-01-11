import React, { useState } from 'react';
import { Search, BookOpen, AlertCircle, Shield, Users, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GraceHeader from '@/components/common/GraceHeader';
import RoleGuard from '@/components/navigation/RoleGuard';

const globalPrinciples = [
  { title: "No Forced Progression", description: "Staff never push participants into Transformation Hub, goals, or programs" },
  { title: "No Clinical Claims", description: "Staff do not diagnose, treat, assess, or document clinical conclusions" },
  { title: "Document Engagement, Not Judgment", description: "Notes describe what happened, not interpretations of character, motivation, or risk" },
  { title: "Grace Harbor Is Sacred", description: "No tracking, no scoring, no follow-up requirements" }
];

const peerSupportSOPs = [
  {
    screen: "Assigned Participants",
    purpose: "Maintain continuity, not surveillance",
    responsibilities: [
      "Review engagement timeline",
      "Note patterns of participation (descriptive only)",
      "Identify opportunities for encouragement"
    ],
    required: [
      "Update engagement notes after meaningful contact",
      "Flag follow-up needs using Tasks (not notes)"
    ],
    doNot: [
      "Change readiness level unilaterally",
      "Record diagnostic language",
      "Use 'noncompliant,' 'resistant,' or 'failed'"
    ]
  },
  {
    screen: "Coaching Tools",
    purpose: "Support identity, habit formation, and regulation",
    responsibilities: [
      "Facilitate reflection",
      "Support goal and habit alignment",
      "Encourage self-directed progress"
    ],
    required: [
      "Log sessions",
      "Capture participant language verbatim where possible"
    ],
    doNot: [
      "Process unresolved trauma",
      "Provide crisis counseling",
      "Override consent boundaries"
    ]
  },
  {
    screen: "Community (VRCC Facilitation)",
    purpose: "Create belonging and safety",
    responsibilities: [
      "Facilitate groups",
      "Log attendance (engagement only)"
    ],
    required: [
      "Record participation as Engagement",
      "Note general themes (non-identifying)"
    ],
    doNot: [
      "Score attendance",
      "Track absences punitively",
      "Use participation as leverage"
    ]
  }
];

const programStaffSOPs = [
  {
    screen: "CRM Dashboard",
    purpose: "Prevent people from falling through the cracks",
    responsibilities: [
      "Monitor new entries",
      "Identify disengagement trends",
      "Support peer staff"
    ],
    required: [
      "Assign participants when appropriate",
      "Generate tasks for outreach"
    ],
    doNot: [
      "Edit participant narratives",
      "Alter historical engagement data"
    ]
  },
  {
    screen: "Participant Pipeline",
    purpose: "System-level continuity",
    responsibilities: [
      "Monitor status changes",
      "Review readiness patterns"
    ],
    required: [
      "Update status (engaged, paused, alumni) when appropriate",
      "Coordinate warm handoffs"
    ],
    doNot: [
      "Use readiness as a gate for services",
      "Remove access as a disciplinary action"
    ]
  },
  {
    screen: "Programs",
    purpose: "Program enrollment and oversight",
    responsibilities: [
      "Assign participants to programs",
      "Monitor enrollment capacity"
    ],
    required: [
      "Ensure consent is recorded",
      "Track completion (non-punitive)"
    ],
    doNot: [
      "Enroll participants without consent",
      "Require paid programs for support access"
    ]
  },
  {
    screen: "Reports",
    purpose: "Accountability and improvement",
    responsibilities: [
      "Review aggregate data",
      "Prepare funder reports"
    ],
    required: [
      "Validate accuracy",
      "Flag anomalies"
    ],
    doNot: [
      "Modify source data to improve optics",
      "Share participant-level data externally"
    ]
  }
];

const adminSOPs = [
  {
    screen: "System Settings",
    purpose: "Maintain platform stability",
    responsibilities: [
      "Manage configurations",
      "Approve structural changes"
    ],
    doNot: [
      "Make changes without audit trail",
      "Alter data retroactively"
    ]
  },
  {
    screen: "Roles & Permissions",
    purpose: "Protect boundaries",
    responsibilities: [
      "Assign roles",
      "Review permissions quarterly"
    ],
    doNot: [
      "Grant exceptions casually",
      "Create ad-hoc roles"
    ]
  },
  {
    screen: "Data Schema",
    purpose: "Long-term scalability",
    responsibilities: [
      "Maintain schema consistency",
      "Approve migrations"
    ]
  },
  {
    screen: "Audit Logs",
    purpose: "Transparency and defensibility",
    responsibilities: [
      "Monitor access",
      "Support audits"
    ]
  }
];

const executiveSOPs = [
  {
    screen: "Impact Dashboard",
    purpose: "Oversight, not management",
    responsibilities: [
      "Review outcomes",
      "Ask strategic questions"
    ],
    doNot: [
      "Request participant-level access",
      "Intervene in operations directly"
    ]
  }
];

function SOPCard({ sop }) {
  return (
    <Card className="p-6 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <BookOpen className="w-6 h-6 text-teal-600 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{sop.screen}</h3>
          <p className="text-sm text-teal-700 font-medium mt-1">Purpose: {sop.purpose}</p>
        </div>
      </div>

      {sop.responsibilities && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Responsibilities:</h4>
          <ul className="space-y-1">
            {sop.responsibilities.map((r, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sop.required && (
        <div className="mb-4">
          <Badge className="mb-2 bg-blue-600">REQUIRED ACTIONS</Badge>
          <ul className="space-y-1">
            {sop.required.map((r, i) => (
              <li key={i} className="text-sm text-gray-700 font-medium flex items-start gap-2">
                <span className="text-blue-600">✓</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sop.doNot && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <Badge className="mb-2 bg-red-600">DO NOT</Badge>
          <ul className="space-y-1">
            {sop.doNot.map((d, i) => (
              <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export default function StaffSOPs() {
  const [searchTerm, setSearchTerm] = useState('');

  const filterSOPs = (sops) => {
    if (!searchTerm) return sops;
    return sops.filter(sop =>
      sop.screen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sop.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <RoleGuard allowedRoles={['peer_support', 'coach', 'program_staff', 'administrator', 'executive']} pageName="Staff SOPs">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <GraceHeader
            title="Staff Operating Procedures"
            subtitle="Day-one manual, compliance reference, and quality assurance guide"
            icon={Shield}
          />

          {/* Global Principles */}
          <Card className="p-6 mb-8 bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-teal-600" />
              Global Operating Principles (Apply Everywhere)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {globalPrinciples.map((principle, i) => (
                <div key={i} className="bg-white rounded-lg p-4 border border-teal-200">
                  <h3 className="font-semibold text-teal-900 mb-1">{principle.title}</h3>
                  <p className="text-sm text-gray-700">{principle.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by screen or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Role-Based SOPs */}
          <Tabs defaultValue="peer" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="peer">Peer Support</TabsTrigger>
              <TabsTrigger value="staff">Program Staff</TabsTrigger>
              <TabsTrigger value="admin">Administrator</TabsTrigger>
              <TabsTrigger value="exec">Executive</TabsTrigger>
            </TabsList>

            <TabsContent value="peer">
              <div className="mb-4">
                <Badge className="bg-blue-600">PEER SUPPORT / COACH</Badge>
                <p className="text-sm text-gray-600 mt-2">Primary relationship holders</p>
              </div>
              {filterSOPs(peerSupportSOPs).map((sop, i) => (
                <SOPCard key={i} sop={sop} />
              ))}
            </TabsContent>

            <TabsContent value="staff">
              <div className="mb-4">
                <Badge className="bg-purple-600">PROGRAM STAFF</Badge>
                <p className="text-sm text-gray-600 mt-2">Coordination, oversight, quality</p>
              </div>
              {filterSOPs(programStaffSOPs).map((sop, i) => (
                <SOPCard key={i} sop={sop} />
              ))}
            </TabsContent>

            <TabsContent value="admin">
              <div className="mb-4">
                <Badge className="bg-red-600">ADMINISTRATOR</Badge>
                <p className="text-sm text-gray-600 mt-2">System integrity and compliance</p>
              </div>
              {filterSOPs(adminSOPs).map((sop, i) => (
                <SOPCard key={i} sop={sop} />
              ))}
            </TabsContent>

            <TabsContent value="exec">
              <div className="mb-4">
                <Badge className="bg-amber-600">EXECUTIVE / BOARD</Badge>
                <p className="text-sm text-gray-600 mt-2">Read-only oversight</p>
              </div>
              {filterSOPs(executiveSOPs).map((sop, i) => (
                <SOPCard key={i} sop={sop} />
              ))}
            </TabsContent>
          </Tabs>

          {/* Special Screens */}
          <Card className="p-6 mt-8 border-2 border-amber-300 bg-amber-50">
            <h2 className="text-xl font-bold text-amber-900 mb-4">Special Screen Rules</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-amber-900 mb-2">GRACE HARBOR (ALL STAFF)</h3>
              <Badge className="mb-2 bg-red-600">NON-NEGOTIABLE</Badge>
              <ul className="space-y-1 text-sm text-amber-900">
                <li>• No notes</li>
                <li>• No tasks</li>
                <li>• No follow-ups unless participant initiates</li>
                <li>• No outcome attribution</li>
              </ul>
              <p className="text-sm italic text-amber-800 mt-2">
                Grace Harbor exists to stabilize, not to be optimized.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-amber-900 mb-2">TRANSFORMATION HUB (STAFF INTERACTION)</h3>
              <p className="text-sm text-amber-900 mb-2">Staff Role: Support only after readiness is signaled</p>
              <Badge className="mb-2 bg-blue-600">REQUIRED CHECKS</Badge>
              <ul className="space-y-1 text-sm text-amber-900 mb-3">
                <li>✓ Readiness ≥ 3</li>
                <li>✓ Consent acknowledged</li>
              </ul>
              <Badge className="mb-2 bg-red-600">DO NOT</Badge>
              <ul className="space-y-1 text-sm text-red-800">
                <li>• Use Transformation Hub as a requirement</li>
                <li>• Tie it to compliance, funding, or worthiness</li>
              </ul>
            </div>
          </Card>

          {/* Daily Flow */}
          <Card className="p-6 mt-8 bg-green-50 border-2 border-green-200">
            <h2 className="text-xl font-bold text-green-900 mb-4">Daily Staff Flow</h2>
            <ol className="space-y-2 text-sm text-green-900">
              <li>1. Open Dashboard</li>
              <li>2. Review new entries</li>
              <li>3. Check tasks</li>
              <li>4. Engage participants</li>
              <li>5. Log engagement</li>
              <li>6. Close tasks</li>
              <li>7. End day without backlog guilt</li>
            </ol>
          </Card>

          {/* QA Checklist */}
          <Card className="p-6 mt-8 bg-purple-50 border-2 border-purple-200">
            <h2 className="text-xl font-bold text-purple-900 mb-4">Weekly QA Check</h2>
            <ul className="space-y-2 text-sm text-purple-900">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                Are notes descriptive?
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                Are tasks supportive?
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                Are participants choosing their pace?
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                Is Grace Harbor untouched by metrics?
              </li>
            </ul>
          </Card>

          {/* Final Truth */}
          <Card className="p-6 mt-8 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
            <h2 className="text-xl font-bold mb-3">Final Operational Truth</h2>
            <p className="text-teal-100 mb-3">If staff follow these SOPs:</p>
            <ul className="space-y-1 text-white">
              <li>✓ Participants feel safe</li>
              <li>✓ Staff avoid burnout</li>
              <li>✓ Funders trust the data</li>
              <li>✓ The platform scales without losing its soul</li>
            </ul>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}