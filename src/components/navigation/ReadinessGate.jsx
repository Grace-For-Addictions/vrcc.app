import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ReadinessGate({ requiredLevel = 3, currentLevel, hasConsent, featureName = "Transformation Hub" }) {
  const needsLevel = currentLevel < requiredLevel;
  const needsConsent = !hasConsent;

  if (!needsLevel && !needsConsent) {
    return null; // User has access
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {featureName} - Journey Gate
        </h1>
        
        <p className="text-gray-600 mb-6">
          This area becomes available as you progress on your journey with Grace.
        </p>

        {needsLevel && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Heart className="w-5 h-5 text-blue-600" />
              <p className="font-medium text-blue-900">
                Readiness Level {requiredLevel} Required
              </p>
            </div>
            <p className="text-sm text-blue-700">
              Your current readiness level: {currentLevel}
            </p>
            <p className="text-sm text-blue-600 mt-2">
              Continue engaging with the community, completing check-ins, and building your recovery capital.
            </p>
          </div>
        )}

        {needsConsent && (
          <div className="bg-amber-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Lock className="w-5 h-5 text-amber-600" />
              <p className="font-medium text-amber-900">Consent Acknowledgment Needed</p>
            </div>
            <p className="text-sm text-amber-700">
              This area involves deeper transformation work. We want to make sure you're ready and willing.
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">Return Home</Button>
          </Link>
          <Link to={createPageUrl('Assessment')}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Continue Your Journey
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6 italic">
          Grace Harbor and Community are always open to you. This is simply about timing and readiness.
        </p>
      </Card>
    </div>
  );
}