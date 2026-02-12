import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Copy, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function VirtualMeetingLinks() {
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['virtual-meetings'],
    queryFn: () => base44.entities.Resource.filter({ category: 'virtual_meeting' })
  });

  const copyToClipboard = async (meeting) => {
    const text = `${meeting.name}\n${meeting.description}\n${meeting.hours}\n${meeting.website}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(meeting.id);
    toast.success('Meeting details copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const groupedMeetings = meetings.reduce((acc, meeting) => {
    const type = meeting.subcategory || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(meeting);
    return acc;
  }, {});

  if (isLoading) return null;
  if (meetings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4 mb-6"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Virtual Recovery Meetings</h3>
            <p className="text-sm text-gray-600">AA, NA, and All Recovery meetings happening now</p>
          </div>
        </div>
        {expanded ? 
          <ChevronUp className="w-5 h-5 text-gray-400" /> : 
          <ChevronDown className="w-5 h-5 text-gray-400" />
        }
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 space-y-4"
          >
            {Object.entries(groupedMeetings).map(([type, typeMeetings]) => (
              <div key={type}>
                <h4 className="font-semibold text-sm text-purple-900 mb-2">{type}</h4>
                <div className="space-y-2">
                  {typeMeetings.map((meeting) => (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-1">{meeting.name}</h5>
                          {meeting.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{meeting.description}</p>
                          )}
                          {meeting.hours && (
                            <Badge variant="outline" className="text-xs mb-2">
                              {meeting.hours}
                            </Badge>
                          )}
                          {meeting.website && (
                            <a
                              href={meeting.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                            >
                              Visit Meeting <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(meeting)}
                          className="shrink-0"
                        >
                          {copiedId === meeting.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="pt-2 text-xs text-gray-500 border-t border-gray-200">
              💡 Click <Copy className="w-3 h-3 inline" /> to copy meeting details to your session description
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}