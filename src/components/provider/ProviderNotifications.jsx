import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function ProviderNotifications({ providerId }) {
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['provider-notifications', providerId],
    queryFn: () => base44.entities.ProviderNotification.filter(
      { provider_id: providerId },
      '-created_date',
      50
    ),
    initialData: [],
    refetchInterval: 30000 // Poll every 30 seconds
  });

  const markAsRead = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.ProviderNotification.update(notificationId, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['provider-notifications'])
  });

  const deleteNotification = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.ProviderNotification.delete(notificationId),
    onSuccess: () => queryClient.invalidateQueries(['provider-notifications'])
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };

  const typeIcons = {
    new_referral: CheckCircle2,
    referral_update: Clock,
    ibhrs_alert: AlertCircle,
    urgent_update: AlertCircle,
    system_message: Bell
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>

        <ScrollArea className="h-96">
          <div className="p-2">
            <AnimatePresence>
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.notification_type] || Bell;
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-3 rounded-lg mb-2 ${
                      notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${
                        notification.priority === 'urgent' ? 'text-red-600' :
                        notification.priority === 'high' ? 'text-orange-600' :
                        'text-blue-600'
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                          <Badge className={priorityColors[notification.priority]} variant="outline">
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.created_date).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        {!notification.is_read && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => markAsRead.mutate(notification.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => deleteNotification.mutate(notification.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {notifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}