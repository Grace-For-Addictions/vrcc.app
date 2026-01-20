import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Calendar, Video, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';

export default function PeerCoachingDetail() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await base44.integrations.Core.SendEmail({
        to: 'info@graceforaddictions.org',
        subject: 'Peer Coaching Interest - New Request',
        body: `New peer coaching inquiry:

Name: ${contactForm.name}
Email: ${contactForm.email}
Phone: ${contactForm.phone}

Message:
${contactForm.message}`
      });
      toast.success('Request sent! We\'ll be in touch soon.');
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <GraceHeader 
          title="Peer Coaching"
          subtitle="One-on-one support from someone who's been there"
          icon={Heart}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GraceCard className="text-center">
            <Video className="w-12 h-12 text-teal-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Virtual Sessions</h3>
            <p className="text-sm text-gray-600">Connect from anywhere via video</p>
          </GraceCard>

          <GraceCard className="text-center">
            <Phone className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Phone Support</h3>
            <p className="text-sm text-gray-600">Talk when it works for you</p>
          </GraceCard>

          <GraceCard className="text-center">
            <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Chat Available</h3>
            <p className="text-sm text-gray-600">Text-based support 24/7</p>
          </GraceCard>
        </div>

        <GraceCard className="mb-8">
          <CardHeader>
            <CardTitle>What is Peer Coaching?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Peer coaches are individuals in recovery who provide non-clinical support, 
              encouragement, and guidance based on their own lived experience. They understand 
              the journey because they've walked it themselves.
            </p>
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
              <h4 className="font-semibold mb-2">What Peer Coaches Help With:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Building recovery support networks</li>
                <li>• Setting and achieving personal goals</li>
                <li>• Navigating community resources</li>
                <li>• Celebrating milestones and progress</li>
                <li>• Processing challenges without judgment</li>
              </ul>
            </div>
          </CardContent>
        </GraceCard>

        <GraceCard>
          <CardHeader>
            <CardTitle>Request a Peer Coach</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input 
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input 
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone (Optional)</label>
                <Input 
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tell us about your needs</label>
                <Textarea 
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  placeholder="What are you hoping for from peer coaching?"
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                Submit Request
              </Button>
            </form>
          </CardContent>
        </GraceCard>
      </div>
    </div>
  );
}