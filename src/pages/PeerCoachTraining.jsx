import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Play, CheckCircle2, XCircle, 
  MessageCircle, Lightbulb, Award, TrendingUp,
  Eye, RefreshCw, Target, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

const trainingScenarios = [
  {
    id: 'hopelessness',
    title: 'Expressing Hopelessness',
    difficulty: 'advanced',
    userMessage: "I don't know why I'm even trying anymore. I've relapsed three times this month and lost my job. Nothing ever works out for me. I'm just a failure.",
    focusAreas: ['Empathy', 'Motivational Interviewing', 'Crisis Assessment', 'Affirmations'],
    correctApproaches: ['Validate feelings', 'Affirm past successes', 'Explore ambivalence', 'Assess safety'],
    vrPreview: 'User appears dejected, avoiding eye contact, slouched posture'
  },
  {
    id: 'meeting_reluctance',
    title: 'Reluctance to Attend Meetings',
    difficulty: 'beginner',
    userMessage: "I tried going to a meeting last week but I felt so out of place. Everyone seemed like they had it together and I'm just... not there yet. I don't think meetings are for me.",
    focusAreas: ['Motivational Interviewing', 'Change Talk', 'Resource Referral', 'Normalization'],
    correctApproaches: ['Normalize feelings', 'Explore barriers', 'Offer alternatives', 'Highlight autonomy'],
    vrPreview: 'User fidgeting, defensive body language, arms crossed'
  },
  {
    id: 'housing_crisis',
    title: 'Difficulty Finding Housing',
    difficulty: 'intermediate',
    userMessage: "I'm about to get released in 2 weeks and I have nowhere to go. I've called 10 places and they all say no because of my record. I'm terrified I'll end up homeless again.",
    focusAreas: ['Resource Referral', 'Problem-Solving', 'Practical Support', 'Hope Instillation'],
    correctApproaches: ['Immediate resource referral', 'Connect to navigator', 'Explore support network', 'Action planning'],
    vrPreview: 'User showing anxiety, rapid speech, leaning forward urgently'
  },
  {
    id: 'family_conflict',
    title: 'Family Conflict and Guilt',
    difficulty: 'intermediate',
    userMessage: "My sister won't let me see my niece anymore because of my past. She says I'm a bad influence. I've been clean for 6 months but she doesn't believe I've changed. It's breaking my heart.",
    focusAreas: ['Empathy', 'Boundary Setting', 'Resource Referral', 'Grief Support'],
    correctApproaches: ['Validate pain', 'Acknowledge progress', 'Explore family resources', 'Discuss realistic expectations'],
    vrPreview: 'User tearful, voice breaking, looking down frequently'
  },
  {
    id: 'medication_concerns',
    title: 'MAT Medication Concerns',
    difficulty: 'advanced',
    userMessage: "People keep telling me I'm not really in recovery because I'm on Suboxone. Someone said I'm just trading one drug for another. Maybe they're right. Should I stop taking it?",
    focusAreas: ['MAT Education', 'Stigma Reduction', 'Medical Boundaries', 'Peer Support'],
    correctApproaches: ['Educate about MAT', 'Address stigma', 'Boundary with medical advice', 'Connect to prescriber'],
    vrPreview: 'User confused, seeking validation, uncertain tone'
  },
  {
    id: 'triggers',
    title: 'Managing Triggers',
    difficulty: 'beginner',
    userMessage: "I saw my old using buddy at the grocery store today and now I can't stop thinking about using. My heart's racing and I feel like I'm going to lose it. What do I do?",
    focusAreas: ['Crisis Support', 'Coping Skills', 'Grounding Techniques', 'Immediate Safety'],
    correctApproaches: ['Assess immediate safety', 'Offer grounding exercise', 'Connect to support', 'Normalize experience'],
    vrPreview: 'User agitated, breathing fast, looking around nervously'
  }
];

function ScenarioSimulator({ scenario, onComplete }) {
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState([
    { role: 'user', content: scenario.userMessage }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showVRPreview, setShowVRPreview] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newConversation = [...conversation, { role: 'coach', content: userInput }];
    setConversation(newConversation);
    setUserInput('');
    setIsAnalyzing(true);

    try {
      const analysisPrompt = `You are evaluating a peer recovery coach's response in a training simulation.

SCENARIO: ${scenario.title}
USER'S MESSAGE: "${scenario.userMessage}"
COACH'S RESPONSE: "${userInput}"

FOCUS AREAS TO EVALUATE:
${scenario.focusAreas.map(area => `- ${area}`).join('\n')}

CORRECT APPROACHES:
${scenario.correctApproaches.map(approach => `- ${approach}`).join('\n')}

Provide detailed feedback in this JSON format:
{
  "score": <1-100>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"],
  "empathy_score": <1-10>,
  "mi_skills_score": <1-10>,
  "resource_accuracy": <1-10>,
  "overall_assessment": "2-3 sentences",
  "suggested_response": "A better example response"
}

Focus on: empathy, motivational interviewing techniques (OARS), appropriate boundaries, resource referrals, and person-first language.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            empathy_score: { type: "number" },
            mi_skills_score: { type: "number" },
            resource_accuracy: { type: "number" },
            overall_assessment: { type: "string" },
            suggested_response: { type: "string" }
          }
        }
      });

      setFeedback(response);
      onComplete(response.score);
    } catch (error) {
      setFeedback({ 
        score: 0, 
        overall_assessment: "Error analyzing response. Please try again.",
        strengths: [],
        improvements: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* VR Preview Toggle */}
      <GraceCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">VR Preview Mode</h4>
              <p className="text-sm text-gray-600">Simulate visual context</p>
            </div>
          </div>
          <Button
            variant={showVRPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowVRPreview(!showVRPreview)}
          >
            {showVRPreview ? 'Hide' : 'Show'} VR Preview
          </Button>
        </div>

        <AnimatePresence>
          {showVRPreview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Headphones className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-blue-900 mb-2">Visual Context:</p>
                  <p className="text-sm text-blue-800">{scenario.vrPreview}</p>
                  <div className="mt-3 flex gap-2">
                    <Badge className="bg-blue-100 text-blue-700">Body Language</Badge>
                    <Badge className="bg-purple-100 text-purple-700">Tone of Voice</Badge>
                    <Badge className="bg-indigo-100 text-indigo-700">Environmental Cues</Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GraceCard>

      {/* Conversation */}
      <GraceCard>
        <h4 className="font-semibold text-gray-900 mb-4">Scenario Conversation</h4>
        <div className="space-y-4 mb-6">
          {conversation.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: msg.role === 'user' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === 'coach' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-teal-600 text-white'
              }`}>
                <p className="text-sm font-medium mb-1">
                  {msg.role === 'user' ? '👤 Participant' : '🎓 You (Peer Coach)'}
                </p>
                <p className="text-sm">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {!feedback && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your coaching response..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={isAnalyzing}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!userInput.trim() || isAnalyzing}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Response
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </GraceCard>

      {/* Feedback */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GraceCard gradient>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Performance Feedback
            </h4>

            {/* Overall Score */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Score</span>
                <span className="text-2xl font-bold text-teal-700">{feedback.score}/100</span>
              </div>
              <Progress value={feedback.score} className="h-3" />
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Empathy</p>
                <p className="text-xl font-bold text-blue-600">{feedback.empathy_score}/10</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">MI Skills</p>
                <p className="text-xl font-bold text-purple-600">{feedback.mi_skills_score}/10</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Resources</p>
                <p className="text-xl font-bold text-teal-600">{feedback.resource_accuracy}/10</p>
              </div>
            </div>

            {/* Assessment */}
            <div className="mb-4">
              <p className="text-gray-700">{feedback.overall_assessment}</p>
            </div>

            {/* Strengths */}
            {feedback.strengths?.length > 0 && (
              <div className="mb-4">
                <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Strengths
                </h5>
                <ul className="space-y-1">
                  {feedback.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {feedback.improvements?.length > 0 && (
              <div className="mb-4">
                <h5 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Areas for Growth
                </h5>
                <ul className="space-y-1">
                  {feedback.improvements.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">→</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Response */}
            {feedback.suggested_response && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <h5 className="font-medium text-teal-900 mb-2">Suggested Response:</h5>
                <p className="text-sm text-teal-800 italic">"{feedback.suggested_response}"</p>
              </div>
            )}
          </GraceCard>
        </motion.div>
      )}
    </div>
  );
}

export default function PeerCoachTraining() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [completedScenarios, setCompletedScenarios] = useState({});

  const handleComplete = (scenarioId, score) => {
    setCompletedScenarios({
      ...completedScenarios,
      [scenarioId]: score
    });
  };

  const avgScore = Object.values(completedScenarios).length > 0
    ? Math.round(Object.values(completedScenarios).reduce((a, b) => a + b, 0) / Object.values(completedScenarios).length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Peer Coach Training Simulator"
          subtitle="AI-powered training with real-world scenarios, VR previews, and expert feedback on coaching techniques"
          icon={GraduationCap}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-700">
                  {Object.keys(completedScenarios).length}/{trainingScenarios.length}
                </p>
                <p className="text-sm text-gray-600">Scenarios Completed</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{avgScore}%</p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </div>
          </GraceCard>

          <GraceCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {Object.values(completedScenarios).filter(s => s >= 80).length}
                </p>
                <p className="text-sm text-gray-600">Expert Level</p>
              </div>
            </div>
          </GraceCard>
        </div>

        {!selectedScenario ? (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Training Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainingScenarios.map((scenario) => {
                const completed = completedScenarios[scenario.id];
                return (
                  <motion.div
                    key={scenario.id}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedScenario(scenario)}
                    className="cursor-pointer"
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                              {completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Play className="w-5 h-5 text-indigo-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{scenario.title}</h4>
                              <Badge className={`mt-1 ${
                                scenario.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                scenario.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {scenario.difficulty}
                              </Badge>
                            </div>
                          </div>
                          {completed && (
                            <Badge className="bg-teal-100 text-teal-700">
                              {completed}%
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {scenario.focusAreas.map((area, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>

                        <p className="text-sm text-gray-600 italic line-clamp-2">
                          "{scenario.userMessage}"
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <Button
              variant="ghost"
              onClick={() => setSelectedScenario(null)}
              className="mb-4"
            >
              ← Back to Scenarios
            </Button>

            <GraceCard className="mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedScenario.title}
                  </h2>
                  <div className="flex gap-2 mb-4">
                    <Badge className={
                      selectedScenario.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      selectedScenario.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {selectedScenario.difficulty}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedScenario.focusAreas.map((area, idx) => (
                      <Badge key={idx} variant="outline">{area}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </GraceCard>

            <ScenarioSimulator 
              scenario={selectedScenario}
              onComplete={(score) => handleComplete(selectedScenario.id, score)}
            />
          </div>
        )}
      </div>

      <GraceChatWidget />
    </div>
  );
}