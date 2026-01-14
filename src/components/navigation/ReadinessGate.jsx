import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ReadinessGate({ requiredLevel = 3, currentLevel, hasConsent, featureName = "Transformation Hub" }) {
  // PILOT BUILD: All gates removed - immediate access for all participants
  // This component now always returns null, allowing full feature access
  return null;
}