import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, Check, Sparkles, Heart, 
  Target, Users, MapPin, Calendar, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'your_why', title: 'Your Why', icon: Heart },
  { id: 'assessment', title: 'Check-In', icon: Target },
  { id: 'pathways', title: 'Pathways', icon: Users },
  { id: 'resources', title: 'Resources', icon: MapPin },
  { id: 'complete', title: 'Complete', icon: Check }
];

export default function ParticipantOnboarding({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  
  const [formData, setFormData] = useState({
    display_name: '',
    my_why: '',
    pathways: [],
    county: '',
    stage: 'exploring',
    barc_snapshot: {
      housing: 3,
      employment: 3,
      health: 3,
      social_support: 3,
      coping_skills: 3
    },
    current_mood: 3,
    interests: [],
    preferred_contact: 'app',
    avatar_style: 'lighthouse'
  });

  const pathwayOptions = [
    { id: 'substance_use', label: 'Substance Use Recovery', desc: 'Finding freedom from substances' },
    { id: 'mental_health', label: 'Mental Health', desc: 'Building emotional wellness' },
    { id: 'justice_involved', label: 'Reentry Support', desc: 'Navigating life after incarceration' },
    { id: 'family_ally', label: 'Family/Ally Support', desc: 'Supporting a loved one' },
    { id: 'youth', label: 'Youth Recovery', desc: 'Young people in recovery' },
    { id: 'provider', label: 'Provider/Professional', desc: 'Working in the recovery field' }
  ];

  const avatarStyles = [
    { id: 'lighthouse', emoji: '🗼', label: 'Lighthouse' },
    { id: 'sunrise', emoji: '🌅', label: 'Sunrise' },
    { id: 'mountain', emoji: '⛰️', label: 'Mountain' },
    { id: 'ocean', emoji: '🌊', label: 'Ocean' },
    { id: 'forest', emoji: '🌲', label: 'Forest' },
    { id: 'phoenix', emoji: '🔥', label: 'Phoenix' }
  ];

  const generateAIRecommendations = async () => {
    setAiGenerating(true);
    try {
      const prompt = `Generate personalized recovery support recommendations for someone with:
      
Pathways: ${formData.pathways.join(', ')}
Recovery Capital Snapshot: ${JSON.stringify(formData.barc_snapshot)}
Current Stage: ${formData.stage}
Current Mood: ${formData.current_mood}/5
Their Why: ${formData.my_why}

Provide:
1. 3 specific resources they should explore first
2. 2 community connections that match their pathways
3. 1 immediate action they can take today
4. A personalized welcome message (warm, trauma-informed, 2-3 sentences)

Use neuroplasticity language and emphasize participant autonomy.`;

      const ai = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            welcome_message: { type: "string" },
            resources: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  name: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            connections: {
              type: "array",
              items: { 
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            immediate_action: { type: "string" }
          }
        }
      });

      setAiRecommendations(ai);
    } catch (error) {
      toast.error('Could not generate recommendations');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Create user profile
      await base44.entities.UserProfile.create({
        display_name: formData.display_name,
        my_why: formData.my_why,
        pathways: formData.pathways,
        county: formData.county,
        stage: formData.stage,
        avatar_style: formData.avatar_style,
        onboarding_complete: true,
        readiness_level: 1
      });

      // Create initial assessment
      const barcScore = Object.values(formData.barc_snapshot).reduce((a, b) => a + b, 0);
      await base44.entities.Assessment.create({
        assessment_type: 'BARC-10',
        total_score: barcScore,
        dimension_scores: formData.barc_snapshot,
        is_onboarding: true
      });

      // Create first check-in
      await base44.entities.DailyCheckIn.create({
        time_mode: 'onboarding',
        mood_score: formData.current_mood,
        mood_note: 'Initial onboarding check-in',
        your_why_touchpoint: formData.my_why
      });

      toast.success('Welcome to Grace For Addictions! 💚');
      onComplete?.();
    } catch (error) {
      toast.error('Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome to Grace For Addictions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A trauma-informed, peer-led recovery community serving all 99 Iowa counties. 
              No fees. No stigma. Just grace.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto text-sm">
              <div className="p-3 bg-teal-50 rounded-lg">
                <p className="font-semibold text-teal-900">Participant-Led</p>
                <p className="text-teal-700">You set the pace</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900">Always Free</p>
                <p className="text-blue-700">Zero barriers</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="font-semibold text-purple-900">AI-Supported</p>
                <p className="text-purple-700">24/7 companion</p>
              </div>
            </div>
            <div className="space-y-3 max-w-md mx-auto">
              <Input
                placeholder="Choose a display name (anonymous is fine!)"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="text-center"
              />
              <div>
                <p className="text-sm text-gray-600 mb-3">Pick your recovery symbol:</p>
                <div className="grid grid-cols-3 gap-2">
                  {avatarStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setFormData({ ...formData, avatar_style: style.id })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.avatar_style === style.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      <div className="text-3xl mb-1">{style.emoji}</div>
                      <p className="text-xs font-medium">{style.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'your_why':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Heart className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's Your "Why"?</h2>
              <p className="text-gray-600">
                Your "why" is your anchor—the deeper reason you're on this journey. 
                It can be a person, a dream, a value, or simply a feeling you want back.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 italic">
                💡 Example: "I want to be present for my daughter's childhood" or 
                "I deserve to feel peace again" or "I want to prove I'm more than my past"
              </p>
            </div>

            <Textarea
              value={formData.my_why}
              onChange={(e) => setFormData({ ...formData, my_why: e.target.value })}
              placeholder="Write your why here... (You can change this anytime)"
              rows={5}
              className="text-lg"
            />

            <div className="text-center text-sm text-gray-500">
              <p>This is for you. It stays private unless you choose to share it.</p>
            </div>
          </motion.div>
        );

      case 'assessment':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Target className="w-16 h-16 mx-auto text-teal-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Wellness Check</h2>
              <p className="text-gray-600">
                This helps us understand where you're at right now—no judgment, just connection.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                How are you feeling in this moment? (1-5)
              </label>
              <Slider
                value={[formData.current_mood]}
                onValueChange={(v) => setFormData({ ...formData, current_mood: v[0] })}
                min={1}
                max={5}
                step={1}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Struggling</span>
                <span className="font-bold text-teal-600">{formData.current_mood}</span>
                <span>Thriving</span>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-4">Recovery Capital Snapshot</h3>
              <p className="text-xs text-purple-700 mb-4">
                Rate how you're doing in these areas (1-6):
              </p>
              {Object.keys(formData.barc_snapshot).map((domain) => (
                <div key={domain} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {domain.replace(/_/g, ' ')}
                  </label>
                  <Slider
                    value={[formData.barc_snapshot[domain]]}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      barc_snapshot: { ...formData.barc_snapshot, [domain]: v[0] }
                    })}
                    min={1}
                    max={6}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span className="font-bold text-purple-600">{formData.barc_snapshot[domain]}</span>
                    <span>High</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'pathways':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Community</h2>
              <p className="text-gray-600">
                Select the pathways that resonate with you. You can pick as many as you need.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pathwayOptions.map((pathway) => {
                const isSelected = formData.pathways.includes(pathway.id);
                return (
                  <button
                    key={pathway.id}
                    onClick={() => {
                      if (isSelected) {
                        setFormData({
                          ...formData,
                          pathways: formData.pathways.filter(p => p !== pathway.id)
                        });
                      } else {
                        setFormData({
                          ...formData,
                          pathways: [...formData.pathways, pathway.id]
                        });
                      }
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isSelected && (
                        <Check className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{pathway.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pathway.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Where are you located in Iowa?
              </label>
              <Input
                placeholder="County name (optional)"
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
              />
            </div>
          </motion.div>
        );

      case 'resources':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <MapPin className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Personalized Support Plan</h2>
              <p className="text-gray-600">
                Based on what you've shared, we're generating tailored recommendations just for you.
              </p>
            </div>

            {!aiRecommendations && !aiGenerating && (
              <Button
                onClick={generateAIRecommendations}
                className="w-full bg-teal-600 hover:bg-teal-700"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Personalized Plan
              </Button>
            )}

            {aiGenerating && (
              <Card className="p-8 text-center">
                <Loader2 className="w-12 h-12 mx-auto text-teal-600 animate-spin mb-4" />
                <p className="text-gray-600">Creating your personalized support plan...</p>
              </Card>
            )}

            {aiRecommendations && (
              <div className="space-y-4">
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-2">Welcome Message</h3>
                  <p className="text-purple-800 leading-relaxed">{aiRecommendations.welcome_message}</p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Recommended Resources
                  </h3>
                  <div className="space-y-3">
                    {aiRecommendations.resources?.map((resource, idx) => (
                      <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="font-semibold text-green-900">{resource.name}</p>
                        <p className="text-sm text-green-700">{resource.reason}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Community Connections
                  </h3>
                  <div className="space-y-3">
                    {aiRecommendations.connections?.map((conn, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-semibold text-blue-900">{conn.type}</p>
                        <p className="text-sm text-blue-700">{conn.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 bg-teal-50 border-2 border-teal-200">
                  <h3 className="font-bold text-teal-900 mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Immediate Action
                  </h3>
                  <p className="text-teal-800">{aiRecommendations.immediate_action}</p>
                </Card>
              </div>
            )}
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Check className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">You're All Set!</h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Welcome to a community where you belong, exactly as you are. 
              Your journey is your own—we're just here to walk alongside you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Card className="p-4 bg-blue-50 border-2 border-blue-200">
                <Calendar className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <h3 className="font-semibold text-blue-900">Daily Check-Ins</h3>
                <p className="text-sm text-blue-700 mt-1">Track your journey with grace</p>
              </Card>
              <Card className="p-4 bg-purple-50 border-2 border-purple-200">
                <Users className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <h3 className="font-semibold text-purple-900">Community Rooms</h3>
                <p className="text-sm text-purple-700 mt-1">Connect with peers 24/7</p>
              </Card>
              <Card className="p-4 bg-green-50 border-2 border-green-200">
                <Sparkles className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <h3 className="font-semibold text-green-900">AI Grace</h3>
                <p className="text-sm text-green-700 mt-1">Your 24/7 companion</p>
              </Card>
            </div>

            <Button
              onClick={handleComplete}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Finalizing...
                </>
              ) : (
                'Enter the Community 💚'
              )}
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return formData.display_name.length >= 2;
      case 'your_why':
        return formData.my_why.length >= 10;
      case 'assessment':
        return true;
      case 'pathways':
        return formData.pathways.length > 0;
      case 'resources':
        return aiRecommendations !== null;
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        idx === currentStep
                          ? 'bg-teal-600 text-white'
                          : idx < currentStep
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {idx < currentStep ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`w-12 h-1 ${idx < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <Badge variant="outline">
              Step {currentStep + 1} of {STEPS.length}
            </Badge>
          </div>
          <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
        </div>

        {/* Content */}
        <Card className="p-8">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </Card>

        {/* Navigation */}
        {STEPS[currentStep].id !== 'complete' && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {currentStep === STEPS.length - 2 ? 'Complete' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}