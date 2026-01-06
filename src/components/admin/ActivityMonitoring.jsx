import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, MessageCircle, Activity, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraceCard from '@/components/common/GraceCard';

export default function ActivityMonitoring({ user }) {
  const [selectedHouse, setSelectedHouse] = useState('all');

  const { data: houses } = useQuery({
    queryKey: ['allHouses'],
    queryFn: () => base44.entities.RecoveryHouse.list(),
    initialData: []
  });

  const { data: flaggedMessages } = useQuery({
    queryKey: ['flaggedMessages'],
    queryFn: () => base44.entities.ResidentMessage.filter({ ai_flagged: true }, '-created_date', 50),
    initialData: []
  });

  const { data: recentEvents } = useQuery({
    queryKey: ['recentEvents', selectedHouse],
    queryFn: async () => {
      if (selectedHouse === 'all') {
        return base44.entities.ResidencyEventLog.list('-event_date', 100);
      }
      return base44.entities.ResidencyEventLog.filter({ house_id: selectedHouse }, '-event_date', 100);
    },
    initialData: []
  });

  const eventTypeColors = {
    chore: 'bg-green-100 text-green-700',
    meeting: 'bg-blue-100 text-blue-700',
    check_in: 'bg-purple-100 text-purple-700',
    mood_log: 'bg-pink-100 text-pink-700',
    note: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Activity Monitoring</h3>
        <Select value={selectedHouse} onValueChange={setSelectedHouse}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Houses</SelectItem>
            {houses.map(h => (
              <SelectItem key={h.id} value={h.id}>{h.house_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Flagged Messages ({flaggedMessages.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            <Activity className="w-4 h-4 mr-2" />
            Recent Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4 mt-4">
          {flaggedMessages.length === 0 ? (
            <GraceCard className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No flagged messages</p>
            </GraceCard>
          ) : (
            flaggedMessages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GraceCard className="border-l-4 border-red-500">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{msg.sender_name}</span>
                        <Badge className="bg-red-100 text-red-700">Flagged</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{msg.message_content}</p>
                      <p className="text-sm text-red-700">
                        <strong>Reason:</strong> {msg.flag_reason}
                      </p>
                    </div>
                  </div>
                </GraceCard>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-3 mt-4">
          {recentEvents.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={`p-4 rounded-lg border ${eventTypeColors[event.event_type]}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{event.title}</h4>
                  <p className="text-sm mt-1">{event.resident_email}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(event.event_date).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {event.event_type.replace('_', ' ')}
                </Badge>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}