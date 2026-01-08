import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Building2, FileText, Phone, MapPin, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function SocialServicesNavigationVR({ user }) {
  const [activeService, setActiveService] = useState(null);
  const [progress, setProgress] = useState({});

  const services = [
    {
      id: 'medicaid',
      name: 'Iowa Medicaid Application',
      description: 'Navigate the IME application process step-by-step',
      difficulty: 'advanced',
      icon: FileText,
      steps: 5
    },
    {
      id: 'snap',
      name: 'SNAP/Food Assistance',
      description: 'Apply for food support through DHS',
      difficulty: 'intermediate',
      icon: Building2,
      steps: 4
    },
    {
      id: 'housing',
      name: 'Section 8 Housing',
      description: 'Navigate public housing application and waitlists',
      difficulty: 'advanced',
      icon: MapPin,
      steps: 6
    }
  ];

  const startService = async (service) => {
    setActiveService(service);
    setProgress({ currentStep: 1, completed: [] });

    // AI generates realistic bureaucratic scenario
    const scenario = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a realistic first-person scenario for someone navigating the ${service.name} application process in Iowa.

Include:
1. The situation/need (why they're applying)
2. First step they need to take
3. One realistic obstacle or confusion point

Make it feel authentic - bureaucratic forms, confusing instructions, phone calls that get disconnected, etc.

Keep it 2-3 sentences.`
    });

    toast.info(scenario);
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-blue-600" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">VR Social Services Navigation</h3>
          <p className="text-gray-700">
            Practice navigating complex social service systems in a judgment-free simulation. 
            Learn the steps, forms, and advocacy skills to access critical resources.
          </p>
        </div>
      </GraceCard>

      {!activeService ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((service) => (
            <GraceCard key={service.id} hover className="cursor-pointer text-center" onClick={() => startService(service)}>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                service.difficulty === 'intermediate' ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
                <service.icon className={`w-6 h-6 ${
                  service.difficulty === 'intermediate' ? 'text-blue-600' : 'text-purple-600'
                }`} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{service.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{service.description}</p>
              <Badge variant="outline" className="text-xs">{service.steps} steps</Badge>
            </GraceCard>
          ))}
        </div>
      ) : (
        <>
          <GraceCard>
            <h4 className="text-xl font-bold text-gray-900 mb-4">{activeService.name}</h4>
            <p className="text-sm text-gray-600 mb-6">Step {progress.currentStep} of {activeService.steps}</p>
            
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <p className="text-sm text-gray-700">
                🎭 <strong>Scenario:</strong> You're at the DHS office with a stack of documents. 
                The worker says you're missing proof of residency. You have a utility bill in your name, but it's for your old address...
              </p>
            </div>

            <div className="space-y-3">
              <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                ✅ Explain situation, ask what alternative docs are accepted
              </Button>
              <Button variant="outline" className="w-full justify-start">
                😟 Say you'll come back later (lose application slot)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                😤 Argue that the bill should count
              </Button>
            </div>
          </GraceCard>

          <Button onClick={() => setActiveService(null)} variant="outline" className="w-full">
            Back to Services
          </Button>
        </>
      )}
    </div>
  );
}