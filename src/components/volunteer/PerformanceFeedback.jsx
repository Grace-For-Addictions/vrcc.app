import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Send } from 'lucide-react';

export default function PerformanceFeedback({ volunteerEmail, volunteerName }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      // Get volunteer profile
      const volunteers = await base44.entities.VolunteerProfile.filter({ 
        volunteer_email: volunteerEmail 
      });
      
      if (volunteers.length === 0) return;
      
      const volunteer = volunteers[0];
      const performanceRatings = volunteer.performance_ratings || [];
      
      performanceRatings.push({
        date: new Date().toISOString(),
        rating,
        feedback,
        reviewer: user.email
      });
      
      return base44.entities.VolunteerProfile.update(volunteer.id, {
        performance_ratings: performanceRatings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['volunteer-profile']);
      setRating(0);
      setFeedback('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Provide Feedback for {volunteerName}</CardTitle>
        <CardDescription>Help volunteers grow through constructive feedback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2 block">Overall Performance Rating</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star 
                  className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Constructive Feedback</Label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Strengths observed, areas for growth, specific examples..."
            rows={6}
            className="mt-2"
          />
        </div>

        <Button
          onClick={() => submitFeedbackMutation.mutate()}
          disabled={rating === 0 || !feedback}
          className="w-full bg-teal-600 hover:bg-teal-700"
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Feedback
        </Button>
      </CardContent>
    </Card>
  );
}