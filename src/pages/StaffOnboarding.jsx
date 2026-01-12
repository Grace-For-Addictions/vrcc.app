import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, Eye, Edit, Heart, AlertTriangle, Check, 
  BookOpen, ArrowRight, ArrowLeft, CheckCircle, Loader2, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const STEPS = [
  { id: 'welcome', title: 'Welcome & Orientation', icon: BookOpen },
  { id: 'role_clarity', title: 'Role Clarity', icon: Users },
  { id: 'views_distinction', title: 'Platform Views', icon: Eye },
  { id: 'daily_flow_docs', title: 'Daily Flow & Documentation', icon: Edit },
  { id: 'readiness_harbor', title: 'Readiness & Grace Harbor', icon: Heart },
  { id: 'escalation', title: 'When to Escalate', icon: AlertTriangle },
  { id: 'commitment', title: 'Staff Commitment', icon: Check },
  { id: 'supervisor_role', title: 'Supervisor Role', icon: Shield, supervisorOnly: true },
  { id: 'corrective_process', title: 'Corrective Guidance', icon: Award, supervisorOnly: true },
  { id: 'supervisor_commitment', title: 'Supervisor Commitment', icon: CheckCircle, supervisorOnly: true }
];

export default function StaffOnboarding() {
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    welcome_acknowledged: false,
    role_clarity_acknowledged: false,
    views_distinction_acknowledged: false,
    daily_flow_acknowledged: false,
    documentation_rules_acknowledged: false,
    readiness_harbor_acknowledged: false,
    escalation_acknowledged: false,
    supervisor_role_acknowledged: false,
    corrective_process_acknowledged: false,
    staff_commitment_signature: '',
    supervisor_commitment_signature: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({ ...formData, staff_commitment_signature: currentUser.full_name });
    };
    loadUser();
  }, []);

  const isSupervisor = user?.role === 'admin' || user?.user_role === 'administrator' || user?.user_role === 'executive';

  const filteredSteps = STEPS.filter(step => !step.supervisorOnly || isSupervisor);

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mb-4">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Welcome to Grace For Addictions</h2>
              <p className="text-lg text-gray-600 mt-2">Staff Onboarding Guide</p>
            </div>

            <Card className="p-6 bg-teal-50 border-2 border-teal-200">
              <h3 className="font-bold text-teal-900 mb-3">1. Why This Platform Exists</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Grace For Addictions operates a trauma-informed, dignity-centered recovery ecosystem designed to meet people exactly where they are — without fees, stigma, or forced pathways.
              </p>
              <div className="bg-white rounded-lg p-4 border border-teal-300">
                <p className="font-semibold text-teal-900 mb-2">You are NOT here to "fix" people.</p>
                <p className="text-gray-700">You are here to protect connection, continuity, and choice.</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-3">2. What This Platform IS — and IS NOT</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="font-semibold text-green-900 mb-2">This Platform IS:</p>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>✓ Peer-led</li>
                    <li>✓ Relationship-centered</li>
                    <li>✓ Recovery-capital focused</li>
                    <li>✓ Data-informed (not data-driven)</li>
                  </ul>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="font-semibold text-red-900 mb-2">This Platform IS NOT:</p>
                  <ul className="space-y-1 text-sm text-red-800">
                    <li>✗ Therapy</li>
                    <li>✗ Clinical treatment</li>
                    <li>✗ Surveillance</li>
                    <li>✗ Compliance enforcement</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm italic text-gray-600 mt-4">
                If you ever feel pressure to act like it is those things, pause and escalate.
              </p>
            </Card>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="welcome-ack"
                checked={formData.welcome_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, welcome_acknowledged: checked })}
              />
              <label htmlFor="welcome-ack" className="text-sm text-blue-900 cursor-pointer">
                I understand GFA's mission and the distinction between peer support and clinical services.
              </label>
            </div>
          </motion.div>
        );

      case 'role_clarity':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">3. Role Clarity</h2>
              <Badge className="mt-2 bg-red-600">NON-NEGOTIABLE</Badge>
            </div>

            <div className="grid gap-4">
              <Card className="p-4 bg-purple-50 border-l-4 border-purple-600">
                <h4 className="font-semibold text-purple-900">Participant</h4>
                <p className="text-sm text-purple-800">Receives support. Controls pace. Chooses pathways.</p>
              </Card>
              <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
                <h4 className="font-semibold text-blue-900">Peer Support / Coach</h4>
                <p className="text-sm text-blue-800">Holds relationship. Supports reflection. Encourages self-direction.</p>
              </Card>
              <Card className="p-4 bg-green-50 border-l-4 border-green-600">
                <h4 className="font-semibold text-green-900">Program Staff</h4>
                <p className="text-sm text-green-800">Coordinates continuity. Protects systems. Oversees quality.</p>
              </Card>
              <Card className="p-4 bg-amber-50 border-l-4 border-amber-600">
                <h4 className="font-semibold text-amber-900">Administrator</h4>
                <p className="text-sm text-amber-800">Protects data, permissions, and compliance.</p>
              </Card>
              <Card className="p-4 bg-red-50 border-l-4 border-red-600">
                <h4 className="font-semibold text-red-900">Executive / Board</h4>
                <p className="text-sm text-red-800">Reviews outcomes only. Never case details.</p>
              </Card>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="role-ack"
                checked={formData.role_clarity_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, role_clarity_acknowledged: checked })}
              />
              <label htmlFor="role-ack" className="text-sm text-blue-900 cursor-pointer">
                I understand my role and its boundaries in the GFA ecosystem.
              </label>
            </div>
          </motion.div>
        );

      case 'views_distinction':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <Eye className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">4. What You See vs What Participants See</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-green-50 border-2 border-green-200">
                <h3 className="font-bold text-green-900 mb-3">Participants See:</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>✓ Community</li>
                  <li>✓ Their own journey</li>
                  <li>✓ Safe Space (Grace Harbor)</li>
                  <li>✓ Messages and resources</li>
                </ul>
              </Card>

              <Card className="p-6 bg-red-50 border-2 border-red-200">
                <h3 className="font-bold text-red-900 mb-3">Participants NEVER See:</h3>
                <ul className="space-y-2 text-sm text-red-800">
                  <li>✗ CRM</li>
                  <li>✗ Internal notes</li>
                  <li>✗ Flags</li>
                  <li>✗ Reports</li>
                  <li>✗ Metrics</li>
                </ul>
              </Card>
            </div>

            <div className="p-4 bg-amber-50 border-l-4 border-amber-500">
              <p className="text-amber-900 font-medium">
                If you can see something they cannot, it exists to support you — not to control them.
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="views-ack"
                checked={formData.views_distinction_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, views_distinction_acknowledged: checked })}
              />
              <label htmlFor="views-ack" className="text-sm text-blue-900 cursor-pointer">
                I understand the distinction between staff and participant views, and the purpose of staff-only data.
              </label>
            </div>
          </motion.div>
        );

      case 'daily_flow_docs':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <Edit className="w-16 h-16 mx-auto text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">5. Daily Staff Flow & 6. Documentation Rules</h2>
            </div>

            <Card className="p-6 bg-green-50 border-2 border-green-200">
              <h3 className="font-bold text-green-900 mb-3">Daily Staff Flow (Standard)</h3>
              <ol className="space-y-2 text-sm text-green-800">
                <li>1. Open Dashboard</li>
                <li>2. Review new entries</li>
                <li>3. Check assigned tasks</li>
                <li>4. Engage participants</li>
                <li>5. Log engagement (descriptive only)</li>
                <li>6. Close tasks</li>
                <li>7. End day clean</li>
              </ol>
              <p className="text-sm italic text-green-700 mt-3">
                You are not expected to "catch everything." The system exists to share the load.
              </p>
            </Card>

            <Card className="p-6 bg-red-50 border-2 border-red-200">
              <h3 className="font-bold text-red-900 mb-3">Documentation Rules (READ THIS TWICE)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-green-900 mb-2">Write:</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• What happened</li>
                    <li>• What the participant said</li>
                    <li>• What support was offered</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-red-900 mb-2">Do NOT Write:</p>
                  <ul className="space-y-1 text-sm text-red-800">
                    <li>✗ Diagnoses</li>
                    <li>✗ Assumptions</li>
                    <li>✗ Risk labels</li>
                    <li>✗ Clinical interpretations</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 mt-3">
                Use person-first language at all times.
              </p>
            </Card>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="flow-ack"
                checked={formData.daily_flow_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, daily_flow_acknowledged: checked })}
              />
              <label htmlFor="flow-ack" className="text-sm text-blue-900 cursor-pointer">
                I understand the daily staff flow and will follow documentation guidelines strictly.
              </label>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="docs-ack"
                checked={formData.documentation_rules_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, documentation_rules_acknowledged: checked })}
              />
              <label htmlFor="docs-ack" className="text-sm text-blue-900 cursor-pointer">
                I commit to writing only factual, descriptive notes without judgment or clinical language.
              </label>
            </div>
          </motion.div>
        );

      case 'readiness_harbor':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <Heart className="w-16 h-16 mx-auto text-pink-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">7. Readiness & 8. Grace Harbor</h2>
            </div>

            <Card className="p-6 bg-purple-50 border-2 border-purple-200">
              <h3 className="font-bold text-purple-900 mb-3">Readiness & Transformation Hub</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>• Readiness is <span className="font-semibold">signaled, not assigned</span></li>
                <li>• Transformation Hub is <span className="font-semibold">invited, not required</span></li>
                <li>• Grace Harbor is <span className="font-semibold">always available</span></li>
              </ul>
              <div className="mt-4 p-3 bg-white rounded-lg border border-purple-300">
                <p className="font-semibold text-red-900 mb-2">Never tie readiness to:</p>
                <ul className="space-y-1 text-sm text-red-800">
                  <li>✗ Worth</li>
                  <li>✗ Compliance</li>
                  <li>✗ Funding</li>
                  <li>✗ Deservingness</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6 bg-amber-50 border-2 border-amber-300">
              <h3 className="font-bold text-amber-900 mb-3">Grace Harbor — Special Rules</h3>
              <Badge className="mb-3 bg-red-600">NON-NEGOTIABLE</Badge>
              <ul className="space-y-2 text-sm text-amber-900">
                <li>• No notes</li>
                <li>• No tasks</li>
                <li>• No follow-ups unless participant initiates</li>
                <li>• No outcomes attributed</li>
              </ul>
              <p className="text-sm font-semibold text-red-900 mt-4">
                Violating this breaks trust system-wide.
              </p>
            </Card>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="readiness-ack"
                checked={formData.readiness_harbor_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, readiness_harbor_acknowledged: checked })}
              />
              <label htmlFor="readiness-ack" className="text-sm text-blue-900 cursor-pointer">
                I understand that readiness is participant-driven and Grace Harbor is a sacred, metrics-free space.
              </label>
            </div>
          </motion.div>
        );

      case 'escalation':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-orange-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">9. When to Escalate</h2>
            </div>

            <Card className="p-6 bg-orange-50 border-2 border-orange-200">
              <h3 className="font-bold text-orange-900 mb-3">Escalate to a supervisor when:</h3>
              <ul className="space-y-2 text-sm text-orange-800">
                <li>• You feel unsure</li>
                <li>• A boundary feels blurry</li>
                <li>• A participant appears unsafe</li>
                <li>• You feel emotionally flooded</li>
              </ul>
              <div className="mt-4 p-3 bg-white rounded-lg border border-orange-300">
                <p className="font-semibold text-orange-900">
                  Escalation is strength, not failure.
                </p>
              </div>
            </Card>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="escalation-ack"
                checked={formData.escalation_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, escalation_acknowledged: checked })}
              />
              <label htmlFor="escalation-ack" className="text-sm text-blue-900 cursor-pointer">
                I understand when and how to escalate concerns to my supervisor.
              </label>
            </div>
          </motion.div>
        );

      case 'commitment':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <Check className="w-16 h-16 mx-auto text-teal-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">10. Staff Commitment Statement</h2>
            </div>

            <Card className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 border-2 border-teal-200">
              <p className="text-lg text-gray-800 italic leading-relaxed mb-6">
                "I commit to dignity-first support, voluntary engagement, and non-punitive practice. 
                I understand this platform exists to serve people, not manage them."
              </p>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Your Full Name (Signature)
                  </label>
                  <Input
                    value={formData.staff_commitment_signature}
                    onChange={(e) => setFormData({ ...formData, staff_commitment_signature: e.target.value })}
                    placeholder="Type your full name"
                    className="text-lg font-medium"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>Date: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="p-4 bg-teal-50 rounded-lg border border-teal-300">
                  <p className="text-sm text-teal-900">
                    By signing, you acknowledge completion of GFA staff onboarding and agreement to uphold all policies and principles.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        );

      case 'supervisor_role':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">PART II: Supervisor Role Definition</h2>
            </div>

            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Supervisors:</h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-900">Protect people</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-900">Protect culture</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-900">Protect systems</p>
                </div>
              </div>

              <Separator className="my-4" />

              <h3 className="font-bold text-gray-900 mb-4">Supervisors Do NOT:</h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-900">Police staff</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-900">Shame mistakes</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-900">Enforce compliance through fear</p>
                </div>
              </div>
            </Card>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="supervisor-role-ack"
                checked={formData.supervisor_role_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, supervisor_role_acknowledged: checked })}
              />
              <label htmlFor="supervisor-role-ack" className="text-sm text-blue-900 cursor-pointer">
                I understand my role as a supervisor is to protect and support, not to police or shame.
              </label>
            </div>
          </motion.div>
        );

      case 'corrective_process':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <Award className="w-16 h-16 mx-auto text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">The Four-Step Corrective Process</h2>
            </div>

            <div className="space-y-4">
              <Card className="p-4 border-l-4 border-blue-600">
                <h4 className="font-semibold text-blue-900 mb-2">STEP 1 — Pause & Ground</h4>
                <p className="text-sm text-gray-700">Review facts only. Separate impact from intent. Regulate yourself first.</p>
                <p className="text-xs italic text-gray-600 mt-2">Never correct while activated.</p>
              </Card>

              <Card className="p-4 border-l-4 border-green-600">
                <h4 className="font-semibold text-green-900 mb-2">STEP 2 — Private, Relational Conversation</h4>
                <p className="text-sm text-gray-700 mb-2">Open with: "I want to support you, not correct you."</p>
                <p className="text-sm text-gray-700">Name the observation, not the person: "I noticed this language..." "I saw this pattern..."</p>
              </Card>

              <Card className="p-4 border-l-4 border-purple-600">
                <h4 className="font-semibold text-purple-900 mb-2">STEP 3 — Align to Principles (Not Rules)</h4>
                <p className="text-sm text-gray-700">Anchor feedback to: Dignity, Trauma-informed care, Participant autonomy, Platform design intent</p>
              </Card>

              <Card className="p-4 border-l-4 border-teal-600">
                <h4 className="font-semibold text-teal-900 mb-2">STEP 4 — Co-Create the Correction</h4>
                <p className="text-sm text-gray-700">Ask: "What do you think would align better?" "How can I support you here?"</p>
              </Card>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="corrective-ack"
                checked={formData.corrective_process_acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, corrective_process_acknowledged: checked })}
              />
              <label htmlFor="corrective-ack" className="text-sm text-blue-900 cursor-pointer">
                I understand and commit to the four-step corrective process that restores without shame.
              </label>
            </div>
          </motion.div>
        );

      case 'supervisor_commitment':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Final Supervisor Commitment</h2>
            </div>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200">
              <p className="text-lg text-gray-800 italic leading-relaxed mb-6">
                "I commit to corrective guidance that restores alignment without shame, protects dignity for participants and staff, and strengthens the system rather than controlling it."
              </p>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Your Full Name (Supervisor Signature)
                  </label>
                  <Input
                    value={formData.supervisor_commitment_signature}
                    onChange={(e) => setFormData({ ...formData, supervisor_commitment_signature: e.target.value })}
                    placeholder="Type your full name"
                    className="text-lg font-medium"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return formData.welcome_acknowledged;
      case 'role_clarity':
        return formData.role_clarity_acknowledged;
      case 'views_distinction':
        return formData.views_distinction_acknowledged;
      case 'daily_flow_docs':
        return formData.daily_flow_acknowledged && formData.documentation_rules_acknowledged;
      case 'readiness_harbor':
        return formData.readiness_harbor_acknowledged;
      case 'escalation':
        return formData.escalation_acknowledged;
      case 'commitment':
        return formData.staff_commitment_signature.length >= 3;
      case 'supervisor_role':
        return formData.supervisor_role_acknowledged;
      case 'corrective_process':
        return formData.corrective_process_acknowledged;
      case 'supervisor_commitment':
        return formData.supervisor_commitment_signature.length >= 3;
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await base44.entities.StaffOnboardingCompletion.create({
        staff_email: user.email,
        staff_role: user.user_role || 'peer_support',
        completion_date: new Date().toISOString(),
        onboarding_version: '2026-01',
        acknowledgments: {
          welcome_acknowledged: formData.welcome_acknowledged,
          role_clarity_acknowledged: formData.role_clarity_acknowledged,
          views_distinction_acknowledged: formData.views_distinction_acknowledged,
          daily_flow_acknowledged: formData.daily_flow_acknowledged,
          documentation_rules_acknowledged: formData.documentation_rules_acknowledged,
          readiness_harbor_acknowledged: formData.readiness_harbor_acknowledged,
          escalation_acknowledged: formData.escalation_acknowledged,
          supervisor_role_acknowledged: formData.supervisor_role_acknowledged,
          corrective_process_acknowledged: formData.corrective_process_acknowledged
        },
        staff_commitment_signature: formData.staff_commitment_signature,
        staff_commitment_timestamp: new Date().toISOString(),
        supervisor_commitment_signature: isSupervisor ? formData.supervisor_commitment_signature : null,
        supervisor_commitment_timestamp: isSupervisor ? new Date().toISOString() : null
      });

      toast.success('Onboarding completed successfully! Welcome to the team 💚');
      window.location.href = '/';
    } catch (error) {
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {filteredSteps.map((step, idx) => {
                const Icon = step.icon;
                const stepIndex = STEPS.findIndex(s => s.id === step.id);
                return (
                  <div key={step.id} className="flex items-center flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        stepIndex === currentStep
                          ? 'bg-teal-600 text-white'
                          : stepIndex < currentStep
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {stepIndex < currentStep ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    {idx < filteredSteps.length - 1 && (
                      <div className={`w-8 h-1 ${stepIndex < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <Badge variant="outline">
              Step {currentStep + 1} of {filteredSteps.length}
            </Badge>
          </div>
          <Progress value={((currentStep + 1) / filteredSteps.length) * 100} className="h-2" />
        </div>

        {/* Content */}
        <Card className="p-8">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < filteredSteps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed() || loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  Complete Onboarding
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}