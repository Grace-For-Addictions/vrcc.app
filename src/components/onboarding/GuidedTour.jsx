import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const tourSteps = [
  {
    id: 'assessment',
    title: 'Start with Your BARC-10',
    description: 'This 2-minute assessment helps us understand your recovery capital and personalize your experience.',
    cta: 'Take Assessment',
    ctaLink: 'Assessment',
    icon: Sparkles
  },
  {
    id: 'why',
    title: 'Share Your Why',
    description: 'Your "why" is your anchor. It reminds you what matters most when things get tough.',
    cta: 'Set My Why',
    ctaLink: 'Assessment',
    icon: Sparkles
  },
  {
    id: 'community',
    title: 'Join the Community',
    description: 'Connect with peers in safe chat rooms. You\'re not alone on this journey.',
    cta: 'Explore Rooms',
    ctaLink: 'Community',
    icon: Sparkles
  }
];

export default function GuidedTour({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const tourCompleted = localStorage.getItem('guidedTourCompleted');
    if (tourCompleted) {
      setIsVisible(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handleCTA = () => {
    const step = tourSteps[currentStep];
    localStorage.setItem(`tourStep_${step.id}_started`, 'true');
    navigate(createPageUrl(step.ctaLink));
    completeTour();
  };

  const completeTour = () => {
    localStorage.setItem('guidedTourCompleted', 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem('guidedTourCompleted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white relative">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Icon className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center">{step.title}</h2>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <p className="text-gray-700 text-center text-lg">
              {step.description}
            </p>

            {/* Progress */}
            <div className="flex items-center justify-center gap-2">
              {tourSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-8 bg-teal-600'
                      : idx < currentStep
                      ? 'w-2 bg-green-500'
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleCTA}
                className="w-full bg-teal-600 hover:bg-teal-700 text-lg py-6"
              >
                {step.cta}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              {currentStep < tourSteps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  variant="outline"
                  className="w-full"
                >
                  Next Tip
                </Button>
              ) : (
                <Button
                  onClick={completeTour}
                  variant="outline"
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I'll Explore On My Own
                </Button>
              )}

              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip tour
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}