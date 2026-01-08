import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceCard from '@/components/common/GraceCard';
import GraceHeader from '@/components/common/GraceHeader';
import DailyReflectionCardDisplay from '@/components/reflection/DailyReflectionCardDisplay';

export default function DailyReflection() {
  const [user, setUser] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  // Fetch all cards
  const { data: allCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['dailyReflectionCards'],
    queryFn: () => base44.entities.DailyReflectionCard.list('slogan_number', 100),
    enabled: !!user
  });

  // Fetch user's responses
  const { data: userResponses = [] } = useQuery({
    queryKey: ['dailyReflectionResponse', user?.email],
    queryFn: () => base44.entities.DailyReflectionResponse.filter({ user_email: user.email }),
    enabled: !!user
  });

  // Calculate today's card (rotating 1-59)
  const getTodaysCard = () => {
    if (allCards.length === 0) return null;
    
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const cardIndex = (daysSinceEpoch % 59);
    
    return allCards.find(c => c.slogan_number === (cardIndex + 1)) || allCards[0];
  };

  const todaysCard = getTodaysCard();
  const todaysResponse = userResponses.find(r => 
    r.slogan_number === todaysCard?.slogan_number && 
    r.reflection_date === new Date().toISOString().split('T')[0]
  );

  // Stats
  const totalReflections = userResponses.length;
  const actedCount = userResponses.filter(r => r.completion_status === 'acted').length;
  const currentStreak = calculateStreak(userResponses);

  if (!user || cardsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <GraceHeader
          title="Daily Reflection Cards"
          subtitle="Words Matter. Growth Happens Daily."
          icon={BookOpen}
        />

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <GraceCard className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-teal-600" />
            <div className="text-3xl font-bold text-teal-700">{currentStreak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </GraceCard>
          
          <GraceCard className="text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-3xl font-bold text-purple-700">{totalReflections}</div>
            <div className="text-sm text-gray-600">Reflections</div>
          </GraceCard>
          
          <GraceCard className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-3xl font-bold text-green-700">{actedCount}</div>
            <div className="text-sm text-gray-600">Actions Taken</div>
          </GraceCard>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="today">Today's Card</TabsTrigger>
            <TabsTrigger value="archive">All Cards (1-59)</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            {todaysCard ? (
              <DailyReflectionCardDisplay
                card={todaysCard}
                user={user}
                existingResponse={todaysResponse}
              />
            ) : (
              <GraceCard>
                <p className="text-center text-gray-600">Loading today's reflection...</p>
              </GraceCard>
            )}
          </TabsContent>

          <TabsContent value="archive">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCards.map(card => {
                const hasResponse = userResponses.some(r => r.slogan_number === card.slogan_number);
                return (
                  <GraceCard
                    key={card.id}
                    hover
                    className="cursor-pointer"
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-teal-600">#{card.slogan_number}</span>
                      {hasResponse && <div className="w-2 h-2 rounded-full bg-green-500" />}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{card.card_title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{card.core_reflection}</p>
                  </GraceCard>
                );
              })}
            </div>

            {selectedCard && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCard(null)}>
                <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <DailyReflectionCardDisplay
                    card={selectedCard}
                    user={user}
                    existingResponse={userResponses.find(r => r.slogan_number === selectedCard.slogan_number)}
                  />
                  <Button onClick={() => setSelectedCard(null)} variant="outline" className="w-full mt-4">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function calculateStreak(responses) {
  if (responses.length === 0) return 0;
  
  const sortedDates = responses
    .map(r => new Date(r.reflection_date))
    .sort((a, b) => b - a);
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    date.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (date.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}