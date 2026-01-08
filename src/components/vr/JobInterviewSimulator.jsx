import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Briefcase, Play, CheckCircle, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GraceCard from '@/components/common/GraceCard';
import { toast } from 'sonner';

export default function JobInterviewSimulator({ user }) {
  const [jobType, setJobType] = useState('');
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('beginner');
  const [liveHints, setLiveHints] = useState([]);

  const JOB_TYPES = [
    'Retail/Customer Service',
    'Food Service/Restaurant',
    'Manufacturing/Warehouse',
    'Healthcare Support',
    'Construction/Skilled Trades',
    'Office/Administrative'
  ];

  const startSimulation = async () => {
    if (!jobType) return;

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 realistic job interview questions for a ${jobType} position suitable for someone with recovery/justice history. Include:
1. Standard behavioral questions
2. Questions about gaps in employment (recovery-friendly framing)
3. Scenario-based questions relevant to the job
4. Strengths/skills questions

Format as JSON array of question strings.`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setQuestions(response.questions);
      setStarted(true);
    } catch (error) {
      toast.error('Failed to start simulation');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    setLoading(true);
    
    // AI analyzes answer in real-time and provides instant hint
    try {
      const instantFeedback = await base44.integrations.Core.InvokeLLM({
        prompt: `Quick analysis: Is this job interview answer strong enough?\nQuestion: ${questions[currentQuestion]}\nAnswer: ${currentAnswer}\n\nProvide a brief 1-sentence hint if it needs improvement, or encouragement if it's good. Be specific.`,
      });
      
      setLiveHints([...liveHints, { question: currentQuestion, hint: instantFeedback }]);
      toast.success(instantFeedback.substring(0, 100) + '...');
    } catch (error) {
      // Continue even if instant feedback fails
    }

    setAnswers({ ...answers, [currentQuestion]: currentAnswer });
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setCurrentAnswer('');
    } else {
      await generateFeedback();
    }
    
    setLoading(false);
  };

  const generateFeedback = async () => {
    setLoading(true);
    try {
      // Calculate adaptive difficulty for next session
      const answersQuality = Object.values(answers).map(a => a.length).reduce((sum, len) => sum + len, 0) / Object.keys(answers).length;
      const suggestedDifficulty = answersQuality > 150 ? 'advanced' : answersQuality > 80 ? 'intermediate' : 'beginner';
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide AI-driven adaptive feedback on these job interview responses for a ${jobType} position. The person is in recovery and may have justice involvement history.

Current skill level: ${difficulty}
Suggested next level: ${suggestedDifficulty}

${questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i]}\n`).join('\n')}

Provide:
1. Overall performance score (1-10)
2. Strengths in responses
3. Areas for improvement (specific, actionable)
4. Reframed example answers for 2 weakest responses
5. Body language tips for in-person interviews
6. Confidence-building encouragement
7. Adaptive difficulty recommendation (should they try harder questions next time?)

Be constructive, trauma-informed, and recovery-focused.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            example_reframes: { type: "array", items: { type: "object", properties: { question: { type: "string" }, better_answer: { type: "string" } } } },
            body_language_tips: { type: "array", items: { type: "string" } },
            encouragement: { type: "string" },
            difficulty_recommendation: { type: "string" }
          }
        }
      });

      setDifficulty(suggestedDifficulty);

      setFeedback(response);
      
      // Log VR session
      await base44.entities.VRCollaborativeSession.create({
        session_type: 'job_interview',
        participants: [user.email],
        scenario_details: { job_type: jobType, score: response.overall_score },
        duration_minutes: Math.round((questions.length * 3) + 5),
        outcome_notes: `Completed ${jobType} interview simulation with ${response.overall_score}/10 score`
      });
    } catch (error) {
      toast.error('Failed to generate feedback');
    } finally {
      setLoading(false);
    }
  };

  if (feedback) {
    return (
      <GraceCard>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          Interview Complete!
        </h3>

        <div className="space-y-4">
          <div className="text-center p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
            <div className="text-5xl font-bold text-teal-700 mb-2">{feedback.overall_score}/10</div>
            <p className="text-sm text-gray-600">Overall Performance</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">✨ Your Strengths</h4>
            <ul className="list-disc list-inside space-y-1">
              {feedback.strengths?.map((s, i) => (
                <li key={i} className="text-sm text-gray-700">{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">🎯 Areas to Improve</h4>
            <ul className="list-disc list-inside space-y-1">
              {feedback.improvements?.map((imp, i) => (
                <li key={i} className="text-sm text-gray-700">{imp}</li>
              ))}
            </ul>
          </div>

          {feedback.example_reframes?.map((example, i) => (
            <div key={i} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="font-medium text-purple-900 mb-2">{example.question}</p>
              <p className="text-sm text-purple-800">
                <strong>Better approach:</strong> {example.better_answer}
              </p>
            </div>
          ))}

          {feedback.body_language_tips && feedback.body_language_tips.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🎭 Body Language & Presence Tips</h4>
              <ul className="list-disc list-inside space-y-1">
                {feedback.body_language_tips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-700">{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-900">💚 {feedback.encouragement}</p>
          </div>

          {feedback.difficulty_recommendation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>🎯 AI Recommendation:</strong> {feedback.difficulty_recommendation}
              </p>
            </div>
          )}

          <Button onClick={() => { setStarted(false); setCurrentQuestion(0); setAnswers({}); setFeedback(null); setLiveHints([]); }} className="w-full">
            Practice Another Interview
          </Button>
        </div>
      </GraceCard>
    );
  }

  if (!started) {
    return (
      <GraceCard>
        <div className="text-center mb-6">
          <Briefcase className="w-12 h-12 mx-auto text-teal-600 mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">VR Job Interview Simulator</h3>
          <p className="text-gray-600">Practice real interview scenarios with AI feedback</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Job Type</label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose job type..." />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={startSimulation} disabled={!jobType || loading} className="w-full bg-teal-600 hover:bg-teal-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Interview
              </>
            )}
          </Button>
        </div>
      </GraceCard>
    );
  }

  return (
    <GraceCard>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Question {currentQuestion + 1} of {questions.length}</h3>
          <span className="text-sm text-gray-600">{jobType}</span>
        </div>
        <div className="flex gap-1 mb-4">
          {questions.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded ${i <= currentQuestion ? 'bg-teal-600' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <MessageSquare className="w-5 h-5 text-teal-600 mb-2" />
          <p className="font-medium text-gray-900">{questions[currentQuestion]}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Your Answer</label>
          <Textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Take your time and answer thoughtfully..."
            rows={6}
          />
        </div>

        <Button onClick={submitAnswer} disabled={!currentAnswer.trim() || loading} className="w-full bg-teal-600">
          {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
        </Button>
      </motion.div>
    </GraceCard>
  );
}