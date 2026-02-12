// ============================================================================
// DOMAIN: 1. Participant Journey
// PURPOSE: Grace-Filled Action Plan builder with GRACE framework (Gratitude,
//          Resilience, Acceptance, Connection, Empowerment). Participant-led.
// DEPENDENCIES: GFAPlan entity, MyGrowthGarden component
// ============================================================================

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Sparkles, Shield, Users, Zap, Save, Download,
  CheckCircle2, ArrowLeft, ArrowRight, Flower2, Eye, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import MyGrowthGarden from '@/components/gfaplan/MyGrowthGarden';
import GFAPlanExport from '@/components/gfaplan/GFAPlanExport';

const sections = [
  {
    key: 'gratitude',
    title: 'Gratitude',
    icon: Sparkles,
    color: 'teal',
    prompt: "What strengths do you notice in yourself? What sources of hope light your path? What's going well, even if small?",
    placeholder: "Take your time... there's no rush. Even noticing one thing is beautiful."
  },
  {
    key: 'resilience',
    title: 'Resilience',
    icon: Shield,
    color: 'blue',
    prompt: 'What skills, practices, or supports help you in tough moments? What has helped you get through hard times before?',
    placeholder: "Remember: resilience isn't about being perfect—it's about showing up for yourself."
  },
  {
    key: 'acceptance',
    title: 'Acceptance',
    icon: Heart,
    color: 'rose',
    prompt: 'What are you gently noticing about where you are right now? What can you hold with compassion, without judgment?',
    placeholder: "Acceptance is a gift you give yourself. It's okay to just be where you are."
  },
  {
    key: 'connection',
    title: 'Connection',
    icon: Users,
    color: 'purple',
    prompt: 'Who or what brings you a sense of belonging? What relationships would you like to nurture? How might you connect with community?',
    placeholder: 'Connection can be small: a smile, a text, a shared moment. All count.'
  },
  {
    key: 'empowerment',
    title: 'Empowerment',
    icon: Zap,
    color: 'amber',
    prompt: 'What small, achievable action could you take today or this week? What longer-term dreams call to you?',
    placeholder: 'Empowerment grows from tiny steps. What feels doable right now?'
  }
];

export default function MyGFAPlan() {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [mode, setMode] = useState('edit'); // 'edit', 'view', 'garden'
  const [formData, setFormData] = useState({
    section_gratitude: '',
    section_resilience: '',
    section_acceptance: '',
    section_connection: '',
    section_empowerment: '',
    grace_notes: '',
    opt_in_tracking: false,
    opt_in_anonymized_data: false
  });
  const [showExport, setShowExport] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: existingPlan, isLoading } = useQuery({
    queryKey: ['gfaplan', user?.email],
    queryFn: async () => {
      const plans = await base44.entities.GFAPlan.filter({ user_email: user.email });
      return plans[0] || null;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (existingPlan) {
      setPlan(existingPlan);
      setFormData({
        section_gratitude: existingPlan.section_gratitude || '',
        section_resilience: existingPlan.section_resilience || '',
        section_acceptance: existingPlan.section_acceptance || '',
        section_connection: existingPlan.section_connection || '',
        section_empowerment: existingPlan.section_empowerment || '',
        grace_notes: existingPlan.grace_notes || '',
        opt_in_tracking: existingPlan.opt_in_tracking || false,
        opt_in_anonymized_data: existingPlan.opt_in_anonymized_data || false
      });
    }
  }, [existingPlan]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const sectionsCompleted = [
        data.section_gratitude,
        data.section_resilience,
        data.section_acceptance,
        data.section_connection,
        data.section_empowerment
      ].filter(s => s && s.trim().length > 0).length;

      const touchDates = plan?.section_touch_dates || {
        gratitude: [],
        resilience: [],
        acceptance: [],
        connection: [],
        empowerment: []
      };

      const currentSectionKey = sections[currentSection].key;
      if (data[`section_${currentSectionKey}`]?.trim()) {
        touchDates[currentSectionKey] = [
          ...(touchDates[currentSectionKey] || []),
          new Date().toISOString()
        ];
      }

      const payload = {
        ...data,
        sections_completed: sectionsCompleted,
        last_touched_date: new Date().toISOString(),
        section_touch_dates: touchDates
      };

      if (plan) {
        return await base44.entities.GFAPlan.update(plan.id, payload);
      } else {
        return await base44.entities.GFAPlan.create({
          ...payload,
          user_email: user.email
        });
      }
    },
    onSuccess: (data) => {
      setPlan(data);
      queryClient.invalidateQueries(['gfaplan']);
      toast.success('Your plan has been saved 💚', {
        description: 'Every step forward is worth celebrating.'
      });
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleNext = () => {
    handleSave();
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const section = sections[currentSection];
  const IconComponent = section.icon;

  const progress = plan?.sections_completed || 0;

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <Flower2 className="w-12 h-12 text-teal-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your gentle path...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <GraceHeader
          title="My GFA Plan"
          subtitle="Your Grace-Filled Action Plan • At Your Pace, In Your Way"
          icon={Heart}
        />

        <Tabs value={mode} onValueChange={setMode} className="mt-8">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="edit" className="gap-2">
              <Edit3 className="w-4 h-4" />
              Build
            </TabsTrigger>
            <TabsTrigger value="view" className="gap-2">
              <Eye className="w-4 h-4" />
              View
            </TabsTrigger>
            <TabsTrigger value="garden" className="gap-2" disabled={!formData.opt_in_tracking}>
              <Flower2 className="w-4 h-4" />
              My Growth
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <GraceCard>
              {/* Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Your Journey</span>
                  <span className="text-sm font-medium text-teal-600">{progress}/5 touched</span>
                </div>
                <div className="flex gap-1">
                  {sections.map((s, idx) => (
                    <motion.div
                      key={s.key}
                      className={`h-2 flex-1 rounded-full ${
                        formData[`section_${s.key}`]?.trim()
                          ? 'bg-teal-500'
                          : 'bg-gray-200'
                      }`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    />
                  ))}
                </div>
              </div>

              {/* Section Navigation */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {sections.map((s, idx) => {
                  const SIcon = s.icon;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setCurrentSection(idx)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        currentSection === idx
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <SIcon className="w-4 h-4" />
                      {s.title}
                      {formData[`section_${s.key}`]?.trim() && (
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Current Section */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-${section.color}-100 flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 text-${section.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-600">{section.prompt}</p>
                    </div>
                  </div>

                  <Textarea
                    value={formData[`section_${section.key}`]}
                    onChange={(e) => setFormData({ ...formData, [`section_${section.key}`]: e.target.value })}
                    placeholder={section.placeholder}
                    className="min-h-[200px] text-base"
                  />

                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="ghost"
                      onClick={handlePrevious}
                      disabled={currentSection === 0}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>

                    <Button onClick={handleSave} variant="outline" className="gap-2">
                      <Save className="w-4 h-4" />
                      Save Progress
                    </Button>

                    <Button
                      onClick={handleNext}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {currentSection === sections.length - 1 ? 'Save & Finish' : 'Next'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Grace Notes Section */}
              {currentSection === sections.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 pt-8 border-t border-gray-200"
                >
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Grace Notes (Optional)</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Anything else on your heart? This space is yours.
                  </p>
                  <Textarea
                    value={formData.grace_notes}
                    onChange={(e) => setFormData({ ...formData, grace_notes: e.target.value })}
                    placeholder="Whatever feels right to share with yourself..."
                    className="min-h-[120px]"
                  />
                </motion.div>
              )}

              {/* Privacy & Tracking Options */}
              <div className="mt-8 pt-8 border-t border-gray-200 space-y-4">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Your Privacy & Growth</h4>
                
                <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="tracking" className="text-sm font-medium">
                      Track my growth over time
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      See when you touch each section and celebrate your progress (revocable anytime)
                    </p>
                  </div>
                  <Switch
                    id="tracking"
                    checked={formData.opt_in_tracking}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, opt_in_tracking: checked });
                      if (plan) {
                        base44.entities.GFAPlan.update(plan.id, { opt_in_tracking: checked });
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="anonymized" className="text-sm font-medium">
                      Contribute anonymized data
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Help improve GFA by sharing anonymized progress patterns (no personal details)
                    </p>
                  </div>
                  <Switch
                    id="anonymized"
                    checked={formData.opt_in_anonymized_data}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, opt_in_anonymized_data: checked });
                      if (plan) {
                        base44.entities.GFAPlan.update(plan.id, { opt_in_anonymized_data: checked });
                      }
                    }}
                  />
                </div>
              </div>
            </GraceCard>
          </TabsContent>

          <TabsContent value="view">
            {plan ? (
              <div className="space-y-4">
                <GraceCard className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.plan_name || 'My GFA Plan'}</h3>
                    <p className="text-sm text-gray-600">
                      Last touched: {plan.last_touched_date ? new Date(plan.last_touched_date).toLocaleDateString() : 'Not yet'}
                    </p>
                  </div>
                  <Button onClick={() => setShowExport(true)} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                </GraceCard>

                {sections.map((s) => {
                  const SIcon = s.icon;
                  const content = formData[`section_${s.key}`];
                  if (!content?.trim()) return null;

                  return (
                    <GraceCard key={s.key}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-${s.color}-100 flex items-center justify-center`}>
                          <SIcon className={`w-5 h-5 text-${s.color}-600`} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
                    </GraceCard>
                  );
                })}

                {formData.grace_notes?.trim() && (
                  <GraceCard>
                    <div className="flex items-center gap-3 mb-3">
                      <Heart className="w-5 h-5 text-teal-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Grace Notes</h3>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{formData.grace_notes}</p>
                  </GraceCard>
                )}
              </div>
            ) : (
              <GraceCard>
                <div className="text-center py-12">
                  <Flower2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No plan created yet. Start building when you're ready! 💚</p>
                </div>
              </GraceCard>
            )}
          </TabsContent>

          <TabsContent value="garden">
            {formData.opt_in_tracking && plan ? (
              <MyGrowthGarden plan={plan} user={user} />
            ) : (
              <GraceCard>
                <div className="text-center py-12">
                  <Flower2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Enable progress tracking to see your Growth Garden</p>
                  <Button
                    onClick={() => {
                      setFormData({ ...formData, opt_in_tracking: true });
                      setMode('edit');
                    }}
                  >
                    Enable Tracking
                  </Button>
                </div>
              </GraceCard>
            )}
          </TabsContent>
        </Tabs>

        {showExport && plan && (
          <GFAPlanExport
            plan={plan}
            formData={formData}
            sections={sections}
            onClose={() => setShowExport(false)}
          />
        )}
      </div>
    </div>
  );
}