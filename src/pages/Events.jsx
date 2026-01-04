import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Users, Video, 
  ChevronLeft, ChevronRight, Check, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import GraceHeader from '@/components/common/GraceHeader';
import GraceCard from '@/components/common/GraceCard';
import GraceChatWidget from '@/components/chat/GraceChatWidget';
import AIEventRecommendations from '@/components/events/AIEventRecommendations';

const eventTypeColors = {
  meeting: 'bg-blue-100 text-blue-700',
  workshop: 'bg-purple-100 text-purple-700',
  social: 'bg-pink-100 text-pink-700',
  training: 'bg-amber-100 text-amber-700',
  game_night: 'bg-rose-100 text-rose-700',
  speaker: 'bg-indigo-100 text-indigo-700',
  support_group: 'bg-teal-100 text-teal-700'
};

function EventCard({ event, onRSVP, isAttending }) {
  const startTime = new Date(event.start_time);
  const colorClass = eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
    >
      {event.image_url && (
        <div className="h-40 rounded-xl overflow-hidden mb-4 -mt-2 -mx-2">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={colorClass}>
              {event.event_type?.replace(/_/g, ' ')}
            </Badge>
            {event.is_virtual && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Video className="w-3 h-3" /> Virtual
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
          
          {event.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
          )}

          {/* Neuroplasticity Benefit Badge */}
          {event.event_type === 'workshop' || event.event_type === 'training' ? (
            <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs text-purple-900">
                🧠 <strong>Brain Benefit:</strong> Group learning creates new neural pathways and strengthens community resilience circuits
              </p>
            </div>
          ) : event.event_type === 'social' || event.event_type === 'game_night' ? (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                🧠 <strong>Brain Benefit:</strong> Social connection releases oxytocin and rewires the brain for positive relationships
              </p>
            </div>
          ) : null}

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              {format(startTime, 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              {format(startTime, 'h:mm a')}
            </div>
            {event.host_name && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                Hosted by {event.host_name}
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <div className="bg-teal-50 rounded-xl p-3 mb-3">
            <div className="text-2xl font-bold text-teal-700">{format(startTime, 'd')}</div>
            <div className="text-xs text-teal-600 uppercase">{format(startTime, 'MMM')}</div>
          </div>
          <div className="text-xs text-gray-500">
            {event.attendee_count || 0} attending
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
        <Button
          onClick={() => onRSVP(event)}
          variant={isAttending ? "outline" : "default"}
          className={isAttending ? "" : "bg-teal-600 hover:bg-teal-700"}
          size="sm"
        >
          {isAttending ? (
            <>
              <Check className="w-4 h-4 mr-2" /> Attending
            </>
          ) : (
            "RSVP"
          )}
        </Button>
        
        {event.meeting_link && isAttending && (
          <Button variant="outline" size="sm" asChild>
            <a href={event.meeting_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" /> Join
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function WeekCalendar({ events, selectedDate, onSelectDate }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const getEventsForDay = (date) => {
    return events.filter(e => isSameDay(new Date(e.start_time), date));
  };

  return (
    <GraceCard className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="font-semibold text-gray-900">
          {format(weekStart, 'MMMM yyyy')}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDate(day)}
              className={`p-3 rounded-xl text-center transition-all ${
                isSelected 
                  ? 'bg-teal-600 text-white' 
                  : isToday 
                    ? 'bg-teal-50 text-teal-700' 
                    : 'hover:bg-gray-50'
              }`}
            >
              <div className="text-xs uppercase mb-1">{format(day, 'EEE')}</div>
              <div className="text-lg font-semibold">{format(day, 'd')}</div>
              {dayEvents.length > 0 && (
                <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                  isSelected ? 'bg-white' : 'bg-teal-500'
                }`} />
              )}
            </motion.button>
          );
        })}
      </div>
    </GraceCard>
  );
}

export default function Events() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        
        const profiles = await base44.entities.UserProfile.filter({ created_by: u.email });
        if (profiles[0]) setProfile(profiles[0]);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('start_time', 50),
    initialData: []
  });

  const rsvpMutation = useMutation({
    mutationFn: async (event) => {
      if (!user) return;
      
      const attendeeIds = event.attendee_ids || [];
      const isAttending = attendeeIds.includes(user.id);
      
      const newAttendeeIds = isAttending 
        ? attendeeIds.filter(id => id !== user.id)
        : [...attendeeIds, user.id];
      
      return base44.entities.Event.update(event.id, {
        attendee_ids: newAttendeeIds,
        attendee_count: newAttendeeIds.length
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['events'])
  });

  const isUserAttending = (event) => {
    if (!user) return false;
    return (event.attendee_ids || []).includes(user.id);
  };

  const filteredEvents = events.filter(e => {
    const eventDate = new Date(e.start_time);
    return isSameDay(eventDate, selectedDate) || eventDate >= new Date();
  });

  const upcomingEvents = events.filter(e => new Date(e.start_time) >= new Date());

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GraceHeader 
          title="Events & Meetings"
          subtitle="Virtual recovery meetings, workshops, game nights, and more. Connection is just one click away."
          icon={Calendar}
        />

        {/* AI Event Recommendations */}
        {user && profile && (
          <AIEventRecommendations user={user} profile={profile} allEvents={events} />
        )}

        <WeekCalendar 
          events={events} 
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {upcomingEvents.map((event) => (
              <EventCard 
                key={event.id}
                event={event}
                onRSVP={(e) => rsvpMutation.mutate(e)}
                isAttending={isUserAttending(event)}
              />
            ))}
          </AnimatePresence>
        </div>

        {upcomingEvents.length === 0 && !isLoading && (
          <GraceCard className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No upcoming events</h3>
            <p className="text-gray-500 mt-1">Check back soon for new events!</p>
          </GraceCard>
        )}
      </div>

      <GraceChatWidget />
    </div>
  );
}