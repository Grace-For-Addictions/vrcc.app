import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Brain, Award, Trophy, CheckCircle2, 
  Filter, TrendingUp, Clock, Star
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import QuizCard from '@/components/quiz/QuizCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

const categories = [
  { id: 'all', label: 'All Quizzes', icon: Brain },
  { id: 'neuroplasticity', label: 'Brain Science', icon: Brain },
  { id: 'depression', label: 'Depression', icon: Brain },
  { id: 'anxiety', label: 'Anxiety', icon: Brain },
  { id: 'substance_recovery', label: 'Recovery', icon: TrendingUp },
  { id: 'trauma_care', label: 'Trauma Care', icon: Brain },
  { id: 'motivational_interviewing', label: 'MI Skills', icon: Star },
  { id: 'suicide_prevention', label: 'Suicide Prevention', icon: Brain },
  { id: 'overdose_response', label: 'Overdose Response', icon: Brain }
];

export default function Quizzes() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.filter({ is_active: true }),
    initialData: []
  });

  const { data: myResults } = useQuery({
    queryKey: ['quizResults', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.QuizResult.filter({ created_by: user.email }, '-created_date', 50);
    },
    enabled: !!user,
    initialData: []
  });

  const saveResult = useMutation({
    mutationFn: (resultData) => base44.entities.QuizResult.create(resultData),
    onSuccess: () => {
      queryClient.invalidateQueries(['quizResults']);
      setActiveQuiz(null);
    }
  });

  const handleQuizComplete = async ({ quiz, score, percentage, passed }) => {
    await saveResult.mutateAsync({
      quiz_id: quiz.id,
      quiz_title: quiz.title,
      score,
      total_questions: quiz.questions.length,
      percentage,
      passed,
      points_earned: passed ? (quiz.points_reward || 30) : 0,
      badge_earned: passed && quiz.badge_reward ? quiz.badge_reward : null
    });
  };

  const filteredQuizzes = selectedCategory === 'all' 
    ? quizzes 
    : quizzes.filter(q => q.category === selectedCategory);

  const completedQuizIds = myResults.filter(r => r.passed).map(r => r.quiz_id);
  const totalPoints = myResults.filter(r => r.passed).reduce((sum, r) => sum + (r.points_earned || 0), 0);

  if (activeQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => setActiveQuiz(null)} className="mb-4">
            ← Back to Quizzes
          </Button>
          <QuizCard quiz={activeQuiz} onComplete={handleQuizComplete} />
        </div>
        <GraceChatWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Test Your Knowledge"
          subtitle="Interactive quizzes on recovery, mental health, brain science, and support skills. Learn and earn points!"
          icon={Brain}
        />

        {/* Stats */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <GraceCard>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{completedQuizIds.length}</p>
                  <p className="text-sm text-gray-500">Quizzes Completed</p>
                </div>
              </div>
            </GraceCard>

            <GraceCard>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
                  <p className="text-sm text-gray-500">Points from Quizzes</p>
                </div>
              </div>
            </GraceCard>

            <GraceCard>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {myResults.length > 0 ? Math.round(myResults.reduce((sum, r) => sum + r.percentage, 0) / myResults.length) : 0}%
                  </p>
                  <p className="text-sm text-gray-500">Avg Score</p>
                </div>
              </div>
            </GraceCard>
          </div>
        )}

        {/* Category Filter */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="bg-white border flex-wrap h-auto">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Quizzes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz, idx) => {
            const isCompleted = completedQuizIds.includes(quiz.id);
            
            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveQuiz(quiz)}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden">
                  {isCompleted && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-4 shadow-md">
                      <Brain className="w-7 h-7 text-white" />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{quiz.questions.length} questions</span>
                      <Badge className="bg-purple-100 text-purple-700">
                        +{quiz.points_reward || 30} pts
                      </Badge>
                    </div>

                    {isCompleted && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          Completed
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredQuizzes.length === 0 && !isLoading && (
          <GraceCard className="text-center py-12">
            <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No quizzes found</h3>
            <p className="text-gray-500 mt-1">Try selecting a different category</p>
          </GraceCard>
        )}
      </div>

      <GraceChatWidget />
    </div>
  );
}