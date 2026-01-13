import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Mail, Video, MessageCircle, Plus, Bell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { TraumaInformedTextarea } from '@/components/rbac/TraumaInformedInput';
import PermissionCheck from '@/components/rbac/PermissionCheck';

export default function CommunicationLogger({ clientEmail }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [newLog, setNewLog] = useState({
    type: 'phone',
    subject: '',
    notes: '',
    duration_minutes: '',
    follow_up_needed: false,
    follow_up_date: ''
  });

  const { data: logs } = useQuery({
    queryKey: ['communicationLogs', clientEmail],
    queryFn: () => base44.entities.CommunicationLog.filter({ client_email: clientEmail }, '-created_date'),
    enabled: !!clientEmail,
    initialData: []
  });

  const createLog = useMutation({
    mutationFn: async (logData) => {
      const log = await base44.entities.CommunicationLog.create({
        ...logData,
        client_email: clientEmail,
        logged_by: (await base44.auth.me()).email
      });

      // Sync to BeePurple
      await base44.functions.invoke('syncToBeepurple', {
        endpoint: '/communications/log',
        data: {
          participant_email: clientEmail,
          communication_type: logData.type,
          subject: logData.subject,
          notes: logData.notes,
          duration: logData.duration_minutes,
          follow_up: logData.follow_up_needed
        }
      });

      return log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communicationLogs']);
      setShowDialog(false);
      setNewLog({
        type: 'phone',
        subject: '',
        notes: '',
        duration_minutes: '',
        follow_up_needed: false,
        follow_up_date: ''
      });
      toast.success('Communication logged successfully!');
    }
  });

  const typeIcons = {
    phone: { icon: Phone, color: 'blue' },
    email: { icon: Mail, color: 'purple' },
    meeting: { icon: Video, color: 'green' },
    message: { icon: MessageCircle, color: 'orange' }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Communication History</h3>
        <PermissionCheck object="daily_outreach_logs" action="create">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Log Communication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Client Communication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={newLog.type} onValueChange={(v) => setNewLog({ ...newLog, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Communication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="message">Text/Message</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Subject/Topic"
                value={newLog.subject}
                onChange={(e) => setNewLog({ ...newLog, subject: e.target.value })}
              />

              <TraumaInformedTextarea
                placeholder="Notes and details..."
                value={newLog.notes}
                onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                rows={4}
              />

              {(newLog.type === 'phone' || newLog.type === 'meeting') && (
                <Input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={newLog.duration_minutes}
                  onChange={(e) => setNewLog({ ...newLog, duration_minutes: e.target.value })}
                />
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="follow-up"
                  checked={newLog.follow_up_needed}
                  onChange={(e) => setNewLog({ ...newLog, follow_up_needed: e.target.checked })}
                />
                <label htmlFor="follow-up" className="text-sm text-gray-700">
                  Follow-up needed
                </label>
              </div>

              {newLog.follow_up_needed && (
                <Input
                  type="date"
                  value={newLog.follow_up_date}
                  onChange={(e) => setNewLog({ ...newLog, follow_up_date: e.target.value })}
                />
              )}

              <Button
                onClick={() => createLog.mutate(newLog)}
                disabled={!newLog.subject || !newLog.notes || createLog.isPending}
                className="w-full"
              >
                Log Communication
              </Button>
            </div>
          </DialogContent>
          </Dialog>
          </PermissionCheck>
          </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No communications logged yet</p>
        ) : (
          logs.map((log) => {
            const { icon: Icon, color } = typeIcons[log.type] || typeIcons.message;
            return (
              <div key={log.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{log.subject}</h4>
                      <Badge variant="outline" className="capitalize">{log.type}</Badge>
                      {log.follow_up_needed && (
                        <Badge className="bg-orange-600">
                          <Bell className="w-3 h-3 mr-1" />
                          Follow-up
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{log.notes}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{format(new Date(log.created_date), 'MMM d, yyyy h:mm a')}</span>
                      {log.duration_minutes && <span>{log.duration_minutes} min</span>}
                      {log.follow_up_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Follow-up: {format(new Date(log.follow_up_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}