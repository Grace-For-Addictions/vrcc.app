import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Zap, Heart, Users, Sparkles, 
  Play, ChevronRight, Check, Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

const brainFacts = [
  {
    title: "Your Brain Can Change",
    content: "Neuroplasticity means your brain creates new neural pathways throughout your entire life. Every positive choice physically rewires your brain.",
    icon: Brain,
    color: "from-purple-400 to-purple-600"
  },
  {
    title: "Connection Heals",
    content: "Positive social connections release oxytocin and dopamine naturally. Community literally helps your brain heal from addiction.",
    icon: Heart,
    color: "from-rose-400 to-rose-600"
  },
  {
    title: "Repetition Creates Pathways",
    content: "The more you practice healthy coping, the stronger those neural pathways become. What fires together, wires together.",
    icon: Zap,
    color: "from-amber-400 to-amber-600"
  },
  {
    title: "Recovery Rebuilds",
    content: "Research shows that brain function and structure improve significantly within the first year of recovery. Your brain is healing right now.",
    icon: Sparkles,
    color: "from-teal-400 to-teal-600"
  }
];

const exercises = [
  {
    id: 1,
    title: "Gratitude Rewiring",
    description: "Name 3 things you're grateful for. This activates your prefrontal cortex and releases dopamine.",
    duration: "2 min",
    points: 10
  },
  {
    id: 2,
    title: "Connection Boost",
    description: "Send a kind message to someone. Social connection activates your brain's reward system naturally.",
    duration: "3 min",
    points: 15
  },
  {
    id: 3,
    title: "Mindful Breathing",
    description: "4-7-8 breathing: Inhale 4 sec, hold 7 sec, exhale 8 sec. This activates your parasympathetic nervous system.",
    duration: "5 min",
    points: 20
  },
  {
    id: 4,
    title: "Movement Medicine",
    description: "10 jumping jacks or a short walk. Physical movement releases endorphins and BDNF for brain growth.",
    duration: "5 min",
    points: 25
  }
];

const quizQuestions = [
  {
    question: "What does neuroplasticity mean?",
    options: [
      "The brain can't change after age 25",
      "The brain can create new neural pathways throughout life",
      "Neurons are made of plastic",
      "The brain shrinks over time"
    ],
    correct: 1
  },
  {
    question: "What naturally releases dopamine in recovery?",
    options: [
      "Isolation",
      "Avoiding all feelings",
      "Positive social connections",
      "Staying busy 24/7"
    ],
    correct: 2
  },
  {
    question: "\"What fires together...\"",
    options: [
      "Burns together",
      "Dies together",
      "Wires together",
      "Fights together"
    ],
    correct: 2
  }
];

function BrainFactCard({ fact, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GraceCard hover className="h-full">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${fact.color} flex items-center justify-center mb-4 shadow-md`}>
          <fact.icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{fact.title}</h3>
        <p className="text-gray-600">{fact.content}</p>
      </GraceCard>
    </motion.div>
  );
}

function ExerciseCard({ exercise, onComplete, completed }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white rounded-xl p-5 border ${completed ? 'border-green-200 bg-green-50' : 'border-gray-100'} transition-all`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{exercise.title}</h4>
            {completed && <Check className="w-5 h-5 text-green-500" />}
          </div>
          <p className="text-sm text-gray-600 mb-3">{exercise.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{exercise.duration}</span>
            <span className="text-teal-600 font-medium">+{exercise.points} pts</span>
          </div>
        </div>
        {!completed && (
          <Button
            onClick={() => onComplete(exercise)}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Play className="w-4 h-4 mr-1" /> Start
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function BrainQuiz() {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (idx) => {
    setSelected(idx);
    if (idx === quizQuestions[currentQ].correct) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      if (currentQ < quizQuestions.length - 1) {
        setCurrentQ(prev => prev + 1);
        setSelected(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  if (showResult) {
    return (
      <GraceCard className="text-center">
        <Trophy className="w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Quiz Complete!
        </h3>
        <p className="text-gray-600 mb-4">
          You got {score} out of {quizQuestions.length} correct!
        </p>
        <p className="text-teal-600 font-medium">
          +{score * 10} points earned! 🎉
        </p>
        <Button 
          onClick={() => { setCurrentQ(0); setScore(0); setShowResult(false); setSelected(null); }}
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </GraceCard>
    );
  }

  const q = quizQuestions[currentQ];

  return (
    <GraceCard>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">Question {currentQ + 1} of {quizQuestions.length}</span>
        <span className="text-sm text-teal-600 font-medium">{score} correct</span>
      </div>
      
      <Progress value={((currentQ + 1) / quizQuestions.length) * 100} className="h-2 mb-6" />
      
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{q.question}</h3>
      
      <div className="space-y-3">
        {q.options.map((option, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === q.correct;
          
          return (
            <motion.button
              key={idx}
              whileHover={selected === null ? { scale: 1.02 } : {}}
              whileTap={selected === null ? { scale: 0.98 } : {}}
              onClick={() => selected === null && handleAnswer(idx)}
              disabled={selected !== null}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected === null 
                  ? 'border-gray-100 hover:border-teal-200' 
                  : isSelected 
                    ? isCorrect 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                    : isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-100 opacity-50'
              }`}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </GraceCard>
  );
}

export default function Neuroplasticity() {
  const [completedExercises, setCompletedExercises] = useState([]);

  const handleCompleteExercise = (exercise) => {
    setCompletedExercises(prev => [...prev, exercise.id]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Brain Science of Recovery"
          subtitle="Learn how connection literally rewires your brain for healing. Your brain is more powerful than you know."
          icon={Brain}
        />

        {/* Brain Facts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">The Science of Hope</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {brainFacts.map((fact, idx) => (
              <BrainFactCard key={idx} fact={fact} index={idx} />
            ))}
          </div>
        </section>

        {/* Daily Brain Exercises */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Daily Brain Exercises</h2>
            <span className="text-sm text-gray-500">
              {completedExercises.length}/{exercises.length} complete today
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((exercise) => (
              <ExerciseCard 
                key={exercise.id}
                exercise={exercise}
                completed={completedExercises.includes(exercise.id)}
                onComplete={handleCompleteExercise}
              />
            ))}
          </div>
        </section>

        {/* Brain Quiz */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Your Knowledge</h2>
          <div className="max-w-2xl mx-auto">
            <BrainQuiz />
          </div>
        </section>

        {/* Key Takeaway */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <GraceCard gradient className="text-center">
            <Sparkles className="w-12 h-12 mx-auto text-teal-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              "Community Rewires the Brain"
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every time you connect with someone here, share a story, or support a peer, 
              you're literally building new neural pathways. Your brain is healing. 
              Keep going—you're doing amazing. 💚
            </p>
          </GraceCard>
        </motion.div>
      </div>

      <GraceChatWidget />
    </div>
  );
}