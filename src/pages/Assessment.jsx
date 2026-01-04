import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, ChevronRight, ChevronLeft, Check, 
  Sparkles, TrendingUp, Users, Heart, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';
import confetti from 'canvas-confetti';

const barc10Questions = [
  { id: 1, text: "There are more important things in my life than using substances", dimension: "personal" },
  { id: 2, text: "In general, I am happy with my life", dimension: "personal" },
  { id: 3, text: "I have enough energy to complete the tasks I set for myself", dimension: "personal" },
  { id: 4, text: "I am proud of the community I live in and feel part of it", dimension: "community" },
  { id: 5, text: "I get a lot of support from friends", dimension: "social" },
  { id: 6, text: "I regard my life as challenging and fulfilling without the need for using substances", dimension: "personal" },
  { id: 7, text: "My living space has helped to drive my recovery journey", dimension: "community" },
  { id: 8, text: "I take responsibility for my own health and wellbeing", dimension: "personal" },
  { id: 9, text: "I am making good progress on my recovery journey", dimension: "personal" },
  { id: 10, text: "I have a network of people I can rely on to support my recovery", dimension: "social" }
];

const responseOptions = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" }
];

function QuestionCard({ question, value, onChange, questionNumber }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
    >
      <div className="text-sm text-teal-600 font-medium mb-2">
        Question {questionNumber} of {barc10Questions.length}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        {question.text}
      </h3>

      <RadioGroup value={value?.toString()} onValueChange={(v) => onChange(parseInt(v))}>
        <div className="space-y-3">
          {responseOptions.map((option) => (
            <motion.div
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Label
                htmlFor={`q${question.id}-${option.value}`}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  value === option.value 
                    ? 'border-teal-500 bg-teal-50' 
                    : 'border-gray-100 hover:border-teal-200'
                }`}
              >
                <RadioGroupItem 
                  value={option.value.toString()} 
                  id={`q${question.id}-${option.value}`}
                  className="text-teal-600"
                />
                <span className={`${value === option.value ? 'text-teal-700 font-medium' : 'text-gray-700'}`}>
                  {option.label}
                </span>
              </Label>
            </motion.div>
          ))}
        </div>
      </RadioGroup>
    </motion.div>
  );
}

function ResultsView({ assessment, onRetake }) {
  const total = assessment.total_score || 0;
  const maxScore = 50;
  const percentage = (total / maxScore) * 100;
  
  const dimensions = assessment.dimension_scores || { personal: 0, social: 0, community: 0 };
  
  const interpretation = 
    percentage >= 70 ? { level: 'Thriving', color: 'text-green-600', bg: 'bg-green-100' } :
    percentage >= 40 ? { level: 'Growing', color: 'text-amber-600', bg: 'bg-amber-100' } :
    { level: 'Building', color: 'text-blue-600', bg: 'bg-blue-100' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Overall Score */}
      <GraceCard gradient className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${interpretation.bg} mb-4`}
        >
          <div>
            <div className={`text-4xl font-bold ${interpretation.color}`}>{total}</div>
            <div className="text-sm text-gray-500">of {maxScore}</div>
          </div>
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Recovery Capital: {interpretation.level}
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Your recovery capital is growing! Every connection and positive choice builds new neural pathways for healing.
        </p>
      </GraceCard>

      {/* Dimension Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GraceCard>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Personal</h3>
          </div>
          <Progress value={(dimensions.personal / 30) * 100} className="h-2 mb-2" />
          <p className="text-sm text-gray-500">{dimensions.personal}/30 points</p>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Social</h3>
          </div>
          <Progress value={(dimensions.social / 10) * 100} className="h-2 mb-2" />
          <p className="text-sm text-gray-500">{dimensions.social}/10 points</p>
        </GraceCard>

        <GraceCard>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Community</h3>
          </div>
          <Progress value={(dimensions.community / 10) * 100} className="h-2 mb-2" />
          <p className="text-sm text-gray-500">{dimensions.community}/10 points</p>
        </GraceCard>
      </div>

      {/* AI Insights */}
      {assessment.ai_insights && (
        <GraceCard>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Grace's Insights
          </h3>
          <p className="text-gray-600">{assessment.ai_insights}</p>
        </GraceCard>
      )}

      <div className="text-center">
        <Button variant="outline" onClick={onRetake}>
          Take Assessment Again
        </Button>
      </div>
    </motion.div>
  );
}

export default function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [completedAssessment, setCompletedAssessment] = useState(null);

  const { data: previousAssessments } = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.Assessment.filter({ created_by: user.email }, '-created_date', 5);
    },
    initialData: []
  });

  const submitAssessment = useMutation({
    mutationFn: async () => {
      // Calculate scores
      const responseArray = barc10Questions.map(q => ({
        question_id: q.id.toString(),
        score: responses[q.id] || 0
      }));

      const totalScore = Object.values(responses).reduce((sum, val) => sum + val, 0);
      
      const dimensionScores = {
        personal: barc10Questions
          .filter(q => q.dimension === 'personal')
          .reduce((sum, q) => sum + (responses[q.id] || 0), 0),
        social: barc10Questions
          .filter(q => q.dimension === 'social')
          .reduce((sum, q) => sum + (responses[q.id] || 0), 0),
        community: barc10Questions
          .filter(q => q.dimension === 'community')
          .reduce((sum, q) => sum + (responses[q.id] || 0), 0)
      };

      const interpretation = totalScore >= 35 ? 'thriving' : totalScore >= 20 ? 'growing' : 'building';

      // Get AI insights
      let aiInsights = '';
      try {
        aiInsights = await base44.integrations.Core.InvokeLLM({
          prompt: `Based on BARC-10 recovery capital assessment with total score ${totalScore}/50, personal ${dimensionScores.personal}/30, social ${dimensionScores.social}/10, community ${dimensionScores.community}/10. Provide 2-3 sentences of encouraging, person-first feedback using neuroscience language about brain rewiring and recovery capital. Keep it warm and hopeful.`
        });
      } catch (e) {
        aiInsights = "Your recovery capital is growing every day. Each positive connection literally rewires your brain for healing!";
      }

      const assessment = await base44.entities.Assessment.create({
        assessment_type: 'barc10',
        responses: responseArray,
        total_score: totalScore,
        dimension_scores: dimensionScores,
        interpretation,
        ai_insights: aiInsights
      });

      return assessment;
    },
    onSuccess: (assessment) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setCompletedAssessment(assessment);
      setShowResults(true);
    }
  });

  const handleResponse = (value) => {
    setResponses(prev => ({
      ...prev,
      [barc10Questions[currentQuestion].id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < barc10Questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitAssessment.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleRetake = () => {
    setResponses({});
    setCurrentQuestion(0);
    setShowResults(false);
    setCompletedAssessment(null);
  };

  const currentValue = responses[barc10Questions[currentQuestion]?.id];
  const progress = ((currentQuestion + 1) / barc10Questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Recovery Capital Assessment"
          subtitle="The BARC-10 measures your recovery strengths across personal, social, and community dimensions."
          icon={Compass}
        />

        {showResults && completedAssessment ? (
          <ResultsView assessment={completedAssessment} onRetake={handleRetake} />
        ) : (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white rounded-full p-2 shadow-sm">
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <QuestionCard
                key={currentQuestion}
                question={barc10Questions[currentQuestion]}
                value={currentValue}
                onChange={handleResponse}
                questionNumber={currentQuestion + 1}
              />
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={!currentValue}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {currentQuestion === barc10Questions.length - 1 ? (
                  <>
                    Complete <Check className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Previous Assessments */}
        {previousAssessments.length > 0 && !showResults && (
          <GraceCard className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-4">Your Assessment History</h3>
            <div className="space-y-3">
              {previousAssessments.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    {new Date(a.created_date).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-teal-600">{a.total_score}/50</span>
                </div>
              ))}
            </div>
          </GraceCard>
        )}
      </div>

      <GraceChatWidget />
    </div>
  );
}