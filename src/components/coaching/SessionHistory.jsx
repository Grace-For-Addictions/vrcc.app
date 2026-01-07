import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, FileText, MapPin, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GraceCard from '@/components/common/GraceCard';

export default function SessionHistory({ sessions, user }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(session =>
    session.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.activity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <GraceCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Session History</h3>
          <Input
            placeholder="Search by participant or activity type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4 opacity-50" />
              <p className="text-gray-600">No sessions found</p>
            </div>
          ) : (
            filteredSessions.map((session, idx) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">{session.contact_name}</h4>
                      <Badge variant="outline">{session.activity_type}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(session.activity_date).toLocaleDateString()}
                      </span>
                      {session.activity_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {session.activity_location}
                        </span>
                      )}
                      {session.referral_made && (
                        <Badge className="bg-green-100 text-green-700">Referral Made</Badge>
                      )}
                      {session.goal_set && (
                        <Badge className="bg-purple-100 text-purple-700">Goal Set</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {session.activity_notes && (
                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <p className="text-sm text-gray-700 line-clamp-3">{session.activity_notes}</p>
                  </div>
                )}

                {session.ai_generated_summary && (
                  <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                    <p className="text-xs font-semibold text-purple-900 mb-1">AI Summary:</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{session.ai_generated_summary}</p>
                  </div>
                )}

                {(session.referral_type || session.personal_goal) && (
                  <div className="mt-3 flex gap-3 text-sm">
                    {session.referral_type && (
                      <div className="flex-1 p-2 bg-green-50 rounded">
                        <span className="font-medium text-green-800">Referral:</span>{' '}
                        <span className="text-gray-700">{session.referral_type}</span>
                      </div>
                    )}
                    {session.personal_goal && (
                      <div className="flex-1 p-2 bg-blue-50 rounded">
                        <span className="font-medium text-blue-800">Goal:</span>{' '}
                        <span className="text-gray-700">{session.personal_goal}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </GraceCard>
    </div>
  );
}