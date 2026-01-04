import React from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, MessageCircle, Heart, Shield, 
  ExternalLink, MapPin, Clock, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

const crisisResources = [
  {
    name: "988 Suicide & Crisis Lifeline",
    description: "Free, confidential support 24/7 for anyone in distress",
    phone: "988",
    type: "call_text",
    priority: true,
    color: "from-red-500 to-rose-600"
  },
  {
    name: "Iowa Warm Line",
    description: "Peer support for anyone needing someone to talk to",
    phone: "844-775-9276",
    type: "call",
    hours: "24/7",
    color: "from-orange-400 to-orange-600"
  },
  {
    name: "Crisis Text Line",
    description: "Text HOME to 741741 for free crisis counseling",
    phone: "741741",
    type: "text",
    textKeyword: "HOME",
    color: "from-purple-400 to-purple-600"
  },
  {
    name: "SAMHSA National Helpline",
    description: "Treatment referral service for substance use and mental health",
    phone: "1-800-662-4357",
    type: "call",
    hours: "24/7, 365 days",
    color: "from-blue-400 to-blue-600"
  },
  {
    name: "Iowa Poison Control",
    description: "For overdose or poisoning emergencies",
    phone: "1-800-222-1222",
    type: "call",
    hours: "24/7",
    color: "from-teal-400 to-teal-600"
  }
];

const groundingExercises = [
  {
    title: "5-4-3-2-1 Grounding",
    steps: [
      "Name 5 things you can SEE",
      "Name 4 things you can TOUCH",
      "Name 3 things you can HEAR",
      "Name 2 things you can SMELL",
      "Name 1 thing you can TASTE"
    ]
  },
  {
    title: "Box Breathing",
    steps: [
      "Breathe IN for 4 seconds",
      "HOLD for 4 seconds",
      "Breathe OUT for 4 seconds",
      "HOLD for 4 seconds",
      "Repeat 4 times"
    ]
  },
  {
    title: "RAIN Technique",
    steps: [
      "R - Recognize what's happening",
      "A - Allow the experience to be there",
      "I - Investigate with kindness",
      "N - Nurture with self-compassion"
    ]
  }
];

function CrisisCard({ resource }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${
        resource.priority ? 'md:col-span-2' : ''
      }`}
      style={{
        background: `linear-gradient(135deg, var(--tw-gradient-stops))`
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${resource.color} opacity-100`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold mb-1">{resource.name}</h3>
            <p className="text-white/80 text-sm">{resource.description}</p>
          </div>
          {resource.priority && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
              Priority
            </span>
          )}
        </div>

        {resource.hours && (
          <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
            <Clock className="w-4 h-4" />
            {resource.hours}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {resource.type === 'call' || resource.type === 'call_text' ? (
            <Button asChild className="bg-white text-gray-900 hover:bg-white/90">
              <a href={`tel:${resource.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call {resource.phone}
              </a>
            </Button>
          ) : null}
          
          {resource.type === 'text' || resource.type === 'call_text' ? (
            <Button asChild variant="outline" className="border-white text-white hover:bg-white/20">
              <a href={`sms:${resource.phone}${resource.textKeyword ? `?body=${resource.textKeyword}` : ''}`}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Text {resource.textKeyword || resource.phone}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function GroundingCard({ exercise, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GraceCard className="h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{exercise.title}</h3>
        <ol className="space-y-3">
          {exercise.steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-medium">
                {idx + 1}
              </span>
              <span className="text-gray-600">{step}</span>
            </li>
          ))}
        </ol>
      </GraceCard>
    </motion.div>
  );
}

export default function Crisis() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white mb-6 shadow-lg">
            <Heart className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            You're Not Alone
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            If you're struggling right now, help is available. These resources are free, confidential, and available 24/7.
          </p>
        </motion.div>

        {/* Crisis Resources Grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Phone className="w-6 h-6 text-rose-500" />
            Crisis Hotlines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crisisResources.map((resource, idx) => (
              <CrisisCard key={idx} resource={resource} />
            ))}
          </div>
        </section>

        {/* Grounding Exercises */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-500" />
            Grounding Exercises
          </h2>
          <p className="text-gray-600 mb-6">
            These techniques can help you feel calmer in the moment. Try one now.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {groundingExercises.map((exercise, idx) => (
              <GroundingCard key={idx} exercise={exercise} index={idx} />
            ))}
          </div>
        </section>

        {/* Important Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <GraceCard gradient className="text-center">
            <Heart className="w-12 h-12 mx-auto text-teal-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Your Life Matters
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              No matter what you're going through, recovery is possible. Every moment you choose to reach out, 
              you're rewiring your brain for hope. The community here at Grace For Addictions believes in you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <a href="/GraceChat">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with Grace
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/Community">
                  <Users className="w-4 h-4 mr-2" />
                  Join Community
                </a>
              </Button>
            </div>
          </GraceCard>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-12">
          No Fees. No Stigma. Just Grace. 💚
        </p>
      </div>

      <GraceChatWidget />
    </div>
  );
}