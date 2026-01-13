import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import GraceHeader from '@/components/common/GraceHeader';
import EnhancedForum from '@/components/community/EnhancedForum';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageCircle, Heart, Sparkles } from 'lucide-react';

export default function CommunityForum() {
  const { data: chatRooms = [] } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: () => base44.entities.ChatRoom.list(),
    initialData: []
  });

  // Default forum topics
  const defaultForums = [
    { id: 'general', name: 'General Support', icon: Users },
    { id: 'victories', name: 'Daily Victories', icon: Sparkles },
    { id: 'struggles', name: 'Working Through It', icon: Heart }
  ];

  const forums = chatRooms.length > 0 ? chatRooms : defaultForums;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <GraceHeader
          title="Community Forum"
          subtitle="Connect, share experiences, and support each other on the recovery journey"
          icon={MessageCircle}
        />

        <Tabs defaultValue={forums[0]?.id || 'general'} className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            {forums.slice(0, 3).map((forum) => {
              const Icon = forum.icon || MessageCircle;
              return (
                <TabsTrigger key={forum.id} value={forum.id}>
                  <Icon className="w-4 h-4 mr-2" />
                  {forum.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {forums.map((forum) => (
            <TabsContent key={forum.id} value={forum.id}>
              <EnhancedForum 
                chatRoomId={forum.id}
                chatRoomName={forum.name}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}