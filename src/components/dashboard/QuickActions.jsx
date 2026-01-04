import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageCircle, Users, Heart, BookOpen, Phone, MapPin } from 'lucide-react';

const actions = [
  {
    id: 'chat',
    title: 'Chat with Grace',
    icon: MessageCircle,
    href: 'GraceChat',
    color: 'from-teal-400 to-teal-600'
  },
  {
    id: 'community',
    title: 'Join a Room',
    icon: Users,
    href: 'Community',
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'kudos',
    title: 'Send Kudos',
    icon: Heart,
    href: 'CommunityWalls',
    color: 'from-rose-400 to-rose-600'
  },
  {
    id: 'resources',
    title: 'Find Help',
    icon: MapPin,
    href: 'Resources',
    color: 'from-emerald-400 to-emerald-600'
  },
  {
    id: 'learn',
    title: 'Brain Science',
    icon: BookOpen,
    href: 'Neuroplasticity',
    color: 'from-purple-400 to-purple-600'
  },
  {
    id: 'crisis',
    title: 'Crisis Support',
    icon: Phone,
    href: 'Crisis',
    color: 'from-orange-400 to-red-500'
  }
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {actions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link to={createPageUrl(action.href)}>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {action.title}
              </span>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}