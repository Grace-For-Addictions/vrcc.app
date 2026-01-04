import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Check, X, Award, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import confetti from 'canvas-confetti';

export default function QuizCard({ quiz, onComplete, compact = false }) {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);

  if (!quiz || !quiz.questions) return null;

  const questions = quiz.questions;
  const score = answers.filter(a => a.was_correct).length;
  const percentage = Math.round((score / questions.length) * 100);
  const passed = percentage >= (quiz.passing_score || 70);

  const handleAnswer = (idx) => {
    setSelected(idx);
    const isCorrect = idx === questions[currentQ].correct_index;
    
    setAnswers(prev => [...prev, {
      question_index: currentQ,
      selected_index: idx,
      was_correct: isCorrect
    }]);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1);
        setSelected(null);
      } else {
        const finalScore = answers.filter(a => a.was_correct).length + (isCorrect ? 1 : 0);
        const finalPct = Math.round((finalScore / questions.length) * 100);
        if (finalPct >= (quiz.passing_score || 70)) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        setShowResult(true);
      }
    }, 1500);
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setShowResult(false);
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStarted(true)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{questions.length} questions</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{quiz.category?.replace(/_/g, ' ')}</Badge>
                <span className="text-xs text-teal-600">+{quiz.points_reward || 30} pts</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!started) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Questions: {questions.length}</span>
              <span className="text-teal-600 font-medium">Reward: +{quiz.points_reward || 30} points</span>
            </div>
            <Button onClick={() => setStarted(true)} className="w-full bg-purple-600 hover:bg-purple-700">
              <BookOpen className="w-4 h-4 mr-2" />
              Start Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResult) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            {passed ? (
              <Award className="w-16 h-16 mx-auto text-green-500 mb-4" />
            ) : (
              <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            )}
          </motion.div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {passed ? 'Great Job!' : 'Keep Learning!'}
          </h3>
          <p className="text-gray-600 mb-4">
            You scored {score} out of {questions.length} ({percentage}%)
          </p>
          
          {passed && (
            <p className="text-teal-600 font-medium mb-6">
              +{quiz.points_reward || 30} points earned! 🎉
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={handleRestart} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => onComplete?.({ quiz, score, percentage, passed })}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const q = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Question {currentQ + 1} of {questions.length}</span>
          <span className="text-sm text-purple-600 font-medium">{score} correct</span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{q.question}</h3>
        
        <div className="space-y-3">
          {q.options.map((option, idx) => {
            const isSelected = selected === idx;
            const isCorrect = idx === q.correct_index;
            const showFeedback = selected !== null;
            
            return (
              <motion.button
                key={idx}
                whileHover={selected === null ? { scale: 1.01 } : {}}
                whileTap={selected === null ? { scale: 0.99 } : {}}
                onClick={() => selected === null && handleAnswer(idx)}
                disabled={selected !== null}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  !showFeedback 
                    ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-50' 
                    : isSelected 
                      ? isCorrect 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-red-500 bg-red-50'
                      : isCorrect && showFeedback
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showFeedback && isSelected && (
                    isCorrect ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )
                  )}
                  {showFeedback && !isSelected && isCorrect && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {selected !== null && q.explanation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <p className="text-sm text-blue-900">
              <strong>Explanation:</strong> {q.explanation}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}