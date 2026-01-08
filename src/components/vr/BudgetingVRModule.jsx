import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ShoppingCart, Home, Car, Heart, Sparkles, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function BudgetingVRModule({ user }) {
  const [isActive, setIsActive] = useState(false);
  const [scenario, setScenario] = useState(null);
  const [choices, setChoices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [difficulty, setDifficulty] = useState('beginner');
  const [score, setScore] = useState(0);

  const scenarios = {
    beginner: {
      title: 'First Paycheck After Recovery',
      description: 'You just received your first paycheck ($1,200) from your new job. You have $800 in immediate bills. How do you allocate your remaining $400?',
      monthlyIncome: 1200,
      fixedExpenses: 800,
      discretionary: 400,
      options: [
        {
          id: 1,
          label: 'Save $200, Personal $100, Fun $100',
          breakdown: { savings: 200, personal: 100, fun: 100 },
          isOptimal: true,
          feedback: '🎯 Excellent! You\'re building an emergency fund (50%), covering needs (25%), and allowing healthy recreation (25%). This balanced approach supports sustainable recovery.'
        },
        {
          id: 2,
          label: 'Fun $250, Personal $100, Save $50',
          breakdown: { savings: 50, personal: 100, fun: 250 },
          isOptimal: false,
          feedback: '⚠️ While self-care is important, spending 62% on fun activities might leave you vulnerable. Consider prioritizing emergency savings first.'
        },
        {
          id: 3,
          label: 'Save $400 (nothing for personal/fun)',
          breakdown: { savings: 400, personal: 0, fun: 0 },
          isOptimal: false,
          feedback: '💡 Saving is wise, but recovery thrives on balance. Allocating $0 for personal needs and recreation can lead to burnout. Consider the 50/25/25 rule.'
        }
      ]
    },
    intermediate: {
      title: 'Unexpected Expense Crisis',
      description: 'Your car broke down ($350 repair). You have $200 in savings, rent is due in 5 days ($600), and you get paid in 7 days. What do you do?',
      monthlyIncome: 1400,
      currentSavings: 200,
      rentDue: 600,
      repairCost: 350,
      options: [
        {
          id: 1,
          label: 'Use savings ($200) + payment plan ($150)',
          breakdown: { savings_used: 200, payment_plan: 150, future_impact: 'low' },
          isOptimal: true,
          feedback: '🎯 Smart! Negotiating a payment plan protects your savings buffer while addressing the immediate need. This demonstrates financial resilience.'
        },
        {
          id: 2,
          label: 'Ask support network for help',
          breakdown: { loan_from_peer: 350, savings_used: 0 },
          isOptimal: true,
          feedback: '💚 Reaching out is a strength! Your recovery network exists for moments like this. Just ensure you communicate a clear repayment plan.'
        },
        {
          id: 3,
          label: 'Use all savings + skip rent payment',
          breakdown: { savings_used: 200, rent_skipped: true },
          isOptimal: false,
          feedback: '⚠️ This creates bigger problems. Late rent can threaten housing stability. Explore community resources (GFA financial coaching, LIHEAP) before risking housing.'
        }
      ]
    },
    advanced: {
      title: 'Long-Term Planning Challenge',
      description: 'You\'ve been stable for 6 months. You want to move to a better apartment (+$200/month) and your sponsor suggests saving for a car. You have $1,500 in savings and earn $1,800/month. What\'s your 12-month plan?',
      monthlyIncome: 1800,
      currentSavings: 1500,
      housingIncrease: 200,
      carGoal: 4000,
      options: [
        {
          id: 1,
          label: 'Delay housing upgrade, prioritize car fund',
          breakdown: { monthly_car_savings: 300, move_delay: 12, car_readiness: 14 },
          isOptimal: true,
          feedback: '🎯 Excellent long-term thinking! Transportation often enables better employment. You\'ll have a car in 14 months while maintaining housing stability.'
        },
        {
          id: 2,
          label: 'Upgrade housing now, save $100/month for car',
          breakdown: { monthly_car_savings: 100, move_delay: 0, car_readiness: 40 },
          isOptimal: false,
          feedback: '💡 While better housing supports recovery, this extends car savings to 3+ years. Consider if the upgrade is truly necessary vs. wants.'
        },
        {
          id: 3,
          label: 'Maintain current housing, aggressive car savings',
          breakdown: { monthly_car_savings: 500, move_delay: 24, car_readiness: 8 },
          isOptimal: true,
          feedback: '🎯 Strategic! Sacrificing housing upgrade for 2 years might feel hard, but owning a reliable car in 8 months can unlock better opportunities.'
        }
      ]
    }
  };

  const startScenario = (level) => {
    setDifficulty(level);
    setScenario(scenarios[level]);
    setChoices([]);
    setFeedback(null);
    setIsActive(true);
  };

  const makeChoice = async (option) => {
    setChoices([...choices, option]);
    
    // Generate AI-powered personalized feedback
    const aiFeedback = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a financial wellness coach for someone in recovery. They chose: "${option.label}" for the scenario: "${scenario.description}".

Base feedback: ${option.feedback}

Provide 2-3 additional personalized tips for this choice, focusing on:
1. How this relates to recovery capital
2. One concrete next step
3. A gentle encouragement

Keep it warm, brief, and actionable.`,
      response_json_schema: {
        type: "object",
        properties: {
          recovery_connection: { type: "string" },
          next_step: { type: "string" },
          encouragement: { type: "string" }
        }
      }
    });

    setFeedback({
      base: option.feedback,
      ai: aiFeedback,
      isOptimal: option.isOptimal
    });

    if (option.isOptimal) {
      setScore(score + 25);
      toast.success('+25 points! Great financial decision');
    }
  };

  const adjustDifficulty = () => {
    // AI-driven adaptive difficulty
    if (score > 75 && difficulty === 'beginner') {
      setDifficulty('intermediate');
      toast.success('💪 Leveling up to Intermediate scenarios!');
    } else if (score > 150 && difficulty === 'intermediate') {
      setDifficulty('advanced');
      toast.success('🎓 Advanced Financial Planning Unlocked!');
    }
  };

  return (
    <div className="space-y-6">
      <GraceCard gradient>
        <div className="text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-3 text-green-600" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">VR Budgeting & Financial Management</h3>
          <p className="text-gray-700 mb-4">
            Practice real-world financial decisions in a safe, judgment-free environment. 
            AI adapts scenarios based on your progress and provides personalized coaching.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{score}</div>
              <div className="text-xs text-gray-600">Financial Wellness Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700 capitalize">{difficulty}</div>
              <div className="text-xs text-gray-600">Current Level</div>
            </div>
          </div>
        </div>
      </GraceCard>

      {!isActive ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GraceCard hover className="text-center cursor-pointer" onClick={() => startScenario('beginner')}>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Beginner</h4>
            <p className="text-sm text-gray-600">First paychecks, basic budgeting, needs vs. wants</p>
          </GraceCard>

          <GraceCard hover className="text-center cursor-pointer" onClick={() => startScenario('intermediate')}>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Intermediate</h4>
            <p className="text-sm text-gray-600">Unexpected expenses, emergency funds, crisis management</p>
          </GraceCard>

          <GraceCard hover className="text-center cursor-pointer" onClick={() => startScenario('advanced')}>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Home className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Advanced</h4>
            <p className="text-sm text-gray-600">Long-term planning, major purchases, financial goals</p>
          </GraceCard>
        </div>
      ) : (
        <>
          <GraceCard>
            <h4 className="text-xl font-bold text-gray-900 mb-3">{scenario.title}</h4>
            <p className="text-gray-700 mb-6">{scenario.description}</p>

            <div className="space-y-3">
              {scenario.options.map((option) => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => makeChoice(option)}
                  disabled={choices.length > 0}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    choices.find(c => c.id === option.id)
                      ? option.isOptimal
                        ? 'border-green-500 bg-green-50'
                        : 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{option.label}</span>
                    {choices.find(c => c.id === option.id) && (
                      option.isOptimal ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </GraceCard>

          {feedback && (
            <GraceCard className="bg-gradient-to-r from-blue-50 to-purple-50">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Coach Feedback
              </h4>
              <p className="text-gray-800 mb-4">{feedback.base}</p>
              
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-white rounded-lg">
                  <p className="font-semibold text-purple-900 mb-1">Recovery Connection</p>
                  <p className="text-gray-700">{feedback.ai.recovery_connection}</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="font-semibold text-blue-900 mb-1">Next Step</p>
                  <p className="text-gray-700">{feedback.ai.next_step}</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="font-semibold text-green-900 mb-1">Encouragement</p>
                  <p className="text-gray-700">{feedback.ai.encouragement}</p>
                </div>
              </div>

              <Button 
                onClick={() => {
                  adjustDifficulty();
                  setIsActive(false);
                }}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Next Scenario
              </Button>
            </GraceCard>
          )}
        </>
      )}
    </div>
  );
}