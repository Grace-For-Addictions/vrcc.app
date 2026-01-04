import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Briefcase, FileText, Video, TrendingUp, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';

export default function WorkforceDevelopment() {
  const [user, setUser] = useState(null);
  const [generatingResume, setGeneratingResume] = useState(false);
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

  const { data: profile } = useQuery({
    queryKey: ['workforceProfile'],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.WorkforceProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  const generateResume = useMutation({
    mutationFn: async (data) => {
      setGeneratingResume(true);
      const resumeContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional, strength-based resume for someone in recovery. Use neuroplasticity language (resilient, adaptable, problem-solver).

Skills: ${data.skills.join(', ')}
Experience: ${data.experience}
Education: ${data.education}

Focus on transferable skills, growth mindset, and confidence-building language. Format in clean markdown.`
      });

      const existingProfile = await base44.entities.WorkforceProfile.filter({ created_by: user.email });
      if (existingProfile.length > 0) {
        return base44.entities.WorkforceProfile.update(existingProfile[0].id, {
          resume_data: { skills: data.skills, experience: data.experience, education: data.education },
          confidence_score: 75
        });
      } else {
        return base44.entities.WorkforceProfile.create({
          resume_data: { skills: data.skills, experience: data.experience, education: data.education },
          confidence_score: 75
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workforceProfile']);
      setGeneratingResume(false);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Workforce Development Center"
          subtitle="AI resume builder, interview practice, and job matching - built on your strengths and resilience"
          icon={Briefcase}
        />

        <Tabs defaultValue="resume" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resume">Resume Builder</TabsTrigger>
            <TabsTrigger value="interview">Interview Practice</TabsTrigger>
            <TabsTrigger value="jobs">Job Matching</TabsTrigger>
          </TabsList>

          <TabsContent value="resume">
            <GraceCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Resume Builder</h3>
              <p className="text-sm text-gray-600 mb-6">
                Share your skills and experience. We'll create a strength-based, professional resume that highlights your adaptability and resilience.
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                generateResume.mutate({
                  skills: e.target.skills.value.split(',').map(s => s.trim()),
                  experience: e.target.experience.value,
                  education: e.target.education.value
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills (comma-separated)
                  </label>
                  <Input name="skills" placeholder="Communication, Problem-solving, Customer service..." required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Experience
                  </label>
                  <Textarea name="experience" rows={4} placeholder="Describe your work history..." required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education
                  </label>
                  <Textarea name="education" rows={2} placeholder="High school, certifications, training..." required />
                </div>

                <Button type="submit" disabled={generatingResume} className="w-full bg-blue-600">
                  {generatingResume ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Generating Your Resume...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Resume
                    </>
                  )}
                </Button>
              </form>

              {profile?.resume_data && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">✓ Resume generated! Download or edit anytime.</p>
                </div>
              )}
            </GraceCard>
          </TabsContent>

          <TabsContent value="interview">
            <GraceCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">VR Interview Practice</h3>
              <p className="text-sm text-gray-600 mb-6">
                Practice common interview questions with AI Grace. Build confidence through repetition - connection rewires your brain for success.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Confidence Score</h4>
                  <Progress value={profile?.confidence_score || 50} className="h-3" />
                  <p className="text-xs text-purple-700 mt-2">
                    {profile?.interview_practice_sessions || 0} practice sessions completed
                  </p>
                </div>

                <Button className="w-full bg-purple-600">
                  <Video className="w-4 h-4 mr-2" />
                  Start VR Interview Practice
                </Button>
              </div>
            </GraceCard>
          </TabsContent>

          <TabsContent value="jobs">
            <GraceCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Matching</h3>
              <p className="text-sm text-gray-600 mb-6">
                Based on your skills and recovery journey, we'll suggest jobs that match your strengths and support your growth.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900">Warehouse Associate - Cedar Rapids</h4>
                  <p className="text-sm text-blue-700 mt-1">$18/hr • Full-time • Second-chance friendly</p>
                  <Button variant="outline" className="mt-3">View Details</Button>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900">Customer Service Rep - Remote</h4>
                  <p className="text-sm text-blue-700 mt-1">$16/hr • Remote • Training provided</p>
                  <Button variant="outline" className="mt-3">View Details</Button>
                </div>
              </div>
            </GraceCard>
          </TabsContent>
        </Tabs>
      </div>

      <GraceChatWidget />
    </div>
  );
}